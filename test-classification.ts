/**
 * Test script to verify mode switching behavior
 * Tests both forecast code and realised rainfall classification
 */

const { classifyCode, classifyRainfall, loadRainfallConfig } = require('./app/utils/rainfallConfig');

async function testClassifications() {
  console.log('=== Testing Classification Logic ===\n');
  
  // Load current config
  const config = await loadRainfallConfig();
  console.log(`Current Mode: ${config.mode}`);
  console.log(`Dual Mode Enabled: ${config.classifications.dual.enabled}`);
  console.log(`Multi Mode Enabled: ${config.classifications.multi.enabled}\n`);
  
  // Test forecast code classification
  console.log('--- Testing Forecast Code Classification ---');
  const testCodes = [3, 5, 7, 27, 8, 26];
  for (const code of testCodes) {
    const classification = await classifyCode(code);
    console.log(`Code ${code} → ${classification}`);
  }
  
  console.log('\n--- Testing Realised Rainfall Classification ---');
  const testRainfalls = [30, 64.5, 70, 115.6, 120, 204.5, 210];
  for (const rainfall of testRainfalls) {
    const classification = await classifyRainfall(rainfall);
    console.log(`Rainfall ${rainfall}mm → ${classification}`);
  }
  
  console.log('\n=== Test Complete ===');
}

testClassifications().catch(console.error);
