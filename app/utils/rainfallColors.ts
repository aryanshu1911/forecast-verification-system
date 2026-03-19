/**
 * Rainfall Classification Utilities
 * Based on IMD thresholds for Maharashtra and Goa
 */

export interface RainfallCategory {
  name: string;
  color: string;
  min: number;
  max: number | null;
}

export const RAINFALL_CATEGORIES: RainfallCategory[] = [
  { name: 'No Rainfall', color: '#D3D3D3', min: 0, max: 0 },
  { name: 'Moderate', color: '#FFFFE0', min: 0.1, max: 64.4 },
  { name: 'Heavy', color: '#FFA500', min: 64.5, max: 115.5 },
  { name: 'Very Heavy', color: '#FF0000', min: 115.6, max: 204.4 },
  { name: 'Extremely Heavy', color: '#8B0000', min: 204.5, max: null },
];

/**
 * Get color based on rainfall value
 */
export function getRainfallColor(value: number): string {
  if (value === 0) return '#D3D3D3'; // No Rainfall
  if (value < 64.5) return '#FFFFE0'; // Moderate
  if (value <= 115.5) return '#FFA500'; // Heavy
  if (value <= 204.4) return '#FF0000'; // Very Heavy
  return '#8B0000'; // Extremely Heavy
}

/**
 * Get category name based on rainfall value
 */
export function getRainfallCategory(value: number): string {
  if (value === 0) return 'No Rainfall';
  if (value < 64.5) return 'Moderate Rainfall';
  if (value <= 115.5) return 'Heavy Rainfall';
  if (value <= 204.4) return 'Very Heavy Rainfall';
  return 'Extremely Heavy Rainfall';
}

/**
 * District name mapping for administrative changes
 */
export const DISTRICT_NAME_MAPPING: Record<string, string> = {
  'AHILYANAGAR': 'AHMADNAGAR',
  'CHHATRAPATI SAMBHAJI NAGAR': 'AURANGABAD',
  'CHATRAPATI SAMBHAJI NAGAR': 'AURANGABAD',
  'DHARASHIV': 'OSMANABAD',
  'RAIGAD': 'RAIGARH',
  'SHOLAPUR': 'SOLAPUR',
  'BEED': 'BID',
};

/**
 * Normalize district name for matching
 */
export function normalizeDistrictName(name: string): string {
  const normalized = name.trim().toUpperCase();
  return DISTRICT_NAME_MAPPING[normalized] || normalized;
}

export const MONTHLY_RAINFALL_CATEGORIES: RainfallCategory[] = [
  { name: 'Very Low / Dry', color: '#8B4513', min: 0, max: 50 },
  { name: 'Low Rain', color: '#008000', min: 51, max: 150 },
  { name: 'Moderate Rain', color: '#FFFF00', min: 151, max: 300 },
  { name: 'Heavy Rain', color: '#FFA500', min: 301, max: 600 },
  { name: 'Very Heavy / Extreme Rain', color: '#FF0000', min: 601, max: null },
];

/**
 * Get monthly color based on accumulated value
 */
export function getMonthlyRainfallColor(value: number): string {
  if (value <= 50) return '#8B4513';
  if (value <= 150) return '#008000';
  if (value <= 300) return '#FFFF00';
  if (value <= 600) return '#FFA500';
  return '#FF0000';
}

/**
 * Get monthly category name based on accumulated value
 */
export function getMonthlyRainfallCategory(value: number): string {
  if (value <= 50) return 'Very Low / Dry';
  if (value <= 150) return 'Low Rain';
  if (value <= 300) return 'Moderate Rain';
  if (value <= 600) return 'Heavy Rain';
  return 'Very Heavy / Extreme Rain';
}

/**
 * Get color based on rainfall value and current config
 */
export function getRainfallColorDynamic(rainfall: number, config: any): string {
  // Check if rainfallData is monthly - this depends on how it's called
  // but let's keep it daily-focused for now and use specific monthly functions in the component
  if (rainfall === 0) return '#D3D3D3';

  if (config.mode === 'dual') {
    const threshold = config.classifications.dual.threshold;
    return rainfall >= threshold ? '#FFA500' : '#FFFFE0'; // Heavy vs Moderate
  } else {
    // Multi-mode: Find highest enabled threshold
    const items = [...config.classifications.multi.items]
      .filter(i => i.enabled)
      .sort((a, b) => b.thresholdMm - a.thresholdMm);
    
    for (const item of items) {
      if (rainfall >= item.thresholdMm) {
        // Map common labels to colors
        if (item.variableName === 'XH') return '#8B0000'; // Extremely Heavy
        if (item.variableName === 'VH') return '#FF0000'; // Very Heavy
        if (item.variableName === 'H') return '#FFA500';  // Heavy
        if (item.variableName === 'L') return '#FFFFE0';  // Less/Moderate
        break;
      }
    }
    return '#FFFFE0'; // Default
  }
}

/**
 * Get category based on rainfall value and current config
 */
export function getRainfallCategoryDynamic(rainfall: number, config: any): string {
  if (rainfall === 0) return 'No Rainfall';

  if (config.mode === 'dual') {
    const dual = config.classifications.dual;
    return rainfall >= dual.threshold ? dual.labels.above : dual.labels.below;
  } else {
    const items = [...config.classifications.multi.items]
      .filter(i => i.enabled)
      .sort((a, b) => b.thresholdMm - a.thresholdMm);
    
    for (const item of items) {
      if (rainfall >= item.thresholdMm) {
        return item.label;
      }
    }
    return 'Less';
  }
}

/**
 * Find district column in GeoJSON properties
 */
export function findDistrictColumn(properties: any): string | null {
  const potentialCols = ['dtname', 'district', 'DISTRICT', 'NAME_2', 'Dist_Name', 'Name'];
  
  for (const col of potentialCols) {
    if (properties[col]) {
      return col;
    }
  }
  
  return null;
}
