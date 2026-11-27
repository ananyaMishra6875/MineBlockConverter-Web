package com.ananya.mineblockconverter.model;

import java.util.List;

/**
 * A whole shopping list.
 *
 * @param items  each item worked out on its own
 * @param totals the whole list worked out together, so leftovers from one item
 *               (e.g. spare planks) count toward the next. This can be less than
 *               adding up the items' own needs.
 */
public record BatchResult(List<ConversionResult> items, List<ResourceAmount> totals) {
}
