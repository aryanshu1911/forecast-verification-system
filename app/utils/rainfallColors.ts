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
  { name: 'Very Light', color: '#E1F5FE', min: 0.1, max: 2.4 },
  { name: 'Light', color: '#FFFFE0', min: 2.5, max: 15.5 },
  { name: 'Moderate', color: '#FFFF00', min: 15.6, max: 64.4 },
  { name: 'Heavy', color: '#FFA500', min: 64.5, max: 115.5 },
  { name: 'Very Heavy', color: '#FF0000', min: 115.6, max: 204.4 },
  { name: 'Extremely Heavy', color: '#8B0000', min: 204.5, max: null },
];

/**
 * Get color based on rainfall value
 */
export function getRainfallColor(value: number): string {
  if (value === 0) return '#D3D3D3';
  if (value <= 2.4) return '#E1F5FE';
  if (value <= 15.5) return '#FFFFE0';
  if (value <= 64.4) return '#FFFF00';
  if (value <= 115.5) return '#FFA500';
  if (value <= 204.4) return '#FF0000';
  return '#8B0000';
}

/**
 * Get category name based on rainfall value
 */
export function getRainfallCategory(value: number): string {
  if (value === 0) return 'No Rainfall';
  if (value <= 2.4) return 'Very Light Rain';
  if (value <= 15.5) return 'Light Rain';
  if (value <= 64.4) return 'Moderate Rain';
  if (value <= 115.5) return 'Heavy Rain';
  if (value <= 204.4) return 'Very Heavy Rain';
  return 'Extremely Heavy Rain';
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
 * Get color based on rainfall value using fixed 100mm bands
 * Matches the map legend: 0-100, 100-200, ..., >900
 */
export function getRainfallColorDynamic(rainfall: number, config?: any): string {
  if (rainfall === 0) return '#D3D3D3'; // No data / no rain
  if (rainfall <= 100) return '#E3F2FD';
  if (rainfall <= 200) return '#90CAF9';
  if (rainfall <= 300) return '#42A5F5';
  if (rainfall <= 400) return '#1E88E5';
  if (rainfall <= 500) return '#1565C0';
  if (rainfall <= 600) return '#FDD835';
  if (rainfall <= 700) return '#FB8C00';
  if (rainfall <= 800) return '#E53935';
  if (rainfall <= 900) return '#B71C1C';
  return '#4A148C'; // > 900
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
