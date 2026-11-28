package com.ananya.mineblockconverter;

import com.ananya.mineblockconverter.model.BatchResult;
import com.ananya.mineblockconverter.model.ConversionResult;
import com.ananya.mineblockconverter.model.Ingredient;
import com.ananya.mineblockconverter.model.ResourceAmount;
import com.ananya.mineblockconverter.service.ConverterService;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ConverterServiceTests {

    private final ConverterService service = new ConverterService();

    // needs("Planks", 12, "Logs", 3) -> [12 Planks, 3 Logs]
    private static List<ResourceAmount> needs(Object... itemsAndCounts) {
        List<ResourceAmount> list = new ArrayList<>();
        for (int i = 0; i < itemsAndCounts.length; i += 2) {
            list.add(new ResourceAmount((String) itemsAndCounts[i], ((Number) itemsAndCounts[i + 1]).longValue()));
        }
        return list;
    }

    @Test
    void calculatesStairsAndLogs() {
        ConversionResult result = service.convert("Stairs", 5);

        assertEquals(needs("Planks", 12, "Logs", 3), result.needs());
        assertEquals(4, result.recipeOutput());
        assertEquals(List.of(new Ingredient("Planks", 6)), result.recipeInputs());
    }

    @Test
    void calculatesStoneStairsAndCobblestone() {
        ConversionResult result = service.convert("Stone Stairs", 8);

        assertEquals(needs("Stone", 12, "Cobblestone", 12), result.needs());
    }

    @Test
    void cobblestoneItemsNeedOnlyCobblestone() {
        assertEquals(needs("Cobblestone", 24), service.convert("Furnaces", 3).needs());
        // 7 walls is two crafts of 6
        assertEquals(needs("Cobblestone", 12), service.convert("Cobblestone Walls", 7).needs());
    }

    @Test
    void stoneAndCobblestoneItemsShareCobblestone() {
        Map<String, Integer> list = new LinkedHashMap<>();
        list.put("Stone Stairs", 8);  // 12 stone, smelted from 12 cobblestone
        list.put("Furnaces", 1);      // 8 cobblestone

        BatchResult result = service.convertBatch(list);

        assertEquals(needs("Stone", 12, "Cobblestone", 20), result.totals());
    }

    @Test
    void calculatesCarpetsWithNothingBehindWool() {
        ConversionResult result = service.convert("Carpets", 30);

        assertEquals(needs("Wool", 20), result.needs());  // 2 wool make 3 carpets
    }

    @Test
    void bedsNeedWoolAndPlanks() {
        ConversionResult result = service.convert("Beds", 2);

        assertEquals(needs("Wool", 6, "Planks", 6, "Logs", 2), result.needs());
        assertEquals(List.of(new Ingredient("Wool", 3), new Ingredient("Planks", 3)), result.recipeInputs());
    }

    @Test
    void bannersWorkBackThroughSticks() {
        ConversionResult result = service.convert("Banners", 2);

        // 2 sticks is one craft (2 planks make 4 sticks), and 2 planks need 1 log
        assertEquals(needs("Wool", 12, "Sticks", 2, "Planks", 2, "Logs", 1), result.needs());
    }

    @Test
    void fencesGatesAndSignsNeedSticksToo() {
        // The planks count includes the planks turned into sticks (2 planks make 4 sticks).
        // Fence Posts ×3: 4 planks + 2 sticks (1 stick craft = 2 more planks) = 6 planks
        assertEquals(needs("Planks", 6, "Sticks", 2, "Logs", 2), service.convert("Fence Posts", 3).needs());
        // Gates ×1: 2 planks + 4 sticks (1 stick craft = 2 more planks) = 4 planks
        assertEquals(needs("Planks", 4, "Sticks", 4, "Logs", 1), service.convert("Gates", 1).needs());
        // Signs ×3: 6 planks + 1 stick (1 stick craft = 2 more planks) = 8 planks
        assertEquals(needs("Planks", 8, "Sticks", 1, "Logs", 2), service.convert("Signs", 3).needs());
    }

    @Test
    void listTotalsShareLeftoversBetweenItems() {
        Map<String, Integer> list = new LinkedHashMap<>();
        list.put("Stairs", 4);   // 6 planks: 2 logs on its own
        list.put("Banners", 1);  // 2 planks for the stick: 1 log on its own

        BatchResult result = service.convertBatch(list);

        assertEquals(2, result.items().size());
        // Together it's 8 planks, which is 2 logs, not 3
        // (Planks come first because Stairs, first on the list, use them directly.)
        assertEquals(needs("Planks", 8, "Wool", 6, "Sticks", 1, "Logs", 2), result.totals());
    }

    @Test
    void listTotalsKeepFamiliesApart() {
        Map<String, Integer> list = new LinkedHashMap<>();
        list.put("Stairs", 24);
        list.put("Stone Stairs", 8);
        list.put("Carpets", 30);

        BatchResult result = service.convertBatch(list);

        assertEquals(needs("Planks", 36, "Stone", 12, "Wool", 20, "Logs", 9, "Cobblestone", 12),
                result.totals());
    }

    @Test
    void ingredientsCantBePickedDirectly() {
        assertThrows(IllegalArgumentException.class, () -> service.convert("Planks", 4));
        assertFalse(service.getMaterialNames().contains("Sticks"));
    }

    @Test
    void rejectsUnknownMaterial() {
        assertThrows(IllegalArgumentException.class,
                () -> service.convert("Rockets", 1));
    }

    @Test
    void rejectsInvalidQuantity() {
        assertThrows(IllegalArgumentException.class,
                () -> service.convert("Slabs", 0));
        assertThrows(IllegalArgumentException.class,
                () -> service.convert("Slabs", 1_000_001));
    }

    @Test
    void rejectsEmptyOrIncompleteList() {
        assertThrows(IllegalArgumentException.class, () -> service.convertBatch(Map.of()));

        Map<String, Integer> missingQuantity = new LinkedHashMap<>();
        missingQuantity.put("Stairs", null);
        assertThrows(IllegalArgumentException.class, () -> service.convertBatch(missingQuantity));
    }
}
