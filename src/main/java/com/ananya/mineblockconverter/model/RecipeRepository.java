package com.ananya.mineblockconverter.model;

import java.util.LinkedHashMap;

public class RecipeRepository {
    public static LinkedHashMap<String, Material> loadRecipes() {
        LinkedHashMap<String, Material> recipes = new LinkedHashMap<>();

        // Wood family: made from planks, and 1 log = 4 planks
        addWood(recipes, "Stairs", 6, 4);
        addWood(recipes, "Slabs", 3, 6);
        addWood(recipes, "Trapdoors", 6, 2);
        addWood(recipes, "Doors", 6, 3);
        addWood(recipes, "Gates", 2, 1);
        addWood(recipes, "Fence Posts", 4, 3);
        addWood(recipes, "Signs", 6, 3);
        addWood(recipes, "Buttons", 1, 1);
        addWood(recipes, "Pressure Plates", 2, 1);
        addWood(recipes, "Boats", 5, 1);
        addWood(recipes, "Chests", 8, 1);

        // Stone family: made from stone, and 1 cobblestone smelts into 1 stone
        addStone(recipes, "Stone Stairs", 6, 4);
        addStone(recipes, "Stone Slabs", 3, 6);
        addStone(recipes, "Stone Bricks", 4, 4);
        addStone(recipes, "Stone Buttons", 1, 1);
        addStone(recipes, "Stone Pressure Plates", 2, 1);

        // Wool family: wool is gathered directly (sheared from sheep), so there's no raw material
        recipes.put("Carpets", new Material("Carpets", "Wool", 2, 3));

        return recipes;
    }

    private static void addStone(LinkedHashMap<String, Material> recipes,
                                 String name, int stoneIn, int itemsOut) {
        recipes.put(name, new Material(name, "Stone", stoneIn, itemsOut, "Cobblestone", 1));
    }

    private static void addWood(LinkedHashMap<String, Material> recipes,
                                String name, int planksIn, int itemsOut) {
        recipes.put(name, new Material(name, "Planks", planksIn, itemsOut, "Logs", 4));
    }

    public static LinkedHashMap<String, Material> getRecipes() {
        return loadRecipes();
    }
}
