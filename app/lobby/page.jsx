'use strict';
'use client';

// ========================================================
// app/lobby/page.jsx - Team Lobby & Synced 10..1 Countdown
// ========================================================

import { useState, useEffect } from 'react';
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

        // Server offset: serverNow - (midpoint of request)
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
    const interval = setInterval(fetchLobby, 2000);
    return () => clearInterval(interval);
  }, [router]);

  // Local tick for smooth countdown when active
  useEffect(() => {
    if (countdownSeconds === null || countdownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.replace('/play');
          return 0;
        }
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
      {/* FULL SCREEN COUNTDOWN OVERLAY */}
      {countdownSeconds !== null && countdownSeconds > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0c10]/95 backdrop-blur-md p-6">
          <div className="text-center space-y-4">
            <p className="text-sm font-semibold tracking-wide text-amber-500 uppercase">
              الرحلة تبدأ الآن
            </p>
            <div className="text-8xl font-black text-amber-400 tracking-tighter">
              {countdownSeconds}
            </div>
            <p className="text-xs text-slate-400">
              استعدوا مع فريقكم لحل اللغز الأول...
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="py-4 text-center border-b border-slate-900">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          غرفة انتظار الفريق
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

        {/* Roster Card */}
        <div className="p-4 rounded-xl bg-[#121620] border border-slate-800">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
            <h2 className="text-xs font-bold text-slate-300">
              تشكيل الفريق ({teamMembers.length} من 6)
            </h2>
            <span className="text-[11px] text-slate-500">
              {teamMembers.length < 2 ? 'مطلوب عضو إضافي على الأقل' : 'الفريق جاهز'}
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
            <h2 className="text-xs font-bold text-amber-400 mb-2">
              طلبات انضمام جديدة ({pendingRequests.length})
            </h2>
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

        {/* State Notice Banner */}
        <div className="text-center p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
          <p className="text-xs text-slate-400">
            {gameState === 'LOBBY' && 'بانتظار قفل المشرف لباب التسجيل وتقسيم المسارات...'}
            {gameState === 'LOCKED' && 'تم إغلاق التسجيل وتوزيع العصور! المشرف يستعد لإطلاق العد التنازلي...'}
            {gameState === 'PAUSED' && 'الرحلة متوقفة مؤقتاً بقرار من المشرف.'}
          </p>
        </div>
      </section>

      {/* Footer controls */}
      <footer className="py-2 border-t border-slate-900 flex justify-between items-center text-xs text-slate-500">
        <span>جلسة مسجلة على جهازك</span>
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

