// ProgressCircle.tsx
// SVG-based circular progress indicator for showing percent of daily tasks completed.

import React from 'react';

interface ProgressCircleProps {
  completed: number; // Number of completed tasks
  total: number;     // Total number of tasks
  size?: number;     // Diameter of the circle in px
  strokeWidth?: number; // Thickness of the progress arc
  className?: string;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  completed,
  total,
  size = 48,
  strokeWidth = 6,
  className = '',
}) => {
  // Calculate radius and circumference for SVG
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Progress as a fraction (0-1)
  const progress = total > 0 ? completed / total : 0;
  // Offset for the progress arc
  const offset = circumference * (1 - progress);
  // Percent for display (clamped to 0-100)
  const percent = Math.max(0, Math.min(100, Math.round(progress * 100)));
  const percentText = `${percent}%`;

  // Adjust the font size so longer strings like "100%" stay within the circle
  const baseFontRatio = 0.32;
  const decrementPerExtraChar = 0.04;
  const minFontRatio = 0.24;
  const fontRatio = Math.max(
    minFontRatio,
    baseFontRatio - Math.max(0, percentText.length - 2) * decrementPerExtraChar,
  );
  const fontSize = size * fontRatio;

  return (
    <svg width={size} height={size} className={className}>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb" // Tailwind gray-200
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#2563eb" // Tailwind primary-600
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.4s' }}
      />
      {/* Percent text in the center */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight="bold"
        fill="#2563eb"
      >
        {percentText}
      </text>
    </svg>
  );
}; 