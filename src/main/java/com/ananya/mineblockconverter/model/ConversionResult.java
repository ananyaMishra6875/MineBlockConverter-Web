package com.ananya.mineblockconverter.model;

public class ConversionResult {
    private String material;
    private int quantity;
    // Kept as "planks"/"logs" so the page keeps working; for non-wood recipes they hold
    // the ingredient and raw material counts, named by ingredient/rawMaterial below.
    private int planks;
    private int logs;
    private int planksPerRecipe;
    private int itemsPerRecipe;
    private String ingredient;
    private String rawMaterial;
    private int ingredientsPerRaw;

    public ConversionResult(String material, int quantity, int planks, int logs,
                            int planksPerRecipe, int itemsPerRecipe,
                            String ingredient, String rawMaterial, int ingredientsPerRaw) {
        this.material = material;
        this.quantity = quantity;
        this.planks = planks;
        this.logs = logs;
        this.planksPerRecipe = planksPerRecipe;
        this.itemsPerRecipe = itemsPerRecipe;
        this.ingredient = ingredient;
        this.rawMaterial = rawMaterial;
        this.ingredientsPerRaw = ingredientsPerRaw;
    }

    // Getters
    public String getMaterial() {
        return material;
    }

    public int getQuantity() {
        return quantity;
    }

    public int getPlanks() {
        return planks;
    }

    public int getLogs() {
        return logs;
    }

    public int getPlanksPerRecipe() {
        return planksPerRecipe;
    }

    public int getItemsPerRecipe() {
        return itemsPerRecipe;
    }

    public String getIngredient() {
        return ingredient;
    }

    public String getRawMaterial() {
        return rawMaterial;
    }

    public int getIngredientsPerRaw() {
        return ingredientsPerRaw;
    }
}
