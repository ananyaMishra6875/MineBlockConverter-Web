package com.ananya.mineblockconverter.controller;

import com.ananya.mineblockconverter.service.ConverterService;
import org.springframework.web.bind.annotation.*;

import com.ananya.mineblockconverter.model.ConversionResult;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
public class ConverterController {

    private final ConverterService converterService;

    public ConverterController(ConverterService converterService) {
        this.converterService = converterService;
    }

    @GetMapping("/hello")
    public String hello() {
        return "MineBlockConverter is running!";
    }

    @GetMapping("/materials")
    public List<String> getMaterials() {
        return converterService.getMaterialNames();
    }

    @GetMapping("/convert")
    public ConversionResult convert(
            @RequestParam String material,
            @RequestParam int quantity) {

        return converterService.convert(material, quantity);
    }

    @PostMapping("/convert/batch")
    public List<ConversionResult> convertBatch(@RequestBody Map<String, Integer> quantities) {
        if (quantities == null || quantities.isEmpty()) {
            throw new IllegalArgumentException("At least one material quantity is required.");
        }

        List<ConversionResult> results = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : quantities.entrySet()) {
            if (entry.getValue() == null) {
                throw new IllegalArgumentException("Quantity is required for " + entry.getKey() + ".");
            }
            results.add(converterService.convert(entry.getKey(), entry.getValue()));
        }
        return results;
    }
}