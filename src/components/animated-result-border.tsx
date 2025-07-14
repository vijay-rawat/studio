
"use client";

import React from 'react';

// A self-contained component for the animated border SVG
export function AnimatedResultBorder() {
  const pathData = "M 10,1 L 20,20 L 5,25 L 15,40 L 1,50 L 20,65 L 10,80 L 25,90 L 15,105 L 30,115 L 20,130 L 40,140 L 50,125 L 65,140 L 80,130 L 95,145 L 110,135 L 120,150 L 135,140 L 150,155 L 165,145 L 180,160 L 190,145 L 205,155 L 220,140 L 230,125 L 220,110 L 235,100 L 225,85 L 240,75 L 230,60 L 245,50 L 235,35 L 250,20 L 230,10 L 215,1 L 200,15 L 185,5 L 170,20 L 155,10 L 140,25 L 125,15 L 110,30 L 100,15 L 85,30 L 70,20 L 60,35 L 45,25 L 30,40 L 25,25 L 10,1 Z";

  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
      <svg width="100%" height="100%" viewBox="0 0 250 160" preserveAspectRatio="none" className="overflow-visible">
        {/* The glowing, flashing lightning path */}
        <path
          d={pathData}
          className="lightning-path"
        />

        {/* Spade icon for the "10" */}
        <g>
          <path d="M 6 8 L 10 0 L 14 8 C 14 12 10 14 10 14 C 10 14 6 12 6 8 Z" fill="hsl(var(--primary))" stroke="hsl(var(--primary-foreground))" strokeWidth="0.5"/>
          <rect x="8" y="13" width="4" height="3" rx="1" fill="hsl(var(--primary))" stroke="hsl(var(--primary-foreground))" strokeWidth="0.5" />
          <text x="5" y="6" fontSize="5" fontWeight="bold" fill="hsl(var(--primary-foreground))" className="font-sans">10</text>
          <animateMotion dur="4s" repeatCount="indefinite" path={pathData} />
        </g>
        
        {/* Spade icon for the "9" */}
        <g>
           <path d="M 6 8 L 10 0 L 14 8 C 14 12 10 14 10 14 C 10 14 6 12 6 8 Z" fill="hsl(var(--primary))" stroke="hsl(var(--primary-foreground))" strokeWidth="0.5"/>
           <rect x="8" y="13" width="4" height="3" rx="1" fill="hsl(var(--primary))" stroke="hsl(var(--primary-foreground))" strokeWidth="0.5" />
           <text x="7" y="6" fontSize="5" fontWeight="bold" fill="hsl(var(--primary-foreground))" className="font-sans">9</text>
          <animateMotion dur="4s" begin="2s" repeatCount="indefinite" path={pathData} />
        </g>
      </svg>
    </div>
  );
}
