/**
 * Product type configuration exports
 * Provides a central registry of all product-specific configurations,
 * allowing components to dynamically load the correct config based on PRODUCT_TYPE
 */

import * as laptops from './laptops';
// Import additional product type configs here as needed
// import * as smartphones from './smartphones';
// import * as tablets from './tablets';

// Get product type from environment variable or use default
export const PRODUCT_TYPE = process.env.NEXT_PUBLIC_PRODUCT_TYPE || 'laptops';

// Config registry mapping product types to their configurations
export const configs = {
  laptops,
  // Add new product types here as they're created
  // smartphones,
  // tablets,
};

// Helper to get the current product config based on PRODUCT_TYPE
export const currentConfig = configs[PRODUCT_TYPE as keyof typeof configs] || laptops;

// Helper function to format field labels
export function formatFieldLabel(key: string): string {
  // Check if the current config has a custom label
  if (currentConfig.fieldLabels && currentConfig.fieldLabels[key]) {
    return currentConfig.fieldLabels[key];
  }
  
  // Default formatting: convert snake_case to Title Case
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Helper function to format field values based on field type
export function formatFieldValue(key: string, value: any): string {
  // Use formatter if available
  if (currentConfig.fieldFormatters && currentConfig.fieldFormatters[key]) {
    return currentConfig.fieldFormatters[key](value);
  }
  
  // Default: just convert to string
  return String(value);
}

// Helper to check if a field should be hidden
export function isHiddenField(key: string): boolean {
  return currentConfig.hiddenFields && currentConfig.hiddenFields.includes(key);
} 