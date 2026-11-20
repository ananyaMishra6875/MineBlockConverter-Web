package com.ananya.mineblockconverter;

import com.ananya.mineblockconverter.model.ConversionResult;
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
