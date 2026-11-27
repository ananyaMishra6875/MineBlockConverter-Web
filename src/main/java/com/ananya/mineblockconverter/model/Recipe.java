package com.ananya.mineblockconverter.model;

import java.util.List;

/**
 * One crafting recipe: the ingredients go in, {@code output} items come out.
 * For example Beds: 3 Wool + 3 Planks make 1 bed.
 *
 * Ingredients can have recipes of their own (Planks come from Logs). Anything with no
 * recipe, like Logs, Cobblestone or Wool, is gathered directly.
 */
public record Recipe(String name, int output, List<Ingredient> inputs) {

    public Recipe {
        if (output < 1) {
            throw new IllegalArgumentException("A recipe must make at least one " + name + ".");
        }
        if (inputs == null || inputs.isEmpty()) {
            throw new IllegalArgumentException("A recipe for " + name + " needs at least one ingredient.");
        }
        inputs = List.copyOf(inputs);
    }

    /** How many times the recipe has to be crafted to get at least {@code amount} items. */
    public long timesToCraft(long amount) {
        return (amount + output - 1) / output;
    }
}
