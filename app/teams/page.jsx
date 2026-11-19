'use client';

// ========================================================
// app/teams/page.jsx - Team Creation & Join Selection
// ========================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeamsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'join'
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Teams data
  const [teams, setTeams] = useState([]);
  const [takenIcons, setTakenIcons] = useState([]);
  const [allIcons, setAllIcons] = useState([]);

  // Create Form State
  const [teamName, setTeamName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Check user session
  useEffect(() => {
    async function loadData() {
      const token = localStorage.getItem('device_token');
      if (!token) {
        router.replace('/');
        return;
      }

      try {
        // Check current member
        const authRes = await fetch('/api/auth/member', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!authRes.ok) {
          router.replace('/');
          return;
        }

        const authData = await authRes.json();
        if (authData.member?.team_id) {
          router.replace('/lobby');
          return;
        }

        // Fetch teams list
        const teamsRes = await fetch('/api/teams');
        const teamsData = await teamsRes.json();

        setTeams(teamsData.teams || []);
        setTakenIcons(teamsData.takenIcons || []);
        setAllIcons(teamsData.allIcons || []);

        // Default icon selection to first available
        const firstFree = (teamsData.allIcons || []).find(
          (ico) => !(teamsData.takenIcons || []).includes(ico)
        );
        if (firstFree) setSelectedIcon(firstFree);
      } catch (err) {
        console.error(err);
        setError('تعذر تحميل بيانات الفرق');
      } finally {
        setLoading(false);
      }
    }

    loadData();
    const interval = setInterval(loadData, 5000); // Polling teams list
    return () => clearInterval(interval);
  }, [router]);

  async function handleCreateTeam(e) {
    e.preventDefault();
    if (!teamName.trim() || !selectedIcon) {
      setError('يرجى تحديد اسم الفريق واختيار أيقونة');
      return;
    }

    setSubmitting(true);
    setError('');
    const token = localStorage.getItem('device_token');

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: teamName.trim(), icon: selectedIcon }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'تعذر إنشاء الفريق');
        setSubmitting(false);
        return;
      }

      router.push('/lobby');
    } catch (err) {
      setError('حدث خطأ في الاتصال بالشبكة');
      setSubmitting(false);
    }
  }

  async function handleSendJoinRequest(teamId) {
    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    const token = localStorage.getItem('device_token');

    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teamId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'تعذر إرسال طلب الانضمام');
        setSubmitting(false);
        return;
      }

      setSuccessMsg(data.message || 'تم إرسال الطلب، بانتظار موافقة قائد الفريق');
      setSubmitting(false);

      // Poll member status to redirect once accepted
      setTimeout(async () => {
        const check = await fetch('/api/auth/member', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const cData = await check.json();
        if (cData.member?.team_id) {
          router.push('/lobby');
        }
      }, 3000);
    } catch (err) {
      setError('حدث خطأ في الشبكة');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#0a0c10]">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen max-w-lg mx-auto p-4 flex flex-col justify-between bg-[#0a0c10] text-slate-200">
      <header className="py-4 text-center">
        <h1 className="text-xl font-bold text-slate-100 mb-1">تنسيق الفرق الميدانية</h1>
        <p className="text-xs text-slate-400">
          يتكون كل فريق من 2 إلى 6 طلاب لخوض التحديات سوياً
        </p>

        {/* Tab Switcher */}
        <div className="flex bg-[#121620] p-1 rounded-xl border border-slate-800 mt-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'create'
                ? 'bg-amber-600 text-slate-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            إنشاء فريق جديد
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('join');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'join'
                ? 'bg-amber-600 text-slate-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            الانضمام لفريق موجود ({teams.length})
          </button>
        </div>
      </header>

      {/* Notifications */}
      {error && (
        <div className="p-3 my-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-900 rounded-lg text-center">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-3 my-2 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-900 rounded-lg text-center">
          {successMsg}
        </div>
      )}

      {/* CREATE TAB */}
      {activeTab === 'create' && (
        <section className="flex-1 my-2">
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                اسم الفريق (يجب أن يكون مميزاً)
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="مثال: حراس الأهرامات، صقور النيل..."
                className="w-full px-4 py-3 rounded-xl bg-[#121620] border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-amber-600"
                disabled={submitting}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  شعار الفريق (اختر الأيقونة المناسبة لفريقك)
                </label>
                {selectedIcon && (
                  <span className="text-xs text-amber-500 font-semibold">
                    المختار: {selectedIcon}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-6 gap-2 bg-[#121620] p-3 rounded-xl border border-slate-800">
                {allIcons.map((ico) => {
                  const isSelected = selectedIcon === ico;

                  return (
                    <button
                      key={ico}
                      type="button"
                      onClick={() => setSelectedIcon(ico)}
                      className={`h-11 rounded-lg text-lg flex items-center justify-center transition border ${
                        isSelected
                          ? 'border-amber-500 bg-amber-950/50 scale-105 shadow-md shadow-amber-500/20'
                          : 'border-slate-800 bg-slate-900/80 hover:border-slate-600 hover:bg-slate-800'
                      }`}
                    >
                      {ico}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !teamName.trim() || !selectedIcon}
              className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 disabled:opacity-50 text-slate-950 font-bold text-sm transition"
            >
              {submitting ? 'جاري الإنشاء...' : 'تأكيد إنشاء الفريق'}
            </button>
          </form>
        </section>
      )}

      {/* JOIN TAB */}
      {activeTab === 'join' && (
        <section className="flex-1 my-2 flex flex-col">
          <div className="mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن اسم الفريق..."
              className="w-full px-3 py-2.5 rounded-xl bg-[#121620] border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-600"
            />
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[60vh] pr-1">
            {filteredTeams.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-8">
                لا توجد فرق مطابقة. بادر بإنشاء أول فريق!
              </p>
            ) : (
              filteredTeams.map((t) => {
                const count = t.member_count || t.members?.length || 0;
                const isFull = count >= 6;

                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#121620] border border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{t.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-[10px] font-mono font-bold text-amber-400">
                            #{t.team_number || 1}
                          </span>
                          <h3 className="text-sm font-bold text-slate-200">{t.name}</h3>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {count} من 6 أعضاء {isFull && '• مكتمل'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isFull || submitting}
                      onClick={() => handleSendJoinRequest(t.id)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition"
                    >
                      {isFull ? 'مكتمل' : 'انضمام'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      <footer className="py-2 text-center text-[11px] text-slate-500">
        بمجرد انضمامك لفريقك، سينقلك النظام لغرفة الانتظار حتى شارة البداية.
      </footer>
    </main>
  );
}

