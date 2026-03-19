/**
 * Enhanced Rainfall Classification Configuration
 * Supports Dual Mode (binary) and Multi Mode (advanced)
 * Admin-controlled with complete user-side hiding
 */

import fs from 'fs';
import path from 'path';

// Dual Mode Configuration
export interface DualModeConfig {
  enabled: boolean;
  threshold: number;
  labels: {
    below: string;
    above: string;
  };
}

// Multi Mode Classification Item
export interface MultiModeClassification {
  id: string;
  variableName: string;
  label: string;
  thresholdMm: number;
  codes: number[];
  enabled: boolean;
  order: number;
}

// Multi Mode Configuration
export interface MultiModeConfig {
  enabled: boolean;
  items: MultiModeClassification[];
}

// Overall Configuration
export interface RainfallConfig {
  mode: 'dual' | 'multi';
  classifications: {
    dual: DualModeConfig;
    multi: MultiModeConfig;
  };
  lastUpdated: string;
}

const CONFIG_PATH = path.join(process.cwd(), 'data', 'rainfall-config.json');

// Cache for configuration
let configCache: RainfallConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5000; // 5 seconds

/**
 * Load rainfall classification configuration
 */
export async function loadRainfallConfig(): Promise<RainfallConfig> {
  const now = Date.now();
  
  if (configCache && (now - cacheTimestamp) < CACHE_TTL) {
    return configCache;
  }
  
  try {
    const fileContent = await fs.promises.readFile(CONFIG_PATH, 'utf-8');
    const config: RainfallConfig = JSON.parse(fileContent);
    
    // Validate config structure
    if (!config.mode || !config.classifications) {
      throw new Error('Invalid configuration structure');
    }
    
    configCache = config;
    cacheTimestamp = now;
    
    return config;
  } catch (error: any) {
    console.error('Failed to load rainfall config:', error);
    
    // Return default config
    const defaultConfig: RainfallConfig = {
      mode: 'dual',
      classifications: {
        dual: {
          enabled: true,
          threshold: 64.5,
          labels: {
            below: 'L',
            above: 'H'
          }
        },
        multi: {
          enabled: false,
          items: [
            {
              id: 'L',
              variableName: 'L',
              label: 'Less',
              thresholdMm: 0.0,
              codes: [],
              enabled: true,
              order: 1
            },
            {
              id: 'H',
              variableName: 'H',
              label: 'Heavy',
              thresholdMm: 64.5,
              codes: [5, 6, 7, 27, 33, 37, 45, 56],
              enabled: true,
              order: 2
            },
            {
              id: 'VH',
              variableName: 'VH',
              label: 'Very Heavy',
              thresholdMm: 115.6,
              codes: [8, 9, 10, 11, 12, 25, 28, 34, 39, 44],
              enabled: true,
              order: 3
            },
            {
              id: 'XH',
              variableName: 'XH',
              label: 'Extremely Heavy',
              thresholdMm: 204.5,
              codes: [26, 29, 35, 38],
              enabled: true,
              order: 4
            }
          ]
        }
      },
      lastUpdated: new Date().toISOString()
    };
    
    configCache = defaultConfig;
    cacheTimestamp = now;
    
    return defaultConfig;
  }
}

/**
 * Save rainfall classification configuration
 */
export async function saveRainfallConfig(config: RainfallConfig): Promise<void> {
  try {
    config.lastUpdated = new Date().toISOString();
    
    const dataDir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dataDir)) {
      await fs.promises.mkdir(dataDir, { recursive: true });
    }
    
    await fs.promises.writeFile(
      CONFIG_PATH,
      JSON.stringify(config, null, 2),
      'utf-8'
    );
    
    // Clear cache
    configCache = null;
    cacheTimestamp = 0;
  } catch (error: any) {
    console.error('Failed to save rainfall config:', error);
    throw new Error('Failed to save configuration: ' + error.message);
  }
}

/**
 * Classify rainfall in DUAL MODE
 * Simple binary: Below 64.5mm = L, >= 64.5mm = H
 */
export function classifyInDualMode(rainfall: number, config: RainfallConfig): string {
  const dualConfig = config.classifications.dual;
  return rainfall >= dualConfig.threshold ? dualConfig.labels.above : dualConfig.labels.below;
}

/**
 * Classify rainfall in MULTI MODE
 * Find highest enabled threshold that rainfall meets or exceeds
 */
export function classifyInMultiMode(rainfall: number, config: RainfallConfig): string {
  if (rainfall < 0) return 'INVALID';
  
  const multiConfig = config.classifications.multi;
  const enabledItems = multiConfig.items.filter(item => item.enabled);
  
  // Sort by threshold descending
  const sorted = [...enabledItems].sort((a, b) => b.thresholdMm - a.thresholdMm);
  
  // Find highest threshold that rainfall meets or exceeds
  for (const item of sorted) {
    if (rainfall >= item.thresholdMm) {
      return item.variableName;
    }
  }
  
  // Default to lowest classification
  return enabledItems[0]?.variableName || 'L';
}

/**
 * Classify rainfall based on current mode
 */
export async function classifyRainfall(rainfall: number): Promise<string> {
  const config = await loadRainfallConfig();
  
  if (config.mode === 'dual') {
    return classifyInDualMode(rainfall, config);
  } else {
    return classifyInMultiMode(rainfall, config);
  }
}

/**
 * Classify warning code in DUAL MODE
 * Uses config-based logic to match rainfall classification behavior
 * Codes >= 5 typically indicate heavy rainfall (>= 64.5mm threshold)
 */
export function classifyCodeInDualMode(code: number, config: RainfallConfig): string {
  const dualConfig = config.classifications.dual;
  // Codes >= 5 correspond to heavy rainfall warnings (>= threshold)
  return code >= 5 ? dualConfig.labels.above : dualConfig.labels.below;
}

/**
 * Classify warning code in MULTI MODE
 * Check if code exists in any enabled classification's code array
 */
export function classifyCodeInMultiMode(code: number, config: RainfallConfig): string | null {
  const multiConfig = config.classifications.multi;
  const enabledItems = multiConfig.items.filter(item => item.enabled);
  
  for (const item of enabledItems) {
    if (item.codes.includes(code)) {
      return item.variableName;
    }
  }
  
  return null;
}

/**
 * Classify warning code based on current mode
 */
export async function classifyCode(code: number): Promise<string> {
  const config = await loadRainfallConfig();
  
  if (config.mode === 'dual') {
    return classifyCodeInDualMode(code, config);
  } else {
    const classification = classifyCodeInMultiMode(code, config);
    return classification || 'L'; // Default to L if code not found
  }
}

/**
 * Switch mode and update configuration
 */
export async function switchMode(newMode: 'dual' | 'multi'): Promise<RainfallConfig> {
  const config = await loadRainfallConfig();
  
  if (config.mode === newMode) {
    return config; // Already in this mode
  }
  
  // Switch mode
  config.mode = newMode;
  
  // Update enabled flags
  config.classifications.dual.enabled = (newMode === 'dual');
  config.classifications.multi.enabled = (newMode === 'multi');
  
  // Save configuration
  await saveRainfallConfig(config);
  
  return config;
}

/**
 * Clear configuration cache
 */
export function clearConfigCache(): void {
  configCache = null;
  cacheTimestamp = 0;
}

/**
 * Get public classification info (for user-facing display)
 * Returns ONLY labels, no thresholds or codes
 */
export async function getPublicClassificationInfo(): Promise<{
  mode: 'dual' | 'multi';
  availableLabels: string[];
}> {
  const config = await loadRainfallConfig();
  
  let availableLabels: string[] = [];
  
  if (config.mode === 'dual') {
    availableLabels = [
      config.classifications.dual.labels.below,
      config.classifications.dual.labels.above
    ];
  } else {
    availableLabels = config.classifications.multi.items
      .filter(item => item.enabled)
      .sort((a, b) => a.order - b.order)
      .map(item => item.variableName);
  }
  
  return {
    mode: config.mode,
    availableLabels
  };
}
