"use client";

import React from 'react';
import { SnowflakeScores } from './financialEngine';

interface SnowflakeRadarProps {
  scores: SnowflakeScores;
  size?: number;
}

export default function SnowflakeRadar({ scores, size = 320 }: SnowflakeRadarProps) {
  const center = size / 2;
  const radius = (size / 2) * 0.72;

  // 5 axes: Angle in radians (starting from top, clockwise)
  // 0: Valor (top)
  // 1: Crecimiento (top-right)
  // 2: Rendimiento / Calidad (bottom-right)
  // 3: Salud Financiera (bottom-left)
  // 4: Momentum Técnico (top-left)
  const axes = [
    { name: 'Valoración', key: 'value', val: scores.value, angle: -Math.PI / 2 },
    { name: 'Crecimiento', key: 'growth', val: scores.growth, angle: -Math.PI / 2 + (2 * Math.PI) / 5 },
    { name: 'Rentabilidad', key: 'performance', val: scores.performance, angle: -Math.PI / 2 + (4 * Math.PI) / 5 },
    { name: 'Salud', key: 'health', val: scores.health, angle: -Math.PI / 2 + (6 * Math.PI) / 5 },
    { name: 'Momentum', key: 'momentum', val: scores.momentum, angle: -Math.PI / 2 + (8 * Math.PI) / 5 },
  ];

  // Helper to compute coordinates
  const getPoint = (angle: number, distance: number) => {
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
    };
  };

  // Concentric levels (20%, 40%, 60%, 80%, 100%)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Polygon points of current scores
  const scorePoints = axes
    .map((axis) => {
      const dist = (Math.max(10, Math.min(100, axis.val)) / 100) * radius;
      const pt = getPoint(axis.angle, dist);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col items-center justify-center p-3">
      <svg width={size} height={size} className="overflow-visible select-none">
        {/* Background Radial Glow */}
        <defs>
          <radialGradient id="snowflakeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#10b981" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="polyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Outer subtle glow */}
        <circle cx={center} cy={center} r={radius * 1.05} fill="url(#snowflakeGlow)" />

        {/* Concentric Pentagons */}
        {levels.map((lvl) => {
          const pts = axes
            .map((axis) => {
              const pt = getPoint(axis.angle, radius * lvl);
              return `${pt.x},${pt.y}`;
            })
            .join(' ');
          return (
            <polygon
              key={`level-${lvl}`}
              points={pts}
              fill="none"
              stroke="#223048"
              strokeWidth={lvl === 1 ? '1.5' : '1'}
              strokeDasharray={lvl === 1 ? undefined : '2 2'}
            />
          );
        })}

        {/* Axes Radial Spoke Lines */}
        {axes.map((axis, i) => {
          const end = getPoint(axis.angle, radius);
          return (
            <line
              key={`spoke-${i}`}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="#27354f"
              strokeWidth="1"
            />
          );
        })}

        {/* Active Data Filled Polygon */}
        <polygon
          points={scorePoints}
          fill="url(#polyGrad)"
          stroke="#38bdf8"
          strokeWidth="2.5"
          className="transition-all duration-700 ease-out"
        />

        {/* Vertex Markers */}
        {axes.map((axis, i) => {
          const dist = (Math.max(10, Math.min(100, axis.val)) / 100) * radius;
          const pt = getPoint(axis.angle, dist);
          return (
            <g key={`marker-${i}`}>
              <circle cx={pt.x} cy={pt.y} r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          );
        })}

        {/* Text Labels & Values */}
        {axes.map((axis, i) => {
          const labelDist = radius + 24;
          const pt = getPoint(axis.angle, labelDist);
          return (
            <g key={`label-${i}`}>
              <text
                x={pt.x}
                y={pt.y - 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#94a3b8"
                fontSize="11"
                fontWeight="600"
                className="font-sans"
              >
                {axis.name}
              </text>
              <text
                x={pt.x}
                y={pt.y + 11}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#38bdf8"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {axis.val}/100
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
