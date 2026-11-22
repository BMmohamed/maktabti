'use client';

import React from 'react';
import { BackgroundTheme } from '@/types';

interface DamasceneBackgroundProps {
  theme?: BackgroundTheme | string;
  primaryColor?: string;
  secondaryColor?: string;
  customUrl?: string | null;
  className?: string;
}

export function DamasceneBackground({
  theme = 'damascus_geometric',
  primaryColor = '#16a34a',
  secondaryColor = '#052e16',
  customUrl,
  className = '',
}: DamasceneBackgroundProps) {
  return (
    <div 
      className={`fixed inset-0 pointer-events-none overflow-hidden select-none -z-10 ${className}`}
      aria-hidden="true"
    >
      {/* 1. Base Ambient Color Gradient */}
      <div 
        className="absolute inset-0 transition-colors duration-700"
        style={{
          background: `radial-gradient(ellipse at 85% 15%, ${primaryColor}18 0%, transparent 65%),
                       radial-gradient(ellipse at 15% 85%, ${secondaryColor}15 0%, transparent 65%),
                       linear-gradient(180deg, #fafbfd 0%, #f1f5f9 50%, #e2e8f0 100%)`
        }}
      />

      {/* 2. Custom Background Image if specified */}
      {customUrl && theme === 'custom' && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 animate-ken-burns mix-blend-multiply"
          style={{ backgroundImage: `url(${customUrl})` }}
        />
      )}

      {/* 3. Primary Animated Damascene Pattern Layer */}
      <div className="absolute -inset-10 opacity-40 animate-ken-burns">
        {theme === 'damascus_geometric' && <DamascusGeometricPattern color={primaryColor} />}
        {theme === 'arabesque_floral' && <ArabesqueFloralPattern color={primaryColor} />}
        {theme === 'islamic_calligraphy' && <ArabicCalligraphyPattern color={primaryColor} />}
        {theme === 'mashrabiya_lattice' && <MashrabiyaPattern color={primaryColor} />}
        {theme === 'custom' && !customUrl && <DamascusGeometricPattern color={primaryColor} />}
      </div>

      {/* 4. Secondary Floating Parallax Layer for Artistic Depth */}
      <div className="absolute -inset-12 opacity-25 animate-damascene-drift mix-blend-color-burn">
        {theme === 'damascus_geometric' && <DamascusStarsOverlay color={secondaryColor} />}
        {theme === 'arabesque_floral' && <FloralVinesOverlay color={secondaryColor} />}
        {theme === 'islamic_calligraphy' && <CalligraphySwirlsOverlay color={secondaryColor} />}
        {theme === 'mashrabiya_lattice' && <DamascusStarsOverlay color={secondaryColor} />}
        {theme === 'custom' && !customUrl && <DamascusStarsOverlay color={secondaryColor} />}
      </div>

      {/* 5. Luminous Vignette & Glass Contrast Protector */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.82) 80%, rgba(248, 250, 252, 0.95) 100%)'
        }}
      />
    </div>
  );
}

// ==============================================================================
// 1. Damascus Geometric Pattern (8-point Girih & Damascene Star Lattice)
// ==============================================================================
function DamascusGeometricPattern({ color }: { color: string }) {
  return (
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="damascus-girih" width="160" height="160" patternUnits="userSpaceOnUse">
          {/* Central 8-Point Damascene Star */}
          <polygon
            points="80,45 89,68 113,68 94,83 101,107 80,93 59,107 66,83 47,68 71,68"
            fill="none"
            stroke={color}
            strokeWidth="1.2"
            strokeOpacity="0.45"
          />
          {/* Interlaced Geometric Web */}
          <line x1="80" y1="0" x2="80" y2="45" stroke={color} strokeWidth="0.9" strokeOpacity="0.3" strokeDasharray="3,3" />
          <line x1="80" y1="115" x2="80" y2="160" stroke={color} strokeWidth="0.9" strokeOpacity="0.3" strokeDasharray="3,3" />
          <line x1="0" y1="80" x2="47" y2="80" stroke={color} strokeWidth="0.9" strokeOpacity="0.3" strokeDasharray="3,3" />
          <line x1="113" y1="80" x2="160" y2="80" stroke={color} strokeWidth="0.9" strokeOpacity="0.3" strokeDasharray="3,3" />

          {/* Octagonal Outer Boundary */}
          <polygon
            points="80,10 130,30 150,80 130,130 80,150 30,130 10,80 30,30"
            fill="none"
            stroke={color}
            strokeWidth="0.8"
            strokeOpacity="0.25"
          />

          {/* Corner Rosettes */}
          <circle cx="0" cy="0" r="24" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.35" />
          <circle cx="160" cy="0" r="24" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.35" />
          <circle cx="0" cy="160" r="24" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.35" />
          <circle cx="160" cy="160" r="24" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.35" />

          {/* Inner Accent Dot */}
          <circle cx="80" cy="80" r="3" fill={color} fillOpacity="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#damascus-girih)" />
    </svg>
  );
}

function DamascusStarsOverlay({ color }: { color: string }) {
  return (
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="damascus-stars-overlay" width="320" height="320" patternUnits="userSpaceOnUse">
          {/* Large Floating Umayyad Medallion */}
          <circle cx="160" cy="160" r="70" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.3" />
          <polygon
            points="160,85 182,130 230,130 192,160 206,206 160,180 114,206 128,160 90,130 138,130"
            fill="none"
            stroke={color}
            strokeWidth="1.2"
            strokeOpacity="0.3"
          />
          <circle cx="160" cy="160" r="20" fill="none" stroke={color} strokeWidth="0.8" strokeOpacity="0.25" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#damascus-stars-overlay)" />
    </svg>
  );
}

// ==============================================================================
// 2. Arabesque Floral Pattern (Damascene Vine & Foliage Motif)
// ==============================================================================
function ArabesqueFloralPattern({ color }: { color: string }) {
  return (
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="arabesque-floral" width="180" height="180" patternUnits="userSpaceOnUse">
          {/* Flowing Damascene Palmettes and Vines */}
          <path
            d="M90,10 C120,40 140,70 140,90 C140,120 120,150 90,170 C60,150 40,120 40,90 C40,70 60,40 90,10 Z"
            fill="none"
            stroke={color}
            strokeWidth="1.2"
            strokeOpacity="0.35"
          />
          <path
            d="M90,35 C105,55 115,75 115,90 C115,105 105,125 90,145 C75,125 65,105 65,90 C65,75 75,55 90,35 Z"
            fill="none"
            stroke={color}
            strokeWidth="0.9"
            strokeOpacity="0.25"
          />
          {/* Side Spirals (قواقع نباتية شاميّة) */}
          <path
            d="M0,90 Q40,60 40,90 T90,90"
            fill="none"
            stroke={color}
            strokeWidth="1"
            strokeOpacity="0.3"
          />
          <path
            d="M180,90 Q140,120 140,90 T90,90"
            fill="none"
            stroke={color}
            strokeWidth="1"
            strokeOpacity="0.3"
          />
          {/* Leaves */}
          <circle cx="90" cy="90" r="5" fill={color} fillOpacity="0.3" />
          <circle cx="40" cy="90" r="3" fill={color} fillOpacity="0.25" />
          <circle cx="140" cy="90" r="3" fill={color} fillOpacity="0.25" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#arabesque-floral)" />
    </svg>
  );
}

function FloralVinesOverlay({ color }: { color: string }) {
  return (
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="floral-vines-overlay" width="280" height="280" patternUnits="userSpaceOnUse">
          <path
            d="M0,140 C70,70 140,210 210,140 S280,70 280,140"
            fill="none"
            stroke={color}
            strokeWidth="1.2"
            strokeOpacity="0.22"
          />
          <path
            d="M140,0 C210,70 70,210 140,280"
            fill="none"
            stroke={color}
            strokeWidth="1"
            strokeOpacity="0.18"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#floral-vines-overlay)" />
    </svg>
  );
}

// ==============================================================================
// 3. Islamic & Arabic Calligraphy Pattern (حروفيات وتجريد خطي)
// ==============================================================================
function ArabicCalligraphyPattern({ color }: { color: string }) {
  return (
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="arabic-calligraphy" width="240" height="240" patternUnits="userSpaceOnUse">
          {/* Abstract Diwani & Kufic sweeping strokes (واو، نون، ألف، كشيدة) */}
          {/* Curve of Waw (و) */}
          <path
            d="M60,80 C75,65 95,70 95,85 C95,110 55,140 35,160 C50,158 85,150 110,150"
            fill="none"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeOpacity="0.4"
          />
          {/* Curve of Noon (ن) with Nuqta */}
          <path
            d="M130,120 C130,155 170,165 195,145 C205,135 210,120 210,105"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.38"
          />
          {/* Diamond Nuqta (نقطة الخط العربي) */}
          <polygon
            points="170,120 176,126 170,132 164,126"
            fill={color}
            fillOpacity="0.45"
          />

          {/* Sweeping Alif & Lam (أ ل) */}
          <path
            d="M125,40 L125,95 C125,105 135,110 145,110"
            fill="none"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeOpacity="0.35"
          />

          {/* Subtle Kashida horizontal flow */}
          <path
            d="M10,210 Q80,200 160,205 T240,200"
            fill="none"
            stroke={color}
            strokeWidth="1.2"
            strokeOpacity="0.25"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#arabic-calligraphy)" />
    </svg>
  );
}

function CalligraphySwirlsOverlay({ color }: { color: string }) {
  return (
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="calligraphy-swirls" width="360" height="360" patternUnits="userSpaceOnUse">
          <path
            d="M50,180 C120,80 240,80 310,180 C240,280 120,280 50,180 Z"
            fill="none"
            stroke={color}
            strokeWidth="1.2"
            strokeOpacity="0.2"
          />
          <circle cx="180" cy="180" r="40" fill="none" stroke={color} strokeWidth="0.8" strokeOpacity="0.15" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#calligraphy-swirls)" />
    </svg>
  );
}

// ==============================================================================
// 4. Mashrabiya Lattice (المشربية الشامية والشبابيك الخشبية)
// ==============================================================================
function MashrabiyaPattern({ color }: { color: string }) {
  return (
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="mashrabiya-pattern" width="100" height="100" patternUnits="userSpaceOnUse">
          {/* Wood Lattice Interlock */}
          <polygon
            points="50,15 85,50 50,85 15,50"
            fill="none"
            stroke={color}
            strokeWidth="1.4"
            strokeOpacity="0.35"
          />
          <polygon
            points="50,30 70,50 50,70 30,50"
            fill="none"
            stroke={color}
            strokeWidth="0.8"
            strokeOpacity="0.2"
          />
          <circle cx="50" cy="50" r="4" fill={color} fillOpacity="0.3" />
          {/* Joint Nodes */}
          <circle cx="0" cy="0" r="3" fill={color} fillOpacity="0.3" />
          <circle cx="100" cy="0" r="3" fill={color} fillOpacity="0.3" />
          <circle cx="0" cy="100" r="3" fill={color} fillOpacity="0.3" />
          <circle cx="100" cy="100" r="3" fill={color} fillOpacity="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mashrabiya-pattern)" />
    </svg>
  );
}
