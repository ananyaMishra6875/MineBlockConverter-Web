// Load materials
async function loadMaterials() {
    // Fetch Materials
    const response = await fetch("/materials");
    const materials = await response.json();

    // Populate the dropdown with the materials
    const dropdown =
        document.getElementById("materialSelect");

    materials.forEach(material => {
        const option =
            document.createElement("option");
        option.value = material;
        option.textContent = material;
        dropdown.appendChild(option);
    });
}

loadMaterials();

// Convert function
async function convert() {
    const material = document.getElementById("materialSelect").value;
    const quantity = document.getElementById("quantityInput").value;

    try {
        const params = new URLSearchParams({material, quantity});
        const response = await fetch(`/convert?${params}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Conversion failed.");
        }

        document.getElementById("planks").textContent = result.planks;
        document.getElementById("logs").textContent = result.logs;
    } catch (error) {
        document.getElementById("planks").textContent = "—";
        document.getElementById("logs").textContent = "—";
        alert(error.message);
    }
}

// Connect conversion to the button and Enter key
document
    .getElementById("convertButton")
    .addEventListener("click", convert);

document
    .getElementById("quantityInput")
    .addEventListener("keydown", event => {
        if (event.key === "Enter") {
            convert();
        }
    });
