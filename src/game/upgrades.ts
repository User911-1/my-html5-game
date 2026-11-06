export type UpgradeDef = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'click' | 'auto';
  baseCost: number;
  costGrowth: number;
  effect: number;
  effectLabel: string;
  maxLevel: number;
};

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'sharp_cursor',
    name: 'Sharp Cursor',
    description: 'Each click produces +1 more cookie.',
    icon: 'MousePointerClick',
    category: 'click',
    baseCost: 15,
    costGrowth: 1.15,
    effect: 1,
    effectLabel: '+1 click power',
    maxLevel: 50,
  },
  {
    id: 'golden_glove',
    name: 'Golden Glove',
    description: 'Doubles your click power.',
    icon: 'Hand',
    category: 'click',
    baseCost: 500,
    costGrowth: 1.5,
    effect: 0,
    effectLabel: 'x2 click power',
    maxLevel: 10,
  },
  {
    id: 'diamond_finger',
    name: 'Diamond Finger',
    description: 'Each click produces +10 more cookies.',
    icon: 'Gem',
    category: 'click',
    baseCost: 5000,
    costGrowth: 1.2,
    effect: 10,
    effectLabel: '+10 click power',
    maxLevel: 30,
  },
  {
    id: 'click_frenzy',
    name: 'Click Frenzy',
    description: 'Each click produces +50 more cookies.',
    icon: 'Zap',
    category: 'click',
    baseCost: 50000,
    costGrowth: 1.25,
    effect: 50,
    effectLabel: '+50 click power',
    maxLevel: 25,
  },
  {
    id: 'grandma',
    name: 'Grandma',
    description: 'A kind grandma bakes cookies for you.',
    icon: 'Cookie',
    category: 'auto',
    baseCost: 100,
    costGrowth: 1.15,
    effect: 1,
    effectLabel: '+1/sec',
    maxLevel: 100,
  },
  {
    id: 'farm',
    name: 'Cookie Farm',
    description: 'Grows cookie plants on a farm.',
    icon: 'Wheat',
    category: 'auto',
    baseCost: 1100,
    costGrowth: 1.15,
    effect: 8,
    effectLabel: '+8/sec',
    maxLevel: 100,
  },
  {
    id: 'factory',
    name: 'Cookie Factory',
    description: 'Mass-produces cookies on an assembly line.',
    icon: 'Factory',
    category: 'auto',
    baseCost: 12000,
    costGrowth: 1.15,
    effect: 47,
    effectLabel: '+47/sec',
    maxLevel: 100,
  },
  {
    id: 'mine',
    name: 'Cookie Mine',
    description: 'Mines chocolate chip ore from deep underground.',
    icon: 'Pickaxe',
    category: 'auto',
    baseCost: 130000,
    costGrowth: 1.15,
    effect: 260,
    effectLabel: '+260/sec',
    maxLevel: 100,
  },
  {
    id: 'lab',
    name: 'Cookie Lab',
    description: 'Synthesizes cookies from quantum particles.',
    icon: 'FlaskConical',
    category: 'auto',
    baseCost: 1400000,
    costGrowth: 1.15,
    effect: 1400,
    effectLabel: '+1400/sec',
    maxLevel: 100,
  },
  {
    id: 'portal',
    name: 'Cookie Portal',
    description: 'Imports cookies from a parallel universe.',
    icon: 'CircleDot',
    category: 'auto',
    baseCost: 20000000,
    costGrowth: 1.15,
    effect: 7800,
    effectLabel: '+7800/sec',
    maxLevel: 100,
  },
];

export function upgradeCost(def: UpgradeDef, currentLevel: number): number {
  return Math.floor(def.baseCost * Math.pow(def.costGrowth, currentLevel));
}

export function computeStats(upgrades: Record<string, number>): {
  clickPower: number;
  autoRate: number;
} {
  let clickPower = 1;
  let autoRate = 0;

  for (const def of UPGRADES) {
    const level = upgrades[def.id] || 0;
    if (level === 0) continue;

    if (def.category === 'click') {
      if (def.id === 'golden_glove') {
        clickPower = clickPower * Math.pow(2, level);
      } else {
        clickPower += def.effect * level;
      }
    } else {
      autoRate += def.effect * level;
    }
  }

  return { clickPower, autoRate };
}
