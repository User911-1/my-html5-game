import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, type GameState } from '@/lib/supabase';
import { computeStats, type UpgradeDef, upgradeCost } from './upgrades';

const AUTO_TICK_MS = 100;
const SAVE_INTERVAL_MS = 5000;

export type GameData = {
  score: number;
  totalEarned: number;
  clickPower: number;
  autoRate: number;
  upgrades: Record<string, number>;
};

async function saveToDb(userId: string, data: GameData) {
  const { error } = await supabase.from('game_state').upsert({
    user_id: userId,
    score: Math.floor(data.score),
    total_earned: Math.floor(data.totalEarned),
    click_power: data.clickPower,
    auto_rate: data.autoRate,
    upgrades: data.upgrades,
    last_saved: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error('Save failed:', error.message);
  }
  return !error;
}

export function useGameState(userId: string | null) {
  const [data, setData] = useState<GameData>({
    score: 0,
    totalEarned: 0,
    clickPower: 1,
    autoRate: 0,
    upgrades: {},
  });
  const [loaded, setLoaded] = useState(false);
  const dataRef = useRef(data);
  const dirtyRef = useRef(false);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!userId) {
      setLoaded(false);
      setData({ score: 0, totalEarned: 0, clickPower: 1, autoRate: 0, upgrades: {} });
      return;
    }

    let cancelled = false;
    (async () => {
      const { data: row, error } = await supabase
        .from('game_state')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('Failed to load game state:', error.message);
        setLoaded(true);
        return;
      }

      if (row) {
        const gs = row as GameState;
        const stats = computeStats(gs.upgrades || {});
        setData({
          score: gs.score,
          totalEarned: gs.total_earned,
          clickPower: stats.clickPower,
          autoRate: stats.autoRate,
          upgrades: gs.upgrades || {},
        });
      }
      setLoaded(true);
    })();

    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!userId || !loaded) return;
    const interval = setInterval(() => {
      setData((prev) => {
        if (prev.autoRate <= 0) return prev;
        const gain = prev.autoRate * (AUTO_TICK_MS / 1000);
        dirtyRef.current = true;
        return { ...prev, score: prev.score + gain, totalEarned: prev.totalEarned + gain };
      });
    }, AUTO_TICK_MS);
    return () => clearInterval(interval);
  }, [userId, loaded]);

  useEffect(() => {
    if (!userId || !loaded) return;
    const interval = setInterval(() => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      saveToDb(userIdRef.current!, dataRef.current);
    }, SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [userId, loaded]);

  useEffect(() => {
    if (!userId || !loaded) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && dirtyRef.current) {
        dirtyRef.current = false;
        saveToDb(userIdRef.current!, dataRef.current);
      }
    };

    const handleBeforeUnload = () => {
      if (dirtyRef.current) {
        dirtyRef.current = false;
        saveToDb(userIdRef.current!, dataRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId, loaded]);

  const click = useCallback(() => {
    setData((prev) => {
      dirtyRef.current = true;
      return { ...prev, score: prev.score + prev.clickPower, totalEarned: prev.totalEarned + prev.clickPower };
    });
  }, []);

  const buyUpgrade = useCallback((def: UpgradeDef) => {
    let success = false;
    setData((prev) => {
      const currentLevel = prev.upgrades[def.id] || 0;
      if (currentLevel >= def.maxLevel) return prev;
      const cost = upgradeCost(def, currentLevel);
      if (prev.score < cost) return prev;

      const newUpgrades = { ...prev.upgrades, [def.id]: currentLevel + 1 };
      const stats = computeStats(newUpgrades);
      success = true;
      dirtyRef.current = true;
      return { ...prev, score: prev.score - cost, upgrades: newUpgrades, clickPower: stats.clickPower, autoRate: stats.autoRate };
    });
    return success;
  }, []);

  const saveNow = useCallback(async () => {
    if (!userId) return false;
    dirtyRef.current = false;
    return saveToDb(userId, dataRef.current);
  }, [userId]);

  return { data, loaded, click, buyUpgrade, saveNow };
}
