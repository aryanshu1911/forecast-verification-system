'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'react-hot-toast';
import { useRainfallConfig } from '@/app/utils/useRainfallConfig';
import { MONTHLY_RAINFALL_CATEGORIES } from '@/app/utils/rainfallColors';

// Dynamically import the map component to avoid SSR issues with Leaflet
const MapVisualization = dynamic(() => import('@/app/dashboard/components/MapVisualization'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

interface DistrictRainfall {
  district: string;
  rainfall: number;
}

export default function MapAnalysisTab() {
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [rainfallData, setRainfallData] = useState<DistrictRainfall[]>([]);
  const [metric, setMetric] = useState<'rainfall' | 'pod' | 'far' | 'bias' | 'csi' | 'subdivision'>('rainfall');
  const [metricData, setMetricData] = useState<Record<string, any>>({});
  const [leadDay, setLeadDay] = useState<string>('D1');
  const [isLoading, setIsLoading] = useState(false);
  const [classificationMode, setClassificationMode] = useState<'dual' | 'multi'>('multi');
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);
  const { config } = useRainfallConfig();

  // Set default date to today
  useEffect(() => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    
    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(monthStr);
  }, []);

  // Fetch data when parameters change
  useEffect(() => {
    if (metric === 'rainfall') {
      if (viewMode === 'daily' && selectedDate) {
        fetchRainfallData('daily', selectedDate);
      } else if (viewMode === 'monthly' && selectedMonth) {
        fetchRainfallData('monthly', selectedMonth);
      }
    } else if (metric !== 'subdivision') {
      const range = getRangeForFetch();
      if (range) {
        fetchMetricData(range.start, range.end, leadDay);
      }
    }
  }, [viewMode, selectedDate, selectedMonth, metric, leadDay]);

  const getRangeForFetch = () => {
    if (viewMode === 'daily' && selectedDate) {
      return { start: selectedDate, end: selectedDate };
    } else if (viewMode === 'monthly' && selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      return { 
        start: `${selectedMonth}-01`, 
        end: `${selectedMonth}-${String(lastDay).padStart(2, '0')}` 
      };
    }
    return null;
  };

  // Fetch current classification mode on mount
  useEffect(() => {
    const fetchClassificationMode = async () => {
      try {
        const response = await fetch('/api/rainfall-mode');
        const data = await response.json();
        if (response.ok && data.mode) {
          setClassificationMode(data.mode);
        }
      } catch (error) {
        console.error('Error fetching classification mode:', error);
      }
    };
    fetchClassificationMode();
  }, []);

  const fetchRainfallData = async (view: 'daily' | 'monthly', value: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        view,
        [view === 'daily' ? 'date' : 'month']: value,
      });

      const response = await fetch(`/api/rainfall-data?${params}`);
      const result = await response.json();

      if (response.ok) {
        setRainfallData(result.data || []);
      } else {
        toast.error(result.error || 'Failed to fetch rainfall data');
        setRainfallData([]);
      }
    } catch (error: any) {
      console.error('Error fetching rainfall data:', error);
      toast.error('Failed to load rainfall data');
      setRainfallData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetricData = async (startDate: string, endDate: string, leadDay: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate, leadDay });
      const response = await fetch(`/api/map-metrics?${params}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setMetricData(result.districts || {});
      } else {
        toast.error(result.error || 'Failed to fetch verification metrics');
        setMetricData({});
      }
    } catch (error: any) {
      console.error('Error fetching metric data:', error);
      toast.error('Failed to load verification metrics');
      setMetricData({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewModeChange = (mode: 'daily' | 'monthly') => {
    setViewMode(mode);
    setRainfallData([]);
    setMetricData({});
  };

  const handleClassificationModeChange = async (mode: 'dual' | 'multi') => {
    if (mode === classificationMode) return;
    
    setIsSwitchingMode(true);
    try {
      const response = await fetch('/api/rainfall-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });

      const result = await response.json();

      if (response.ok) {
        setClassificationMode(mode);
        toast.success(`Switched to ${mode === 'dual' ? 'Dual' : 'Multi'} classification mode`);
        
        // Refresh data
        if (metric === 'rainfall') {
          if (viewMode === 'daily' && selectedDate) {
            fetchRainfallData('daily', selectedDate);
          } else if (viewMode === 'monthly' && selectedMonth) {
            fetchRainfallData('monthly', selectedMonth);
          }
        }
      } else {
        toast.error(result.error || 'Failed to switch classification mode');
      }
    } catch (error: any) {
      console.error('Error switching classification mode:', error);
      toast.error('Failed to switch classification mode');
    } finally {
      setIsSwitchingMode(false);
    }
  };

  const renderLegend = () => {
    if (metric === 'rainfall') {
      if (viewMode === 'monthly') {
        return (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {MONTHLY_RAINFALL_CATEGORIES.map((cat) => (
              <div key={cat.name} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: cat.color }}></div>
                <div>
                  <div className="text-sm font-bold text-black">{cat.name}</div>
                  <div className="text-xs text-gray-900 font-semibold">
                    {cat.max === null ? `> ${cat.min} mm` : `${cat.min}-${cat.max} mm`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      }

      if (!config) return null;
      
      let categories = [];
      if (config.mode === 'dual') {
        categories = [
          { name: config.classifications.dual.labels.below, color: '#FFFFE0', range: `< ${config.classifications.dual.threshold} mm` },
          { name: config.classifications.dual.labels.above, color: '#FFA500', range: `>= ${config.classifications.dual.threshold} mm` }
        ];
      } else {
        categories = config.classifications.multi.items
          .filter(item => item.enabled)
          .sort((a, b) => a.order - b.order)
          .map(item => {
            let color = '#FFFFE0';
            if (item.variableName === 'XH') color = '#8B0000';
            else if (item.variableName === 'VH') color = '#FF0000';
            else if (item.variableName === 'H') color = '#FFA500';
            
            // Find next threshold for range
            const nextItem = config.classifications.multi.items
              .filter(i => i.enabled && i.thresholdMm > item.thresholdMm)
              .sort((a, b) => a.thresholdMm - b.thresholdMm)[0];
              
            const range = nextItem 
              ? `${item.thresholdMm}-${nextItem.thresholdMm - 0.1} mm`
              : `>= ${item.thresholdMm} mm`;
              
            return { name: item.label, color, range };
          });
      }

      return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded border border-gray-300 bg-[#D3D3D3]"></div>
            <div>
              <div className="text-sm font-bold text-black">No Rainfall</div>
              <div className="text-xs text-gray-900 font-semibold">0 mm</div>
            </div>
          </div>
          {categories.map((cat) => (
            <div key={cat.name} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: cat.color }}></div>
              <div>
                <div className="text-sm font-bold text-black">{cat.name}</div>
                <div className="text-xs text-gray-900 font-semibold">{cat.range}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (metric === 'subdivision') {
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Konkan', color: '#6366f1' },
            { name: 'S. Madhya MH', color: '#10b981' },
            { name: 'N. Madhya MH', color: '#f59e0b' },
            { name: 'Marathwada', color: '#ef4444' }
          ].map(sub => (
            <div key={sub.name} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: sub.color }}></div>
              <div className="text-sm font-medium text-gray-900">{sub.name}</div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-24 h-4 bg-gradient-to-r from-[#f0fdf4] via-[#22c55e] to-[#166534] rounded"></div>
          <span className="text-xs text-gray-600">Low to High Score</span>
        </div>
        <p className="text-xs text-gray-500 italic">Districts with no data are shown in gray.</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Map Analysis</h2>
        <p className="text-gray-600">
          Visualize district-wise rainfall and meteorological verification factors
        </p>
      </div>

      {/* Controls Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Selection */}
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Time & Mode Selection</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-black uppercase mb-2">View Mode</label>
              <select 
                value={viewMode} 
                onChange={(e) => handleViewModeChange(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-400 rounded-md text-sm text-black font-semibold"
              >
                <option value="daily">Daily View</option>
                <option value="monthly">Monthly View</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-black uppercase mb-2">Classification</label>
              <select 
                value={classificationMode} 
                onChange={(e) => handleClassificationModeChange(e.target.value as any)}
                disabled={isSwitchingMode}
                className="w-full px-3 py-2 border border-gray-400 rounded-md text-sm text-black font-semibold"
              >
                <option value="dual">Dual Mode (L/H)</option>
                <option value="multi">Multi Mode (L/H/VH/XH)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-black uppercase mb-2">
              {viewMode === 'daily' ? 'Select Date' : 'Select Month'}
            </label>
            {viewMode === 'daily' ? (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded-md text-sm text-black font-semibold"
              />
            ) : (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded-md text-sm text-black font-semibold"
              />
            )}
          </div>
        </div>

        {/* Metric Selection */}
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Metric Selection</h3>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Active Metric</label>
            <div className="grid grid-cols-3 gap-2">
              {['rainfall', 'pod', 'far', 'bias', 'csi', 'subdivision'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m as any)}
                  className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors ${
                    metric === m 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {metric !== 'rainfall' && metric !== 'subdivision' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Lead Time</label>
              <div className="flex gap-2">
                {['D1', 'D2', 'D3', 'D4', 'D5'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setLeadDay(d)}
                    className={`flex-1 py-2 text-xs font-medium rounded-md border transition-colors ${
                      leadDay === d 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-sm text-blue-800">
          {metric === 'rainfall' ? (
            viewMode === 'daily' 
              ? `Displaying actual rainfall recorded on ${selectedDate}.`
              : `Displaying total accumulated rainfall for ${selectedMonth}. Hover for max rainfall date.`
          ) : metric === 'subdivision' ? (
            "Displaying districts grouped by IMD Meteorological Subdivisions."
          ) : (
            `Displaying ${metric.toUpperCase()} verification scores for ${leadDay} forecasts over the selected period.`
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <MapVisualization 
          rainfallData={rainfallData} 
          viewMode={viewMode}
          selectedDate={selectedDate}
          selectedMonth={selectedMonth}
          metric={metric}
          metricData={metricData}
        />
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {metric === 'rainfall' ? 'Rainfall Classification Legend' : 'Map Legend'}
        </h3>
        {renderLegend()}
      </div>
    </div>
  );
}

