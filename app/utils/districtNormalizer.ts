/**
 * District Normalization Utility
 * Ensures consistent district naming across warning and realised data
 * Handles Ghats aggregation and variant name mapping
 */

/**
 * Canonical district name mappings
 * All variants map to a single canonical name
 */
const DISTRICT_MAPPINGS: Record<string, string> = {
  // Nashik variants
  'NASIK': 'NASHIK',
  'NASHIK': 'NASHIK',
  'GHATS OF NASIK': 'NASHIK',
  'GHATS OF NASHIK': 'NASHIK',
  'NASHIK GHATS': 'NASHIK',
  
  // Pune variants
  'PUNE': 'PUNE',
  'GHATS OF PUNE': 'PUNE',
  'PUNE GHATS': 'PUNE',
  
  // Kolhapur variants
  'KOLHAPUR': 'KOLHAPUR',
  'GHATS OF KOLHAPUR': 'KOLHAPUR',
  'KOLHAPUR GHATS': 'KOLHAPUR',
  
  // Aurangabad / Chhatrapati Sambhaji Nagar
  'AURANGABAD': 'CHHATRAPATI SAMBHAJI NAGAR',
  'CHHATRAPATI SAMBHAJI NAGAR': 'CHHATRAPATI SAMBHAJI NAGAR',
  
  // Solapur variants
  'SOLAPUR': 'SOLAPUR',
  'SHOLAPUR': 'SOLAPUR',
};

/**
 * Normalize a district name to its canonical form
 * @param districtName - Raw district name from Excel
 * @returns Canonical district name
 */
export function normalizeDistrictName(districtName: string): string {
  const normalized = districtName.trim().toUpperCase();
  return DISTRICT_MAPPINGS[normalized] || normalized;
}

/**
 * Normalize and aggregate district data
 * Handles Ghats merging: if both main district and Ghats exist, use maximum value
 * 
 * @param rawData - Object with raw district names as keys
 * @returns Object with normalized district names and aggregated values
 */
export function normalizeDistrictData<T extends number | null>(
  rawData: Record<string, T>
): Record<string, T> {
  const normalized: Record<string, T> = {};
  
  for (const [rawName, value] of Object.entries(rawData)) {
    const canonicalName = normalizeDistrictName(rawName);
    
    // If district already exists, apply aggregation rule
    if (canonicalName in normalized) {
      const existingValue = normalized[canonicalName];
      
      // For numerical values, take maximum (meteorologically correct for severity)
      if (typeof value === 'number' && typeof existingValue === 'number') {
        normalized[canonicalName] = Math.max(value, existingValue) as T;
      } else if (value !== null && existingValue === null) {
        // If new value is not null but existing is null, use new value
        normalized[canonicalName] = value;
      }
      // Otherwise keep existing value
    } else {
      normalized[canonicalName] = value;
    }
  }
  
  return normalized;
}

/**
 * Get all canonical district names
 */
export function getCanonicalDistricts(): string[] {
  const canonical = new Set(Object.values(DISTRICT_MAPPINGS));
  return Array.from(canonical).sort();
}

/**
 * Check if a district name is a variant (not canonical)
 */
export function isVariantName(districtName: string): boolean {
  const normalized = districtName.trim().toUpperCase();
  return normalized in DISTRICT_MAPPINGS && DISTRICT_MAPPINGS[normalized] !== normalized;
}

/**
 * Get mapping statistics for validation
 */
export function getMappingStats(): {
  totalVariants: number;
  canonicalNames: number;
  mappings: Record<string, string[]>;
} {
  const mappings: Record<string, string[]> = {};
  
  for (const [variant, canonical] of Object.entries(DISTRICT_MAPPINGS)) {
    if (!mappings[canonical]) {
      mappings[canonical] = [];
    }
    if (variant !== canonical) {
      mappings[canonical].push(variant);
    }
  }
  
  return {
    totalVariants: Object.keys(DISTRICT_MAPPINGS).length,
    canonicalNames: new Set(Object.values(DISTRICT_MAPPINGS)).size,
    mappings
  };
}
