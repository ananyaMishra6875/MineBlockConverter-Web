const materialSelect = document.getElementById("materialSelect");
const quantityInput = document.getElementById("quantityInput");
const converterForm = document.getElementById("converterForm");
const convertButton = document.getElementById("convertButton");
const emptyState = document.getElementById("emptyState");
const resultsContent = document.getElementById("resultsContent");
const errorBanner = document.getElementById("errorBanner");

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
    } catch (error) {
        showError(error.message);
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
        document.getElementById("summaryMaterial").textContent = result.material;
        document.getElementById("summaryQuantity").textContent = `× ${result.quantity.toLocaleString()}`;
        document.getElementById("recipeDetails").textContent =
            `${result.planksPerRecipe} planks → ${result.itemsPerRecipe} ${result.material.toLowerCase()}`;
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

// Each entry: { material, quantity, planks, logs } (planks/logs filled in by the server)
let shoppingList = [];
let recalcTimer = null;
let recalcRequestId = 0;

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
        shoppingList.push({material, quantity, planks: null, logs: null});
    }

    renderList();
    recalculateList();
}

function removeFromList(material) {
    shoppingList = shoppingList.filter(entry => entry.material !== material);
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
    // Wait for the user to stop typing before asking the server.
    clearTimeout(recalcTimer);
    recalcTimer = setTimeout(recalculateList, 250);
}

function formatCount(value) {
    return value == null ? "…" : value.toLocaleString();
}

function renderList() {
    const count = shoppingList.length;
    document.getElementById("listCount").textContent = `${count} ${count === 1 ? "item" : "items"}`;
    listEmpty.hidden = count > 0;
    listContent.hidden = count === 0;
    clearListButton.hidden = count === 0;

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
        planks.textContent = formatCount(entry.planks);

        const logs = document.createElement("span");
        logs.className = "list-num";
        logs.setAttribute("role", "cell");
        logs.dataset.field = "logs";
        logs.textContent = formatCount(entry.logs);

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
    let totalPlanks = 0;
    shoppingList.forEach(entry => {
        const row = listRows.querySelector(`[data-material="${CSS.escape(entry.material)}"]`);
        if (row) {
            row.querySelector('[data-field="planks"]').textContent = formatCount(entry.planks);
            row.querySelector('[data-field="logs"]').textContent = formatCount(entry.logs);
        }
        totalPlanks += entry.planks ?? 0;
    });

    document.getElementById("totalPlanks").textContent = totalPlanks.toLocaleString();
    document.getElementById("totalLogs").textContent = Math.ceil(totalPlanks / 4).toLocaleString();
}

function showListError(message) {
    listError.textContent = message;
    listError.hidden = false;
}

async function recalculateList() {
    clearTimeout(recalcTimer);
    listError.hidden = true;

    if (shoppingList.length === 0) {
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
            }
        });
        renderListNumbers();
    } catch (error) {
        if (requestId === recalcRequestId) showListError(error.message);
    }
}

document.getElementById("addToListButton").addEventListener("click", addToList);
clearListButton.addEventListener("click", () => {
    shoppingList = [];
    renderList();
    recalculateList();
});

renderList();
loadMaterials();
