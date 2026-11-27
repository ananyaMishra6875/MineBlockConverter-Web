const materialSelect = document.getElementById("materialSelect");
const quantityInput = document.getElementById("quantityInput");
const converterForm = document.getElementById("converterForm");
const convertButton = document.getElementById("convertButton");
const emptyState = document.getElementById("emptyState");
const resultsContent = document.getElementById("resultsContent");
const errorBanner = document.getElementById("errorBanner");

// Every material the app works out (planks, logs, sticks, stone, cobblestone, wool) stacks to 64.
const STACK_SIZE = 64;

// CSS class for a material's little block icon (see styles.css).
const ICON_CLASSES = {
    Planks: "plank-icon",
    Logs: "log-icon",
    Sticks: "stick-icon",
    Stone: "stone-icon",
    Cobblestone: "cobblestone-icon",
    Wool: "wool-icon"
};

function iconClass(materialName) {
    return ICON_CLASSES[materialName] ?? "plank-icon";
}

// "Planks", 3 -> "planks"; "Logs", 1 -> "log". Wool, Stone and Cobblestone don't change.
function unitName(item, count) {
    const name = item.toLowerCase();
    return count === 1 && name.endsWith("s") ? name.slice(0, -1) : name;
}

// "Planks", 3 -> "3 planks"; "Logs", 1 -> "1 log"
function amountText(item, count) {
    return `${count.toLocaleString()} ${unitName(item, count)}`;
}

// [{item: "Wool", count: 6}, {item: "Planks", count: 6}] -> "6 wool · 6 planks"
function needsText(needs) {
    return needs.map(need => amountText(need.item, need.count)).join(" · ");
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

        // One card per material, the recipe's own ingredients first.
        document.getElementById("resourceList").replaceChildren(...result.needs.map(resourceCard));
        document.getElementById("summaryMaterial").textContent = result.material;
        document.getElementById("summaryQuantity").textContent = `× ${result.quantity.toLocaleString()}`;
        // e.g. "3 wool + 3 planks → 1 bed"
        const recipeInputs = result.recipeInputs.map(input => amountText(input.item, input.amount)).join(" + ");
        document.getElementById("recipeDetails").textContent =
            `${recipeInputs} → ${amountText(result.material, result.recipeOutput)}`;
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

// A result card, e.g. [plank icon] Planks / "4 stacks + 44" / 300
function resourceCard(need) {
    const card = document.createElement("article");
    card.className = "resource-card";

    const icon = document.createElement("div");
    icon.className = `resource-icon ${iconClass(need.item)}`;
    icon.setAttribute("aria-hidden", "true");

    const label = document.createElement("div");
    const name = document.createElement("p");
    name.textContent = need.item;
    const stacks = document.createElement("span");
    stacks.textContent = formatStacks(need.count) || "Total required";
    label.append(name, stacks);

    const count = document.createElement("strong");
    count.textContent = need.count.toLocaleString();

    card.append(icon, label, count);
    return card;
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

// Each entry: { material, quantity, needs }. needs is filled in by the server,
// e.g. [{item: "Wool", count: 6}, {item: "Planks", count: 6}, {item: "Logs", count: 2}].
let shoppingList = [];
// The whole list worked out together by the server, so leftovers carry over between items.
let listTotals = [];

function newEntry(material, quantity) {
    return {material, quantity, needs: null};
}
let recalcTimer = null;
let recalcRequestId = 0;
// False from any list change until the server answers for the latest version of the list.
let listUpToDate = true;
let copyResetTimer = null;

// The list is kept in the browser so it survives a refresh.
// Only material + quantity are stored; what they need is recalculated by the server on load.
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

// The Needs cell, e.g. "6 wool · 6 planks · 2 logs", or "…" until the server answers.
function fillNeedsCell(cell, entry) {
    cell.textContent = entry.needs == null ? "…" : needsText(entry.needs);
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

        const needs = document.createElement("span");
        needs.className = "list-needs";
        needs.setAttribute("role", "cell");
        fillNeedsCell(needs, entry);

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

        row.append(name, qtyCell, needs, removeCell);
        return row;
    }));
}

// Updates only the numbers, so the quantity box being typed in keeps focus.
function renderListNumbers() {
    shoppingList.forEach(entry => {
        const row = listRows.querySelector(`[data-material="${CSS.escape(entry.material)}"]`);
        if (row) fillNeedsCell(row.querySelector(".list-needs"), entry);
    });

    document.getElementById("totalPills").replaceChildren(
        ...listTotals.map(total => totalPill(total.item, total.count)));
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
    text.append(number, ` ${unitName(materialName, count)}`);
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
        listTotals = [];
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
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Could not calculate your list.");
        if (requestId !== recalcRequestId) return;

        result.items.forEach(item => {
            const entry = shoppingList.find(listed => listed.material === item.material);
            if (entry) entry.needs = item.needs;
        });
        listTotals = result.totals;
        listUpToDate = true;
        renderListNumbers();
    } catch (error) {
        if (requestId === recalcRequestId) showListError(error.message);
    }
}

function hasInvalidQuantity() {
    return listRows.querySelector(".list-qty.invalid") !== null;
}

// Plain text for pasting into chat or notes, e.g.
//   Beds ×2 → 6 wool · 6 planks · 2 logs
//   Total: 6 wool · 6 planks · 2 logs
function listAsText() {
    const lines = shoppingList.map(entry =>
        `${entry.material} ×${entry.quantity.toLocaleString()} → ${needsText(entry.needs)}`);
    lines.push(`Total: ${needsText(listTotals)}`);
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
