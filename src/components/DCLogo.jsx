import React from 'react';

export default function DCLogo({ className = "w-52 h-52" }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg viewBox="0 0 512 512" className="w-full h-full drop-shadow-xl overflow-visible">
        <defs>
          <radialGradient id="dcBgProp2" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0b1b15" />
            <stop offset="70%" stopColor="#03110c" />
            <stop offset="100%" stopColor="#010705" />
          </radialGradient>
          <linearGradient id="dcSteelPlate2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="dcGreen2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00df82" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Fondo circular */}
        <circle cx="256" cy="256" r="248" fill="url(#dcBgProp2)" stroke="#064e3b" strokeWidth="3" />
        <circle cx="256" cy="225" r="160" fill="none" stroke="#00df82" strokeWidth="2" opacity="0.25" strokeDasharray="10 12" />

        {/* Indicador digital estilizado arriba (Cabezal LED) */}
        <rect x="206" y="90" width="100" height="34" rx="8" fill="#041f17" stroke="#00df82" strokeWidth="2" />
        <circle cx="222" cy="107" r="4" fill="#00df82" />
        <rect x="236" y="102" width="56" height="10" rx="3" fill="#00df82" opacity="0.85" />
        <line x1="256" y1="124" x2="256" y2="150" stroke="#00df82" strokeWidth="4" strokeLinecap="round" />

        {/* MONOGRAMA DC FLOTANTE */}
        {/* Letra D en Blanco Puro */}
        <path d="M 165 160 L 220 160 C 255 160, 270 185, 270 215 C 270 245, 255 270, 220 270 L 165 270 Z" 
              fill="none" stroke="#ffffff" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
        {/* Letra C en Verde Esmeralda */}
        <path d="M 335 175 C 300 150, 250 160, 230 195 C 210 230, 220 260, 250 280 C 285 298, 325 290, 340 270" 
              fill="none" stroke="url(#dcGreen2)" strokeWidth="24" strokeLinecap="round" />

        {/* PLATAFORMA DE PESAJE DE ALTA PRECISIÓN */}
        <rect x="120" y="278" width="272" height="16" rx="5" fill="url(#dcSteelPlate2)" />
        <rect x="126" y="281" width="260" height="3" rx="1.5" fill="#ffffff" opacity="0.9" />
        
        {/* Patas de celda de carga */}
        <rect x="145" y="294" width="24" height="8" rx="2" fill="#334155" />
        <rect x="343" y="294" width="24" height="8" rx="2" fill="#334155" />

        {/* Textos de Marca */}
        <text x="256" y="365" textAnchor="middle" fill="#ffffff" fontSize="36" fontWeight="900" fontFamily="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" letterSpacing="6">
          DC PROCESOS
        </text>
        <text x="256" y="400" textAnchor="middle" fill="#00df82" fontSize="15" fontWeight="800" fontFamily="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" letterSpacing="4">
          PESAJE &amp; RENDIMIENTOS
        </text>
      </svg>
    </div>
  );
}
