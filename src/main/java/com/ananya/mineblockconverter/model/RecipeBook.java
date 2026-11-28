package com.ananya.mineblockconverter.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Every recipe the app knows, and which things can be picked in the dropdown.
 *
 * There are three kinds of things:
 * <ul>
 *   <li><b>Items</b> you craft and place, like Stairs or Beds. They can be picked.</li>
 *   <li><b>Building blocks</b>, like Planks or Logs. They can be picked too, because builds
 *       use them directly. They also show up in "needs" and totals, since other items are
 *       made from them. Some are crafted (Planks from Logs), some gathered (Logs).</li>
 *   <li><b>Ingredients</b> you never place, like Sticks. They can't be picked, but they show up
 *       in "needs" and totals.</li>
 * </ul>
 * Anything without a recipe (Logs, Cobblestone, Wool) is gathered directly.
 */
public class RecipeBook {
    private final Map<String, Recipe> recipes = new HashMap<>();
    private final List<String> selectable = new ArrayList<>();
    private final Set<String> materials = new HashSet<>();

    /** An item you craft and place, e.g. Stairs. */
    public RecipeBook item(String name, int output, Ingredient... inputs) {
        addRecipe(name, output, inputs);
        selectable.add(name);
        return this;
    }

    /** A building block that is crafted, e.g. Planks from Logs. */
    public RecipeBook block(String name, int output, Ingredient... inputs) {
        addRecipe(name, output, inputs);
        selectable.add(name);
        materials.add(name);
        return this;
    }

    /** A building block that is gathered directly, e.g. Logs. */
    public RecipeBook block(String name) {
        checkNew(name);
        selectable.add(name);
        materials.add(name);
        return this;
    }

    /** An ingredient you can't pick, e.g. Sticks. */
    public RecipeBook ingredient(String name, int output, Ingredient... inputs) {
        addRecipe(name, output, inputs);
        materials.add(name);
        return this;
    }

    /** The recipe for something, or null if it's gathered directly. */
    public Recipe recipe(String name) {
        return recipes.get(name);
    }

    /** What the dropdown offers, in order. */
    public List<String> selectableNames() {
        return List.copyOf(selectable);
    }

    public boolean isSelectable(String name) {
        return selectable.contains(name);
    }

    /** True for building blocks and ingredients: things that show up in "needs" and totals. */
    public boolean isMaterial(String name) {
        return materials.contains(name);
    }

    private void addRecipe(String name, int output, Ingredient... inputs) {
        checkNew(name);
        recipes.put(name, new Recipe(name, output, List.of(inputs)));
    }

    private void checkNew(String name) {
        if (recipes.containsKey(name) || selectable.contains(name) || materials.contains(name)) {
            throw new IllegalStateException(name + " is in the recipe book twice.");
        }
    }
}
