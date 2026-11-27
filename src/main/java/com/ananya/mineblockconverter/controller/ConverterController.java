package com.ananya.mineblockconverter.controller;

import com.ananya.mineblockconverter.service.ConverterService;
import org.springframework.web.bind.annotation.*;

import com.ananya.mineblockconverter.model.BatchResult;
import com.ananya.mineblockconverter.model.ConversionResult;
import org.springframework.web.bind.annotation.RequestParam;

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
    public BatchResult convertBatch(@RequestBody Map<String, Integer> quantities) {
        return converterService.convertBatch(quantities);
    }
}