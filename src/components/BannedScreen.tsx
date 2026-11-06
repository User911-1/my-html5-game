import { useAuth } from '@/context/AuthContext';
import { ShieldX, LogOut } from 'lucide-react';

export function BannedScreen() {
  const { profile, signOut } = useAuth();

  const banUntil = profile?.ban_until;
  const isPermanent = !banUntil;
  const expiry = banUntil ? new Date(banUntil).toLocaleString() : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg mb-6">
          <ShieldX className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-800 mb-3">
          You have been banned
        </h1>
        <p className="text-gray-500 mb-6">
          {isPermanent
            ? 'This is a permanent ban. You can no longer play Cookie Clicker on this account.'
            : `This ban expires on ${expiry}. You will be able to play again after that time.`}
        </p>
        <button
          onClick={() => signOut()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
        >
          <LogOut className="w-5 h-5" /> Log Out
        </button>
      </div>
    </div>
  );
}
