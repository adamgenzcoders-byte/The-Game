'use strict';
'use client';

// ========================================================
// app/progress/page.jsx - Team Progress, Era Rank & Race Strip
// ========================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProgressPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      const token = localStorage.getItem('device_token');
      if (!token) {
        router.replace('/');
        return;
      }

      try {
        const res = await fetch('/api/progress', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          router.replace('/play');
          return;
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
    const interval = setInterval(fetchProgress, 3000);
    return () => clearInterval(interval);
  }, [router]);

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} دقيقة و ${secs} ثانية`;
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#0a0c10]">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  const team = data?.team;
  const members = data?.members || [];
  const raceStrip = data?.raceStrip || [];
  const eraColor = team?.eraColor || '#d4af37';

  return (
    <main className="min-h-screen max-w-lg mx-auto p-4 flex flex-col justify-between bg-[#0a0c10] text-slate-200">
      {/* Header */}
      <header className="flex items-center justify-between py-2 border-b border-slate-900">
        <Link
          href="/play"
          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#121620] border border-slate-800 text-slate-300 hover:text-white transition"
        >
          ← العودة للغز الحالي
        </Link>

        <div
          className="text-xs font-bold px-3 py-1 rounded-full border"
          style={{
            borderColor: eraColor,
            backgroundColor: `${eraColor}15`,
            color: eraColor,
          }}
        >
          {team?.eraName} ({team?.eraRuler})
        </div>
      </header>

      {/* Main Content */}
      <section className="flex-1 my-3 space-y-3 overflow-y-auto max-h-[78vh]">
        {/* Team Profile Card */}
        <div className="p-4 rounded-xl bg-[#121620] border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{team?.icon}</span>
              <div>
                <h1 className="text-base font-bold text-slate-100">{team?.name}</h1>
                <p className="text-[11px] text-slate-400">
                  التفريعة: {team?.variant} • المستوى الحالي: {team?.currentLevel} من 10
                </p>
              </div>
            </div>

            <div className="text-center bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                الترتيب في العصر
              </span>
              <span className="text-base font-black text-amber-400">
                {team?.rankInEra}{' '}
                <span className="text-[10px] text-slate-400 font-normal">
                  / {team?.totalTeamsInEra}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Time & Penalties Card */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-[#121620] border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">الوقت الميداني الفعلي</span>
            <span className="text-sm font-bold text-slate-200">
              {formatTime(team?.elapsedSeconds || 0)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#121620] border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">غرامات التلميحات</span>
            <span
              className={`text-sm font-bold ${
                team?.penaltySeconds > 0 ? 'text-rose-400' : 'text-slate-200'
              }`}
            >
              +{team?.penaltySeconds || 0} ثانية
            </span>
          </div>
        </div>

        {/* Team Members List */}
        <div className="p-3 rounded-xl bg-[#121620] border border-slate-800">
          <h2 className="text-xs font-bold text-slate-300 mb-2">أعضاء الفريق ({members.length})</h2>
          <div className="flex flex-wrap gap-1.5">
            {members.map((m) => (
              <span
                key={m.id}
                className={`text-xs px-2.5 py-1 rounded-lg border ${
                  m.isLeader
                    ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                {m.name} {m.isLeader && '👑'}
              </span>
            ))}
          </div>
        </div>

        {/* Era Race Strip */}
        <div className="p-4 rounded-xl bg-[#121620] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-200">
              سباق فرق {team?.eraName}
            </h2>
            <span className="text-[10px] text-slate-500">مباشر ومحدث تلقائياً</span>
          </div>

          <div className="space-y-2">
            {raceStrip.map((t, idx) => (
              <div
                key={t.id}
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition ${
                  t.isMyTeam
                    ? 'bg-amber-950/30 border-amber-600/70'
                    : 'bg-slate-900/60 border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400 w-4">{idx + 1}</span>
                  <span>{t.icon}</span>
                  <span
                    className={`font-semibold ${
                      t.isMyTeam ? 'text-amber-300 font-bold' : 'text-slate-300'
                    }`}
                  >
                    {t.name} {t.isMyTeam && '(فريقكم)'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">
                    {t.isFinished ? '🏆 تم الإنهاء' : `مستوى ${t.currentLevel}/10`}
                  </span>
                  {/* Mini Progress Bar */}
                  <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(t.currentLevel / 10) * 100}%`,
                        backgroundColor: eraColor,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-2 text-center text-[11px] text-slate-500">
        الفريق الأول الذي يتم الـ 10 مستويات يتأهل لتمثيل العصر على المسرح الكبير.
      </footer>
    </main>
  );
}

