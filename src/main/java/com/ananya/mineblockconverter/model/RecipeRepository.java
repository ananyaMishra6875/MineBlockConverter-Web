package com.ananya.mineblockconverter.model;

import java.util.LinkedHashMap;

public class RecipeRepository {
    public static LinkedHashMap<String, Material> loadRecipes() {
        LinkedHashMap<String, Material> recipes = new LinkedHashMap<>();

        recipes.put("Stairs", new Material("Stairs", 6, 4));
        recipes.put("Slabs", new Material("Slabs", 3, 6));
        recipes.put("Trapdoors", new Material("Trapdoors", 6, 2));
        recipes.put("Doors", new Material("Doors", 6, 3));
        recipes.put("Gates", new Material("Gates", 2, 1));
        recipes.put("Fence Posts", new Material("Fence Posts", 4, 3));
        recipes.put("Signs", new Material("Signs", 6, 3));
        recipes.put("Buttons", new Material("Buttons", 1, 1));
        recipes.put("Pressure Plates", new Material("Pressure Plates", 2, 1));
        recipes.put("Boats", new Material("Boats", 5, 1));
        recipes.put("Chests", new Material("Chests", 8, 1));

        return recipes;
    }

    public static LinkedHashMap<String, Material> getRecipes() {
        return loadRecipes();
    }
}