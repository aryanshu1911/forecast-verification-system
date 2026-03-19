import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  getRainfallColorDynamic, 
  getRainfallCategoryDynamic, 
  getMonthlyRainfallColor,
  getMonthlyRainfallCategory,
  normalizeDistrictName, 
  findDistrictColumn 
} from '@/app/utils/rainfallColors';
import { useRainfallConfig } from '@/app/utils/useRainfallConfig';

interface DistrictRainfall {
  district: string;
  rainfall: number;
  maxRainfallDate?: string;
  maxRainfallValue?: number;
}

interface MapVisualizationProps {
  rainfallData: DistrictRainfall[];
  viewMode: 'daily' | 'monthly';
  selectedDate: string;
  selectedMonth: string;
  metric?: 'rainfall' | 'pod' | 'far' | 'bias' | 'csi' | 'subdivision';
  metricData?: Record<string, any>;
}

// Maharashtra Meteorological Subdivisions
const MAHARASHTRA_SUBDIVISIONS = [
  {
    name: 'Konkan',
    color: '#6366f1',
    cities: ['MUMBAI', 'MUMBAI SUBURBAN', 'THANE', 'PALGHAR', 'RAIGAD', 'RATNAGIRI', 'SINDHUDURG']
  },
  {
    name: 'South Madhya Maharashtra',
    color: '#10b981',
    cities: ['PUNE', 'SATARA', 'SANGLI', 'KOLHAPUR', 'SOLAPUR']
  },
  {
    name: 'North Madhya Maharashtra',
    color: '#f59e0b',
    cities: ['NASHIK', 'DHULE', 'JALGAON', 'NANDURBAR', 'AHMEDNAGAR']
  },
  {
    name: 'Marathwada',
    color: '#ef4444',
    cities: ['CHHATRAPATI SAMBHAJI NAGAR', 'AURANGABAD', 'JALNA', 'BEED', 'LATUR', 'OSMANABAD', 'NANDED', 'HINGOLI', 'PARBHANI']
  }
];

// Component to fit bounds when data changes
function FitBounds({ geoJsonData }: { geoJsonData: any }) {
  const map = useMap();

  useEffect(() => {
    if (geoJsonData) {
      const geoJsonLayer = L.geoJSON(geoJsonData);
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [geoJsonData, map]);

  return null;
}

export default function MapVisualization({
  rainfallData,
  viewMode,
  selectedDate,
  selectedMonth,
  metric = 'rainfall',
  metricData = {}
}: MapVisualizationProps) {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { config } = useRainfallConfig();

  // Load GeoJSON files
  useEffect(() => {
    const loadGeoJson = async () => {
      setIsLoading(true);
      try {
        const [maharashtraResponse, goaResponse] = await Promise.all([
          fetch('/geojson/MAHARASHTRA_DISTRICTS.geojson'),
          fetch('/geojson/GOA_DISTRICTS.geojson'),
        ]);

        const maharashtraData = await maharashtraResponse.json();
        const goaData = await goaResponse.json();

        // Normalize features
        const processFeatures = (data: any) => {
          if (!data.features) return [];
          data.features.forEach((feature: any) => {
            const distCol = findDistrictColumn(feature.properties);
            if (distCol && feature.properties[distCol]) {
              const distName = feature.properties[distCol].toString();
              feature.properties['DISTRICT_NORM'] = normalizeDistrictName(distName);
              // Special case for Goa in Map
              if (feature.properties['DISTRICT_NORM'] === 'NORTH GOA' || feature.properties['DISTRICT_NORM'] === 'SOUTH GOA') {
                 // Rainfall data usually uses 'GOA'
              }
            }
          });
          return data.features;
        };

        const combined = {
          type: 'FeatureCollection',
          features: [
            ...processFeatures(maharashtraData),
            ...processFeatures(goaData),
          ],
        };

        setGeoJsonData(combined);
      } catch (error) {
        console.error('Error loading GeoJSON:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGeoJson();
  }, []);

  // Create a map of district -> stats
  const rainfallMap = new Map<string, DistrictRainfall>();
  rainfallData.forEach((item) => {
    rainfallMap.set(item.district, item);
  });

  const getMetricColor = (districtNorm: string, val: number) => {
    if (metric === 'pod' || metric === 'csi') {
      // Green scale for POD/CSI (High is good)
      if (val >= 0.8) return '#166534';
      if (val >= 0.6) return '#22c55e';
      if (val >= 0.4) return '#86efac';
      if (val >= 0.2) return '#dcfce7';
      return '#f0fdf4';
    }
    if (metric === 'far') {
      // Red scale for FAR (Low is good)
      if (val >= 0.8) return '#991b1b';
      if (val >= 0.6) return '#ef4444';
      if (val >= 0.4) return '#fca5a5';
      if (val >= 0.2) return '#fee2e2';
      return '#fef2f2';
    }
    if (metric === 'bias') {
      // Diverging for Bias (1.0 is perfect)
      if (val > 1.5) return '#9a3412'; // High Overforecast
      if (val > 1.1) return '#f97316'; // Overforecast
      if (val >= 0.9) return '#22c55e'; // Good
      if (val >= 0.5) return '#3b82f6'; // Underforecast
      return '#1e3a8a'; // Deep Underforecast
    }
    if (metric === 'subdivision') {
      for (const sub of MAHARASHTRA_SUBDIVISIONS) {
        if (sub.cities.some(c => normalizeDistrictName(c) === districtNorm)) {
          return sub.color;
        }
      }
      return '#D3D3D3';
    }
    return '#D3D3D3';
  };

  // Style function for GeoJSON
  const style = (feature: any) => {
    const districtNorm = feature.properties.DISTRICT_NORM;
    let color = '#D3D3D3';

    if (metric === 'rainfall') {
      const rainfall = rainfallMap.get(districtNorm)?.rainfall || 0;
      if (viewMode === 'daily') {
        color = config ? getRainfallColorDynamic(rainfall, config) : '#D3D3D3';
      } else {
        color = getMonthlyRainfallColor(rainfall);
      }
    } else if (metric === 'subdivision') {
      color = getMetricColor(districtNorm, 0);
    } else {
      const val = metricData[districtNorm]?.[metric] ?? -1;
      if (val !== -1) {
        color = getMetricColor(districtNorm, val);
      }
    }

    return {
      fillColor: color,
      weight: 1,
      opacity: 1,
      color: '#333',
      fillOpacity: 0.7,
    };
  };

  const highlightStyle = {
    weight: 3,
    color: '#000',
    fillOpacity: 0.9,
  };

  const onEachFeature = (feature: any, layer: any) => {
    const distCol = findDistrictColumn(feature.properties);
    const districtName = distCol ? feature.properties[distCol] : 'Unknown';
    const districtNorm = feature.properties.DISTRICT_NORM;
    
    let tooltipContent = `<strong>${districtName}</strong><br/>`;

    if (metric === 'rainfall') {
      const data = rainfallMap.get(districtNorm);
      const rainfall = data?.rainfall || 0;
      const category = config ? getRainfallCategoryDynamic(rainfall, config) : 'N/A';
      
      if (viewMode === 'daily') {
        tooltipContent += `Rainfall: <strong>${rainfall.toFixed(1)} mm</strong><br/>Category: <em>${category}</em>`;
      } else {
        tooltipContent += `Total accumulation: <strong>${rainfall.toFixed(1)} mm</strong><br/>`;
        if (data?.maxRainfallValue !== undefined && data?.maxRainfallDate) {
          tooltipContent += `Max rainfall: <strong>${data.maxRainfallValue.toFixed(1)} mm</strong> on <strong>${data.maxRainfallDate}</strong>`;
        } else if (data?.maxRainfallDate) {
          tooltipContent += `Max rainfall date: <strong>${data.maxRainfallDate}</strong>`;
        }
      }
    } else if (metric === 'subdivision') {
      const sub = MAHARASHTRA_SUBDIVISIONS.find(s => s.cities.some(c => normalizeDistrictName(c) === districtNorm));
      tooltipContent += `Subdivision: <strong>${sub?.name || 'N/A'}</strong>`;
    } else {
      const stats = metricData[districtNorm];
      if (stats) {
        const val = stats[metric];
        tooltipContent += `${metric.toUpperCase()}: <strong>${typeof val === 'number' ? val.toFixed(3) : 'N/A'}</strong><br/>`;
        tooltipContent += `Total predictions: ${stats.total || 0}`;
      } else {
        tooltipContent += `No verification data available`;
      }
    }

    layer.bindTooltip(`<div style="font-family: sans-serif;">${tooltipContent}</div>`, {
      sticky: false,
      direction: 'top',
    });

    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle(highlightStyle);
        layer.bringToFront();
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle(style(feature));
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <MapContainer
        center={[19.7515, 75.7139]}
        zoom={7}
        style={{ height: '600px', width: '100%', borderRadius: '0.5rem' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          key={`${JSON.stringify(rainfallData)}-${metric}-${config?.mode}`}
          data={geoJsonData}
          style={style}
          onEachFeature={onEachFeature}
        />
        <FitBounds geoJsonData={geoJsonData} />
      </MapContainer>

      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 px-4 py-2 rounded-lg shadow-lg z-[1000]">
        <h3 className="text-lg font-bold text-gray-900">
          {metric === 'rainfall' 
            ? (viewMode === 'daily' 
                ? `Daily Rainfall: ${new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                : `Accumulated Rainfall: ${new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`)
            : metric === 'subdivision' 
              ? 'Meteorological Subdivisions'
              : `Verification Metric: ${metric.toUpperCase()}`
          }
        </h3>
      </div>
    </div>
  );
}

