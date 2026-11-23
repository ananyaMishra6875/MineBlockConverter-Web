package com.ananya.mineblockconverter;

import com.ananya.mineblockconverter.model.ConversionResult;
import com.ananya.mineblockconverter.model.Material;
import com.ananya.mineblockconverter.model.RecipeRepository;
import com.ananya.mineblockconverter.service.ConverterService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ConverterServiceTests {

    private final ConverterService service = new ConverterService();

    @Test
    void calculatesStairsAndLogs() {
        ConversionResult result = service.convert("Stairs", 5);

        assertEquals(12, result.getPlanks());
        assertEquals(3, result.getLogs());
        assertEquals(6, result.getPlanksPerRecipe());
        assertEquals(4, result.getItemsPerRecipe());
    }

    @Test
    void woodRecipesSayWhatTheyAreMadeFrom() {
        Material stairs = RecipeRepository.loadRecipes().get("Stairs");

        assertEquals("Planks", stairs.getIngredient());
        assertEquals("Logs", stairs.getRawMaterial());
        assertEquals(4, stairs.getIngredientsPerRaw());
    }

    @Test
    void usesEachRecipesOwnRawRatio() {
        // Made-up recipe: 2 ingredients make 1 item, 1 raw makes 9 ingredients
        Material block = new Material("Test Block", "Nuggets", 2, 1, "Ingots", 9);

        assertEquals(20, block.calculateIngredients(10));
        assertEquals(3, block.calculateRawMaterials(10));
    }

    @Test
    void rejectsUnknownMaterial() {
        assertThrows(IllegalArgumentException.class,
                () -> service.convert("Beds", 1));
    }

    @Test
    void rejectsInvalidQuantity() {
        assertThrows(IllegalArgumentException.class,
                () -> service.convert("Slabs", 0));
        assertThrows(IllegalArgumentException.class,
                () -> service.convert("Slabs", 1_000_001));
    }
}
