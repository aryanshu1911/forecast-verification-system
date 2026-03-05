# IMD Mumbai - Rainfall Forecast Verification & Analysis Dashboard

## 🌧️ Project Overview

This is a professional-grade web application designed for the Indian Meteorological Department (IMD) Mumbai Regional Centre to upload, analyze, compare, and report district-wise rainfall forecasts against actual observed rainfall data.

## ✨ Key Features

### 🔐 Authentication
- **Fixed Credentials**: `imd_mumbai` / `imd@mumbai`
- Simple, secure login interface

### 📊 Data Processing
- **Warning Data**: Upload 5-day rolling forecasts (Excel/CSV)
- **Realised Data**: Upload previous day's observed rainfall (Excel/CSV)
- **Smart Classification**: Automatic rainfall classification (>64.5mm = Y, ≤64.5mm = N)

### 📈 Analysis & Verification
- **Forecast Accuracy**: Calculate overall and district-wise accuracy
- **Performance Metrics**:
  - Correct Predictions (Y-Y, N-N)
  - False Alarms (Y-N)
  - Missed Events (N-Y)
  - Hit Rate and False Alarm Rate

### 📅 Calendar Interface
- **5-Day View**: Visual comparison of warning vs realised data
- **Historical Analysis**: Show data only for previous days (not current/future)
- **Day-wise Accuracy**: Performance tracking per date

### 📑 Professional Reports
- **Word Documents**: Generate official IMD-style reports
- **Comprehensive Analysis**: Statistics, tables, and conclusions
- **Automatic Download**: One-click report generation

### 🎨 Professional UI
- **Meteorological Design**: Clean, data-first interface
- **Government Standard**: Professional appearance suitable for official use
- **No AI Styling**: Simple, functional design without flashy animations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Modern web browser

### Installation
1. Clone/extract the project
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000)

### First Login
- **Username**: `imd_mumbai`
- **Password**: `imd@mumbai`

## 📁 File Upload Format

### Warning (Forecast) Data
**Required Columns:**
- `District`: District name
- `Day1_Date`, `Day1_Rainfall_mm`: Day 1 forecast
- `Day2_Date`, `Day2_Rainfall_mm`: Day 2 forecast
- `Day3_Date`, `Day3_Rainfall_mm`: Day 3 forecast
- `Day4_Date`, `Day4_Rainfall_mm`: Day 4 forecast
- `Day5_Date`, `Day5_Rainfall_mm`: Day 5 forecast

### Realised (Observed) Data  
**Required Columns:**
- `District`: District name (must match warning data)
- `Date`: Observation date (YYYY-MM-DD)
- `Rainfall_mm`: Actual rainfall in millimeters

### Sample Files
Check the `sample-files/` folder for:
- `sample_warning_data.csv`
- `sample_realised_data.csv`
- `README.md` (detailed format guide)

## 🏛️ Maharashtra Districts Covered
36 districts including Mumbai City, Mumbai Suburban, Thane, Pune, Nashik, Nagpur, Aurangabad, and all other Maharashtra districts.

## 📋 Usage Workflow

1. **Login** with IMD credentials
2. **Upload Files**:
   - Daily 5-day forecast (Warning data)
   - Previous day's observations (Realised data)
3. **Generate Analysis** to compare forecasts vs observations
4. **View Results** in:
   - Statistics dashboard
   - Detailed comparison table
   - Calendar view
5. **Download Reports** in Word format for official documentation

## 🔧 Technical Features

### Built With
- **Next.js 16**: React framework
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Professional styling
- **date-fns**: Date manipulation
- **docx**: Word document generation
- **react-hot-toast**: User notifications

### Data Storage
- **Local Processing**: No database required
- **Client-side Analysis**: All processing happens in browser
- **File-based Workflow**: Upload → Process → Analyze → Report

### Security
- Simple authentication for internal use
- Local data processing (no external servers)
- Government-appropriate security measures

## 🎯 Classification Logic

**Rainfall Classification:**
- **Significant (Y)**: > 64.5 mm
- **Not Significant (N)**: ≤ 64.5 mm

**Verification Categories:**
- **Correct**: Forecast matches observation (Y-Y or N-N)
- **False Alarm**: Rain predicted but not observed (Y-N)
- **Missed Event**: Rain occurred but not predicted (N-Y)

## 📊 Report Features

Generated reports include:
- Executive summary
- Verification statistics table
- District-wise performance analysis
- Detailed methodology explanation
- Conclusions and recommendations
- Professional IMD formatting

## 🖥️ System Requirements

- **Browser**: Chrome, Firefox, Safari, Edge (latest versions)
- **Screen Resolution**: 1024x768 minimum
- **JavaScript**: Must be enabled
- **File Uploads**: Excel (.xlsx) and CSV (.csv) support

## 📞 Support

This system is designed for internal IMD Mumbai use. For technical support or feature requests, contact the development team.

---

**© 2024 Indian Meteorological Department, Mumbai Regional Centre**  
*Government of India - Ministry of Earth Sciences*
