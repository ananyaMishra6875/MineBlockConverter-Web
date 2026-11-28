package com.ananya.mineblockconverter.model;

public class RecipeRepository {

    /**
     * Every recipe, in the order the dropdown shows them: each family starts with its
     * building blocks, then the items made from them. See {@link RecipeBook} for what
     * item, block and ingredient mean.
     */
    public static RecipeBook load() {
        return new RecipeBook()
                // Wood family
                .block("Logs")
                .block("Planks", 4, of("Logs", 1))
                .ingredient("Sticks", 4, of("Planks", 2))
                .item("Stairs", 4, of("Planks", 6))
                .item("Slabs", 6, of("Planks", 3))
                .item("Trapdoors", 2, of("Planks", 6))
                .item("Doors", 3, of("Planks", 6))
                .item("Gates", 1, of("Planks", 2), of("Sticks", 4))
                .item("Fence Posts", 3, of("Planks", 4), of("Sticks", 2))
                .item("Signs", 3, of("Planks", 6), of("Sticks", 1))
                .item("Buttons", 1, of("Planks", 1))
                .item("Pressure Plates", 1, of("Planks", 2))
                .item("Boats", 1, of("Planks", 5))
                .item("Chests", 1, of("Planks", 8))

                // Stone family: stone is smelted from cobblestone
                .block("Stone", 1, of("Cobblestone", 1))
                .item("Stone Stairs", 4, of("Stone", 6))
                .item("Stone Slabs", 6, of("Stone", 3))
                .item("Stone Bricks", 4, of("Stone", 4))
                .item("Stone Buttons", 1, of("Stone", 1))
                .item("Stone Pressure Plates", 1, of("Stone", 2))

                // Cobblestone family
                .block("Cobblestone")
                .item("Cobblestone Stairs", 4, of("Cobblestone", 6))
                .item("Cobblestone Slabs", 6, of("Cobblestone", 3))
                .item("Cobblestone Walls", 6, of("Cobblestone", 6))
                .item("Furnaces", 1, of("Cobblestone", 8))

                // Wool family: wool is sheared from sheep
                .block("Wool")
                .item("Carpets", 3, of("Wool", 2))
                .item("Beds", 1, of("Wool", 3), of("Planks", 3))
                .item("Banners", 1, of("Wool", 6), of("Sticks", 1));
    }

    private static Ingredient of(String item, int amount) {
        return new Ingredient(item, amount);
    }
}
