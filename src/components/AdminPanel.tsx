import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchAdminPlayers,
  adminPromote,
  adminDemote,
  adminBan,
  adminUnban,
  adminDeletePlayer,
  adminSetGameState,
} from '@/game/adminApi';
import { UPGRADES, computeStats } from '@/game/upgrades';
import type { AdminPlayer } from '@/lib/supabase';
import {
  Shield, Crown, Ban, Trash2, Pencil, X, Check, Search,
  UserCog, Clock, Infinity as InfinityIcon, RefreshCw, AlertTriangle,
} from 'lucide-react';

type BanModal = { player: AdminPlayer } | null;
type EditModal = { player: AdminPlayer } | null;
type ConfirmModal = { player: AdminPlayer; action: 'delete' | 'promote' | 'demote' } | null;

function formatNum(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return Math.floor(n).toLocaleString();
}

export function AdminPanel() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [banModal, setBanModal] = useState<BanModal>(null);
  const [editModal, setEditModal] = useState<EditModal>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModal>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminPlayers();
      setPlayers(data);
    } catch (err) {
      setToast({ msg: `Failed to load players: ${(err as Error).message}`, ok: false });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  const filtered = players.filter((p) => p.username.toLowerCase().includes(search.toLowerCase()));

  async function handlePromote(player: AdminPlayer) {
    const err = await adminPromote(player.user_id);
    if (err) showToast(err, false);
    else { showToast(`${player.username} is now an admin`, true); load(); }
  }

  async function handleDemote(player: AdminPlayer) {
    const err = await adminDemote(player.user_id);
    if (err) showToast(err, false);
    else { showToast(`${player.username} is no longer an admin`, true); load(); }
  }

  async function handleUnban(player: AdminPlayer) {
    const err = await adminUnban(player.user_id);
    if (err) showToast(err, false);
    else { showToast(`${player.username} has been unbanned`, true); load(); }
  }

  async function handleDelete(player: AdminPlayer) {
    const err = await adminDeletePlayer(player.user_id);
    if (err) showToast(err, false);
    else { showToast(`${player.username} has been permanently deleted`, true); load(); }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-orange-600" />
          <h2 className="font-bold text-gray-800 text-lg">Admin Panel</h2>
          <button onClick={load} className="ml-auto flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search players by name..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading players...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">{search ? 'No players match your search.' : 'No players found.'}</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((player) => {
              const isMe = player.user_id === user?.id;
              const banned = player.is_currently_banned;
              const permanentBan = banned && player.ban_until === null;
              const banExpiry = player.ban_until ? new Date(player.ban_until) : null;
              const banExpired = banExpiry ? banExpiry < new Date() : false;
              return (
                <div key={player.user_id} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        player.is_admin ? 'bg-gradient-to-br from-amber-400 to-orange-600 text-white' :
                        banned ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                      }`}>{player.username.charAt(0).toUpperCase()}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-800 text-sm">{player.username}</span>
                          {player.is_admin && <span className="flex items-center gap-0.5 text-xs font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded"><Crown className="w-3 h-3" /> Admin</span>}
                          {banned && !banExpired && <span className="flex items-center gap-0.5 text-xs font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded"><Ban className="w-3 h-3" /> {permanentBan ? 'Banned' : 'Temp-banned'}</span>}
                          {isMe && <span className="text-xs text-gray-400">(you)</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                          <span>{formatNum(player.score)} cookies</span>
                          <span>{formatNum(player.total_earned)} earned</span>
                          {banned && !banExpired && !permanentBan && banExpiry && <span className="flex items-center gap-0.5 text-red-400"><Clock className="w-3 h-3" /> until {banExpiry.toLocaleDateString()}</span>}
                          {banned && permanentBan && <span className="flex items-center gap-0.5 text-red-400"><InfinityIcon className="w-3 h-3" /> permanent</span>}
                        </div>
                      </div>
                    </div>
                    {!isMe && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button onClick={() => setEditModal({ player })} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Edit game state"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                        {banned && !banExpired ? (
                          <button onClick={() => handleUnban(player)} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"><Check className="w-3.5 h-3.5" /> Unban</button>
                        ) : (
                          <button onClick={() => setBanModal({ player })} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"><Ban className="w-3.5 h-3.5" /> Ban</button>
                        )}
                        {player.is_admin ? (
                          <button onClick={() => setConfirmModal({ player, action: 'demote' })} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"><UserCog className="w-3.5 h-3.5" /> Demote</button>
                        ) : (
                          <button onClick={() => setConfirmModal({ player, action: 'promote' })} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"><Crown className="w-3.5 h-3.5" /> Promote</button>
                        )}
                        <button onClick={() => setConfirmModal({ player, action: 'delete' })} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl shadow-lg text-sm font-medium z-50 ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{toast.msg}</div>
      )}

      {banModal && (
        <BanModalContent
          player={banModal.player}
          onClose={() => setBanModal(null)}
          onConfirm={async (duration, reason) => {
            const banUntil = duration === 'permanent' ? null : new Date(Date.now() + duration * 60 * 1000).toISOString();
            const err = await adminBan(banModal!.player.user_id, banUntil, reason);
            if (err) showToast(err, false);
            else { showToast(`${banModal!.player.username} has been banned`, true); setBanModal(null); load(); }
          }}
        />
      )}

      {editModal && (
        <EditModalContent
          player={editModal.player}
          onClose={() => setEditModal(null)}
          onSave={async (score, totalEarned, clickPower, autoRate, upgrades) => {
            const err = await adminSetGameState(editModal!.player.user_id, score, totalEarned, clickPower, autoRate, upgrades);
            if (err) showToast(err, false);
            else { showToast(`${editModal!.player.username}'s game state updated`, true); setEditModal(null); load(); }
          }}
        />
      )}

      {confirmModal && (
        <ConfirmModalContent
          player={confirmModal.player}
          action={confirmModal.action}
          onClose={() => setConfirmModal(null)}
          onConfirm={() => {
            if (confirmModal!.action === 'delete') handleDelete(confirmModal!.player);
            else if (confirmModal!.action === 'promote') handlePromote(confirmModal!.player);
            else if (confirmModal!.action === 'demote') handleDemote(confirmModal!.player);
            setConfirmModal(null);
          }}
        />
      )}
    </div>
  );
}

function BanModalContent({ player, onClose, onConfirm }: {
  player: AdminPlayer; onClose: () => void; onConfirm: (durationMinutes: number | 'permanent', reason: string) => void;
}) {
  const [duration, setDuration] = useState<number | 'permanent'>(60);
  const [reason, setReason] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');
  const presets = [
    { label: '1 hour', value: 60 }, { label: '6 hours', value: 360 },
    { label: '1 day', value: 1440 }, { label: '7 days', value: 10080 }, { label: '30 days', value: 43200 },
  ];
  const effectiveDuration = duration === 'permanent' ? 'permanent' : customMinutes ? parseInt(customMinutes) || 60 : duration;

  return (
    <ModalWrapper onClose={onClose} title={`Ban ${player.username}`} icon={<Ban className="w-5 h-5 text-yellow-600" />}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ban duration</label>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button key={p.value} onClick={() => { setDuration(p.value); setCustomMinutes(''); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${duration === p.value && !customMinutes ? 'bg-yellow-50 border-yellow-400 text-yellow-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>{p.label}</button>
            ))}
            <button onClick={() => setDuration('permanent')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${duration === 'permanent' ? 'bg-red-50 border-red-400 text-red-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}><InfinityIcon className="w-3.5 h-3.5" /> Permanent</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom duration (minutes)</label>
          <input type="number" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} placeholder="e.g. 120 for 2 hours" min={1} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 outline-none transition-all text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason (optional)</label>
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why are you banning this player?" maxLength={200} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 outline-none transition-all text-sm" />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={() => onConfirm(effectiveDuration, reason)} className="flex-1 py-2.5 rounded-xl bg-yellow-500 text-white font-semibold text-sm hover:bg-yellow-600 transition-colors">Ban Player</button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function EditModalContent({ player, onClose, onSave }: {
  player: AdminPlayer; onClose: () => void;
  onSave: (score: number, totalEarned: number, clickPower: number, autoRate: number, upgrades: Record<string, number>) => void;
}) {
  const [score, setScore] = useState(String(player.score));
  const [totalEarned, setTotalEarned] = useState(String(player.total_earned));
  const [clickPower, setClickPower] = useState(String(player.click_power));
  const [autoRate, setAutoRate] = useState(String(player.auto_rate));
  const [upgrades, setUpgrades] = useState<Record<string, number>>(player.upgrades || {});

  function setUpgradeLevel(id: string, level: number) {
    setUpgrades((prev) => { const next = { ...prev }; if (level <= 0) delete next[id]; else next[id] = level; return next; });
  }

  const previewStats = computeStats(upgrades);

  return (
    <ModalWrapper onClose={onClose} title={`Edit ${player.username}`} icon={<Pencil className="w-5 h-5 text-blue-600" />}>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <FieldInput label="Score (cookies)" value={score} onChange={setScore} />
          <FieldInput label="Total earned" value={totalEarned} onChange={setTotalEarned} />
          <FieldInput label="Click power" value={clickPower} onChange={setClickPower} />
          <FieldInput label="Auto rate (/sec)" value={autoRate} onChange={setAutoRate} />
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
          Computed from upgrades: click power = {previewStats.clickPower}, auto rate = {previewStats.autoRate}/sec. These are overridden by the values above when you save.
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Upgrades</label>
          <div className="space-y-2">
            {UPGRADES.map((def) => {
              const level = upgrades[def.id] || 0;
              return (
                <div key={def.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700">{def.name}</p>
                    <p className="text-xs text-gray-400">{def.effectLabel} (max {def.maxLevel})</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setUpgradeLevel(def.id, Math.max(0, level - 1))} className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors">−</button>
                    <span className="w-10 text-center text-sm font-bold text-gray-700 tabular-nums">{level}</span>
                    <button onClick={() => setUpgradeLevel(def.id, Math.min(def.maxLevel, level + 1))} className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 font-bold hover:bg-orange-200 transition-colors">+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2 pt-2 sticky bottom-0 bg-white pb-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={() => onSave(parseInt(score) || 0, parseInt(totalEarned) || 0, parseInt(clickPower) || 1, parseFloat(autoRate) || 0, upgrades)} className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 transition-colors">Save Changes</button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function FieldInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm tabular-nums" />
    </div>
  );
}

function ConfirmModalContent({ player, action, onClose, onConfirm }: {
  player: AdminPlayer; action: 'delete' | 'promote' | 'demote'; onClose: () => void; onConfirm: () => void;
}) {
  const config = {
    delete: { title: 'Delete account', message: `This will permanently delete ${player.username}'s account, game state, and all data. This cannot be undone.`, confirmLabel: 'Delete Forever', color: 'bg-red-500 hover:bg-red-600', icon: <Trash2 className="w-10 h-10 text-red-500" /> },
    promote: { title: 'Promote to admin', message: `${player.username} will gain full admin privileges, including the ability to ban and delete players.`, confirmLabel: 'Promote', color: 'bg-amber-500 hover:bg-amber-600', icon: <Crown className="w-10 h-10 text-amber-500" /> },
    demote: { title: 'Demote from admin', message: `${player.username} will lose all admin privileges and become a regular player.`, confirmLabel: 'Demote', color: 'bg-gray-500 hover:bg-gray-600', icon: <UserCog className="w-10 h-10 text-gray-500" /> },
  }[action];

  return (
    <ModalWrapper onClose={onClose} title={config.title} icon={null}>
      <div className="text-center py-2">
        <div className="flex justify-center mb-4">{config.icon}</div>
        {action === 'delete' && (
          <div className="flex items-center justify-center gap-1.5 text-red-600 mb-3"><AlertTriangle className="w-4 h-4" /><span className="text-sm font-semibold">Warning</span></div>
        )}
        <p className="text-gray-600 text-sm mb-6">{config.message}</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 rounded-xl text-white font-semibold text-sm transition-colors ${config.color}`}>{config.confirmLabel}</button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function ModalWrapper({ title, icon, onClose, children }: {
  title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
