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
        Material material = materials.get(materialName);

        if (material == null) {
            return null;
        }

        int planks = material.calculatePlanks(quantity);
        int logs = material.calculateLogs(quantity);

        return new ConversionResult(material.getName(), quantity, planks, logs);
    }

    public List<String> getMaterialNames() {
        return new ArrayList<>(materials.keySet());
    }
}