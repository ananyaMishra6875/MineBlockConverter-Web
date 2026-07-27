package com.ananya.mineblockconverter.model;

public class Material {
    protected String name;
    protected int recipeInput;
    protected int recipeOutput;

    public Material(String name, int recipeInput, int recipeOutput) {
        this.name = name;
        this.recipeInput = recipeInput;
        this.recipeOutput = recipeOutput;
    }

    // Getters
    public int getRecipeInput() {
        return recipeInput;
    }

    public int getRecipeOutput() {
        return recipeOutput;
    }

    public String getName() {
        return this.name;
    }

    // Calculate Planks
    public int calculatePlanks(int amt) {
        int recipesNeeded = (int) Math.ceil(amt/(double)recipeOutput);

        return recipesNeeded * recipeInput;
    }

    // Calculate Logs
    public int calculateLogs(int amt) {
        return (int) Math.ceil(calculatePlanks(amt)/4.0);
    }
}