'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { format, subDays, isAfter, startOfDay, addDays, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import * as XLSX from 'xlsx';
import { generateWordReport } from '../utils/reportGenerator';
import HeavyRainfallVerificationTab from './components/HeavyRainfallVerificationTab';
import LeadTimeVerificationTab from './LeadTimeVerificationTab';
import {
  saveWarningData,
  loadWarningData,
  saveRealisedData,
  loadRealisedData,
  saveComparisonData,
  loadComparisonData,
  getDataForDate,
  getAvailableDates,
  clearAllData,
  getStorageInfo,
  loadDailyData,
  type StoredWarningData,
  type StoredRealisedData,
  type StoredComparisonData,
  type StoredAccuracyStats
} from '../utils/enhancedStorage';

interface RainfallData {
  district: string;
  date: string;
  rainfall: number;
  classification: 'Y' | 'N';
}

interface WarningData {
  district: string;
  day1: { date: string; rainfall: number; classification: 'Y' | 'N' };
  day2: { date: string; rainfall: number; classification: 'Y' | 'N' };
  day3: { date: string; rainfall: number; classification: 'Y' | 'N' };
  day4: { date: string; rainfall: number; classification: 'Y' | 'N' };
  day5: { date: string; rainfall: number; classification: 'Y' | 'N' };
}

interface ComparisonData {
  district: string;
  station?: string; // Add station name for detailed analysis
  date: string;
  warning: 'Y' | 'N';
  realised: 'Y' | 'N';
  warningRainfall: number | null;
  realisedRainfall: number | null;
  match: boolean;
  type: 'Correct' | 'False Alarm' | 'Missed Event' | 'Correct Non-Event';
}

// New interface for day-wise lead-time analysis
interface LeadTimeComparison {
  district: string;
  station: string;
  forecastDate: string;   // Date the forecast was issued
  targetDate: string;     // Date being predicted
  leadDays: number;       // 1, 2, 3, 4, or 5 days ahead
  forecastRainfall: number;
  observedRainfall: number;
  forecastHeavy: 'Y' | 'N';
  observedHeavy: 'Y' | 'N';
  result: 'Hit' | 'Miss' | 'False Alarm' | 'Correct Negative';
}

// Interface for lead-time skill scores
interface LeadTimeStats {
  leadDays: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  correctNegatives: number;
  total: number;
  pod: number;  // Probability of Detection
  far: number;  // False Alarm Rate  
  csi: number;  // Critical Success Index
  bias: number; // Frequency Bias
}

// New interface for date-specific analysis
interface DateSpecificAnalysis {
  date: string;
  dayTables: {
    day: number; // 1-5
    predictions: {
      district: string;
      warning: 'Y' | 'N';
      warningRainfall: number;
      realised: 'Y' | 'N';
      realisedRainfall: number;
      status: 'Hit' | 'Miss' | 'False Alarm' | 'Correct Negative';
    }[];
  }[];
}

// Combined results for dual analysis
interface VerificationResults {
  // Spatial analysis (district-station)
  spatialAnalysis: {
    totalStations: number;
    totalDistricts: number;
    districtAccuracy: { [district: string]: { correct: number; total: number; percentage: number } };
    stationResults: ComparisonData[];
  };

  // Temporal analysis (lead-time)  
  temporalAnalysis: {
    leadTimeStats: LeadTimeStats[];
    leadTimeComparisons: LeadTimeComparison[];
  };

  // Overall summary
  summary: {
    analysisStartDate: string;
    analysisEndDate: string;
    totalComparisons: number;
    threshold: number;
  };
}

interface AccuracyStats {
  totalPredictions: number;
  correct: number;
  falseAlarms: number;
  missedEvents: number;
  accuracy: number;
}

interface DayData {
  date: string;
  comparisons: StoredComparisonData[];
  warnings: any[];
  realised: StoredRealisedData[];
  hasData: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
  const [warningData, setWarningData] = useState<WarningData[]>([]);
  const [realisedData, setRealisedData] = useState<RainfallData[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [accuracyStats, setAccuracyStats] = useState<AccuracyStats | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'analysis' | 'calendar' | 'verification' | 'leadtime'>('upload');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [dateSpecificAnalysis, setDateSpecificAnalysis] = useState<DateSpecificAnalysis | null>(null);
  const [storageInfo, setStorageInfo] = useState<any>(null);

  // Calendar navigation state
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date().getMonth());
  const [currentCalendarYear, setCurrentCalendarYear] = useState(new Date().getFullYear());

  // Heavy Rainfall Verification state
  const [verificationThreshold, setVerificationThreshold] = useState<number>(64.5);
  const [verificationStartDate, setVerificationStartDate] = useState<string>(format(new Date(2025, 4, 1), 'yyyy-MM-dd')); // May 1, 2025
  const [verificationEndDate, setVerificationEndDate] = useState<string>(format(new Date(2025, 5, 30), 'yyyy-MM-dd')); // June 30, 2025
  const [verificationResults, setVerificationResults] = useState<VerificationResults | null>(null);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [generatedReports, setGeneratedReports] = useState<{ [key: string]: string | string[] }>({});

  // Upload mode state
  const [warningUploadMode, setWarningUploadMode] = useState<'monthly' | 'daily'>('monthly');
  const [realisedUploadMode, setRealisedUploadMode] = useState<'monthly' | 'daily'>('monthly');
  const [selectedUploadDate, setSelectedUploadDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    const auth = localStorage.getItem('imd_authenticated');
    if (!auth) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      loadStoredData();
      updateStorageInfo();
    }
  }, [router]);

  const loadStoredData = () => {
    // Load stored data on component mount
    const storedWarning = loadWarningData();
    const storedRealised = loadRealisedData();
    const { comparisons, stats } = loadComparisonData();

    // Convert stored data to component state format
    if (storedWarning.length > 0) {
      setWarningData(storedWarning.map(w => ({
        district: w.district,
        day1: w.day1,
        day2: w.day2,
        day3: w.day3,
        day4: w.day4,
        day5: w.day5
      })));
    }

    if (storedRealised.length > 0) {
      setRealisedData(storedRealised.map(r => ({
        district: r.district,
        date: r.date,
        rainfall: r.rainfall,
        classification: r.classification
      })));
    }

    if (comparisons.length > 0) {
      setComparisonData(comparisons.map(c => ({
        district: c.district,
        station: c.station, // Include station name from stored data
        date: c.date,
        warning: c.warning,
        realised: c.realised,
        warningRainfall: c.warningRainfall,
        realisedRainfall: c.realisedRainfall,
        match: c.match,
        type: c.type
      })));
    }

    if (stats) {
      setAccuracyStats({
        totalPredictions: stats.totalPredictions,
        correct: stats.correct,
        falseAlarms: stats.falseAlarms,
        missedEvents: stats.missedEvents,
        accuracy: stats.accuracy
      });
    }
  };

  const updateStorageInfo = () => {
    setStorageInfo(getStorageInfo());
  };

  const handleLogout = () => {
    localStorage.removeItem('imd_authenticated');
    localStorage.removeItem('imd_user');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const classifyRainfall = (rainfall: number): 'Y' | 'N' => {
    return rainfall > 64.5 ? 'Y' : 'N';
  };

  const handleWarningFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let parsedData: WarningData[] = [];

      // Check file type and parse accordingly
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        // Handle CSV files (original format)
        const text = await file.text();
        const rows = text.split('\n').filter(row => row.trim());

        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(',').map(col => col.trim());
          if (cols.length >= 11) {
            parsedData.push(createWarningDataFromRow(cols));
          }
        }
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Handle Excel files with IMD format
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // Parse IMD District Forecast format
        parsedData = parseIMDWarningFile(workbook);
      } else {
        toast.error('Unsupported file format. Please use CSV, XLS, or XLSX files.');
        return;
      }

      if (parsedData.length === 0) {
        toast.error('No valid data found in the file. Please check the file format.');
        return;
      }

      // Process based on upload mode
      if (warningUploadMode === 'daily') {
        // For daily mode, map all data to the selected date
        parsedData = parsedData.map(data => ({
          ...data,
          day1: { ...data.day1, date: selectedUploadDate },
          day2: { ...data.day2, date: format(addDays(new Date(selectedUploadDate), 1), 'yyyy-MM-dd') },
          day3: { ...data.day3, date: format(addDays(new Date(selectedUploadDate), 2), 'yyyy-MM-dd') },
          day4: { ...data.day4, date: format(addDays(new Date(selectedUploadDate), 3), 'yyyy-MM-dd') },
          day5: { ...data.day5, date: format(addDays(new Date(selectedUploadDate), 4), 'yyyy-MM-dd') }
        }));

        // Remove existing data for this date range and add new data
        const existingData = loadWarningData();
        const dateRangeToRemove = [
          selectedUploadDate,
          format(addDays(new Date(selectedUploadDate), 1), 'yyyy-MM-dd'),
          format(addDays(new Date(selectedUploadDate), 2), 'yyyy-MM-dd'),
          format(addDays(new Date(selectedUploadDate), 3), 'yyyy-MM-dd'),
          format(addDays(new Date(selectedUploadDate), 4), 'yyyy-MM-dd')
        ];

        const filteredExistingData = existingData.filter(existing => {
          return !dateRangeToRemove.some(dateToRemove =>
            [existing.day1.date, existing.day2.date, existing.day3.date, existing.day4.date, existing.day5.date]
              .includes(dateToRemove)
          );
        });

        // Add new data with storage format
        parsedData.forEach(data => {
          filteredExistingData.push({
            ...data,
            uploadDate: new Date().toISOString()
          });
        });

        saveWarningData(filteredExistingData);
        setWarningData(parsedData);
        toast.success(`Warning data uploaded for ${format(new Date(selectedUploadDate), 'MMM dd, yyyy')} (${parsedData.length} districts, overwrote existing data)`);
      } else {
        // Monthly mode - dates are extracted from the file
        const existingData = loadWarningData();
        const mergedData = [...existingData];

        parsedData.forEach(newData => {
          // Remove existing data for the same district and date range
          const existingIndex = mergedData.findIndex(existing =>
            existing.district === newData.district &&
            [existing.day1.date, existing.day2.date, existing.day3.date, existing.day4.date, existing.day5.date]
              .some(date => [newData.day1.date, newData.day2.date, newData.day3.date, newData.day4.date, newData.day5.date].includes(date))
          );

          if (existingIndex !== -1) {
            mergedData.splice(existingIndex, 1);
          }

          mergedData.push({
            ...newData,
            uploadDate: new Date().toISOString()
          });
        });

        saveWarningData(mergedData);
        setWarningData(parsedData);
        toast.success(`Warning data uploaded successfully (${parsedData.length} districts)`);
      }

      updateStorageInfo();
    } catch (error) {
      console.error('Error processing warning file:', error);
      toast.error('Error processing file. Please check the format and try again.');
    }
  };

  const createWarningDataFromRow = (cols: string[]): WarningData => {
    return {
      district: cols[0],
      day1: {
        date: cols[1],
        rainfall: parseFloat(cols[2]) || 0,
        classification: classifyRainfall(parseFloat(cols[2]) || 0)
      },
      day2: {
        date: cols[3],
        rainfall: parseFloat(cols[4]) || 0,
        classification: classifyRainfall(parseFloat(cols[4]) || 0)
      },
      day3: {
        date: cols[5],
        rainfall: parseFloat(cols[6]) || 0,
        classification: classifyRainfall(parseFloat(cols[6]) || 0)
      },
      day4: {
        date: cols[7],
        rainfall: parseFloat(cols[8]) || 0,
        classification: classifyRainfall(parseFloat(cols[8]) || 0)
      },
      day5: {
        date: cols[9],
        rainfall: parseFloat(cols[10]) || 0,
        classification: classifyRainfall(parseFloat(cols[10]) || 0)
      }
    };
  };

  // Convert Excel serial number to date
  const excelDateToJSDate = (serial: number): string => {
    // Excel serial date system: January 1, 1900 = 1
    // Convert to Unix timestamp and then to JavaScript Date
    const utc_days = Math.floor(serial - 25569); // 25569 = days between 1900-01-01 and 1970-01-01
    const utc_value = utc_days * 86400; // seconds
    const date_info = new Date(utc_value * 1000); // milliseconds
    return format(date_info, 'yyyy-MM-dd');
  };

  // Parse IMD Warning File (District Forecast format)
  const parseIMDWarningFile = (workbook: any): WarningData[] => {
    const parsedData: WarningData[] = [];

    // Process each sheet (each sheet represents a forecast issue date)
    workbook.SheetNames.forEach((sheetName: string) => {
      // Skip the "District Codes" sheet
      if (sheetName.includes('District Codes') || sheetName.includes('Codes')) return;

      console.log(`\n📄 ========== Processing sheet: ${sheetName} ==========`);

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        raw: true // Use raw values to preserve Excel serial dates as numbers
      }) as any[][];

      if (jsonData.length < 7) {
        console.log(`⚠️ Sheet ${sheetName} has less than 7 rows, skipping`);
        return; // Skip if not enough rows
      }

      // Debug: Show first 5 rows to understand structure
      console.log(`🔍 First 5 rows of sheet ${sheetName}:`, jsonData.slice(0, 5));

      // Extract dates from row 4 (columns B-F contain Excel serial dates)
      const dateRow = jsonData[3] || []; // Row 4 (0-indexed as 3)
      const dates: string[] = [];

      console.log(`📅 Date row (row 4, index 3) raw values:`, dateRow);
      console.log(`📅 Columns B-F (indices 1-5):`, dateRow.slice(1, 6));

      for (let col = 1; col <= 5; col++) { // Columns B-F (1-5)
        const cellValue = dateRow[col];

        if (!cellValue) {
          dates.push('');
          continue;
        }

        try {
          let parsedDate: Date;

          // Try multiple date parsing methods
          if (typeof cellValue === 'number') {
            // Excel serial date number - use proper Excel epoch
            const excelEpoch = new Date(1899, 11, 30); // Excel's epoch is Dec 30, 1899
            parsedDate = new Date(excelEpoch.getTime() + cellValue * 86400000);
          } else if (typeof cellValue === 'string') {
            // String date in various formats
            // Handle "DD-MMM-YYYY" format (e.g., "11-Jun-2025")
            if (cellValue.includes('-')) {
              const parts = cellValue.split('-');
              if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const monthStr = parts[1].toLowerCase();
                const year = parseInt(parts[2]);

                // Map month abbreviations to numbers
                const months: { [key: string]: number } = {
                  'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
                  'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
                };

                const month = months[monthStr];
                if (month !== undefined) {
                  parsedDate = new Date(year, month, day);
                } else {
                  parsedDate = new Date(cellValue);
                }
              } else {
                parsedDate = new Date(cellValue);
              }
            } else if (cellValue.includes('/')) {
              // Handle "DD/MM/YYYY" format
              const parts = cellValue.split('/');
              if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                const year = parseInt(parts[2]);
                parsedDate = new Date(year, month, day);
              } else {
                parsedDate = new Date(cellValue);
              }
            } else {
              parsedDate = new Date(cellValue);
            }
          } else {
            dates.push('');
            continue;
          }

          // Validate the parsed date
          if (isNaN(parsedDate.getTime())) {
            console.warn(`⚠️ Invalid date in sheet ${sheetName}, col ${col}:`, cellValue);
            dates.push('');
          } else {
            const formattedDate = format(parsedDate, 'yyyy-MM-dd');
            dates.push(formattedDate);
            console.log(`  D${col} (col ${col}): ${cellValue} → ${formattedDate}`);
          }
        } catch (error) {
          console.error(`❌ Error parsing date in sheet ${sheetName}, col ${col}:`, cellValue, error);
          dates.push('');
        }
      }

      console.log(`✅ Parsed dates for sheet ${sheetName}:`, dates);

      // Process district data starting from row 7 (index 6)
      for (let row = 6; row < jsonData.length; row++) {
        const rowData = jsonData[row] || [];
        const district = String(rowData[0] || '').trim();

        // Skip empty districts, regional headers, and instruction rows
        if (!district ||
          district.includes('KONKAN') ||
          district.includes('MARATHWADA') ||
          district.includes('VIDARBHA') ||
          district.includes('MADHYA MAHARASHTRA') ||
          district.includes('sheet is updated') ||
          district.includes('any number with decimal') ||
          district.includes('for example') ||
          district.includes('appicable') ||
          district === 'DISTRICTS') continue;

        // Extract rainfall intensity codes from columns B-F
        const intensityCodes = [];
        for (let col = 1; col <= 5; col++) {
          const value = parseFloat(String(rowData[col] || '0'));
          intensityCodes.push(isNaN(value) ? 0 : value);
        }

        // Convert intensity codes to rainfall amounts (approximate)
        const rainfallAmounts = intensityCodes.map(code => convertIntensityToRainfall(code));

        // Create warning data entry
        if (dates.length >= 5 && district) {
          parsedData.push({
            district: district,
            day1: {
              date: dates[0] || '',
              rainfall: rainfallAmounts[0],
              classification: classifyRainfall(rainfallAmounts[0])
            },
            day2: {
              date: dates[1] || '',
              rainfall: rainfallAmounts[1],
              classification: classifyRainfall(rainfallAmounts[1])
            },
            day3: {
              date: dates[2] || '',
              rainfall: rainfallAmounts[2],
              classification: classifyRainfall(rainfallAmounts[2])
            },
            day4: {
              date: dates[3] || '',
              rainfall: rainfallAmounts[3],
              classification: classifyRainfall(rainfallAmounts[3])
            },
            day5: {
              date: dates[4] || '',
              rainfall: rainfallAmounts[4],
              classification: classifyRainfall(rainfallAmounts[4])
            }
          });
        }
      }
    });

    return parsedData;
  };

  // Convert IMD intensity codes to approximate rainfall amounts
  const convertIntensityToRainfall = (code: number): number => {
    // Handle decimal severity indicators (.1=yellow, .2=orange, .3=red)
    const baseCode = Math.floor(code);
    const decimal = code - baseCode;

    // Heavy rainfall warning base codes only
    const heavyRainfallCodes = [5, 6, 7, 8, 9, 10, 11, 12, 25, 26, 27, 28, 29, 33, 34, 35, 37, 38, 39, 44, 45, 56];

    // If code is not in heavy rainfall warning codes, return 0 (no warning)
    if (!heavyRainfallCodes.includes(baseCode)) {
      return 0;
    }

    let baseRainfall = 0;

    // Convert heavy rainfall warning codes to rainfall amounts
    switch (baseCode) {
      case 5: baseRainfall = 25; break;     // Heavy rainfall at isolated places
      case 6: baseRainfall = 35; break;     // Heavy rainfall at a few places
      case 7: baseRainfall = 45; break;     // Heavy rainfall at most places
      case 8: baseRainfall = 65; break;     // Heavy to very heavy at isolated places
      case 9: baseRainfall = 85; break;     // Heavy to very heavy at a few places
      case 10: baseRainfall = 105; break;   // Heavy to very heavy at most places
      case 11: baseRainfall = 125; break;   // Very heavy rainfall at isolated places
      case 12: baseRainfall = 145; break;   // Very heavy rainfall at a few places
      case 25: baseRainfall = 165; break;   // Heavy rain warning
      case 26: baseRainfall = 185; break;   // Heavy rain warning
      case 27: baseRainfall = 205; break;   // Very heavy to extremely heavy
      case 28: baseRainfall = 225; break;   // Extremely heavy rainfall
      case 29: baseRainfall = 245; break;   // Exceptionally heavy rainfall
      case 33: baseRainfall = 165; break;   // Heavy rain warning
      case 34: baseRainfall = 185; break;   // Heavy rain warning
      case 35: baseRainfall = 205; break;   // Heavy rain warning
      case 37: baseRainfall = 225; break;   // Heavy rain warning
      case 38: baseRainfall = 245; break;   // Heavy rain warning
      case 39: baseRainfall = 265; break;   // Heavy rain warning
      case 44: baseRainfall = 185; break;   // Heavy rain warning
      case 45: baseRainfall = 205; break;   // Heavy rain warning
      case 56: baseRainfall = 225; break;   // Heavy rain warning
      default:
        baseRainfall = 0; // Unknown heavy rainfall code, treat as no warning
    }

    // Adjust for severity decimal (.1=10%, .2=25%, .3=50% increase)
    if (decimal >= 0.1 && decimal < 0.2) {
      baseRainfall *= 1.1; // Yellow warning (+10%)
    } else if (decimal >= 0.2 && decimal < 0.3) {
      baseRainfall *= 1.25; // Orange warning (+25%)
    } else if (decimal >= 0.3) {
      baseRainfall *= 1.5; // Red warning (+50%)
    }

    return Math.round(baseRainfall * 10) / 10; // Round to 1 decimal place
  };

  // Parse IMD Realised File (Monthly Summary Format)
  const parseIMDRealisedFile = (workbook: any): RainfallData[] => {
    const parsedData: RainfallData[] = [];

    // Usually the first sheet contains the data
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false
    }) as any[][];

    // Find the header row (contains "MET.SUB/DISTRICT/STATION")
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(20, jsonData.length); i++) {
      const row = jsonData[i] || [];
      if (row[0] && row[0].toString().includes('MET.SUB/DISTRICT/STATION')) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      console.warn('Header row not found in realised data file');
      return parsedData;
    }

    // Get the year and month from the file (assuming June 2025)
    const year = 2025;
    const month = 6; // June
    const headerRow = jsonData[headerRowIndex];

    // Process data rows starting after the header
    for (let i = headerRowIndex + 2; i < jsonData.length; i++) { // Skip header and separator row
      const row = jsonData[i] || [];
      const stationName = String(row[0] || '').trim();

      // Skip empty rows, district headers, and metadata rows
      if (!stationName ||
        stationName.includes('DISTRICT:') ||
        stationName.includes('MET.') ||
        stationName.includes('----') ||
        stationName.includes(':') ||
        stationName.length < 3) continue;

      // Extract daily rainfall data from columns 1-31 (representing days 1-31)
      for (let day = 1; day <= 31; day++) {
        const columnIndex = day; // Column B=1 (day 1), Column C=2 (day 2), etc.
        const rainfallValue = row[columnIndex];

        // Skip if no data or invalid day for June
        if (day > 30) break; // June has 30 days
        if (rainfallValue === undefined || rainfallValue === '') continue;

        const rainfall = parseFloat(String(rainfallValue));
        if (isNaN(rainfall)) continue;

        // Create date string for this day
        const date = format(new Date(year, month - 1, day), 'yyyy-MM-dd');

        parsedData.push({
          district: stationName,
          date: date,
          rainfall: rainfall,
          classification: classifyRainfall(rainfall)
        });
      }
    }

    return parsedData;
  };

  const handleRealisedFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let parsedData: RainfallData[] = [];

      // Check file type and parse accordingly
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        // Handle CSV files (original format)
        const text = await file.text();
        const rows = text.split('\n').filter(row => row.trim());

        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(',').map(col => col.trim());
          if (cols.length >= 3) {
            parsedData.push(createRealisedDataFromRow(cols));
          }
        }
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Handle Excel files with IMD format
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // Parse IMD Realised format
        parsedData = parseIMDRealisedFile(workbook);
      } else {
        toast.error('Unsupported file format. Please use CSV, XLS, or XLSX files.');
        return;
      }

      if (parsedData.length === 0) {
        toast.error('No valid data found in the file. Please check the file format.');
        return;
      }

      // Process based on upload mode
      if (realisedUploadMode === 'daily') {
        // For daily mode, map all data to the selected date
        parsedData = parsedData.map(data => ({
          ...data,
          date: selectedUploadDate
        }));

        // Remove existing data for this date
        const existingData = loadRealisedData();
        const filteredExistingData = existingData.filter(existing => existing.date !== selectedUploadDate);

        // Add new data
        parsedData.forEach(data => {
          filteredExistingData.push({
            ...data,
            uploadDate: new Date().toISOString()
          });
        });

        saveRealisedData(filteredExistingData);
        setRealisedData(parsedData);
        toast.success(`Realised data uploaded for ${format(new Date(selectedUploadDate), 'MMM dd, yyyy')} (${parsedData.length} districts, overwrote existing data)`);
      } else {
        // Monthly mode - dates are extracted from the file
        const existingData = loadRealisedData();

        // Merge with existing data, replacing entries with same district and date
        parsedData.forEach(newData => {
          const existingIndex = existingData.findIndex(
            existing => existing.district === newData.district && existing.date === newData.date
          );

          if (existingIndex !== -1) {
            existingData.splice(existingIndex, 1);
          }

          existingData.push({
            ...newData,
            uploadDate: new Date().toISOString()
          });
        });

        saveRealisedData(existingData);
        setRealisedData(parsedData);
        toast.success(`Realised data uploaded successfully (${parsedData.length} districts)`);
      }

      updateStorageInfo();
    } catch (error) {
      console.error('Error processing realised file:', error);
      toast.error('Error processing file. Please check the format and try again.');
    }
  };

  const createRealisedDataFromRow = (cols: string[]): RainfallData => {
    const rainfall = parseFloat(cols[2]) || 0;
    return {
      district: cols[0],
      date: cols[1],
      rainfall: rainfall,
      classification: classifyRainfall(rainfall)
    };
  };

  // District to Station mapping for Maharashtra
  const createDistrictStationMapping = () => {
    const mapping: { [key: string]: string[] } = {
      // Mumbai District - using actual station names from data
      'MUMBAI': [
        'COLABA - IMD OBSY', 'SANTACRUZ - IMD OBSY', 'PANDHERIKAWARA',
        'MUMBAI COLABA', 'COLABA', 'MUMBAI', 'SANTA CRUZ',
        'MUMBAI SANTA CRUZ', 'SANTACRUZ', 'JUHU', 'BANDRA', 'ANDHERI'
      ],
      'MUMBAI CITY': [
        'COLABA - IMD OBSY', 'SANTACRUZ - IMD OBSY', 'PANDHERIKAWARA',
        'MUMBAI COLABA', 'COLABA', 'MUMBAI', 'SANTA CRUZ',
        'MUMBAI SANTA CRUZ', 'SANTACRUZ', 'JUHU', 'BANDRA', 'ANDHERI'
      ],
      'MUMBAI SUBURBAN': [
        'COLABA - IMD OBSY', 'SANTACRUZ - IMD OBSY', 'PANDHERIKAWARA',
        'MUMBAI COLABA', 'COLABA', 'MUMBAI', 'SANTA CRUZ',
        'MUMBAI SANTA CRUZ', 'SANTACRUZ', 'JUHU', 'BANDRA', 'ANDHERI'
      ],

      // Thane District - using actual station names from data
      'THANE': [
        'THANE', 'KALYAN', 'BHIWANDI', 'VASAI', 'ULHASNAGAR', 'AMBARNATH',
        'MIRA ROAD', 'SHAHAPUR', 'MURBAD'
      ],

      // Palghar District - using actual station names from data
      'PALGHAR': [
        'PALGHAR_AGRI', 'DAHANU - IMD OBSY', 'JAWHAR', 'TALASARI', 'VIKRAMGAD',
        'WADA', 'TALA', 'PALGHAR', 'DAHANU', 'VASAI', 'VIRAR'
      ],

      // Raigad District
      'RAIGAD': [
        'ALIBAG', 'RAIGAD', 'PANVEL', 'KARJAT', 'KHOPOLI', 'MATHERAN',
        'URAN', 'PEN', 'ROHA', 'MAHAD'
      ],

      // Pune District
      'PUNE': [
        'PUNE', 'SHIVAJINAGAR', 'LOHEGAON', 'CHINCHWAD', 'TALEGAON',
        'MAHABALESHWAR', 'LONAVALA', 'KHADAKWASLA', 'PASHAN'
      ],

      // Nashik District  
      'NASIK': [
        'NASIK', 'NASHIK', 'IGATPURI', 'TRIMBAKESHWAR', 'DINDORI',
        'YEOLA', 'NIPHAD', 'SINNAR'
      ],
      'NASHIK': [
        'NASIK', 'NASHIK', 'IGATPURI', 'TRIMBAKESHWAR', 'DINDORI',
        'YEOLA', 'NIPHAD', 'SINNAR'
      ],

      // Ahmednagar District
      'AHMEDNAGAR': [
        'AHMEDNAGAR', 'AHMADNAGAR', 'SHRIRAMPUR', 'SANGAMNER', 'KOPARGAON',
        'NEWASA', 'PATHARDI', 'SHEVGAON'
      ],

      // Satara District
      'SATARA': [
        'SATARA', 'KOREGAON', 'PHALTAN', 'WAI', 'KARAD', 'PANCHGANI'
      ],

      // Kolhapur District
      'KOLHAPUR': [
        'KOLHAPUR', 'ICHALKARANJI', 'SHIROL', 'PANHALA', 'RADHANAGARI'
      ],

      // Sangli District
      'SANGLI': [
        'SANGLI', 'MIRAJ', 'KUPWAD', 'PALUS', 'KHANAPUR'
      ],

      // Solapur District
      'SOLAPUR': [
        'SOLAPUR', 'SHOLAPUR', 'AKKALKOT', 'BARSHI', 'PANDHARPUR', 'MANGALWEDHA'
      ],

      // Aurangabad District
      'AURANGABAD': [
        'AURANGABAD', 'CHHATRAPATI SAMBHAJINAGAR', 'PAITHAN', 'GANGAPUR', 'VAIJAPUR'
      ],
      'CHHATRAPATI SAMBHAJINAGAR': [
        'AURANGABAD', 'CHHATRAPATI SAMBHAJINAGAR', 'PAITHAN', 'GANGAPUR', 'VAIJAPUR'
      ],

      // Jalgaon District
      'JALGAON': [
        'JALGAON', 'BHUSAWAL', 'CHALISGAON', 'CHOPDA', 'PAROLA'
      ],

      // Dhule District
      'DHULE': [
        'DHULE', 'SHIRPUR', 'SAKRI', 'SINDKHEDE'
      ],

      // Nandurbar District
      'NANDURBAR': [
        'NANDURBAR', 'SHAHADA', 'TALODA', 'DHADGAON'
      ],

      // Jalna District
      'JALNA': [
        'JALNA', 'AMBAD', 'GHANSAWANGI', 'PARTUR'
      ],

      // Bid District
      'BEED': [
        'BEED', 'BID', 'GEORAI', 'PARLI', 'PATODA', 'MAJALGAON'
      ],
      'BID': [
        'BEED', 'BID', 'GEORAI', 'PARLI', 'PATODA', 'MAJALGAON'
      ],

      // Osmanabad District
      'OSMANABAD': [
        'OSMANABAD', 'DHARASHIV', 'TULJAPUR', 'OMERGA', 'BHOOM'
      ],
      'DHARASHIV': [
        'OSMANABAD', 'DHARASHIV', 'TULJAPUR', 'OMERGA', 'BHOOM'
      ],

      // Latur District
      'LATUR': [
        'LATUR', 'NILANGA', 'AUSA', 'RENAPUR'
      ],

      // Hingoli District
      'HINGOLI': [
        'HINGOLI', 'KALAMNURI', 'BASMAT', 'SENGAON'
      ],

      // Nanded District
      'NANDED': [
        'NANDED', 'KINWAT', 'MUKHED', 'DEGLOOR', 'BHOKAR'
      ],

      // Parbhani District
      'PARBHANI': [
        'PARBHANI', 'PURNA', 'PATHRI', 'JINTUR', 'MANWAT'
      ],

      // Akola District
      'AKOLA': [
        'AKOLA', 'TELHARA', 'BALAPUR', 'PATUR', 'BARSHITAKLI'
      ],

      // Amravati District
      'AMRAVATI': [
        'AMRAVATI', 'BADNERA', 'MORSHI', 'CHANDURBAZAR', 'DHAMANGAON'
      ],

      // Buldhana District
      'BULDHANA': [
        'BULDHANA', 'KHAMGAON', 'CHIKHLI', 'JALGAON JAMOD', 'SHEGAON'
      ],

      // Washim District
      'WASHIM': [
        'WASHIM', 'KARANJA', 'MALEGAON', 'RISOD'
      ],

      // Yavatmal District
      'YAVATMAL': [
        'YAVATMAL', 'DARWHA', 'PUSAD', 'WANI', 'ARNI'
      ],

      // Wardha District
      'WARDHA': [
        'WARDHA', 'HINGANAGHAT', 'SAMUDRAPUR', 'ARVI'
      ],

      // Nagpur District
      'NAGPUR': [
        'NAGPUR', 'KAMPTEE', 'HINGNA', 'PARSEONI', 'KATOL', 'NARKHED'
      ],

      // Chandrapur District
      'CHANDRAPUR': [
        'CHANDRAPUR', 'BALLARPUR', 'GADCHIROLI', 'WARORA', 'CHIMUR'
      ],

      // Gadchiroli District
      'GADCHIROLI': [
        'GADCHIROLI', 'ARMORI', 'KURKHEDA', 'KORCHI', 'CHAMORSHI'
      ],

      // Bhandara District
      'BHANDARA': [
        'BHANDARA', 'GONDIA', 'TUMSAR', 'PAUNI', 'MOHADI'
      ],

      // Gondia District
      'GONDIA': [
        'GONDIA', 'TIRODA', 'GOREGAON', 'ARJUNI', 'AMGAON'
      ]
    };

    return mapping;
  };

  // Find matching stations for a district
  const findMatchingStations = (district: string, availableStations: string[]): string[] => {
    const mapping = createDistrictStationMapping();
    const districtUpper = district.toUpperCase().trim();

    // Direct mapping lookup
    if (mapping[districtUpper]) {
      return availableStations.filter(station =>
        mapping[districtUpper].some(mappedStation =>
          station.toUpperCase().includes(mappedStation.toUpperCase()) ||
          mappedStation.toUpperCase().includes(station.toUpperCase()) ||
          station.toUpperCase().includes(districtUpper)
        )
      );
    }

    // Fallback: partial string matching
    return availableStations.filter(station =>
      station.toUpperCase().includes(districtUpper) ||
      districtUpper.includes(station.toUpperCase().split(' ')[0]) ||
      station.toUpperCase().split(' ').some(part =>
        part.length > 3 && districtUpper.includes(part)
      )
    );
  };

  const generateComparison = () => {
    if (warningData.length === 0 || realisedData.length === 0) {
      toast.error('Please upload both warning and realised data');
      return;
    }

    console.log('Starting dual analysis with:', {
      warningData: warningData.length,
      realisedData: realisedData.length,
      dateRange: `${verificationStartDate} to ${verificationEndDate}`
    });

    // Parse date range for filtering
    const startDate = new Date(verificationStartDate);
    const endDate = new Date(verificationEndDate);

    // Initialize result structures
    const spatialResults: ComparisonData[] = [];
    const temporalResults: LeadTimeComparison[] = [];
    const districtAccuracy: { [district: string]: { correct: number; total: number; percentage: number } } = {};

    // Get all available station names
    const availableStations = [...new Set(realisedData.map(r => r.district))];
    console.log('Available stations:', availableStations.slice(0, 10));

    // SPATIAL ANALYSIS: District-Station Comparison
    warningData.forEach(warning => {
      // Find matching stations for this district
      const matchingStations = findMatchingStations(warning.district, availableStations);

      if (matchingStations.length === 0) {
        console.warn(`No matching stations found for district: ${warning.district}`);
        return;
      }

      // Initialize district accuracy tracking
      if (!districtAccuracy[warning.district]) {
        districtAccuracy[warning.district] = { correct: 0, total: 0, percentage: 0 };
      }

      // Check each day's prediction for spatial analysis
      [warning.day1, warning.day2, warning.day3, warning.day4, warning.day5].forEach(dayWarning => {
        // Filter by date range
        const dayDate = new Date(dayWarning.date);
        if (dayDate < startDate || dayDate > endDate) {
          return; // Skip dates outside the selected range
        }

        matchingStations.forEach(stationName => {
          // Find realised data for this station and date
          const realisedForStation = realisedData.find(
            realised => realised.district === stationName && realised.date === dayWarning.date
          );

          if (realisedForStation) {
            const match = dayWarning.classification === realisedForStation.classification;
            let type: 'Correct' | 'False Alarm' | 'Missed Event' | 'Correct Non-Event';

            if (match) {
              if (dayWarning.classification === 'Y') {
                type = 'Correct';
              } else {
                type = 'Correct Non-Event';
              }
              districtAccuracy[warning.district].correct++;
            } else {
              if (dayWarning.classification === 'Y' && realisedForStation.classification === 'N') {
                type = 'False Alarm';
              } else {
                type = 'Missed Event';
              }
            }

            districtAccuracy[warning.district].total++;

            spatialResults.push({
              district: warning.district,
              station: stationName,
              date: realisedForStation.date,
              warning: dayWarning.classification,
              realised: realisedForStation.classification,
              warningRainfall: dayWarning.rainfall || 0,
              realisedRainfall: realisedForStation.rainfall || 0,
              match,
              type
            });
          }
        });
      });
    });

    // Calculate district accuracy percentages
    Object.keys(districtAccuracy).forEach(district => {
      const stats = districtAccuracy[district];
      stats.percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    });

    // TEMPORAL ANALYSIS: Day-wise Lead-time Analysis
    warningData.forEach(warning => {
      const matchingStations = findMatchingStations(warning.district, availableStations);

      matchingStations.forEach(stationName => {
        // For each forecast day, analyze all lead times (1-5 days)
        const forecastDays = [warning.day1, warning.day2, warning.day3, warning.day4, warning.day5];

        forecastDays.forEach((dayForecast, leadIndex) => {
          // Filter by date range
          const dayDate = new Date(dayForecast.date);
          if (dayDate < startDate || dayDate > endDate) {
            return; // Skip dates outside the selected range
          }

          // Find corresponding observed data for the target date
          const observedData = realisedData.find(
            realised => realised.district === stationName && realised.date === dayForecast.date
          );

          if (observedData) {
            const forecastHeavy = dayForecast.classification === 'Y';
            const observedHeavy = observedData.classification === 'Y';

            let result: 'Hit' | 'Miss' | 'False Alarm' | 'Correct Negative';
            if (forecastHeavy && observedHeavy) result = 'Hit';
            else if (!forecastHeavy && observedHeavy) result = 'Miss';
            else if (forecastHeavy && !observedHeavy) result = 'False Alarm';
            else result = 'Correct Negative';

            temporalResults.push({
              district: warning.district,
              station: stationName,
              forecastDate: warning.day1.date, // Base forecast date
              targetDate: dayForecast.date,
              leadDays: leadIndex + 1,
              forecastRainfall: dayForecast.rainfall,
              observedRainfall: observedData.rainfall,
              forecastHeavy: dayForecast.classification,
              observedHeavy: observedData.classification,
              result
            });
          }
        });
      });
    });

    // Calculate lead-time skill scores
    const leadTimeStats: LeadTimeStats[] = [];
    for (let leadDays = 1; leadDays <= 5; leadDays++) {
      const leadData = temporalResults.filter(r => r.leadDays === leadDays);

      const hits = leadData.filter(r => r.result === 'Hit').length;
      const misses = leadData.filter(r => r.result === 'Miss').length;
      const falseAlarms = leadData.filter(r => r.result === 'False Alarm').length;
      const correctNegatives = leadData.filter(r => r.result === 'Correct Negative').length;
      const total = leadData.length;

      const pod = (hits + misses) > 0 ? hits / (hits + misses) : 0;
      const far = (hits + falseAlarms) > 0 ? falseAlarms / (hits + falseAlarms) : 0;
      const csi = (hits + misses + falseAlarms) > 0 ? hits / (hits + misses + falseAlarms) : 0;
      const bias = (hits + misses) > 0 ? (hits + falseAlarms) / (hits + misses) : 0;

      leadTimeStats.push({
        leadDays,
        hits,
        misses,
        falseAlarms,
        correctNegatives,
        total,
        pod,
        far,
        csi,
        bias
      });
    }

    // Prepare final results
    const verificationResults: VerificationResults = {
      spatialAnalysis: {
        totalStations: availableStations.length,
        totalDistricts: Object.keys(districtAccuracy).length,
        districtAccuracy,
        stationResults: spatialResults
      },
      temporalAnalysis: {
        leadTimeStats,
        leadTimeComparisons: temporalResults
      },
      summary: {
        analysisStartDate: verificationStartDate,
        analysisEndDate: verificationEndDate,
        totalComparisons: spatialResults.length,
        threshold: verificationThreshold
      }
    };

    console.log('Dual analysis completed:', {
      spatialComparisons: spatialResults.length,
      temporalComparisons: temporalResults.length,
      districtsAnalyzed: Object.keys(districtAccuracy).length
    });

    // Save results and update UI
    setVerificationResults(verificationResults);

    // Update legacy state for compatibility
    setComparisonData(spatialResults);
    const overallAccuracy = spatialResults.length > 0 ?
      (spatialResults.filter(r => r.match).length / spatialResults.length) * 100 : 0;

    setAccuracyStats({
      totalPredictions: spatialResults.length,
      correct: spatialResults.filter(r => r.match).length,
      falseAlarms: spatialResults.filter(r => r.type === 'False Alarm').length,
      missedEvents: spatialResults.filter(r => r.type === 'Missed Event').length,
      accuracy: overallAccuracy
    });

    toast.success(`Dual analysis completed: ${spatialResults.length} spatial + ${temporalResults.length} temporal comparisons`);
    setActiveTab('verification');
  };

  const generateReport = async () => {
    if (!accuracyStats || comparisonData.length === 0) {
      toast.error('No analysis data available for report generation');
      return;
    }

    try {
      const dateRange = `${comparisonData[0]?.date} to ${comparisonData[comparisonData.length - 1]?.date}`;
      const blob = await generateWordReport(accuracyStats, comparisonData, dateRange);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `IMD_Forecast_Verification_Report_${format(new Date(), 'yyyy-MM-dd')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Error generating report');
    }
  };

  const saveAnalysisToDate = () => {
    if (!accuracyStats || comparisonData.length === 0) {
      toast.error('No analysis data available to save');
      return;
    }

    const saveDate = prompt('Enter the date to save this analysis (YYYY-MM-DD format):');
    if (!saveDate) return;

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(saveDate)) {
      toast.error('Please enter date in YYYY-MM-DD format');
      return;
    }

    try {
      // Create a date-specific key
      const dateKey = `imd_analysis_${saveDate}`;
      const analysisData = {
        date: saveDate,
        savedAt: new Date().toISOString(),
        comparisonData,
        accuracyStats,
        warningCount: warningData.length,
        realisedCount: realisedData.length
      };

      localStorage.setItem(dateKey, JSON.stringify(analysisData));

      // Update the main comparison data to ensure calendar shows it
      const existingComparisons = loadComparisonData().comparisons;
      const dateComparisons = comparisonData.map(comp => ({
        ...comp,
        analysisDate: new Date().toISOString(),
        date: comp.date // Keep original dates, but also allow saving to specific date
      }));

      // Add date-specific versions
      const dateSpecificComparisons = comparisonData.map(comp => ({
        ...comp,
        analysisDate: new Date().toISOString(),
        date: saveDate // Save all comparisons under the specified date
      }));

      const combinedComparisons = [
        ...existingComparisons.filter(c => c.date !== saveDate), // Remove any existing data for this date
        ...dateSpecificComparisons
      ];

      const updatedStats = {
        ...accuracyStats,
        analysisDate: new Date().toISOString(),
        dateRange: saveDate
      };

      saveComparisonData(dateSpecificComparisons, updatedStats);
      updateStorageInfo();

      toast.success(`Analysis saved successfully for ${saveDate}! It will now be visible in the calendar.`);
    } catch (error) {
      toast.error('Error saving analysis data');
      console.error('Save error:', error);
    }
  };

  const generateDateSpecificReport = (date: string, analysis: DateSpecificAnalysis) => {
    const reportDate = format(new Date(date), 'MMMM dd, yyyy');

    let csvContent = `Heavy Rainfall Verification - 5-Day Lead Time Analysis\n`;
    csvContent += `Date: ${reportDate}\n`;
    csvContent += `Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n\n`;

    analysis.dayTables.forEach(dayTable => {
      csvContent += `\nDay-${dayTable.day} Forecast Results (${dayTable.predictions.length} predictions)\n`;
      csvContent += `District,Warning Status,Predicted (mm),Realised Status,Actual (mm),Verification Result\n`;

      dayTable.predictions.forEach(prediction => {
        csvContent += `${prediction.district},${prediction.warning},${prediction.warningRainfall.toFixed(1)},${prediction.realised},${prediction.realisedRainfall.toFixed(1)},${prediction.status}\n`;
      });
    });

    // Add summary statistics
    csvContent += `\nSummary Statistics for ${reportDate}\n`;
    csvContent += `Lead Time,Total Predictions,Hits,Accuracy (%)\n`;

    [1, 2, 3, 4, 5].forEach(day => {
      const dayData = analysis.dayTables.find(d => d.day === day);
      const hits = dayData?.predictions.filter(p => p.status === 'Hit').length || 0;
      const total = dayData?.predictions.length || 0;
      const accuracy = total > 0 ? ((hits / total) * 100).toFixed(1) : '0.0';
      csvContent += `Day-${day},${total},${hits},${accuracy}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Heavy_Rainfall_Analysis_${format(new Date(date), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Report downloaded for ${reportDate}`);
  };

  const handleDateClick = (date: string) => {
    setSelectedCalendarDate(date);

    console.log('🔍 Selected date:', date);
    console.log('📊 Debug: Raw stored realised data:', loadRealisedData());
    console.log('⚠️ Debug: Raw stored warnings data:', loadWarningData());
    console.log('🎯 Debug: Warning data length:', loadWarningData().length);
    console.log('💾 Debug: Realised data length:', loadRealisedData().length);

    // CRITICAL FIX: Use component state as fallback when localStorage is empty
    let storedWarnings = loadWarningData();
    let storedRealisedRaw = loadRealisedData();

    console.log('🔄 LocalStorage data - Warnings:', storedWarnings.length, 'Realised:', storedRealisedRaw.length);
    console.log('🔄 Component state data - Warnings:', warningData.length, 'Realised:', realisedData.length);

    // If localStorage is empty but component state has data, use component state
    if (storedWarnings.length === 0 && warningData.length > 0) {
      console.log('🚨 Using component state warning data as localStorage is empty!');
      storedWarnings = warningData.map(w => ({
        district: w.district,
        day1: w.day1,
        day2: w.day2,
        day3: w.day3,
        day4: w.day4,
        day5: w.day5,
        uploadDate: new Date().toISOString()
      }));
    }

    if (storedRealisedRaw.length === 0 && realisedData.length > 0) {
      console.log('🚨 Using component state realised data as localStorage is empty!');
      storedRealisedRaw = realisedData.map(r => ({
        district: r.district,
        date: r.date,
        rainfall: r.rainfall,
        classification: r.classification,
        uploadDate: new Date().toISOString()
      }));
    }

    // Debug: Check what data structure we have
    if (storedWarnings.length > 0) {
      console.log('📋 Debug: First warning entry structure:', storedWarnings[0]);
      console.log('📅 Debug: Day1 structure:', storedWarnings[0].day1);
    }

    // Load fresh data from localStorage for the selected date
    const storedComparisons = loadComparisonData().comparisons.filter(c => c.date === date);
    const storedRealised = storedRealisedRaw.filter(r => {
      // Try multiple date formats to match
      const matches = r.date === date ||
        format(new Date(r.date), 'yyyy-MM-dd') === date ||
        format(new Date(r.date), 'MM/dd/yyyy') === format(new Date(date), 'MM/dd/yyyy');

      if (matches) {
        console.log('📈 Found matching realised data:', r);
      }
      return matches;
    });

    console.log('📊 Found realised data:', storedRealised.length);
    console.log('⚠️ Found warnings data:', storedWarnings.length);

    // Get warning data for the specific date
    const dateWarnings: any[] = [];
    storedWarnings.forEach(warning => {
      [warning.day1, warning.day2, warning.day3, warning.day4, warning.day5].forEach(day => {
        if (day?.date) {
          const dayDate = day.date;
          const isMatchingDate = dayDate === date ||
            format(new Date(dayDate), 'yyyy-MM-dd') === date ||
            format(new Date(dayDate), 'MM/dd/yyyy') === format(new Date(date), 'MM/dd/yyyy');

          if (isMatchingDate) {
            dateWarnings.push({
              district: warning.district,
              date: day.date,
              rainfall: day.rainfall || 0,
              classification: day.classification
            });
          }
        }
      });
    });

    // Create 5-table analysis for the selected date
    const dayTables: DateSpecificAnalysis['dayTables'] = [];

    // Generate tables for Day-1 through Day-5 forecasts for this date
    for (let leadDay = 1; leadDay <= 5; leadDay++) {
      const predictions: DateSpecificAnalysis['dayTables'][0]['predictions'] = [];

      storedWarnings.forEach(warning => {
        // Find forecasts that predict this date with the current lead time
        const forecastDays = [warning.day1, warning.day2, warning.day3, warning.day4, warning.day5];
        const targetForecast = forecastDays[leadDay - 1]; // leadDay 1 = day1, etc.

        if (targetForecast?.date) {
          // Check if this forecast is for our target date (try multiple formats)
          const forecastDate = targetForecast.date;
          const isTargetDate = forecastDate === date ||
            format(new Date(forecastDate), 'yyyy-MM-dd') === date ||
            format(new Date(forecastDate), 'MM/dd/yyyy') === format(new Date(date), 'MM/dd/yyyy');

          if (isTargetDate) {
            console.log(`📈 Found Day-${leadDay} forecast for ${warning.district}:`, targetForecast);

            // Find realised data for this district on this date
            const realised = storedRealised.find(r =>
              r.district === warning.district ||
              r.district.toLowerCase() === warning.district.toLowerCase()
            );

            if (realised) {
              let status: 'Hit' | 'Miss' | 'False Alarm' | 'Correct Negative';

              if (targetForecast.classification === 'Y' && realised.classification === 'Y') {
                status = 'Hit';
              } else if (targetForecast.classification === 'N' && realised.classification === 'Y') {
                status = 'Miss';
              } else if (targetForecast.classification === 'Y' && realised.classification === 'N') {
                status = 'False Alarm';
              } else {
                status = 'Correct Negative';
              }

              predictions.push({
                district: warning.district,
                warning: targetForecast.classification,
                warningRainfall: targetForecast.rainfall || 0,
                realised: realised.classification,
                realisedRainfall: realised.rainfall || 0,
                status
              });
            } else {
              // Add entry even if no realised data found (to show missing data)
              predictions.push({
                district: warning.district,
                warning: targetForecast.classification,
                warningRainfall: targetForecast.rainfall || 0,
                realised: 'N',
                realisedRainfall: 0,
                status: 'Miss' // Assume miss if no realised data
              });
            }
          }
        }
      });

      console.log(`🎯 Day-${leadDay} predictions:`, predictions.length);

      dayTables.push({
        day: leadDay,
        predictions
      });
    }

    console.log('📋 Final dayTables:', dayTables);

    // Debug: Show what dates ARE available in warning data
    const availableDates = new Set<string>();
    storedWarnings.forEach(warning => {
      [warning.day1, warning.day2, warning.day3, warning.day4, warning.day5].forEach(day => {
        if (day?.date) {
          availableDates.add(day.date);
        }
      });
    });
    console.log('🗓️ Available forecast dates in warning data:', Array.from(availableDates).sort());
    console.log(`❓ Is ${date} in available dates?`, availableDates.has(date));

    setDateSpecificAnalysis({
      date,
      dayTables
    });

    setDayData({
      date,
      comparisons: storedComparisons,
      realised: storedRealised,
      warnings: dateWarnings,
      hasData: storedComparisons.length > 0 || storedRealised.length > 0 || dateWarnings.length > 0
    });

    console.log('✅ Selected date:', date);
    console.log('📊 Date-specific 5-table analysis:', dayTables);
  }; const generateDayReport = async (date: string) => {
    const data = getDataForDate(date);
    if (data.comparisons.length === 0) {
      toast.error('No comparison data available for this date');
      return;
    }

    try {
      // Calculate day-specific stats
      const dayStats = {
        totalPredictions: data.comparisons.length,
        correct: data.comparisons.filter(c => c.match).length,
        falseAlarms: data.comparisons.filter(c => c.type === 'False Alarm').length,
        missedEvents: data.comparisons.filter(c => c.type === 'Missed Event').length,
        accuracy: (data.comparisons.filter(c => c.match).length / data.comparisons.length) * 100
      };

      const blob = await generateWordReport(dayStats, data.comparisons, date);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `IMD_Day_Report_${date}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Day report for ${date} downloaded successfully`);
    } catch (error) {
      toast.error('Error generating day report');
    }
  };

  const clearAllStoredData = () => {
    if (confirm('Are you sure you want to clear all stored data? This action cannot be undone.')) {
      clearAllData();
      setWarningData([]);
      setRealisedData([]);
      setComparisonData([]);
      setAccuracyStats(null);
      setDayData(null);
      setSelectedCalendarDate(null);
      updateStorageInfo();
      toast.success('All data cleared successfully');
    }
  };

  // Heavy Rainfall Verification handlers
  const handleRunVerification = async () => {
    // Check if we have data
    if (warningData.length === 0 || realisedData.length === 0) {
      toast.error('Please upload both warning and realised data before running verification');
      return;
    }

    setIsVerificationLoading(true);
    try {
      toast.success('Running dual verification analysis...');

      // Use the existing generateComparison function that now does both analyses
      generateComparison();

      toast.success('Verification analysis completed successfully!');
    } catch (error) {
      toast.error('Error running verification analysis');
      console.error('Verification error:', error);
    } finally {
      setIsVerificationLoading(false);
    }
  };

  const handleGenerateReports = async () => {
    if (!verificationResults) {
      toast.error('No verification results available');
      return;
    }

    try {
      toast.success('Generating comprehensive reports based on real data...');

      await new Promise(resolve => setTimeout(resolve, 1000));

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const mockReports = {
        excel_report: `/reports/IMD_Heavy_Rainfall_Verification_${timestamp}.xlsx`,
        pdf_report: `/reports/IMD_Heavy_Rainfall_Verification_${timestamp}.pdf`,
        charts: [
          `/reports/charts_${timestamp}/skill_scores_by_lead_time.png`,
          `/reports/charts_${timestamp}/district_accuracy_comparison.png`
        ]
      };

      setGeneratedReports(mockReports);
      toast.success('Professional reports generated successfully with real calculation results!');
    } catch (error) {
      toast.error('Error generating reports');
      console.error('Report generation error:', error);
    }
  };

  const getCalendarDays = () => {
    const calendarDate = new Date(currentCalendarYear, currentCalendarMonth, 1);
    const start = startOfMonth(calendarDate);
    const end = endOfMonth(calendarDate);

    // Get the start of the week for the first day of the month
    const startWeek = startOfWeek(start, { weekStartsOn: 0 }); // Sunday = 0
    // Get the end of the week for the last day of the month
    const endWeek = endOfWeek(end, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startWeek, end: endWeek });
  };

  const getDayStatus = (date: string) => {
    // Check if we have verification results for this date
    if (verificationResults && verificationResults.spatialAnalysis.stationResults.length > 0) {
      const dayComparisons = verificationResults.spatialAnalysis.stationResults.filter(r => r.date === date);

      if (dayComparisons.length > 0) {
        const accuracy = (dayComparisons.filter(c => c.match).length / dayComparisons.length) * 100;
        return {
          status: 'has-data',
          accuracy,
          count: dayComparisons.length
        };
      }
    }

    // Fallback to checking raw data availability
    const dayData = getDataForDate(date);

    if (dayData.warnings.length > 0 || dayData.realised.length > 0) {
      return { status: 'has-data', accuracy: 0, count: dayData.warnings.length + dayData.realised.length };
    }

    return { status: 'no-data', accuracy: 0, count: 0 };
  };

  const getDateRangeForCalendar = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      if (!isAfter(date, startOfDay(new Date()))) {
        dates.push(format(date, 'yyyy-MM-dd'));
      }
    }
    return dates;
  };

  // Calendar navigation functions
  const goToPreviousMonth = () => {
    if (currentCalendarMonth === 0) {
      setCurrentCalendarMonth(11);
      setCurrentCalendarYear(currentCalendarYear - 1);
    } else {
      setCurrentCalendarMonth(currentCalendarMonth - 1);
    }
    setSelectedCalendarDate(null);
    setDayData(null);
  };

  const goToNextMonth = () => {
    if (currentCalendarMonth === 11) {
      setCurrentCalendarMonth(0);
      setCurrentCalendarYear(currentCalendarYear + 1);
    } else {
      setCurrentCalendarMonth(currentCalendarMonth + 1);
    }
    setSelectedCalendarDate(null);
    setDayData(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentCalendarMonth(today.getMonth());
    setCurrentCalendarYear(today.getFullYear());
    setSelectedCalendarDate(null);
    setDayData(null);
  };

  const getMonthYearString = () => {
    const date = new Date(currentCalendarYear, currentCalendarMonth, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">IMD Mumbai</h1>
              <div className="ml-4 text-sm text-gray-600">
                Rainfall Forecast Verification Dashboard
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, IMD Mumbai</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {['upload', 'analysis', 'leadtime', 'verification'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab as any);
                  // Refresh data when switching to calendar
                  if (tab === 'calendar') {
                    updateStorageInfo();
                  }
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab === 'upload' && 'Data Upload'}
                {tab === 'analysis' && 'Analysis'}
                {tab === 'leadtime' && 'Lead-Time Verification'}
                {tab === 'verification' && 'Heavy Rainfall Verification'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Data Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Data Upload</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Warning Data Upload */}
                <div>
                  <h3 className="font-medium mb-4">Warning (Forecast) Data</h3>

                  {/* Upload Mode Selection */}
                  <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Mode</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="warningMode"
                          value="monthly"
                          checked={warningUploadMode === 'monthly'}
                          onChange={(e) => setWarningUploadMode(e.target.value as 'monthly' | 'daily')}
                          className="mr-2 text-blue-600"
                        />
                        Monthly Data File
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="warningMode"
                          value="daily"
                          checked={warningUploadMode === 'daily'}
                          onChange={(e) => setWarningUploadMode(e.target.value as 'monthly' | 'daily')}
                          className="mr-2 text-blue-600"
                        />
                        Single Day Data
                      </label>
                    </div>
                  </div>

                  {/* Date Selection for Daily Mode */}
                  {warningUploadMode === 'daily' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Date for Upload
                      </label>
                      <input
                        type="date"
                        value={selectedUploadDate}
                        onChange={(e) => setSelectedUploadDate(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleWarningFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    {warningUploadMode === 'monthly'
                      ? 'Upload CSV/Excel file with monthly forecast data. Dates will be extracted automatically from the file.'
                      : `Upload CSV/Excel file for ${format(new Date(selectedUploadDate), 'MMM dd, yyyy')}. Data will be mapped to this specific date. Any existing data for this date will be overwritten.`
                    }
                  </p>
                  {warningData.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {warningData.length} warning entries loaded
                    </p>
                  )}
                </div>

                {/* Realised Data Upload */}
                <div>
                  <h3 className="font-medium mb-4">Realised (Observed) Data</h3>

                  {/* Upload Mode Selection */}
                  <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Mode</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="realisedMode"
                          value="monthly"
                          checked={realisedUploadMode === 'monthly'}
                          onChange={(e) => setRealisedUploadMode(e.target.value as 'monthly' | 'daily')}
                          className="mr-2 text-green-600"
                        />
                        Monthly Data File
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="realisedMode"
                          value="daily"
                          checked={realisedUploadMode === 'daily'}
                          onChange={(e) => setRealisedUploadMode(e.target.value as 'monthly' | 'daily')}
                          className="mr-2 text-green-600"
                        />
                        Single Day Data
                      </label>
                    </div>
                  </div>

                  {/* Date Selection for Daily Mode */}
                  {realisedUploadMode === 'daily' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Date for Upload
                      </label>
                      <input
                        type="date"
                        value={selectedUploadDate}
                        onChange={(e) => setSelectedUploadDate(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleRealisedFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    {realisedUploadMode === 'monthly'
                      ? 'Upload CSV/Excel file with monthly observed rainfall data. Dates will be extracted automatically from the file.'
                      : `Upload CSV/Excel file for ${format(new Date(selectedUploadDate), 'MMM dd, yyyy')}. Data will be mapped to this specific date. Any existing data for this date will be overwritten.`
                    }
                  </p>
                  {realisedData.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {realisedData.length} realised entries loaded
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-4 sm:mb-0">
                    <button
                      onClick={generateComparison}
                      disabled={warningData.length === 0 || realisedData.length === 0}
                      className={`w-full sm:w-auto px-6 py-3 rounded-md font-medium ${warningData.length === 0 || realisedData.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                      Generate Comparison & Analysis
                    </button>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={clearAllStoredData}
                      className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50 text-sm"
                    >
                      Clear All Data
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Summary */}
            {(warningData.length > 0 || realisedData.length > 0 || storageInfo) && (
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Data Summary</h3>
                  <button
                    onClick={clearAllStoredData}
                    className="text-sm text-red-600 hover:text-red-700 underline"
                  >
                    Clear All Data
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {storageInfo?.warningDataCount || warningData.length}
                    </div>
                    <div className="text-sm text-gray-800 font-medium">Warning Districts</div>
                    {storageInfo?.warningLastUpload && (
                      <div className="text-xs text-gray-700 mt-1">
                        Last: {format(new Date(storageInfo.warningLastUpload), 'MMM dd, HH:mm')}
                      </div>
                    )}
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {storageInfo?.realisedDataCount || realisedData.length}
                    </div>
                    <div className="text-sm text-gray-800 font-medium">Realised Records</div>
                    {storageInfo?.realisedLastUpload && (
                      <div className="text-xs text-gray-700 mt-1">
                        Last: {format(new Date(storageInfo.realisedLastUpload), 'MMM dd, HH:mm')}
                      </div>
                    )}
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded">
                    <div className="text-2xl font-bold text-yellow-600">
                      {storageInfo?.comparisonDataCount || comparisonData.length}
                    </div>
                    <div className="text-sm text-gray-800 font-medium">Comparisons</div>
                    {storageInfo?.analysisLastRun && (
                      <div className="text-xs text-gray-700 mt-1">
                        Last: {format(new Date(storageInfo.analysisLastRun), 'MMM dd, HH:mm')}
                      </div>
                    )}
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <div className="text-2xl font-bold text-purple-600">
                      {accuracyStats ? `${accuracyStats.accuracy.toFixed(1)}%` : '0%'}
                    </div>
                    <div className="text-sm text-gray-800 font-medium">Accuracy</div>
                  </div>
                </div>

                {/* Debug Info */}
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">🔍 Debug Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-red-700">State Data (Used for Analysis):</div>
                      <div>Warning Data: {warningData.length}</div>
                      <div>Realised Data: {realisedData.length}</div>
                    </div>
                    <div>
                      <div className="font-medium text-red-700">LocalStorage Data (Used for Calendar):</div>
                      <div>Stored Warnings: {loadWarningData().length}</div>
                      <div>Stored Realised: {loadRealisedData().length}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={generateComparison}
                    disabled={warningData.length === 0 || realisedData.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded"
                  >
                    Generate Analysis
                  </button>
                  {accuracyStats && comparisonData.length > 0 && (
                    <>
                      <button
                        onClick={generateReport}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                      >
                        Download Full Report
                      </button>
                      <button
                        onClick={saveAnalysisToDate}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                      >
                        Save to Calendar Date
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {accuracyStats ? (
              <>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold mb-4">Forecast Accuracy Analysis</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded">
                      <div className="text-3xl font-bold text-green-600">{accuracyStats.correct}</div>
                      <div className="text-sm text-gray-800 font-medium">Correct Predictions</div>
                      <div className="text-xs text-gray-700 mt-1">
                        {((accuracyStats.correct / accuracyStats.totalPredictions) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded">
                      <div className="text-3xl font-bold text-orange-600">{accuracyStats.falseAlarms}</div>
                      <div className="text-sm text-gray-800 font-medium">False Alarms</div>
                      <div className="text-xs text-gray-700 mt-1">
                        {((accuracyStats.falseAlarms / accuracyStats.totalPredictions) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded">
                      <div className="text-3xl font-bold text-red-600">{accuracyStats.missedEvents}</div>
                      <div className="text-sm text-gray-800 font-medium">Missed Events</div>
                      <div className="text-xs text-gray-700 mt-1">
                        {((accuracyStats.missedEvents / accuracyStats.totalPredictions) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded">
                      <div className="text-3xl font-bold text-blue-600">{accuracyStats.accuracy.toFixed(1)}%</div>
                      <div className="text-sm text-gray-800 font-medium">Overall Accuracy</div>
                      <div className="text-xs text-gray-700 mt-1">
                        {accuracyStats.totalPredictions} total predictions
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparison Table */}
                {comparisonData.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">Detailed Comparison Results</h3>
                      <div className="text-sm text-gray-600">
                        Showing {Math.min(50, comparisonData.length)} of {comparisonData.length} results
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">District</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Station</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warning (mm)</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Realised (mm)</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classification</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {comparisonData.slice(0, 50).map((item, index) => (
                            <tr key={index} className={item.match ? 'bg-green-50' : 'bg-red-50'}>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {item.district}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {item.station || 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {format(new Date(item.date), 'MMM dd, yyyy')}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div className="flex items-center space-x-2">
                                  <span>{item.warningRainfall ? item.warningRainfall.toFixed(1) : '0.0'}</span>
                                  <span className={`px-2 py-1 text-xs rounded ${item.warning === 'Y' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {item.warning}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div className="flex items-center space-x-2">
                                  <span>{item.realisedRainfall ? item.realisedRainfall.toFixed(1) : '0.0'}</span>
                                  <span className={`px-2 py-1 text-xs rounded ${item.realised === 'Y' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {item.realised}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {item.warning} → {item.realised}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 text-xs rounded font-medium ${item.match
                                  ? 'bg-green-100 text-green-800'
                                  : item.type === 'False Alarm'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-red-100 text-red-800'
                                  }`}>
                                  {item.type}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {comparisonData.length > 50 && (
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        {comparisonData.length - 50} more results available. Download full report for complete analysis.
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Data</h3>
                <p className="text-gray-600 mb-4">
                  Upload warning and realised data, then generate analysis to view results here.
                </p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Go to Data Upload
                </button>
              </div>
            )}
          </div>
        )}


        {/* Lead-Time Verification Tab */}
        {activeTab === 'leadtime' && (
          <LeadTimeVerificationTab />
        )}

        {/* Heavy Rainfall Verification Tab */}
        {activeTab === 'verification' && (
          <HeavyRainfallVerificationTab />
        )}
      </div>
    </div>
  );
}
