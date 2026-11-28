package com.ananya.mineblockconverter.service;

import com.ananya.mineblockconverter.model.BatchResult;
import com.ananya.mineblockconverter.model.ConversionResult;
import com.ananya.mineblockconverter.model.Ingredient;
import com.ananya.mineblockconverter.model.Recipe;
import com.ananya.mineblockconverter.model.RecipeBook;
import com.ananya.mineblockconverter.model.RecipeRepository;
import com.ananya.mineblockconverter.model.ResourceAmount;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

@Service
public class ConverterService {
    private static final int MAX_QUANTITY = 1_000_000;

    private final RecipeBook book = RecipeRepository.load();

    public ConversionResult convert(String materialName, int quantity) {
        validate(materialName, quantity);
        List<ResourceAmount> needs = workBackwards(Map.of(materialName, quantity));

        Recipe recipe = book.recipe(materialName);
        if (recipe == null) {
            // Gathered directly, e.g. Logs: no recipe to show
            return new ConversionResult(materialName, quantity, 0, List.of(), needs);
        }
        return new ConversionResult(materialName, quantity, recipe.output(), recipe.inputs(), needs);
    }

    public BatchResult convertBatch(Map<String, Integer> quantities) {
        if (quantities == null || quantities.isEmpty()) {
            throw new IllegalArgumentException("At least one material quantity is required.");
        }

        List<ConversionResult> items = new ArrayList<>();
        Map<String, Integer> wanted = new LinkedHashMap<>();
        for (Map.Entry<String, Integer> entry : quantities.entrySet()) {
            if (entry.getValue() == null) {
                throw new IllegalArgumentException("Quantity is required for " + entry.getKey() + ".");
            }
            items.add(convert(entry.getKey(), entry.getValue()));
            wanted.put(entry.getKey(), entry.getValue());
        }
        return new BatchResult(items, workBackwards(wanted));
    }

    public List<String> getMaterialNames() {
        return book.selectableNames();
    }

    private void validate(String materialName, int quantity) {
        if (materialName == null || materialName.isBlank()) {
            throw new IllegalArgumentException("Material is required.");
        }
        if (quantity < 1 || quantity > MAX_QUANTITY) {
            throw new IllegalArgumentException("Quantity must be between 1 and 1,000,000.");
        }
        if (!book.isSelectable(materialName)) {
            throw new IllegalArgumentException("Unknown material: " + materialName);
        }
    }

    /**
     * Works out everything needed to craft the wanted items, all the way back to
     * things that are gathered directly.
     *
     * Each material is only worked out once everything that uses it has added its
     * share. That way, crafting is rounded up on the combined amount: Stairs and
     * Banners on one list share their planks, and leftover planks aren't wasted.
     *
     * The result lists the wanted items' own ingredients first, then what those are
     * made from, e.g. Wool, Sticks, Planks, Logs for Banners. Materials that several
     * items share (like Planks) appear once, where they're first needed. A picked building
     * block is included with its own amount added in, e.g. Planks ×20 gives 20 Planks, 5 Logs.
     */
    private List<ResourceAmount> workBackwards(Map<String, Integer> wanted) {
        // 1. Find every material involved, nearest first.
        Set<String> involved = new LinkedHashSet<>();
        Deque<String> toVisit = new ArrayDeque<>(wanted.keySet());
        while (!toVisit.isEmpty()) {
            String item = toVisit.poll();
            if (!involved.add(item)) continue;
            Recipe recipe = book.recipe(item);
            if (recipe != null) {
                recipe.inputs().forEach(input -> toVisit.add(input.item()));
            }
        }

        // 2. Count how many involved recipes use each material.
        Map<String, Integer> usedBy = new HashMap<>();
        for (String item : involved) {
            Recipe recipe = book.recipe(item);
            if (recipe != null) {
                recipe.inputs().forEach(input -> usedBy.merge(input.item(), 1, Integer::sum));
            }
        }

        // 3. Go through materials once all their users are done, adding up what each one needs.
        Map<String, Long> needed = new HashMap<>();
        wanted.forEach((item, amount) -> needed.merge(item, (long) amount, Long::sum));

        Deque<String> ready = new ArrayDeque<>();
        involved.stream().filter(item -> !usedBy.containsKey(item)).forEach(ready::add);

        List<ResourceAmount> result = new ArrayList<>();
        int done = 0;
        while (!ready.isEmpty()) {
            String item = ready.poll();
            done++;
            long amount = needed.getOrDefault(item, 0L);
            // Materials are listed even when picked themselves: Planks ×10 + Stairs ×4 is 16 planks.
            // Items like Stairs aren't: you place those, nothing else is made from them.
            if (book.isMaterial(item)) {
                result.add(new ResourceAmount(item, amount));
            }

            Recipe recipe = book.recipe(item);
            if (recipe == null) continue;  // gathered directly

            long crafts = recipe.timesToCraft(amount);
            for (Ingredient input : recipe.inputs()) {
                needed.merge(input.item(), crafts * input.amount(), Long::sum);
                if (usedBy.merge(input.item(), -1, Integer::sum) == 0) {
                    ready.add(input.item());
                }
            }
        }

        if (done != involved.size()) {
            throw new IllegalStateException("The recipes go in a circle, so they can't be worked out.");
        }

        // 4. Show them nearest first (the order step 1 found them in), not in working-out order.
        List<String> nearestFirst = new ArrayList<>(involved);
        result.sort(Comparator.comparingInt(amount -> nearestFirst.indexOf(amount.item())));
        return result;
    }
}
