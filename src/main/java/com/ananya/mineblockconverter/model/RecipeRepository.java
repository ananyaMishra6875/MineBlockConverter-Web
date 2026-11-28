package com.ananya.mineblockconverter.model;

import java.util.LinkedHashMap;
import java.util.List;

public class RecipeRepository {

    /** The items you can pick in the app, in the order the dropdown shows them. */
    public static LinkedHashMap<String, Recipe> loadRecipes() {
        LinkedHashMap<String, Recipe> recipes = new LinkedHashMap<>();

        // Wood family
        add(recipes, "Stairs", 4, of("Planks", 6));
        add(recipes, "Slabs", 6, of("Planks", 3));
        add(recipes, "Trapdoors", 2, of("Planks", 6));
        add(recipes, "Doors", 3, of("Planks", 6));
        add(recipes, "Gates", 1, of("Planks", 2));
        add(recipes, "Fence Posts", 3, of("Planks", 4));
        add(recipes, "Signs", 3, of("Planks", 6));
        add(recipes, "Buttons", 1, of("Planks", 1));
        add(recipes, "Pressure Plates", 1, of("Planks", 2));
        add(recipes, "Boats", 1, of("Planks", 5));
        add(recipes, "Chests", 1, of("Planks", 8));

        // Stone family
        add(recipes, "Stone Stairs", 4, of("Stone", 6));
        add(recipes, "Stone Slabs", 6, of("Stone", 3));
        add(recipes, "Stone Bricks", 4, of("Stone", 4));
        add(recipes, "Stone Buttons", 1, of("Stone", 1));
        add(recipes, "Stone Pressure Plates", 1, of("Stone", 2));

        // Cobblestone family: cobblestone is gathered directly
        add(recipes, "Cobblestone Stairs", 4, of("Cobblestone", 6));
        add(recipes, "Cobblestone Slabs", 6, of("Cobblestone", 3));
        add(recipes, "Cobblestone Walls", 6, of("Cobblestone", 6));
        add(recipes, "Furnaces", 1, of("Cobblestone", 8));

        // Wool family
        add(recipes, "Carpets", 3, of("Wool", 2));
        add(recipes, "Beds", 1, of("Wool", 3), of("Planks", 3));
        add(recipes, "Banners", 1, of("Wool", 6), of("Sticks", 1));

        return recipes;
    }

    /**
     * Ingredients that are crafted from something else. They aren't in the dropdown,
     * but the converter works back through them. Logs, Cobblestone and Wool have no
     * recipe because they are gathered directly.
     */
    public static LinkedHashMap<String, Recipe> loadIngredientRecipes() {
        LinkedHashMap<String, Recipe> recipes = new LinkedHashMap<>();

        add(recipes, "Planks", 4, of("Logs", 1));
        add(recipes, "Sticks", 4, of("Planks", 2));
        add(recipes, "Stone", 1, of("Cobblestone", 1));  // smelted

        return recipes;
    }

    private static void add(LinkedHashMap<String, Recipe> recipes, String name, int output,
                            Ingredient... inputs) {
        recipes.put(name, new Recipe(name, output, List.of(inputs)));
    }

    private static Ingredient of(String item, int amount) {
        return new Ingredient(item, amount);
    }
}
