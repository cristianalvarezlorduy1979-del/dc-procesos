import React from 'react';

export default function DCLogo({ className = "w-52 h-52" }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg viewBox="0 0 512 512" className="w-full h-full drop-shadow-xl overflow-visible">
        <defs>
          <radialGradient id="dcBgSolid" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#082a1c" />
            <stop offset="60%" stopColor="#03150e" />
            <stop offset="100%" stopColor="#010c08" />
          </radialGradient>
        </defs>

        {/* Círculo base con fondo sólido garantizado y borde esmeralda neón */}
        <circle cx="256" cy="256" r="246" fill="#021810" stroke="#00df82" strokeWidth="4" />
        <circle cx="256" cy="256" r="246" fill="url(#dcBgSolid)" opacity="0.8" />
        <circle cx="256" cy="256" r="234" fill="none" stroke="#00df82" strokeWidth="1.5" strokeDasharray="8 8" opacity="0.45" />

        {/* Cabezal digital de pesaje arriba */}
        <rect x="196" y="75" width="120" height="42" rx="10" fill="#021a12" stroke="#00df82" strokeWidth="3" />
        <circle cx="216" cy="96" r="6" fill="#00ff96" />
        <rect x="232" y="90" width="68" height="12" rx="4" fill="#00df82" opacity="0.9" />
        <line x1="256" y1="117" x2="256" y2="150" stroke="#00df82" strokeWidth="6" strokeLinecap="round" />

        {/* ================================================================= */}
        {/* MONOGRAMA DC (100% SÓLIDO, ALTO CONTRASTE, VISIBILIDAD GARANTIZADA) */}
        {/* ================================================================= */}
        
        {/* LETRA D (Blanco Puro Sólido) */}
        <path
          d="M 145 155 L 210 155 C 260 155, 275 185, 275 220 C 275 255, 260 285, 210 285 L 145 285 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="28"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* LETRA C (Verde Esmeralda Neón Sólido - Arco Matemático Preciso) */}
        <path
          d="M 342 165 A 64 64 0 1 0 342 275"
          fill="none"
          stroke="#00df82"
          strokeWidth="28"
          strokeLinecap="round"
        />

        {/* PLATAFORMA DE PESAJE EN ACERO INOXIDABLE */}
        <rect x="110" y="295" width="292" height="20" rx="5" fill="#94a3b8" stroke="#ffffff" strokeWidth="2" />
        <rect x="116" y="298" width="280" height="4" rx="2" fill="#ffffff" opacity="0.95" />
        
        {/* Patas celda de carga */}
        <rect x="135" y="315" width="30" height="10" rx="3" fill="#334155" />
        <rect x="347" y="315" width="30" height="10" rx="3" fill="#334155" />

        {/* TIPOGRAFÍA GRANDE, AUDÁZ Y 100% LEGIBLE */}
        <text
          x="256"
          y="385"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="52"
          fontWeight="900"
          letterSpacing="4"
          fontFamily="'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        >
          DC PROCESOS
        </text>

        <text
          x="256"
          y="428"
          textAnchor="middle"
          fill="#00df82"
          fontSize="24"
          fontWeight="800"
          letterSpacing="3"
          fontFamily="'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        >
          PESAJE &amp; RENDIMIENTOS
        </text>
      </svg>
    </div>
  );
}
