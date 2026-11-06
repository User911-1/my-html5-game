import { UPGRADES, upgradeCost, type UpgradeDef } from '@/game/upgrades';
import { useGame } from '@/context/GameContext';
import {
  MousePointerClick, Hand, Gem, Zap, Cookie, Wheat,
  Factory, Pickaxe, FlaskConical, CircleDot, ShoppingCart,
  Check, Lock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  MousePointerClick,
  Hand,
  Gem,
  Zap,
  Cookie,
  Wheat,
  Factory,
  Pickaxe,
  FlaskConical,
  CircleDot,
};

export function UpgradeShop() {
  const { data, buyUpgrade } = useGame();
  const score = data.score;

  function formatNum(n: number): string {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return Math.floor(n).toLocaleString();
  }

  const renderUpgrade = (def: UpgradeDef) => {
    const level = data.upgrades[def.id] || 0;
    const cost = upgradeCost(def, level);
    const affordable = score >= cost && level < def.maxLevel;
    const maxed = level >= def.maxLevel;
    const Icon = ICON_MAP[def.icon] || Cookie;

    return (
      <button
        key={def.id}
        onClick={() => buyUpgrade(def)}
        disabled={!affordable || maxed}
        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
          maxed
            ? 'bg-gray-50 border-gray-100 cursor-default'
            : affordable
              ? 'bg-white border-orange-200 hover:border-orange-400 hover:shadow-md active:scale-[0.98] cursor-pointer'
              : 'bg-gray-50 border-gray-100 opacity-70 cursor-not-allowed'
        }`}
      >
        <div
          className={`flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center ${
            affordable
              ? 'bg-gradient-to-br from-amber-100 to-orange-100 text-orange-600'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          <Icon className="w-5.5 h-5.5" style={{ width: 22, height: 22 }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-800">{def.name}</span>
            {level > 0 && (
              <span className="text-xs font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                Lv {level}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{def.description}</p>
          <p className="text-xs font-medium text-orange-600 mt-0.5">{def.effectLabel}</p>
        </div>

        <div className="flex-shrink-0 text-right">
          {maxed ? (
            <div className="flex items-center gap-1 text-gray-400">
              <Check className="w-4 h-4" />
              <span className="text-xs font-semibold">MAX</span>
            </div>
          ) : affordable ? (
            <div className="text-sm font-bold text-gray-700">
              {formatNum(cost)}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-400">
              <Lock className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">{formatNum(cost)}</span>
            </div>
          )}
        </div>
      </button>
    );
  };

  const clickUpgrades = UPGRADES.filter((u) => u.category === 'click');
  const autoUpgrades = UPGRADES.filter((u) => u.category === 'auto');

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-orange-100">
        <ShoppingCart className="w-5 h-5 text-amber-600" />
        <h2 className="font-bold text-gray-800">Upgrade Shop</h2>
      </div>

      <div className="p-4 space-y-5 max-h-[500px] overflow-y-auto">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5 px-1">
            Click Upgrades
          </h3>
          <div className="space-y-2">
            {clickUpgrades.map(renderUpgrade)}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5 px-1">
            Auto Producers
          </h3>
          <div className="space-y-2">
            {autoUpgrades.map(renderUpgrade)}
          </div>
        </div>
      </div>
    </div>
  );
}
