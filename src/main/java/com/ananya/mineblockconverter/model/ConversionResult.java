package com.ananya.mineblockconverter.model;

public class ConversionResult {
    private String material;
    private int quantity;
    private int planks;
    private int logs;
    private int planksPerRecipe;
    private int itemsPerRecipe;

    public ConversionResult(String material, int quantity, int planks, int logs,
                            int planksPerRecipe, int itemsPerRecipe) {
        this.material = material;
        this.quantity = quantity;
        this.planks = planks;
        this.logs = logs;
        this.planksPerRecipe = planksPerRecipe;
        this.itemsPerRecipe = itemsPerRecipe;
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
}