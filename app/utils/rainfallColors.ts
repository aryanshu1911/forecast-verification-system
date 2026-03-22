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
  { name: 'Very Light Rain', color: '#E1F5FE', min: 0.1, max: 2.4 },
  { name: 'Light Rain', color: '#FFFFE0', min: 2.5, max: 15.5 },
  { name: 'Moderate Rain', color: '#FFFF00', min: 15.6, max: 64.4 },
  { name: 'Heavy Rain', color: '#FFA500', min: 64.5, max: 115.5 },
  { name: 'Very Heavy Rain', color: '#FF0000', min: 115.6, max: 204.4 },
  { name: 'Extremely Heavy Rain', color: '#8B0000', min: 204.5, max: null },
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

/**
 * Monthly Rainfall Categories for CBAR (0 to 1500 mm)
 */
export const MONTHLY_RAINFALL_CATEGORIES: RainfallCategory[] = [
  { name: '0 - 150', color: '#edf8fb', min: 0, max: 150 },
  { name: '150 - 300', color: '#ccece6', min: 151, max: 300 },
  { name: '300 - 450', color: '#99d8c9', min: 301, max: 450 },
  { name: '450 - 600', color: '#66c2a4', min: 451, max: 600 },
  { name: '600 - 750', color: '#41ae76', min: 601, max: 750 },
  { name: '750 - 900', color: '#238b45', min: 751, max: 900 },
  { name: '900 - 1050', color: '#006d2c', min: 901, max: 1050 },
  { name: '1050 - 1200', color: '#00441b', min: 1051, max: 1200 },
  { name: '1200 - 1350', color: '#feb24c', min: 1201, max: 1350 },
  { name: '1350 - 1500', color: '#f03b20', min: 1351, max: 1500 },
  { name: '> 1500', color: '#bd0026', min: 1501, max: null },
];

/**
 * Get monthly color based on accumulated value
 */
export function getMonthlyRainfallColor(value: number): string {
  if (value <= 150) return '#edf8fb';
  if (value <= 300) return '#ccece6';
  if (value <= 450) return '#99d8c9';
  if (value <= 600) return '#66c2a4';
  if (value <= 750) return '#41ae76';
  if (value <= 900) return '#238b45';
  if (value <= 1050) return '#006d2c';
  if (value <= 1200) return '#00441b';
  if (value <= 1350) return '#feb24c';
  if (value <= 1500) return '#f03b20';
  return '#bd0026';
}

/**
 * Get monthly category name based on accumulated value
 */
export function getMonthlyRainfallCategory(value: number): string {
  if (value <= 150) return '0 - 150 mm';
  if (value <= 300) return '151 - 300 mm';
  if (value <= 450) return '301 - 450 mm';
  if (value <= 600) return '451 - 600 mm';
  if (value <= 750) return '601 - 750 mm';
  if (value <= 900) return '751 - 900 mm';
  if (value <= 1050) return '901 - 1050 mm';
  if (value <= 1200) return '1051 - 1200 mm';
  if (value <= 1350) return '1201 - 1350 mm';
  if (value <= 1500) return '1351 - 1500 mm';
  return '> 1500 mm';
}

/**
 * Get color based on rainfall value using fixed 100mm bands
 * Matches the map legend: 0-100, 100-200, ..., >900
 */
export function getRainfallColorDynamic(rainfall: number, config?: any): string {
  if (rainfall === 0) return '#D3D3D3';
  if (rainfall <= 2.4) return '#E1F5FE';
  if (rainfall <= 15.5) return '#FFFFE0';
  if (rainfall <= 64.4) return '#FFFF00';
  if (rainfall <= 115.5) return '#FFA500';
  if (rainfall <= 204.4) return '#FF0000';
  return '#8B0000';
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
