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
    const material =
        document.getElementById("materialSelect").value;
    const quantity =
        document.getElementById("quantityInput").value;
    const response =
        await fetch(`/convert?material=${material}&quantity=${quantity}`);
    const result =
        await response.json();

    // Output converted planks/logs
    document.getElementById("planks").textContent =
        result.planks; // labels moved to html
    document.getElementById("logs").textContent =
        result.logs;
}

// Connect the convert function to the button click event
document
    .getElementById("convertButton")
    .addEventListener("click", convert);
