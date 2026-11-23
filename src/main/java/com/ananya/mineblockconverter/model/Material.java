package com.ananya.mineblockconverter.model;

/**
 * A craftable item and what it is made from.
 *
 * Each recipe turns {@code recipeInput} of an ingredient (e.g. Planks) into
 * {@code recipeOutput} items. The ingredient itself comes from a raw material
 * (e.g. Logs), and one raw material makes {@code ingredientsPerRaw} ingredients.
 */
public class Material {
    protected String name;
    protected String ingredient;
    protected int recipeInput;
    protected int recipeOutput;
    protected String rawMaterial;
    protected int ingredientsPerRaw;

    public Material(String name, String ingredient, int recipeInput, int recipeOutput,
                    String rawMaterial, int ingredientsPerRaw) {
        this.name = name;
        this.ingredient = ingredient;
        this.recipeInput = recipeInput;
        this.recipeOutput = recipeOutput;
        this.rawMaterial = rawMaterial;
        this.ingredientsPerRaw = ingredientsPerRaw;
    }

    // Getters
    public String getName() {
        return name;
    }

    public String getIngredient() {
        return ingredient;
    }

    public int getRecipeInput() {
        return recipeInput;
    }

    public int getRecipeOutput() {
        return recipeOutput;
    }

    public String getRawMaterial() {
        return rawMaterial;
    }

    public int getIngredientsPerRaw() {
        return ingredientsPerRaw;
    }

    // How many ingredients (e.g. planks) are needed to craft amt items
    public int calculateIngredients(int amt) {
        int recipesNeeded = (int) Math.ceil(amt / (double) recipeOutput);

        return recipesNeeded * recipeInput;
    }

    // How many raw materials (e.g. logs) are needed to craft amt items
    public int calculateRawMaterials(int amt) {
        return (int) Math.ceil(calculateIngredients(amt) / (double) ingredientsPerRaw);
    }
}
