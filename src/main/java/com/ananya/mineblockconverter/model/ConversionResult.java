package com.ananya.mineblockconverter.model;

import java.util.List;

/**
 * What crafting {@code quantity} of one item takes.
 *
 * @param recipeOutput how many items one craft makes
 * @param recipeInputs what one craft takes, e.g. 3 Wool + 3 Planks
 * @param needs        everything to gather or craft along the way, the recipe's own
 *                     ingredients first, e.g. 6 Wool, 6 Planks, 2 Logs
 */
public record ConversionResult(String material, int quantity, int recipeOutput,
                               List<Ingredient> recipeInputs, List<ResourceAmount> needs) {
}
