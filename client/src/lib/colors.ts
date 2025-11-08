/**
 * Central color configuration for the application
 * All colors can be easily modified from this single file
 */

export const colors = {
  // Accent colors (replaces teal)
  accent: "280 85% 55%", // Vibrant purple
  accentLight: "280 85% 95%", // Light purple background
  
  // Table row alternating colors (blue variations)
  tableRowEven: "220 90% 95%", // Light blue
  tableRowOdd: "220 80% 90%", // Slightly darker blue
  
  // Header accent colors
  headerAccent: "220 90% 56%", // Primary blue
  headerAccentLight: "220 90% 95%", // Light blue background
};

/**
 * Get a CSS class string for table row coloring
 * @param index - The row index (0-based)
 * @returns CSS class string for alternating row colors
 */
export function getTableRowClass(index: number): string {
  // Using inline styles with HSL values for dynamic coloring
  if (index % 2 === 0) {
    return "even-row";
  }
  return "odd-row";
}

