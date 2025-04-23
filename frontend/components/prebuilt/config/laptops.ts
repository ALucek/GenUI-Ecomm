/**
 * Configuration for laptop product type
 * Defines which fields are used in different UI components and their display order
 */

// Fields to show in the ProductDetail view
export const detailFields = [
  'name',
  'brand',
  'price',
  'cpu_family',
  'ram_gb',
  'storage_gb',
  'storage_type',
  'screen_size_inches',
  'screen_resolution',
  'screen_type',
  'graphics_card',
  'battery_life_hours',
  'weight_kg'
] as const;

// Fields to display as badges in both detail and tile views
export const badgeFields = [
  'ram_gb',
  'storage_gb',
  'screen_size_inches',
  'battery_life_hours'
] as const;

// Fields to display in the comparison view
export const comparisonFields = [
  'name',
  'brand',
  'price',
  'cpu_family',
  'ram_gb',
  'storage_gb',
  'storage_type',
  'screen_size_inches',
  'screen_resolution',
  'screen_type',
  'graphics_card',
  'battery_life_hours',
  'weight_kg'
] as const;

// Field formatting configuration
export const fieldFormatters: { [key: string]: (value: any) => string } = {
  ram_gb: (value) => `${value} GB RAM`,
  storage_gb: (value) => `${value} GB`,
  screen_size_inches: (value) => `${value}"`,
  battery_life_hours: (value) => `${value}`,
  weight_kg: (value) => `${value} kg`
};

// Field labels (if you want to override the auto-formatting)
export const fieldLabels: { [key: string]: string } = {
  cpu_family: 'Processor',
  ram_gb: 'Memory',
  storage_gb: 'Storage',
  screen_size_inches: 'Screen Size',
  screen_resolution: 'Resolution',
  screen_type: 'Display Type',
  graphics_card: 'Graphics',
  battery_life_hours: 'Battery Life',
  weight_kg: 'Weight'
};

// Fields that should be hidden from badging or generic display
export const hiddenFields = [
  'product_id',
  'marketing_link',
  'datasheet_link',
  'has_image',
  'image_url'
]; 