const materialSelect = document.getElementById("materialSelect");
const quantityInput = document.getElementById("quantityInput");
const converterForm = document.getElementById("converterForm");
const convertButton = document.getElementById("convertButton");
const emptyState = document.getElementById("emptyState");
const resultsContent = document.getElementById("resultsContent");
const errorBanner = document.getElementById("errorBanner");

// Planks, logs, stone and cobblestone all stack to 64 in Minecraft.
const STACK_SIZE = 64;

// CSS class for a material's little block icon (see styles.css).
const ICON_CLASSES = {
    Planks: "plank-icon",
    Logs: "log-icon",
    Stone: "stone-icon",
    Cobblestone: "cobblestone-icon"
};

function iconClass(materialName) {
    return ICON_CLASSES[materialName] ?? "plank-icon";
}

// 300 -> "4 stacks + 44", 128 -> "2 stacks", 40 -> "" (under a stack, nothing extra to show)
function formatStacks(count) {
    if (count == null || count < STACK_SIZE) return "";
    const stacks = Math.floor(count / STACK_SIZE);
    const leftover = count % STACK_SIZE;
    const stackText = `${stacks.toLocaleString()} ${stacks === 1 ? "stack" : "stacks"}`;
    return leftover ? `${stackText} + ${leftover}` : stackText;
}

// Returns the material names, or null if they couldn't be loaded.
async function loadMaterials() {
    try {
        const response = await fetch("/materials");
        if (!response.ok) throw new Error("Could not load crafting items.");

        const materials = await response.json();
        materials.forEach(material => {
            const option = document.createElement("option");
            option.value = material;
            option.textContent = material;
            materialSelect.appendChild(option);
        });
        return materials;
    } catch (error) {
        showError(error.message);
        return null;
    }
}

function setQuantity(value) {
    const clamped = Math.min(1000000, Math.max(1, Number.parseInt(value, 10) || 1));
    quantityInput.value = clamped;
}

function clearValidation() {
    document.getElementById("materialError").textContent = "";
    document.getElementById("quantityError").textContent = "";
    errorBanner.hidden = true;
}

function showError(message) {
    errorBanner.textContent = message;
    errorBanner.hidden = false;
}

async function convert(event) {
    event?.preventDefault();
    clearValidation();

    const material = materialSelect.value;
    const quantity = Number(quantityInput.value);

    if (!material) {
        document.getElementById("materialError").textContent = "Choose an item to craft.";
        materialSelect.focus();
        return;
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000000) {
        document.getElementById("quantityError").textContent = "Enter a quantity from 1 to 1,000,000.";
        quantityInput.focus();
        return;
    }

    convertButton.classList.add("loading");
    convertButton.querySelector("span").textContent = "Calculating...";

    try {
        const params = new URLSearchParams({material, quantity: quantity.toString()});
        const response = await fetch(`/convert?${params}`);
        const result = await response.json();

        if (!response.ok) throw new Error(result.message || "Conversion failed.");

        document.getElementById("planks").textContent = result.planks.toLocaleString();
        document.getElementById("logs").textContent = result.logs.toLocaleString();
        document.getElementById("planksStacks").textContent = formatStacks(result.planks) || "Total required";
        document.getElementById("logsStacks").textContent = formatStacks(result.logs) || "Total required";
        document.getElementById("ingredientLabel").textContent = result.ingredient;
        document.getElementById("rawMaterialLabel").textContent = result.rawMaterial;
        document.getElementById("ingredientIcon").className = `resource-icon ${iconClass(result.ingredient)}`;
        document.getElementById("rawMaterialIcon").className = `resource-icon ${iconClass(result.rawMaterial)}`;
        document.getElementById("summaryMaterial").textContent = result.material;
        document.getElementById("summaryQuantity").textContent = `× ${result.quantity.toLocaleString()}`;
        document.getElementById("recipeDetails").textContent =
            `${result.planksPerRecipe} ${result.ingredient.toLowerCase()} → ` +
            `${result.itemsPerRecipe} ${result.material.toLowerCase()}`;
        document.getElementById("recipeChip").textContent = "Calculated";

        emptyState.hidden = true;
        resultsContent.hidden = false;
    } catch (error) {
        emptyState.hidden = false;
        resultsContent.hidden = true;
        showError(error.message);
    } finally {
        convertButton.classList.remove("loading");
        convertButton.querySelector("span").textContent = "Calculate resources";
    }
}

converterForm.addEventListener("submit", convert);
document.getElementById("increaseButton").addEventListener("click", () => setQuantity(Number(quantityInput.value) + 1));
document.getElementById("decreaseButton").addEventListener("click", () => setQuantity(Number(quantityInput.value) - 1));

document.getElementById("resetButton").addEventListener("click", () => {
    materialSelect.value = "";
    quantityInput.value = "1";
    clearValidation();
    emptyState.hidden = false;
    resultsContent.hidden = true;
    document.getElementById("recipeChip").textContent = "Ready";
    materialSelect.focus();
});

quantityInput.addEventListener("input", () => {
    document.getElementById("quantityError").textContent = "";
});

materialSelect.addEventListener("change", () => {
    document.getElementById("materialError").textContent = "";
});

/* ---------- Shopping list ---------- */

const MAX_QUANTITY = 1000000;
const listEmpty = document.getElementById("listEmpty");
const listContent = document.getElementById("listContent");
const listRows = document.getElementById("listRows");
const listError = document.getElementById("listError");
const clearListButton = document.getElementById("clearListButton");
const copyListButton = document.getElementById("copyListButton");

// Each entry: { material, quantity, planks, logs, ingredient, rawMaterial, ingredientsPerRaw }.
// Everything after quantity is filled in by the server. For stone items "planks"/"logs"
// hold the stone/cobblestone counts; ingredient/rawMaterial say what they really are.
let shoppingList = [];

function newEntry(material, quantity) {
    return {material, quantity, planks: null, logs: null,
        ingredient: null, rawMaterial: null, ingredientsPerRaw: null};
}
let recalcTimer = null;
let recalcRequestId = 0;
// False from any list change until the server answers for the latest version of the list.
let listUpToDate = true;
let copyResetTimer = null;

// The list is kept in the browser so it survives a refresh.
// Only material + quantity are stored; planks/logs are recalculated by the server on load.
const LIST_STORAGE_KEY = "mineblock.shoppingList";

function saveList() {
    try {
        const saved = shoppingList.map(({material, quantity}) => ({material, quantity}));
        localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify(saved));
    } catch {
        // Storage can be unavailable (e.g. blocked or full); the list still works for this visit.
    }
}

// Reads the saved list, skipping anything malformed or no longer a known material.
// knownMaterials is null if the material list failed to load; then nothing is filtered by name.
function loadSavedList(knownMaterials) {
    let saved;
    try {
        saved = JSON.parse(localStorage.getItem(LIST_STORAGE_KEY));
    } catch {
        return [];
    }
    if (!Array.isArray(saved)) return [];

    const entries = [];
    saved.forEach(item => {
        const material = item?.material;
        const quantity = item?.quantity;
        if (typeof material !== "string") return;
        if (knownMaterials && !knownMaterials.includes(material)) return;
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) return;
        if (entries.some(entry => entry.material === material)) return;
        entries.push(newEntry(material, quantity));
    });
    return entries;
}

function addToList() {
    clearValidation();

    const material = materialSelect.value;
    const quantity = Number(quantityInput.value);

    if (!material) {
        document.getElementById("materialError").textContent = "Choose an item to add.";
        materialSelect.focus();
        return;
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
        document.getElementById("quantityError").textContent = "Enter a quantity from 1 to 1,000,000.";
        quantityInput.focus();
        return;
    }

    // Adding an item that's already on the list adds to its quantity.
    const existing = shoppingList.find(entry => entry.material === material);
    if (existing) {
        if (existing.quantity + quantity > MAX_QUANTITY) {
            document.getElementById("quantityError").textContent =
                `${material} would go over 1,000,000 on your list.`;
            return;
        }
        existing.quantity += quantity;
    } else {
        shoppingList.push(newEntry(material, quantity));
    }

    saveList();
    renderList();
    recalculateList();
}

function removeFromList(material) {
    shoppingList = shoppingList.filter(entry => entry.material !== material);
    saveList();
    renderList();
    recalculateList();
}

function updateListQuantity(material, rawValue, input) {
    const entry = shoppingList.find(item => item.material === material);
    const quantity = Number(rawValue);
    if (!entry) return;

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
        input.classList.add("invalid");
        showListError(`Quantity for ${material} must be from 1 to 1,000,000.`);
        return;
    }

    input.classList.remove("invalid");
    entry.quantity = quantity;
    listUpToDate = false;
    recalcRequestId++; // any request already in flight is now out of date
    saveList();
    // Wait for the user to stop typing before asking the server.
    clearTimeout(recalcTimer);
    recalcTimer = setTimeout(recalculateList, 250);
}

function formatCount(value) {
    return value == null ? "…" : value.toLocaleString();
}

// Fills a list cell with the number and what it counts (e.g. "12 stone"),
// plus a small stack line underneath when it's 64 or more.
function fillCountCell(cell, value, unit) {
    const stacks = formatStacks(value);
    const number = document.createElement("span");
    number.className = "count-value";
    number.textContent = value == null || !unit ? "…" : `${formatCount(value)} ${unit.toLowerCase()}`;
    cell.replaceChildren(number);
    if (stacks) {
        const small = document.createElement("small");
        small.className = "stack-text";
        small.textContent = stacks;
        cell.appendChild(small);
    }
}

function renderList() {
    const count = shoppingList.length;
    document.getElementById("listCount").textContent = `${count} ${count === 1 ? "item" : "items"}`;
    listEmpty.hidden = count > 0;
    listContent.hidden = count === 0;
    clearListButton.hidden = count === 0;
    copyListButton.hidden = count === 0;

    listRows.replaceChildren(...shoppingList.map(entry => {
        const row = document.createElement("div");
        row.className = "list-row";
        row.setAttribute("role", "row");
        row.dataset.material = entry.material;

        const name = document.createElement("span");
        name.className = "list-item-name";
        name.setAttribute("role", "cell");
        name.textContent = entry.material;

        const qtyCell = document.createElement("span");
        qtyCell.setAttribute("role", "cell");
        const qtyInput = document.createElement("input");
        qtyInput.type = "number";
        qtyInput.min = "1";
        qtyInput.max = String(MAX_QUANTITY);
        qtyInput.value = entry.quantity;
        qtyInput.inputMode = "numeric";
        qtyInput.className = "list-qty";
        qtyInput.setAttribute("aria-label", `Quantity of ${entry.material}`);
        qtyInput.addEventListener("input", () => updateListQuantity(entry.material, qtyInput.value, qtyInput));
        qtyCell.appendChild(qtyInput);

        const planks = document.createElement("span");
        planks.className = "list-num";
        planks.setAttribute("role", "cell");
        planks.dataset.field = "planks";
        fillCountCell(planks, entry.planks, entry.ingredient);

        const logs = document.createElement("span");
        logs.className = "list-num";
        logs.setAttribute("role", "cell");
        logs.dataset.field = "logs";
        fillCountCell(logs, entry.logs, entry.rawMaterial);

        const removeCell = document.createElement("span");
        removeCell.setAttribute("role", "cell");
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-button";
        removeButton.textContent = "×";
        removeButton.title = `Remove ${entry.material}`;
        removeButton.setAttribute("aria-label", `Remove ${entry.material}`);
        removeButton.addEventListener("click", () => removeFromList(entry.material));
        removeCell.appendChild(removeButton);

        row.append(name, qtyCell, planks, logs, removeCell);
        return row;
    }));
}

// Updates only the numbers, so the quantity box being typed in keeps focus.
function renderListNumbers() {
    shoppingList.forEach(entry => {
        const row = listRows.querySelector(`[data-material="${CSS.escape(entry.material)}"]`);
        if (row) {
            fillCountCell(row.querySelector('[data-field="planks"]'), entry.planks, entry.ingredient);
            fillCountCell(row.querySelector('[data-field="logs"]'), entry.logs, entry.rawMaterial);
        }
    });

    const pills = [];
    listTotals().forEach(group => {
        pills.push(totalPill(group.ingredient, group.ingredientTotal));
        pills.push(totalPill(group.rawMaterial, group.rawTotal));
    });
    document.getElementById("totalPills").replaceChildren(...pills);
}

// Adds up the list per ingredient, in list order, e.g.
// [{ingredient: "Planks", ingredientTotal: 36, rawMaterial: "Logs", rawTotal: 9}, ...].
// Raw materials come from the combined ingredient total, so leftovers carry over between items.
// Items the server hasn't answered for yet are left out.
function listTotals() {
    const groups = new Map();
    shoppingList.forEach(entry => {
        if (entry.ingredient == null || entry.planks == null) return;
        let group = groups.get(entry.ingredient);
        if (!group) {
            group = {ingredient: entry.ingredient, ingredientTotal: 0,
                rawMaterial: entry.rawMaterial, perRaw: entry.ingredientsPerRaw};
            groups.set(entry.ingredient, group);
        }
        group.ingredientTotal += entry.planks;
    });
    return [...groups.values()].map(group =>
        ({...group, rawTotal: Math.ceil(group.ingredientTotal / group.perRaw)}));
}

// One total, e.g. [icon] "300 planks (4 stacks + 44)"
function totalPill(materialName, count) {
    const pill = document.createElement("div");
    pill.className = "total-pill";

    const icon = document.createElement("span");
    icon.className = `mini-icon ${iconClass(materialName)}`;
    icon.setAttribute("aria-hidden", "true");

    const text = document.createElement("span");
    const number = document.createElement("strong");
    number.textContent = count.toLocaleString();
    text.append(number, ` ${materialName.toLowerCase()}`);
    const stacks = formatStacks(count);
    if (stacks) {
        const small = document.createElement("small");
        small.className = "stack-text";
        small.textContent = ` (${stacks})`;
        text.appendChild(small);
    }

    pill.append(icon, text);
    return pill;
}

function showListError(message) {
    listError.textContent = message;
    listError.hidden = false;
}

async function recalculateList() {
    clearTimeout(recalcTimer);
    listError.hidden = true;
    listUpToDate = false;

    if (shoppingList.length === 0) {
        listUpToDate = true;
        renderListNumbers();
        return;
    }

    // Ignore responses from older requests if the list changed in the meantime.
    const requestId = ++recalcRequestId;
    const payload = Object.fromEntries(shoppingList.map(entry => [entry.material, entry.quantity]));

    try {
        const response = await fetch("/convert/batch", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload)
        });
        const results = await response.json();
        if (!response.ok) throw new Error(results.message || "Could not calculate your list.");
        if (requestId !== recalcRequestId) return;

        results.forEach(result => {
            const entry = shoppingList.find(item => item.material === result.material);
            if (entry) {
                entry.planks = result.planks;
                entry.logs = result.logs;
                entry.ingredient = result.ingredient;
                entry.rawMaterial = result.rawMaterial;
                entry.ingredientsPerRaw = result.ingredientsPerRaw;
            }
        });
        listUpToDate = true;
        renderListNumbers();
    } catch (error) {
        if (requestId === recalcRequestId) showListError(error.message);
    }
}

function hasInvalidQuantity() {
    return listRows.querySelector(".list-qty.invalid") !== null;
}

// Plain text for pasting into chat or notes, e.g. "Stairs ×24 → 36 planks (9 logs)",
// then one "Total:" line per ingredient.
function listAsText() {
    const lines = shoppingList.map(entry =>
        `${entry.material} ×${entry.quantity.toLocaleString()} → ` +
        `${entry.planks.toLocaleString()} ${entry.ingredient.toLowerCase()} ` +
        `(${entry.logs.toLocaleString()} ${entry.rawMaterial.toLowerCase()})`);
    listTotals().forEach(group => {
        lines.push(`Total: ${group.ingredientTotal.toLocaleString()} ${group.ingredient.toLowerCase()}, ` +
            `${group.rawTotal.toLocaleString()} ${group.rawMaterial.toLowerCase()}`);
    });
    return lines.join("\n");
}

async function copyList() {
    listError.hidden = true;

    if (hasInvalidQuantity()) {
        showListError("Fix the highlighted quantity before copying.");
        return;
    }
    if (!listUpToDate) {
        showListError("Your list is still calculating. Try again in a moment.");
        return;
    }

    try {
        await navigator.clipboard.writeText(listAsText());
        copyListButton.textContent = "Copied!";
        clearTimeout(copyResetTimer);
        copyResetTimer = setTimeout(() => { copyListButton.textContent = "Copy list"; }, 1500);
    } catch {
        showListError("Couldn't copy to the clipboard. Your browser may be blocking it.");
    }
}

/* ---------- Theme ---------- */

// The starting theme is set by the small script in index.html's <head>; this keeps it in sync after that.
const THEME_STORAGE_KEY = "mineblock.theme";
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
    const dark = theme === "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    themeToggle.setAttribute("aria-pressed", String(dark));
    // Show what clicking will switch to; ︎ keeps the sun as a plain symbol, not a colour emoji.
    themeToggle.textContent = dark ? "☀︎" : "☾";
}

themeToggle.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
        // Can't save; the theme still changes for this visit.
    }
});

applyTheme(document.documentElement.dataset.theme);

document.getElementById("addToListButton").addEventListener("click", addToList);
copyListButton.addEventListener("click", copyList);
clearListButton.addEventListener("click", () => {
    shoppingList = [];
    saveList();
    renderList();
    recalculateList();
});

renderList();
loadMaterials().then(materials => {
    shoppingList = loadSavedList(materials);
    // Re-save so entries that were dropped (e.g. a removed material) don't come back.
    if (materials) saveList();
    renderList();
    recalculateList();
});
