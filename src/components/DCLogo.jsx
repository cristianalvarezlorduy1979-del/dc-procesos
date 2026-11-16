import React from 'react';

export default function DCLogo({ className = "w-52 h-52" }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-xl overflow-visible">
        <defs>
          <linearGradient id="dcSteelPlate" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="40%" stopColor="#cbd5e1" />
            <stop offset="70%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          <linearGradient id="dcDarkBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06221a" />
            <stop offset="100%" stopColor="#010d0a" />
          </linearGradient>
        </defs>

        {/* Círculo contenedor redondo verde esmeralda profundo con doble bisel */}
        <circle cx="120" cy="120" r="112" fill="url(#dcDarkBg)" stroke="#083829" strokeWidth="3" />
        <circle cx="120" cy="120" r="104" fill="#010d0a" stroke="#00df82" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.45" />

        {/* ESTRUCTURA DE LA BÁSCULA MODERNA CON MONOGRAMA DC */}
        <g transform="translate(120, 98)">
          
          {/* Mástil central de la báscula con indicador digital */}
          <line x1="0" y1="-48" x2="0" y2="44" stroke="#00df82" strokeWidth="3.5" strokeLinecap="round" />
          
          {/* Cabezal digital de la báscula industrial */}
          <rect x="-26" y="-62" width="52" height="22" rx="5" fill="#0b1727" stroke="#00df82" strokeWidth="1.5" />
          <circle cx="-19" cy="-51" r="2" fill="#00df82" />
          <text x="3" y="-46.5" fill="#00df82" fontSize="9.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">
            0.00 kg
          </text>

          {/* MONOGRAMA DC EN RELIEVE - COLORES SÓLIDOS DE ALTO CONTRASTE (100% INMUNE A ERRORES DE RENDERIZADO) */}
          {/* Letra D en Blanco Puro Nítido */}
          <path
            d="M -54 -20 L -23 -20 C -6 -20, 0 -8, 0 10 C 0 28, -6 40, -23 40 L -54 40 Z"
            fill="none"
            stroke="#ffffff"
            strokeWidth="11"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Letra C en Verde Esmeralda Vibrante */}
          <path
            d="M 50 -16 C 33 -28, 8 -22, -4 -6 C -16 10, -16 30, -4 46 C 8 62, 33 64, 50 52"
            fill="none"
            stroke="#00df82"
            strokeWidth="11"
            strokeLinecap="round"
          />

          {/* PLATAFORMA DE PESAJE INFERIOR (Báscula de Planta / Acero Inox) */}
          <g transform="translate(0, 48)">
            {/* Plato de acero inox con brillo */}
            <rect x="-68" y="0" width="136" height="8" rx="2" fill="url(#dcSteelPlate)" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="-64" y1="2" x2="64" y2="2" stroke="#ffffff" strokeWidth="0.8" opacity="0.8" />
            
            {/* Celdas de carga y apoyos */}
            <rect x="-56" y="8" width="15" height="5" rx="1" fill="#475569" />
            <rect x="41" y="8" width="15" height="5" rx="1" fill="#475569" />
          </g>

        </g>

        {/* NOMBRE OFICIAL DE LA APLICACIÓN (Nítido y visible en todas las pantallas) */}
        <text
          x="120"
          y="182"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="16.5"
          fontWeight="900"
          letterSpacing="2.5"
          fontFamily="Arial, sans-serif"
        >
          DC PROCESOS
        </text>
        <text
          x="120"
          y="200"
          textAnchor="middle"
          fill="#00df82"
          fontSize="8"
          fontWeight="800"
          letterSpacing="2"
          fontFamily="Arial, sans-serif"
        >
          DC ASESORÍAS
        </text>
      </svg>
    </div>
  );
}
