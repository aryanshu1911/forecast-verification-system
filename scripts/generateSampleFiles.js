/**
 * Generate Sample Excel Files for Testing
 * Creates sample Warning and Realised Excel files with correct format
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Districts from Maharashtra
const districts = [
  "PALGHAR",
  "THANE",
  "MUMBAI",
  "RAIGAD",
  "RATNAGIRI",
  "SINDHUDURG",
  "DHULE",
  "NANDURBAR",
  "JALGAON",
  "NASIK",
  "Ghats of NASIK",
  "AHMEDNAGAR",
  "PUNE",
  "Ghats of PUNE",
  "Ghats of KOLHAPUR",
  "KOLHAPUR",
  "SATARA",
  "SOUTH SATARA",
  "SANGLI",
  "SHOLAPUR",
  "CHHATRAPATI SAMBHAJINAGAR",
  "JALNA",
  "PARBHANI",
  "BEED",
  "HINGOLI",
  "NANDED",
  "LATUR",
  "DHARASHIV"
];

// Generate sample warning data for June 2025 (30 days)
function generateWarningData() {
  const data = [];
  const daysInMonth = 30; // June has 30 days
  
  // Header row
  const header = ['District'];
  for (let day = 1; day <= daysInMonth; day++) {
    header.push(day);
  }
  data.push(header);
  
  // Data rows
  const warningCodes = [0, 5, 7, 8, 10, 12]; // Different warning codes
  
  districts.forEach(district => {
    const row = [district];
    for (let day = 1; day <= daysInMonth; day++) {
      // Generate random warning code (mostly 0, some warnings)
      const rand = Math.random();
      let code;
      if (rand < 0.6) code = 0;        // 60% no warning
      else if (rand < 0.75) code = 5;  // 15% light warning
      else if (rand < 0.85) code = 7;  // 10% moderate warning
      else if (rand < 0.93) code = 8;  // 8% heavy warning
      else if (rand < 0.98) code = 10; // 5% very heavy warning
      else code = 12;                   // 2% extremely heavy warning
      
      row.push(code);
    }
    data.push(row);
  });
  
  return data;
}

// Generate sample realised data for June 2025 (30 days)
function generateRealisedData() {
  const data = [];
  const daysInMonth = 30; // June has 30 days
  
  // Header row
  const header = ['District'];
  for (let day = 1; day <= daysInMonth; day++) {
    header.push(day);
  }
  data.push(header);
  
  // Data rows
  const rainfallValues = [0, 5.5, 12.3, 25.8, 45.2, 67.8, 89.5, 125.3];
  
  districts.forEach(district => {
    const row = [district];
    for (let day = 1; day <= daysInMonth; day++) {
      // Generate random rainfall value
      const rand = Math.random();
      let rainfall;
      if (rand < 0.3) rainfall = 0;          // 30% no rain
      else if (rand < 0.5) rainfall = 5.5;   // 20% light rain
      else if (rand < 0.65) rainfall = 12.3; // 15% moderate rain
      else if (rand < 0.8) rainfall = 25.8;  // 15% moderate-heavy rain
      else if (rand < 0.9) rainfall = 45.2;  // 10% heavy rain
      else if (rand < 0.95) rainfall = 67.8; // 5% very heavy rain
      else if (rand < 0.98) rainfall = 89.5; // 3% extremely heavy rain
      else rainfall = 125.3;                  // 2% exceptional rain
      
      row.push(rainfall);
    }
    data.push(row);
  });
  
  return data;
}

// Create Excel files
function createExcelFiles() {
  const outputDir = path.join(__dirname, '..', '..', 'sample-files');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Create Warning Excel file
  const warningData = generateWarningData();
  const warningWorksheet = XLSX.utils.aoa_to_sheet(warningData);
  const warningWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(warningWorkbook, warningWorksheet, 'Warning Data');
  
  const warningFilePath = path.join(outputDir, 'sample_warning_june_2025.xlsx');
  XLSX.writeFile(warningWorkbook, warningFilePath);
  console.log(`✅ Sample Warning Excel file created: ${warningFilePath}`);
  console.log(`   Districts: ${districts.length}`);
  console.log(`   Days: 30`);
  console.log(`   Format: District | 1 | 2 | 3 | ... | 30`);
  
  // Create Realised Excel file
  const realisedData = generateRealisedData();
  const realisedWorksheet = XLSX.utils.aoa_to_sheet(realisedData);
  const realisedWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(realisedWorkbook, realisedWorksheet, 'Realised Data');
  
  const realisedFilePath = path.join(outputDir, 'sample_realised_june_2025.xlsx');
  XLSX.writeFile(realisedWorkbook, realisedFilePath);
  console.log(`\n✅ Sample Realised Excel file created: ${realisedFilePath}`);
  console.log(`   Districts: ${districts.length}`);
  console.log(`   Days: 30`);
  console.log(`   Format: District | 1 | 2 | 3 | ... | 30`);
  
  console.log('\n📋 Sample data preview (first 5 districts):');
  console.log('Warning codes: 0=No warning, 5=Light, 7=Moderate, 8=Heavy, 10=Very Heavy, 12=Extreme');
  console.log('Realised values: Rainfall in mm\n');
  
  // Show preview
  for (let i = 1; i <= Math.min(5, districts.length); i++) {
    console.log(`${warningData[i][0]}: Warning Day 1=${warningData[i][1]}, Realised Day 1=${realisedData[i][1]}mm`);
  }
}

// Run the generator
createExcelFiles();
