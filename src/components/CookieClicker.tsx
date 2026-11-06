import { useState, useCallback, useRef } from 'react';
import { useGame } from '@/context/GameContext';
import { Cookie } from 'lucide-react';

type FloatingNum = {
  id: number;
  x: number;
  y: number;
  value: number;
};

export function CookieClicker() {
  const { data, click } = useGame();
  const [floaters, setFloaters] = useState<FloatingNum[]>([]);
  const floatId = useRef(0);
  const clickPowerRef = useRef(data.clickPower);
  clickPowerRef.current = data.clickPower;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      click();
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = floatId.current++;
      setFloaters((prev) => [...prev, { id, x, y, value: clickPowerRef.current }]);
      setTimeout(() => {
        setFloaters((prev) => prev.filter((f) => f.id !== id));
      }, 900);
    },
    [click]
  );

  function formatNum(n: number): string {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return Math.floor(n).toLocaleString();
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-8 flex flex-col items-center select-none">
      {/* Score display */}
      <div className="text-center mb-6">
        <div className="text-5xl font-extrabold text-gray-800 tabular-nums">
          {formatNum(data.score)}
        </div>
        <div className="text-sm text-gray-400 font-medium mt-1">cookies</div>
      </div>

      {/* Stats */}
      <div className="flex gap-6 mb-8 text-center">
        <div>
          <div className="text-lg font-bold text-orange-600 tabular-nums">
            +{data.clickPower}
          </div>
          <div className="text-xs text-gray-400">per click</div>
        </div>
        <div className="w-px bg-gray-100" />
        <div>
          <div className="text-lg font-bold text-orange-600 tabular-nums">
            {data.autoRate.toFixed(0)}/s
          </div>
          <div className="text-xs text-gray-400">auto</div>
        </div>
      </div>

      {/* Cookie button */}
      <div className="relative">
        <button
          onClick={handleClick}
          className="relative w-48 h-48 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 shadow-2xl flex items-center justify-center hover:shadow-amber-300/50 transition-shadow active:scale-95 active:saturate-150"
          style={{ touchAction: 'manipulation' }}
        >
          <Cookie
            className="w-28 h-28 text-amber-900 pointer-events-none"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
          />
        </button>

        {/* Floating numbers */}
        {floaters.map((f) => (
          <span
            key={f.id}
            className="absolute pointer-events-none font-bold text-orange-600 text-lg"
            style={{
              left: f.x,
              top: f.y,
              animation: 'floatUp 0.9s ease-out forwards',
            }}
          >
            +{f.value}
          </span>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-6">Click the cookie to earn more!</p>

      <style>{`
        @keyframes floatUp {
          0% { transform: translate(-50%, 0); opacity: 1; }
          100% { transform: translate(-50%, -60px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
