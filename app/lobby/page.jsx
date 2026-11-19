'use strict';
'use client';

// ========================================================
// app/lobby/page.jsx - Kahoot-Style Synced 10..0 Audio Countdown Lobby
// ========================================================

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function LobbyPage() {
  const router = useRouter();
  const [member, setMember] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [gameState, setGameState] = useState('LOBBY');
  const [countdownSeconds, setCountdownSeconds] = useState(null);
  const [serverClockOffset, setServerClockOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Audio Context Ref for Synthesizer Beeps
  const audioCtxRef = useRef(null);

  // Play Kahoot-style Tick Beep (Web Audio API)
  const playTickSound = (sec) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      if (sec > 0) {
        // High-pitch tension tick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        // Pitch rises as time gets closer: 10 -> 440Hz, 3 -> 660Hz, 1 -> 880Hz
        osc.frequency.setValueAtTime(440 + (10 - sec) * 44, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        // Grand Start Fanfare Chord on 0!
        [523.25, 659.25, 783.99, 1046.5].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.8);
        });
      }
    } catch (e) {
      // Audio autoplay policy fallback (silent if blocked)
    }
  };

  // Initial load & Polling
  useEffect(() => {
    async function fetchLobby() {
      const token = localStorage.getItem('device_token');
      if (!token) {
        router.replace('/');
        return;
      }

      try {
        const clientReqTime = Date.now();
        const res = await fetch('/api/auth/member', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          router.replace('/');
          return;
        }

        const data = await res.json();
        if (!data.member?.team_id) {
          router.replace('/teams');
          return;
        }

        setMember(data.member);
        setTeamMembers(data.teamMembers || []);

        // Fetch journey state
        const journeyRes = await fetch('/api/journey');
        const journeyData = await journeyRes.json();
        const clientResTime = Date.now();

        // Server offset: serverNow - midpoint of request
        const roundTripMid = clientReqTime + (clientResTime - clientReqTime) / 2;
        const offset = (journeyData.serverNow || Date.now()) - roundTripMid;
        setServerClockOffset(offset);
        setGameState(journeyData.state);

        // If game is already running, go straight to play
        if (journeyData.state === 'RUNNING') {
          router.replace('/play');
          return;
        }

        // If Countdown active
        if (journeyData.state === 'COUNTDOWN' && journeyData.startAtEpoch) {
          const adjustedClientNow = Date.now() + offset;
          const diff = Math.ceil((journeyData.startAtEpoch - adjustedClientNow) / 1000);
          if (diff <= 0) {
            playTickSound(0);
            router.replace('/play');
            return;
          }
          setCountdownSeconds(diff);
        } else {
          setCountdownSeconds(null);
        }

        // If leader, fetch pending requests
        if (data.member.is_leader) {
          const reqRes = await fetch('/api/teams/join', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (reqRes.ok) {
            const reqData = await reqRes.json();
            setPendingRequests(reqData.requests || []);
          }
        }
      } catch (err) {
        console.error('Lobby poll error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLobby();
    const interval = setInterval(fetchLobby, 1500); // Fast polling for Kahoot sync
    return () => clearInterval(interval);
  }, [router]);

  // Local tick for smooth 10..0 countdown with sound
  useEffect(() => {
    if (countdownSeconds === null || countdownSeconds <= 0) return;

    // Play tick sound for current second
    playTickSound(countdownSeconds);

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          playTickSound(0); // Launch sound!
          setTimeout(() => {
            router.replace('/play');
          }, 800);
          return 0;
        }
        playTickSound(prev - 1);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownSeconds, router]);

  async function handleRequestAction(requestId, action) {
    setActionLoading(true);
    setError('');
    const token = localStorage.getItem('device_token');

    try {
      const res = await fetch('/api/teams/join', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'تعذر تنفيذ الإجراء');
      } else {
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        // Refresh team roster
        const authRes = await fetch('/api/auth/member', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const authData = await authRes.json();
        setTeamMembers(authData.teamMembers || []);
      }
    } catch (e) {
      setError('خطأ في الاتصال');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLeaveTeam() {
    if (!confirm('هل أنت متأكد من مغادرة الفريق؟')) return;
    const token = localStorage.getItem('device_token');

    try {
      await fetch('/api/teams/members', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      router.replace('/teams');
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#0a0c10]">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-lg mx-auto p-4 flex flex-col justify-between bg-[#0a0c10] text-slate-200 relative">
      {/* KAHOOT-STYLE FULL SCREEN SYNCED COUNTDOWN OVERLAY */}
      {countdownSeconds !== null && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0c10]/98 backdrop-blur-xl p-6 select-none animate-fade-in">
          <div className="text-center space-y-4">
            <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500 text-amber-400 text-xs font-black tracking-widest uppercase">
              🚀 استعدوا للانطلاق 🚀
            </span>

            {countdownSeconds > 0 ? (
              <div className="text-9xl font-black text-amber-400 tracking-tighter scale-110 transition-transform duration-200">
                {countdownSeconds}
              </div>
            ) : (
              <div className="text-4xl font-black text-emerald-400 tracking-tight animate-bounce">
                انطلقت الرحلة!
              </div>
            )}

            <p className="text-xs text-slate-300">
              {countdownSeconds > 0
                ? 'الجيم ماستر أطلق شارة البداية، اللعبة ستفتح فوراً...'
                : 'جاري فتح المستويات لجميع الفرق الآن...'}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="py-4 text-center border-b border-slate-900">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 mb-2 font-bold">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          🔒 اللعبة مقفولة حالياً • بانتظار إطلاق الجيم ماستر
        </div>

        <div className="flex items-center justify-center gap-3 mt-1">
          <span className="text-3xl">{member?.team_icon}</span>
          <h1 className="text-2xl font-bold text-slate-100">{member?.team_name}</h1>
        </div>

        {/* Assigned Era Banner if locked */}
        {member?.era_name ? (
          <div
            className="mt-3 inline-block px-4 py-1.5 rounded-lg text-xs font-bold border"
            style={{
              backgroundColor: `${member.era_color}15`,
              borderColor: member.era_color,
              color: member.era_color,
            }}
          >
            المسار: {member.era_name} ({member.era_ruler}) • التفريعة {member.variant}
          </div>
        ) : (
          <p className="text-xs text-amber-500/80 mt-2">
            بانتظار قفل التسجيل لتحديد العصر التاريخي لفريقكم...
          </p>
        )}
      </header>

      {/* Roster & Members */}
      <section className="flex-1 py-4 space-y-4">
        {error && (
          <div className="p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-900 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Big Waiting / Locked Banner */}
        <div className="p-5 rounded-2xl bg-[#121620] border border-slate-800 text-center space-y-3">
          <div className="text-4xl">⏳</div>
          <h2 className="text-base font-bold text-slate-100">
            أنتم الآن في صالة الانتظار الميدانية
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            مثل مسابقات كهوت والهاكاثونات؛ لا يمكن لأي فريق فتح الألغاز أو البدء إلا بعد ضغط الجيم ماستر على زر البداية، وستظهر لكم شاشة عد تنازلي جماعية (10..0) بصوت موحد على كل الهواتف.
          </p>
        </div>

        {/* Roster Card */}
        <div className="p-4 rounded-xl bg-[#121620] border border-slate-800">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
            <h3 className="text-xs font-bold text-slate-300">
              تشكيل الفريق ({teamMembers.length} من 6)
            </h3>
            <span className="text-[11px] text-slate-500">
              {teamMembers.length < 2 ? 'مطلوب عضو إضافي على الأقل' : 'الفريق جاهز للمنافسة'}
            </span>
          </div>

          <div className="space-y-2">
            {teamMembers.map((tm) => (
              <div
                key={tm.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">👤</span>
                  <span className="font-semibold text-slate-200">{tm.name}</span>
                </div>
                {tm.is_leader ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/50">
                    القائد
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">عضو</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pending Requests (For Leader) */}
        {member?.is_leader && pendingRequests.length > 0 && (
          <div className="p-4 rounded-xl bg-[#121620] border border-amber-900/40">
            <h3 className="text-xs font-bold text-amber-400 mb-2">
              طلبات انضمام جديدة ({pendingRequests.length})
            </h3>
            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                >
                  <span className="font-medium text-slate-200">{req.member_name}</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleRequestAction(req.id, 'ACCEPT')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded text-[11px]"
                    >
                      قبول
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleRequestAction(req.id, 'REJECT')}
                      className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold rounded text-[11px]"
                    >
                      رفض
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Footer controls */}
      <footer className="py-2 border-t border-slate-900 flex justify-between items-center text-xs text-slate-500">
        <span>جلسة مسجلة على هذا الهاتف</span>
        <button
          type="button"
          onClick={handleLeaveTeam}
          className="text-rose-400/80 hover:text-rose-400 transition"
        >
          مغادرة الفريق
        </button>
      </footer>
    </main>
  );
}
