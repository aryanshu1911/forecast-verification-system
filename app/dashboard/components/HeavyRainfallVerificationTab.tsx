'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface SkillScores {
  POD: number;
  FAR: number;
  CSI: number;
  Bias: number;
  H: number;
  M: number;
  F: number;
  CN: number;
  Total: number;
}

interface LeadTimeData {
  scores: SkillScores;
  count: number;
}

interface DistrictWiseData {
  [district: string]: SkillScores;
}

interface OverviewResults {
  success: boolean;
  threshold: number;
  start_date: string;
  end_date: string;
  lead_times: {
    [key: string]: LeadTimeData;
  };
}

interface DetailedResults {
  success: boolean;
  threshold: number;
  start_date: string;
  end_date: string;
  selectedDay: string;
  district_wise: DistrictWiseData;
}

export default function HeavyRainfallVerificationTab() {
  const [startDate, setStartDate] = useState<string>('2025-06-01');
  const [endDate, setEndDate] = useState<string>('2025-06-30');
  const [isLoading, setIsLoading] = useState(false);
  const [overviewResults, setOverviewResults] = useState<OverviewResults | null>(null);
  const [detailedResults, setDetailedResults] = useState<DetailedResults | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const runVerification = async () => {
    setIsLoading(true);
    setSelectedDay(null);
    setDetailedResults(null);
    
    try {
      const response = await fetch('/api/verification/heavy-rainfall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate
        })
      });

      const result = await response.json();

      if (result.success) {
        setOverviewResults(result);
        toast.success('Verification completed successfully!');
      } else {
        toast.error(result.error || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error('Failed to run verification: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDayDetails = async (day: string) => {
    setIsLoading(true);
    setSelectedDay(day);
    
    try {
      const response = await fetch('/api/verification/heavy-rainfall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          selectedDay: day
        })
      });

      const result = await response.json();

      if (result.success) {
        setDetailedResults(result);
        toast.success(`Loaded ${day} details`);
      } else {
        toast.error(result.error || 'Failed to load details');
      }
    } catch (error: any) {
      console.error('Detail load error:', error);
      toast.error('Failed to load details: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (value: number, metric: string) => {
    if (metric === 'FAR') {
      if (value <= 0.3) return 'text-green-600';
      if (value <= 0.5) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value >= 0.7) return 'text-green-600';
      if (value >= 0.5) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const getAccuracyBadge = (accuracy: number) => {
    if (accuracy >= 0.8) return 'bg-green-100 text-green-800';
    if (accuracy >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getDayNumber = (leadTime: string) => {
    return leadTime.replace('Day-', '');
  };

  const getDayCode = (dayNumber: string) => {
    return `D${dayNumber}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Heavy Rainfall Verification System
        </h2>
        <p className="text-gray-600 mb-6">
          Day-wise verification analysis with district-level drill-down
        </p>

        {/* Configuration Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
        </div>

        {/* Run Button */}
        <button
          onClick={runVerification}
          disabled={isLoading}
          className={`px-6 py-3 rounded-md font-medium ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? 'Running Verification...' : 'Run Heavy Rainfall Verification'}
        </button>
      </div>

      {/* Overview: Day Cards */}
      {overviewResults && !selectedDay && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Verification Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Threshold:</span>
                <span className="ml-2 font-semibold text-gray-900">{overviewResults.threshold}mm</span>
              </div>
              <div>
                <span className="text-gray-600">Date Range:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {format(new Date(overviewResults.start_date), 'MMM dd')} - {format(new Date(overviewResults.end_date), 'MMM dd, yyyy')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Lead Times:</span>
                <span className="ml-2 font-semibold text-gray-900">Day 1 to Day 5</span>
              </div>
              <div>
                <span className="text-gray-600">Mode:</span>
                <span className="ml-2 font-semibold text-gray-900">Overview</span>
              </div>
            </div>
          </div>

          {/* Overview Table with Download */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Day-Wise Verification Summary</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Click any day row for detailed district-wise analysis
                  </p>
                </div>
                <button
                  onClick={() => {
                    try {
                      const excelData: any[][] = [];
                      
                      // Title
                      excelData.push(['Heavy Rainfall Verification - Overview']);
                      
                      // Date Range
                      excelData.push([`Date Range: ${startDate} to ${endDate}`]);
                      
                      // Empty row
                      excelData.push([]);
                      
                      // Headers
                      excelData.push(['Day', 'Hit', 'Miss', 'False Alarm', 'CN', 'POD', 'CSI', 'FAR', 'BIAS']);
                      
                      // Data rows
                      Object.entries(overviewResults.lead_times).forEach(([leadTime, data]) => {
                        const dayNum = getDayNumber(leadTime);
                        excelData.push([
                          `Day ${dayNum}`,
                          data.scores.H,
                          data.scores.M,
                          data.scores.F,
                          data.scores.CN,
                          data.scores.POD.toFixed(3),
                          data.scores.CSI.toFixed(3),
                          data.scores.FAR.toFixed(3),
                          data.scores.Bias.toFixed(3)
                        ]);
                      });
                      
                      // Create worksheet
                      const ws = XLSX.utils.aoa_to_sheet(excelData);
                      
                      // Create workbook
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, 'Overview');
                      
                      // Generate filename
                      const filename = `HeavyRainfall_Overview_${startDate}_to_${endDate}.xlsx`;
                      
                      // Download
                      XLSX.writeFile(wb, filename);
                      toast.success('Downloaded overview table');
                    } catch (error: any) {
                      console.error('Export error:', error);
                      toast.error('Failed to export table');
                    }
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center gap-2 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Excel
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hit</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Miss</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">False Alarm</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CN</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">POD</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CSI</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">FAR</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">BIAS</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(overviewResults.lead_times).map(([leadTime, data]) => {
                    const dayNum = getDayNumber(leadTime);
                    const dayCode = getDayCode(dayNum);
                    
                    return (
                      <tr 
                        key={leadTime} 
                        onClick={() => loadDayDetails(dayCode)}
                        className="hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          Day {dayNum}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600 font-semibold">
                          {data.scores.H}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-600 font-semibold">
                          {data.scores.M}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-orange-600 font-semibold">
                          {data.scores.F}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-600 font-semibold">
                          {data.scores.CN}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-semibold ${getScoreColor(data.scores.POD, 'POD')}`}>
                          {data.scores.POD.toFixed(3)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-semibold ${getScoreColor(data.scores.CSI, 'CSI')}`}>
                          {data.scores.CSI.toFixed(3)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-semibold ${getScoreColor(data.scores.FAR, 'FAR')}`}>
                          {data.scores.FAR.toFixed(3)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-700">
                          {data.scores.Bias.toFixed(3)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Contingency Table Legend:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center">
                <span className="font-semibold text-green-600 mr-2">H:</span>
                <span className="text-gray-600">Hits (Forecast YES, Observed YES)</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold text-red-600 mr-2">M:</span>
                <span className="text-gray-600">Misses (Forecast NO, Observed YES)</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold text-orange-600 mr-2">F:</span>
                <span className="text-gray-600">False Alarms (Forecast YES, Observed NO)</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold text-blue-600 mr-2">CN:</span>
                <span className="text-gray-600">Correct Negatives (Forecast NO, Observed NO)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed View: District-Wise Table */}
      {detailedResults && selectedDay && (
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={() => {
              setSelectedDay(null);
              setDetailedResults(null);
            }}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Overview
          </button>

          {/* Detailed Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {selectedDay} Verification - District-Wise Analysis
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Selected Day:</span>
                <span className="ml-2 font-semibold text-gray-900">{selectedDay}</span>
              </div>
              <div>
                <span className="text-gray-600">Date Range:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {format(new Date(detailedResults.start_date), 'MMM dd')} - {format(new Date(detailedResults.end_date), 'MMM dd, yyyy')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Threshold:</span>
                <span className="ml-2 font-semibold text-gray-900">{detailedResults.threshold}mm</span>
              </div>
              <div>
                <span className="text-gray-600">Districts:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {Object.keys(detailedResults.district_wise).length}
                </span>
              </div>
            </div>
          </div>

          {/* District Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">District-Wise Statistics</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Month-long verification for {selectedDay} across all districts
                  </p>
                </div>
                <button
                  onClick={() => {
                    try {
                      const excelData: any[][] = [];
                      
                      // Title
                      excelData.push([`Heavy Rainfall Verification - ${selectedDay}`]);
                      
                      // Date Range
                      excelData.push([`Date Range: ${startDate} to ${endDate}`]);
                      
                      // Empty row
                      excelData.push([]);
                      
                      // Headers
                      excelData.push(['District', 'Hit', 'Miss', 'False Alarm', 'CN', 'POD', 'CSI', 'FAR', 'BIAS']);
                      
                      // Data rows
                      Object.entries(detailedResults.district_wise)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .forEach(([district, scores]) => {
                          excelData.push([
                            district,
                            scores.H,
                            scores.M,
                            scores.F,
                            scores.CN,
                            scores.POD.toFixed(3),
                            scores.CSI.toFixed(3),
                            scores.FAR.toFixed(3),
                            scores.Bias.toFixed(3)
                          ]);
                        });
                      
                      // Create worksheet
                      const ws = XLSX.utils.aoa_to_sheet(excelData);
                      
                      // Create workbook
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, selectedDay);
                      
                      // Generate filename
                      const filename = `HeavyRainfall_${selectedDay}_${startDate}_to_${endDate}.xlsx`;
                      
                      // Download
                      XLSX.writeFile(wb, filename);
                      toast.success(`Downloaded ${selectedDay} verification table`);
                    } catch (error: any) {
                      console.error('Export error:', error);
                      toast.error('Failed to export table');
                    }
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center gap-2 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Excel
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hit</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Miss</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">False Alarm</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CN</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">POD</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CSI</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">FAR</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">BIAS</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(detailedResults.district_wise)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([district, scores]) => (
                      <tr key={district} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {district}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600 font-semibold">
                          {scores.H}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-600 font-semibold">
                          {scores.M}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-orange-600 font-semibold">
                          {scores.F}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-600 font-semibold">
                          {scores.CN}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-semibold ${getScoreColor(scores.POD, 'POD')}`}>
                          {scores.POD.toFixed(3)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-semibold ${getScoreColor(scores.CSI, 'CSI')}`}>
                          {scores.CSI.toFixed(3)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-semibold ${getScoreColor(scores.FAR, 'FAR')}`}>
                          {scores.FAR.toFixed(3)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-700">
                          {scores.Bias.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* No Results State */}
      {!overviewResults && !isLoading && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-600 text-lg">Configure parameters and run verification to see results</p>
          <p className="text-gray-500 text-sm mt-2">Click any day card to view detailed district-wise analysis</p>
        </div>
      )}
    </div>
  );
}
