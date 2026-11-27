package com.ananya.mineblockconverter.model;

/** How much of one material is needed, e.g. "12 Planks". */
public record ResourceAmount(String item, long count) {
}
