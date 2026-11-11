import React, { useState, useRef } from 'react';
import { DamageMark } from '../types';
import { Plus, Trash2, X, AlertCircle } from 'lucide-react';

interface CarDamageDiagramProps {
  damages: DamageMark[];
  onChange: (damages: DamageMark[]) => void;
  readOnly?: boolean;
}

export const CarDamageDiagram: React.FC<CarDamageDiagramProps> = ({
  damages,
  onChange,
  readOnly = false,
}) => {
  const [selectedDamageType, setSelectedDamageType] = useState<DamageMark['tipo']>('Risco');
  const [activeZone, setActiveZone] = useState<string>('Lateral');
  const [damageDesc, setDamageDesc] = useState<string>('');
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    // Auto-detect zone approximately from coordinates
    let detectedZone = 'Lateral Esquerda';
    if (y < 25) detectedZone = 'Frente / Capô';
    else if (y > 75) detectedZone = 'Traseira';
    else if (x < 30) detectedZone = 'Lateral Esquerda';
    else if (x > 70) detectedZone = 'Lateral Direita';
    else detectedZone = 'Teto / Cabine';

    setActiveZone(detectedZone);
    setPendingPoint({ x, y });
  };

  const confirmAddPoint = () => {
    if (!pendingPoint) return;
    const newDamage: DamageMark = {
      id: `dmg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      zona: activeZone,
      tipo: selectedDamageType,
      x: pendingPoint.x,
      y: pendingPoint.y,
      descricao: damageDesc.trim() || `${selectedDamageType} em ${activeZone}`,
    };

    onChange([...damages, newDamage]);
    setPendingPoint(null);
    setDamageDesc('');
  };

  const removePoint = (id: string) => {
    if (readOnly) return;
    onChange(damages.filter((d) => d.id !== id));
  };

  const getColorClass = (tipo: DamageMark['tipo']) => {
    switch (tipo) {
      case 'Risco':
        return 'bg-amber-500 text-slate-950 border-amber-300';
      case 'Amassado':
        return 'bg-orange-500 text-white border-orange-300';
      case 'Quebrado':
        return 'bg-red-600 text-white border-red-300';
      case 'Ralado':
        return 'bg-blue-600 text-white border-blue-300';
      default:
        return 'bg-slate-700 text-white border-slate-500';
    }
  };

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            <span>Clique na lataria do veículo abaixo para marcar uma avaria:</span>
          </span>

          <div className="flex items-center gap-1">
            {(['Risco', 'Amassado', 'Ralado', 'Quebrado', 'Outro'] as const).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => setSelectedDamageType(tipo)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition border ${
                  selectedDamageType === tipo
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Schematic Container */}
      <div
        ref={containerRef}
        onClick={handleDiagramClick}
        className={`relative w-full max-w-lg mx-auto bg-slate-900/95 rounded-xl border border-slate-700 p-4 select-none ${
          !readOnly ? 'cursor-crosshair hover:border-red-500/80 transition-colors' : ''
        }`}
        style={{ aspectRatio: '1.4 / 1' }}
      >
        {/* Car Outline Vector SVG */}
        <svg
          viewBox="0 0 400 280"
          className="w-full h-full stroke-slate-400 fill-transparent stroke-[1.8] pointer-events-none"
        >
          {/* External car body perimeter */}
          <path
            d="M 120 20 
               C 150 15, 250 15, 280 20 
               C 300 24, 310 50, 310 70
               C 310 100, 305 130, 305 160
               C 305 200, 310 230, 285 255
               C 260 262, 140 262, 115 255
               C 90 230, 95 200, 95 160
               C 95 130, 90 100, 90 70
               C 90 50, 100 24, 120 20 Z"
            fill="#1e293b"
            stroke="#94a3b8"
            strokeWidth="2.5"
          />

          {/* Front Bumper / Hood */}
          <path d="M 120 20 C 160 30, 240 30, 280 20" stroke="#cbd5e1" strokeWidth="2" />
          <path d="M 115 65 C 160 75, 240 75, 285 65" stroke="#64748b" />
          {/* Front Headlights */}
          <ellipse cx="110" cy="35" rx="12" ry="6" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
          <ellipse cx="290" cy="35" rx="12" ry="6" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />

          {/* Front Windshield */}
          <path
            d="M 118 70 L 135 110 L 265 110 L 282 70 Z"
            fill="#0f172a"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />

          {/* Roof & Cabin */}
          <rect x="135" y="110" width="130" height="60" rx="4" fill="#1e293b" stroke="#64748b" />

          {/* Rear Windshield */}
          <path
            d="M 135 170 L 120 205 L 280 205 L 265 170 Z"
            fill="#0f172a"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />

          {/* Trunk & Rear Bumper */}
          <path d="M 115 250 C 160 260, 240 260, 285 250" stroke="#cbd5e1" strokeWidth="2" />
          {/* Rear Tail Lights */}
          <ellipse cx="108" cy="245" rx="10" ry="5" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
          <ellipse cx="292" cy="245" rx="10" ry="5" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />

          {/* Side mirrors */}
          <rect x="74" y="80" width="16" height="10" rx="4" fill="#334155" stroke="#94a3b8" />
          <rect x="310" y="80" width="16" height="10" rx="4" fill="#334155" stroke="#94a3b8" />

          {/* Wheels indication */}
          <rect x="78" y="45" width="12" height="35" rx="3" fill="#020617" stroke="#475569" />
          <rect x="310" y="45" width="12" height="35" rx="3" fill="#020617" stroke="#475569" />
          <rect x="78" y="190" width="12" height="35" rx="3" fill="#020617" stroke="#475569" />
          <rect x="310" y="190" width="12" height="35" rx="3" fill="#020617" stroke="#475569" />

          {/* Zone Guides (Labels) */}
          <text x="200" y="45" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">
            FRENTE / CAPÔ
          </text>
          <text x="60" y="145" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">
            L. ESQUERDA
          </text>
          <text x="340" y="145" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">
            L. DIREITA
          </text>
          <text x="200" y="142" fill="#cbd5e1" fontSize="10" fontWeight="bold" textAnchor="middle">
            TETO
          </text>
          <text x="200" y="235" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">
            TRASEIRA
          </text>
        </svg>

        {/* Existing Markers */}
        {damages.map((dmg, idx) => (
          <div
            key={dmg.id}
            style={{ left: `${dmg.x}%`, top: `${dmg.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-[10px] shadow-lg cursor-pointer transform hover:scale-125 transition-transform z-10 ${getColorClass(
              dmg.tipo
            )}`}
            title={`${dmg.tipo} - ${dmg.zona}: ${dmg.descricao || ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!readOnly && window.confirm(`Remover marcação "${dmg.descricao}"?`)) {
                removePoint(dmg.id);
              }
            }}
          >
            {idx + 1}
          </div>
        ))}

        {/* Pending Click Pinpoint */}
        {pendingPoint && (
          <div
            style={{ left: `${pendingPoint.x}%`, top: `${pendingPoint.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-red-600 animate-ping pointer-events-none z-20"
          />
        )}
      </div>

      {/* Confirmation Box for New Point */}
      {pendingPoint && !readOnly && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
          <div className="flex-1 min-w-[200px]">
            <span className="text-[11px] font-bold text-red-900 block mb-1">
              Nova avaria detectada em: <strong>{activeZone}</strong>
            </span>
            <input
              type="text"
              value={damageDesc}
              onChange={(e) => setDamageDesc(e.target.value)}
              placeholder={`Descreva a avaria (ex: Risco superficial capô...)`}
              className="w-full bg-white border border-red-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmAddPoint();
              }}
            />
          </div>

          <div className="flex items-center gap-1.5 self-end">
            <button
              type="button"
              onClick={() => setPendingPoint(null)}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmAddPoint}
              className="px-3 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded shadow-xs"
            >
              Salvar Marcação
            </button>
          </div>
        </div>
      )}

      {/* List of Marked Damages */}
      {damages.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-2.5">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
            Avarias Marcadas no Diagrama ({damages.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
            {damages.map((dmg, idx) => (
              <div
                key={dmg.id}
                className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 ${getColorClass(
                      dmg.tipo
                    )}`}
                  >
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800 truncate">
                    {dmg.tipo}: {dmg.descricao || dmg.zona}
                  </span>
                </div>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removePoint(dmg.id)}
                    className="text-slate-400 hover:text-red-600 p-1"
                    title="Remover ponto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
