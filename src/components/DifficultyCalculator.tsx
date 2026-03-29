import React, { useState } from 'react';
import { Mountain, Activity, Scale } from 'lucide-react';

export default function DifficultyCalculator() {
  const [params, setParams] = useState({
    distance: 5,
    elevation: 500,
    terrain: 1, // 1: Easy, 2: Moderate, 3: Technical
  });

  const calculateScore = () => {
    // Basic formula: (Distance * 1.5) + (Elevation / 100) * Terrain
    const score = (params.distance * 1.5) + (params.elevation / 100) * params.terrain;
    if (score < 15) return { label: 'Easy', color: 'text-emerald-400' };
    if (score < 30) return { label: 'Moderate', color: 'text-amber-400' };
    return { label: 'Hard', color: 'text-rose-400' };
  };

  const result = calculateScore();

  return (
    <div className="glass p-8 rounded-3xl border border-nature-500/20">
      <h3 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
        <Scale className="text-nature-400" />
        Difficulty Calculator
      </h3>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm text-nature-400 mb-2">Total Distance (km)</label>
          <input 
            type="range" min="1" max="50" value={params.distance}
            onChange={(e) => setParams({...params, distance: parseInt(e.target.value)})}
            className="w-full accent-nature-500"
          />
          <div className="flex justify-between text-xs mt-1">
            <span>1km</span>
            <span className="font-bold text-nature-300">{params.distance}km</span>
            <span>50km</span>
          </div>
        </div>

        <div>
          <label className="block text-sm text-nature-400 mb-2">Elevation Gain (meters)</label>
          <input 
            type="range" min="100" max="3000" step="100" value={params.elevation}
            onChange={(e) => setParams({...params, elevation: parseInt(e.target.value)})}
            className="w-full accent-nature-500"
          />
          <div className="flex justify-between text-xs mt-1">
            <span>100m</span>
            <span className="font-bold text-nature-300">{params.elevation}m</span>
            <span>3000m</span>
          </div>
        </div>

        <div>
          <label className="block text-sm text-nature-400 mb-2">Terrain Type</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 1, label: 'Flat/Paved' },
              { val: 2, label: 'Rocky/Steep' },
              { val: 3, label: 'Technical/Snow' },
            ].map((t) => (
              <button
                key={t.val}
                onClick={() => setParams({...params, terrain: t.val})}
                className={`text-[10px] p-2 rounded-lg border transition-all ${
                  params.terrain === t.val 
                    ? 'bg-nature-500 border-nature-500 text-white' 
                    : 'bg-nature-900 border-white/10 text-nature-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 p-6 bg-nature-950/50 rounded-2xl border border-white/5 text-center">
          <p className="text-xs text-nature-400 uppercase tracking-widest mb-1">Estimated Difficulty</p>
          <p className={`text-3xl font-display font-bold ${result.color}`}>{result.label}</p>
        </div>
      </div>
    </div>
  );
}
