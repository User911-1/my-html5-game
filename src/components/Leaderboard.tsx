import { useEffect, useState } from 'react';
import { supabase, type LeaderboardEntry } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Trophy, Crown, Medal } from 'lucide-react';

export function Leaderboard() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('rank', { ascending: true })
        .limit(50);

      if (cancelled) return;
      if (error) {
        console.error('Leaderboard error:', error.message);
        setLoading(false);
        return;
      }
      setEntries((data || []) as LeaderboardEntry[]);
      setLoading(false);
    })();

    // Refresh every 15 seconds
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .order('rank', { ascending: true })
        .limit(50);
      if (!cancelled && data) setEntries(data as LeaderboardEntry[]);
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  function formatNum(n: number): string {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return Math.floor(n).toLocaleString();
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-orange-100">
        <Trophy className="w-5 h-5 text-amber-600" />
        <h2 className="font-bold text-gray-800">Leaderboard</h2>
        <span className="text-xs text-gray-400 ml-auto">Top 50 by total earned</span>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Loading rankings...</div>
      ) : entries.length === 0 ? (
        <div className="p-8 text-center text-gray-400">No players yet.</div>
      ) : (
        <div className="max-h-[500px] overflow-y-auto">
          {entries.map((entry, i) => {
            const isMe = profile?.user_id === entry.user_id;
            const rank = i + 1;
            return (
              <div
                key={entry.user_id}
                className={`flex items-center gap-3 px-5 py-3 border-b border-gray-50 transition-colors ${
                  isMe ? 'bg-amber-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-8 flex justify-center">
                  {rank === 1 ? (
                    <Crown className="w-5 h-5 text-yellow-500" />
                  ) : rank === 2 ? (
                    <Medal className="w-5 h-5 text-gray-400" />
                  ) : rank === 3 ? (
                    <Medal className="w-5 h-5 text-amber-700" />
                  ) : (
                    <span className="text-sm font-bold text-gray-400">{rank}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-semibold text-sm truncate ${
                      isMe ? 'text-orange-600' : 'text-gray-700'
                    }`}
                  >
                    {entry.username}
                    {isMe && <span className="ml-1.5 text-xs font-normal">(you)</span>}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatNum(entry.total_earned)} total earned
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-700">
                    {formatNum(entry.score)}
                  </p>
                  <p className="text-xs text-gray-400">cookies</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
