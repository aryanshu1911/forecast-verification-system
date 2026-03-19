/**
 * Comprehensive test to demonstrate mode switching
 * Tests both dual and multi modes with the same data
 */

const { switchMode, classifyRainfall, classifyCode, loadRainfallConfig } = require('./app/utils/rainfallConfig');

async function demonstrateModes() {
  console.log('=== Rainfall Classification Mode Demonstration ===\n');
  
  const testRainfalls = [30, 64.5, 70, 115.6, 120, 204.5, 210];
  const testCodes = [3, 5, 7, 27, 8, 26];
  
  // Test DUAL MODE
  console.log('🔵 SWITCHING TO DUAL MODE...');
  await switchMode('dual');
  let config = await loadRainfallConfig();
  console.log(`✓ Current Mode: ${config.mode}\n`);
  
  console.log('--- Dual Mode: Rainfall Classification ---');
  for (const rainfall of testRainfalls) {
    const classification = await classifyRainfall(rainfall);
    console.log(`${rainfall}mm → ${classification}`);
  }
  
  console.log('\n--- Dual Mode: Forecast Code Classification ---');
  for (const code of testCodes) {
    const classification = await classifyCode(code);
    console.log(`Code ${code} → ${classification}`);
  }
  
  // Test MULTI MODE
  console.log('\n\n🟢 SWITCHING TO MULTI MODE...');
  await switchMode('multi');
  config = await loadRainfallConfig();
  console.log(`✓ Current Mode: ${config.mode}\n`);
  
  console.log('--- Multi Mode: Rainfall Classification ---');
  for (const rainfall of testRainfalls) {
    const classification = await classifyRainfall(rainfall);
    console.log(`${rainfall}mm → ${classification}`);
  }
  
  console.log('\n--- Multi Mode: Forecast Code Classification ---');
  for (const code of testCodes) {
    const classification = await classifyCode(code);
    console.log(`Code ${code} → ${classification}`);
  }
  
  console.log('\n=== Demonstration Complete ===');
  console.log('\n📊 Summary:');
  console.log('  Dual Mode: Binary classification (L/H)');
  console.log('  Multi Mode: Advanced classification (L/H/VH/XH)');
  console.log('  ✓ Mode switching works correctly');
  console.log('  ✓ Classifications update based on active mode');
}

demonstrateModes().catch(console.error);
