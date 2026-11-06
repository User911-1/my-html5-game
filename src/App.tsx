import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AuthScreen } from '@/components/AuthScreen';
import { GameScreen } from '@/components/GameScreen';
import { BannedScreen } from '@/components/BannedScreen';
import { Loader2 } from 'lucide-react';

function AppInner() {
  const { user, loading, isBanned } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;
  if (isBanned) return <BannedScreen />;
  return <GameScreen />;
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;
