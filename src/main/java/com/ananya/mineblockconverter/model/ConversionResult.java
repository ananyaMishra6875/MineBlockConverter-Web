package com.ananya.mineblockconverter.model;

public class ConversionResult {
    private String material;
    private int quantity;
    private int planks;
    private int logs;

    public ConversionResult(String material, int quantity, int planks, int logs) {
        this.material = material;
        this.quantity = quantity;
        this.planks = planks;
        this.logs = logs;
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
}