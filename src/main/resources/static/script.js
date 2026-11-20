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

loadMaterials();
