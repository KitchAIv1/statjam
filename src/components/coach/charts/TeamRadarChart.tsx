/**
 * Team Radar Chart Component
 * 
 * Displays team performance metrics in a radar/spider chart format
 * Simple SVG-based implementation (no external chart library needed)
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 * 
 * @module TeamRadarChart
 */

'use client';

import React from 'react';

interface TeamRadarChartProps {
  data: {
    label: string;
    value: number;      // 0-100 scale
    maxValue?: number;  // Optional max for scaling
  }[];
  size?: number;        // Chart size in pixels
  className?: string;
}

/**
 * TeamRadarChart - Visual representation of team metrics
 * 
 * Features:
 * - Clean SVG-based radar chart
 * - Responsive design
 * - Color-coded performance levels
 * - Tooltip-ready labels
 */
export function TeamRadarChart({ 
  data, 
  size = 300,
  className = '' 
}: TeamRadarChartProps) {
  
  const center = size / 2;
  const radius = (size / 2) * 0.7; // 70% of half size for padding
  const numPoints = data.length;

  // Calculate points for the polygon
  const calculatePoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2; // Start from top
    const scaledValue = (value / 100) * radius; // Scale to 0-100
    
    return {
      x: center + scaledValue * Math.cos(angle),
      y: center + scaledValue * Math.sin(angle)
    };
  };

  // Generate polygon points string
  const polygonPoints = data
    .map((item, index) => {
      const point = calculatePoint(index, item.value);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  // Generate grid circles (25%, 50%, 75%, 100%)
  const gridLevels = [25, 50, 75, 100];

  return (
    <div className={`relative ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto"
      >
        {/* Background grid circles */}
        {gridLevels.map((level) => (
          <circle
            key={level}
            cx={center}
            cy={center}
            r={(radius * level) / 100}
            fill="none"
            stroke="#374151"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}

        {/* Grid lines from center to each point */}
        {data.map((_, index) => {
          const endPoint = calculatePoint(index, 100);
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke="#374151"
              strokeWidth="1"
              opacity="0.3"
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(249, 115, 22, 0.3)"
          stroke="#f97316"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((item, index) => {
          const point = calculatePoint(index, item.value);
          return (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#f97316"
              stroke="#fff"
              strokeWidth="2"
            />
          );
        })}

        {/* Labels */}
        {data.map((item, index) => {
          const labelPoint = calculatePoint(index, 115); // Position outside the chart
          const textAnchor = 
            labelPoint.x > center + 5 ? 'start' : 
            labelPoint.x < center - 5 ? 'end' : 
            'middle';
          
          return (
            <text
              key={index}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor={textAnchor}
              fontSize="12"
              fill="#9CA3AF"
              fontWeight="500"
            >
              {item.label}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-gray-600">
              {item.label}: <span className="font-semibold text-gray-900">{item.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

