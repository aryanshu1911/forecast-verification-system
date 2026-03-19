'use client';

import React, { useState } from 'react';

interface DistrictVerification {
  district: string;
  date: string;
  forecastCode: number | null;
  forecastClassification: string;
  realisedRainfall: number | null;
  realisedClassification: string;
  match: boolean;
  type: 'Correct' | 'False Alarm' | 'Missed Event' | 'Correct Non-Event';
}

interface TableStatistics {
  hits: number;
  misses: number;
  falseAlarms: number;
  correctNegatives: number;
  total: number;
  accuracy: number;
}

interface LeadTimeTableData {
  verifications: DistrictVerification[];
  statistics: TableStatistics;
}

interface DateVerificationViewProps {
  selectedDate: string;
  overall: LeadTimeTableData;
  day1: LeadTimeTableData;
  day2: LeadTimeTableData;
  day3: LeadTimeTableData;
  day4: LeadTimeTableData;
  day5: LeadTimeTableData;
}

export default function DateVerificationView({
  selectedDate,
  overall,
  day1,
  day2,
  day3,
  day4,
  day5
}: DateVerificationViewProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('overall');
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderVerificationTable = (
    id: string,
    title: string,
    data: LeadTimeTableData
  ) => {
    const isExpanded = expandedSection === id;

    if (!data || !data.verifications || data.verifications.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden opacity-60">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center cursor-not-allowed">
            <h3 className="text-lg font-semibold text-gray-500">{title}</h3>
            <span className="text-sm text-gray-400 font-medium">No Data Available</span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200">
        {/* Accordion Header */}
        <button 
          onClick={() => setExpandedSection(isExpanded ? null : id)}
          className={`w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors border-b ${
            isExpanded ? 'bg-blue-50/50 border-blue-100' : 'bg-white'
          }`}
        >
          <div className="flex items-center gap-4">
            <h3 className={`text-lg font-bold ${isExpanded ? 'text-blue-700' : 'text-gray-800'}`}>
              {title}
            </h3>
            {!isExpanded && (
              <div className="hidden md:flex items-center gap-3">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                  {data.statistics.accuracy.toFixed(1)}% Accuracy
                </span>
                <span className="text-xs text-gray-500">
                  {data.statistics.hits} Hits • {data.statistics.misses} Misses
                </span>
              </div>
            )}
          </div>
          <svg 
            className={`w-6 h-6 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-blue-500' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isExpanded && (
          <div className="p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="text-sm text-gray-900 font-medium">
                Detailed metrics and district-wise results
              </div>
              <div className="text-lg font-semibold text-blue-700">
                Overall Accuracy: {data.statistics.accuracy.toFixed(1)}%
              </div>
            </div>

            {/* Statistics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-700">{data.statistics.hits}</div>
                <div className="text-xs font-bold text-green-600 uppercase tracking-wider">Hits</div>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-700">{data.statistics.misses}</div>
                <div className="text-xs font-bold text-red-600 uppercase tracking-wider">Misses</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-700">{data.statistics.falseAlarms}</div>
                <div className="text-xs font-bold text-yellow-600 uppercase tracking-wider">False Alarms</div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-700">{data.statistics.correctNegatives}</div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Correct Negatives</div>
              </div>
            </div>

            {/* Verification Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-100 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">District</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Forecast</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Observed (mm)</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Outcome</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.verifications.map((verification, index) => (
                    <tr key={`${verification.district}-${index}`} className="hover:bg-gray-50 text-sm transition-colors text-black font-medium">
                      <td className="px-4 py-3 font-bold text-black">{verification.district}</td>
                      <td className="px-4 py-3 text-black font-semibold">{verification.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded font-black text-xs ${
                            verification.forecastClassification === 'XH' ? 'bg-red-900 text-white shadow-sm' :
                            verification.forecastClassification === 'VH' ? 'bg-red-600 text-white shadow-sm' :
                            verification.forecastClassification === 'H' ? 'bg-orange-600 text-white shadow-sm' :
                            'bg-blue-100 text-blue-900 border border-blue-200'
                          }`}>
                            {verification.forecastClassification}
                          </span>
                          {verification.forecastCode !== null && (
                            <span className="text-xs text-black font-black">({verification.forecastCode})</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-black">
                        {verification.realisedRainfall !== null ? verification.realisedRainfall.toFixed(1) : 'N/A'}
                        <span className="ml-1 text-xs text-gray-900 font-bold">({verification.realisedClassification})</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          verification.type === 'Correct' ? 'bg-green-100 text-green-800 border-green-200' :
                          verification.type === 'False Alarm' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          verification.type === 'Missed Event' ? 'bg-red-100 text-red-800 border-red-200' :
                          'bg-blue-100 text-blue-800 border-blue-200'
                        }`}>
                          {verification.type === 'Correct' ? '✓ Correct' :
                           verification.type === 'False Alarm' ? '⚠ False Alarm' :
                           verification.type === 'Missed Event' ? '✗ Missed' :
                           '○ Correct Non-Event'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-xl shadow-lg p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black mb-1">
              Verification Results
            </h2>
            <p className="text-blue-100 font-medium">
              {formatDate(selectedDate)} • All Forecast Lead Times
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20">
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">Selected Mode:</span>
            <div className="text-sm font-black">Lead-Time Analysis (Accordion View)</div>
          </div>
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="flex flex-col gap-4">
        {renderVerificationTable('overall', 'Overall Verification (All Lead Times)', overall)}
        {renderVerificationTable('day1', 'Day-1 Forecast (Issued on Date)', day1)}
        {renderVerificationTable('day2', 'Day-2 Forecast (Issued 1 Day Before)', day2)}
        {renderVerificationTable('day3', 'Day-3 Forecast (Issued 2 Days Before)', day3)}
        {renderVerificationTable('day4', 'Day-4 Forecast (Issued 3 Days Before)', day4)}
        {renderVerificationTable('day5', 'Day-5 Forecast (Issued 4 Days Before)', day5)}
      </div>

      {/* Legend Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h4 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">Verification Outcome Key</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold">✓</span>
            <div>
              <div className="text-sm font-bold text-green-900">Hit / Correct</div>
              <div className="text-[10px] text-green-700 leading-tight">Rainfall matches forecast intensity category</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-700 font-bold">✗</span>
            <div>
              <div className="text-sm font-bold text-red-900">Missed Event</div>
              <div className="text-[10px] text-red-700 leading-tight">Heavy rain observed but not forecasted</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-700 font-bold">⚠</span>
            <div>
              <div className="text-sm font-bold text-yellow-900">False Alarm</div>
              <div className="text-[10px] text-yellow-700 leading-tight">Heavy rain forecasted but not observed</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">○</span>
            <div>
              <div className="text-sm font-bold text-blue-900">Correct Negative</div>
              <div className="text-[10px] text-blue-700 leading-tight">Low rain correctly forecasted & observed</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
