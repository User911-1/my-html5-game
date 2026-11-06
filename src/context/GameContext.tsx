import { createContext, useContext, type ReactNode } from 'react';
import { useGameState, type GameData } from '@/game/useGameState';

type GameContextValue = {
  data: GameData;
  loaded: boolean;
  click: () => void;
  buyUpgrade: ReturnType<typeof useGameState>['buyUpgrade'];
  saveNow: () => Promise<boolean | undefined>;
};

const GameContext = createContext<GameContextValue | undefined>(undefined);

export function GameProvider({ userId, children }: { userId: string | null; children: ReactNode }) {
  const { data, loaded, click, buyUpgrade, saveNow } = useGameState(userId);

  return (
    <GameContext.Provider value={{ data, loaded, click, buyUpgrade, saveNow }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
