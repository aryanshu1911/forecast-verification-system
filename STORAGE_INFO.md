# IMD Heavy Rainfall Verification System - Data Storage Information

## 📁 **Where Your Data is Stored**

Your Heavy Rainfall Verification System now uses a **file-based storage system** that stores all data locally on disk. This means your data is:

- ✅ **Stored as files on your computer** - No database required
- ✅ **Portable and shareable** - Copy the `/data` folder to share or backup
- ✅ **Human-readable** - JSON files can be opened in any text editor
- ✅ **Offline-first** - Works completely offline
- ✅ **Version-controllable** - Can be tracked with git if desired

---

## 🗃️ **Storage Structure**

### **Directory Hierarchy:**

```
/data
 ├── /warning
 │    └── /YYYY (e.g., 2025)
 │         └── /MM (e.g., 06 for June)
 │              ├── /D1
 │              │    ├── 01.json
 │              │    ├── 02.json
 │              │    └── ... (up to 31.json)
 │              ├── /D2
 │              ├── /D3
 │              ├── /D4
 │              └── /D5
 │
 └── /realised
      └── /YYYY (e.g., 2025)
           └── /MM (e.g., 06 for June)
                ├── 01.json
                ├── 02.json
                └── ... (up to 31.json)
```

### **File Naming Convention:**

- **Warning Data**: `/data/warning/YYYY/MM/D1-D5/DD.json`
  - Example: `/data/warning/2025/06/D3/23.json` (June 23, 2025, Day-3 forecast)

- **Realised Data**: `/data/realised/YYYY/MM/DD.json`
  - Example: `/data/realised/2025/06/23.json` (June 23, 2025, observed rainfall)

---

## 📊 **File Format**

### **Warning Data File Example:**

**Path**: `/data/warning/2025/06/D3/23.json`

```json
{
  "date": "2025-06-23",
  "leadDay": "D3",
  "districts": {
    "PUNE": 7,
    "NASHIK": 10,
    "MUMBAI": 5,
    "LATUR": null
  }
}
```

### **Realised Data File Example:**

**Path**: `/data/realised/2025/06/23.json`

```json
{
  "date": "2025-06-23",
  "districts": {
    "PUNE": 45.2,
    "NASHIK": 12.8,
    "MUMBAI": 78.5,
    "LATUR": 0.0
  }
}
```

---

## 🔧 **Data Management Features**

### **Upload System:**

The **Upload Data** tab provides:

- **Warning Data Upload (Multi-Sheet Format - Recommended)**: 
  - Upload a **single Excel file** with **5 sheets** named: `Day1`, `Day2`, `Day3`, `Day4`, `Day5`
  - Each sheet contains warning codes for that specific lead day
  - All 5 lead days are processed automatically in one upload
  - No need to select lead day - system auto-detects multi-sheet files
  
- **Warning Data Upload (Legacy Single-Sheet Format)**:
  - Upload Excel files one at a time with mandatory metadata (Year, Month, Lead Day)
  - Requires 5 separate uploads to complete all lead days (D1-D5)
  - Still supported for backward compatibility

- **Realised Data Upload**: 
  - Upload Excel files with mandatory metadata (Year, Month)
  - Single sheet format (no changes)

- **Automatic Extraction**: System automatically splits monthly data into day-wise JSON files
- **Overwrite Protection**: Uploading same date + lead day overwrites existing file

### **Expected Excel Format:**

**Multi-Sheet Warning File (Recommended):**

The Excel file should contain exactly 5 sheets named: `Day1`, `Day2`, `Day3`, `Day4`, `Day5`

Each sheet should have this structure:

```
District | 1    | 2    | 3    | ... | 30   | 31
PUNE     | 7    | 10   | 5    | ... | 0    | 0
NASHIK   | 10   | 5    | 7    | ... | 5    | 10
MUMBAI   | 5    | 7    | 10   | ... | 7    | 5
...
```

**Single-Sheet Warning/Realised Format:**

Both Warning and Realised sheets should have this structure:

```
District | 1    | 2    | 3    | ... | 30   | 31
PUNE     | 45.2 | 12.8 | 78.5 | ... | 23.1 | 0.0
NASHIK   | 67.3 | 34.2 | 12.0 | ... | 45.6 | 8.9
MUMBAI   | 89.1 | 56.7 | 34.2 | ... | 67.8 | 12.3
...
```

- **First column**: District name
- **Remaining columns**: Day numbers (1-31, depending on month)
- **Warning sheet**: Contains warning codes (integers)
- **Realised sheet**: Contains rainfall values in mm (decimals)

### **Shifted Verification Methodology:**

⚠️ **Important**: This system implements IMD's shifted verification methodology (D+1 alignment):

- Forecasts issued on Day D are verified against realised data from Day D+1, D+2, etc.
- **D1 forecast** issued on June 1 → verifies with **June 2** realised data
- **D2 forecast** issued on June 1 → verifies with **June 3** realised data
- **D3 forecast** issued on June 1 → verifies with **June 4** realised data
- **D4 forecast** issued on June 1 → verifies with **June 5** realised data
- **D5 forecast** issued on June 1 → verifies with **June 6** realised data

This ensures meteorologically correct lead-time verification as per IMD standards.

---

## 💡 **Data Portability**

### **Sharing Data:**

1. Copy the entire `/data` directory from your project folder
2. Transfer via:
   - USB drive / External hard drive
   - Cloud storage (Google Drive, Dropbox, etc.)
   - Network share
   - Email (if size permits)
3. Paste into another installation's project directory
4. Data is immediately available - no re-upload needed!

### **Backup:**

1. **Simple Backup**: Copy `/data` folder to backup location
2. **Automated Backup**: Use file sync tools (rsync, robocopy, etc.)
3. **Version Control**: Optionally track with git for change history
4. **Restore**: Copy backed-up `/data` folder back to project directory

---

## 📈 **Storage Capacity**

### **File Sizes:**

- **Single day JSON file**: ~1-5 KB (depending on number of districts)
- **One month (30 days)**: ~30-150 KB per lead day
- **One year (all lead days)**: ~1-2 MB

### **Scalability:**

- **10 years of data**: ~10-20 MB
- **No storage limits** (depends on available disk space)
- **Fast access** even with years of data

---

## 🎯 **Advantages Over Previous System**

| Feature | Old System (localStorage) | New System (File-Based) |
|---------|---------------------------|-------------------------|
| **Storage Location** | Browser localStorage | Disk files |
| **Portability** | Browser-specific | Fully portable |
| **Shareability** | Not shareable | Easy to share |
| **Backup** | Manual export required | Simple folder copy |
| **Size Limit** | ~5-10 MB | No practical limit |
| **Human-Readable** | No | Yes (JSON files) |
| **Offline Access** | Yes | Yes |
| **Multi-User** | No | Yes (via shared folder) |

---

## 🔍 **Data Access**

### **Viewing Data:**

You can inspect your stored data by:

1. **File Explorer**: Navigate to `/data` directory in project folder
2. **Text Editor**: Open any `.json` file to view contents
3. **Dashboard**: Use the application's analysis features
4. **Command Line**: Use tools like `cat`, `jq`, or `grep` to query data

### **Programmatic Access:**

The system provides a data loader API:

```typescript
import { loadWarningData, loadRealisedData } from '@/app/utils/dataLoader';

// Load warning data for a specific date and lead day
const warningData = await loadWarningData(2025, 6, 23, 'D3');

// Load realised data for a specific date
const realisedData = await loadRealisedData(2025, 6, 23);
```

---

## ⚠️ **Important Notes**

### **Data Safety:**

- **Regular Backups**: Copy `/data` folder regularly to backup location
- **Multiple Copies**: Keep copies in different locations for redundancy
- **Original Files**: Keep original Excel files as primary backup

### **File System Requirements:**

- **Permissions**: Application needs read/write access to project directory
- **Disk Space**: Ensure sufficient disk space for data storage
- **File System**: Works on Windows, macOS, and Linux

### **Migration from Old System:**

- Old localStorage data remains accessible via "Data Upload (Legacy)" tab
- New uploads use file-based storage
- Both systems can coexist
- **Recommended**: Re-upload data using new system for portability

---

## 🚀 **Getting Started**

1. Navigate to **Dashboard** → **Upload Data** tab
2. **For Warning Data (Recommended - Multi-Sheet Format)**:
   - Prepare one Excel file with 5 sheets named: `Day1`, `Day2`, `Day3`, `Day4`, `Day5`
   - Each sheet contains warning codes for all districts and days of the month
   - Upload the file with Year and Month
   - All 5 lead days will be processed automatically
3. **For Warning Data (Legacy - Single-Sheet Format)**:
   - Upload your Warning Excel file with Year, Month, and Lead Day
   - Repeat for each lead day (D1-D5) - requires 5 uploads
4. **For Realised Data**:
   - Upload your Realised Excel file with Year and Month
   - Single sheet format (no changes)
5. Data is automatically extracted and stored as day-wise JSON files
6. Use the analysis tabs to verify and analyze your data

**Note**: The system uses IMD's shifted verification methodology (D+1 alignment) for all verification calculations.

---

## 📞 **Support**

For questions or issues:
- Check the upload instructions panel in the Upload Data tab
- Review the walkthrough documentation
- Ensure Excel files match the expected format
- Verify file permissions in the project directory

---

**Last Updated**: January 2026  
**System Version**: 3.0 (Multi-Sheet Support + Shifted Verification Logic)

