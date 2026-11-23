package com.ananya.mineblockconverter.service;

import com.ananya.mineblockconverter.model.ConversionResult;
import com.ananya.mineblockconverter.model.Material;
import com.ananya.mineblockconverter.model.RecipeRepository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.ArrayList;

import org.springframework.stereotype.Service;

@Service
public class ConverterService {
    private LinkedHashMap<String, Material> materials = RecipeRepository.loadRecipes();

    public ConversionResult convert(String materialName, int quantity) {
        if (materialName == null || materialName.isBlank()) {
            throw new IllegalArgumentException("Material is required.");
        }
        if (quantity < 1 || quantity > 1_000_000) {
            throw new IllegalArgumentException("Quantity must be between 1 and 1,000,000.");
        }

        Material material = materials.get(materialName);
        if (material == null) {
            throw new IllegalArgumentException("Unknown material: " + materialName);
        }

        int planks = material.calculateIngredients(quantity);
        int logs = material.calculateRawMaterials(quantity);

        return new ConversionResult(material.getName(), quantity, planks, logs,
                material.getRecipeInput(), material.getRecipeOutput());
    }

    public List<String> getMaterialNames() {
        return new ArrayList<>(materials.keySet());
    }
}