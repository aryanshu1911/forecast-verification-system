# Maharashtra Rainfall Analysis - Documentation

This document provides a comprehensive technical overview and operational guide for the Maharashtra Rainfall Forecast Verification System.

## 1. How to Run the Project

The application is built using **Next.js 14** with the App Router.

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation & Execution
1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Run Development Server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

3. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 2. Credentials for Admins and Login

The application uses a simple, secure authentication mechanism for officials.

- **Username**: `imd_mumbai`
- **Password**: `imd@mumbai`

*Note: Authentication is handled in `app/login/page.tsx`. Upon successful login, an `auth_token` cookie is set, allowing access to the dashboard and administration panels.*

---

## 3. Core Logic and Technical Architecture

### A. Forecast Codes and Classifications
The system maps IMD numeric warning codes to qualitative classifications (`L`, `H`, `VH`, `XH`).
- **Location**: `app/utils/rainfallConfig.ts`
- **Logic**:
  - **Dual Mode**: Binary classification (Below 64.5mm = L, Above = H).
  - **Multi Mode**: Categorizes into Low (L), Heavy (H), Very Heavy (VH), and Extremely Heavy (XH) based on IMD data codes (e.g., Codes 5, 27 are H; Codes 26, 35 are XH).

### B. Shifted Verification (D+1) Logic
Verification follows the IMD methodology where a forecast issued on day **D** is verified against the actual rainfall recorded on day **D+1** (08:30 IST).
- **Location**: `app/utils/dateUtils.ts` and `app/utils/comparisonEngine.ts`
- **Formula**: `calculateVerificationDate(issueDate) => issueDate + 1 day`.

### C. Skill Score Formulas (POD, FAR, CSI, Bias)
Mathematical verification of forecast accuracy using contingency tables (Hits, Misses, False Alarms, Correct Negatives).
- **Location**: `app/utils/comparisonEngine.ts` (`calculateAccuracy` function)
- **Formulas**:
  - **POD (Probability of Detection)**: `Hits / (Hits + Misses)`
  - **FAR (False Alarm Ratio)**: `False Alarms / (Hits + False Alarms)`
  - **CSI (Critical Success Index)**: `Hits / (Hits + Misses + False Alarms)`
  - **Bias**: `(Hits + False Alarms) / (Hits + Misses)`

### D. Monthly Rainfall Accumulation
Maps can show monthly accumulated totals rather than daily peaks.
- **Location**: `app/api/rainfall-data/route.ts`
- **Logic**: Iterates through all daily JSON files in the month's directory, summing rainfall per district and tracking the maximum daily value/date for tooltips.

### E. District Normalization and States
Handles inconsistent district names (e.g., "Mumbai City" vs "MUMBAI") to ensure map synchronization.
- **Location**: `app/utils/rainfallColors.ts` (`normalizeDistrictName` function).
- **Subdivisions**: Grouping logic for Konkan, Madhya Maharashtra, Marathwada, and Vidarbha is located in `app/dashboard/components/AnalysisTab.tsx`.

---

## 4. Troubleshooting and Logic Implementation
- **Hit Determination in Multi-Mode**: To maintain compatibility with binary skill scores, the logic treats *any* "Heavy" forecast (H, VH, or XH) as a hit if the observed rainfall was also in *any* "Heavy" category (even if they don't match exactly).
- **State Colors**: Controlled dynamically by `app/utils/rainfallColors.ts` based on current classification thresholds.
