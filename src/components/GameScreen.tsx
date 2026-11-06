import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { GameProvider, useGame } from '@/context/GameContext';
import { CookieClicker } from './CookieClicker';
import { UpgradeShop } from './UpgradeShop';
import { Leaderboard } from './Leaderboard';
import { AdminPanel } from './AdminPanel';
import { LogOut, User, Shield, Gamepad, Trophy } from 'lucide-react';

type Tab = 'game' | 'leaderboard' | 'admin';

function GameContent() {
  const { profile, signOut, isAdmin } = useAuth();
  const { saveNow } = useGame();
  const [tab, setTab] = useState<Tab>('game');

  const handleSignOut = async () => {
    await saveNow();
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="font-bold text-gray-800 hidden sm:block">Cookie Clicker</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{profile?.username}</span>
              {isAdmin && <Shield className="w-3.5 h-3.5 text-amber-600" />}
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-2">
          <div className="flex gap-1">
            <TabButton active={tab === 'game'} onClick={() => setTab('game')} icon={<Gamepad className="w-4 h-4" />} label="Game" />
            <TabButton active={tab === 'leaderboard'} onClick={() => setTab('leaderboard')} icon={<Trophy className="w-4 h-4" />} label="Leaderboard" />
            {isAdmin && (
              <TabButton active={tab === 'admin'} onClick={() => setTab('admin')} icon={<Shield className="w-4 h-4" />} label="Admin" />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'game' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-1 flex flex-col gap-6"><CookieClicker /></div>
            <div className="lg:col-span-1"><UpgradeShop /></div>
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className="max-w-2xl mx-auto"><Leaderboard /></div>
        )}

        {tab === 'admin' && isAdmin && (
          <div className="max-w-4xl mx-auto"><AdminPanel /></div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">Your progress auto-saves continuously.</p>
      </main>
    </div>
  );
}

export function GameScreen() {
  const { user } = useAuth();
  return (
    <GameProvider userId={user?.id ?? null}>
      <GameContent />
    </GameProvider>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
        active ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      {icon}{label}
    </button>
  );
}
