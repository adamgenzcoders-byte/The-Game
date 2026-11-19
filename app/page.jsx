'use strict';
'use client';

// ========================================================
// app/page.jsx - Calm Minimal Landing Page (Arabic, RTL)
// ========================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState('');

  // Admin secret login toggle
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Manual token recovery
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState('');

  // Auto-check existing session in localStorage
  useEffect(() => {
    async function checkSession() {
      const storedToken = localStorage.getItem('device_token');
      if (!storedToken) {
        setCheckingSession(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/member', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            // Check if already in a team
            if (data.member?.team_id) {
              // Check game state
              const journeyRes = await fetch('/api/journey');
              const journeyData = await journeyRes.json();
              if (journeyData.state === 'RUNNING') {
                router.replace('/play');
                return;
              } else {
                router.replace('/lobby');
                return;
              }
            } else {
              router.replace('/teams');
              return;
            }
          }
        }
      } catch (err) {
        console.error('Session verify failed:', err);
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, [router]);

  async function handleStart(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) {
      setError('يرجى كتابة اسمك الثلاثي أو الثنائي بشكل صحيح');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const existingToken = localStorage.getItem('device_token') || undefined;
      const res = await fetch('/api/auth/member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, deviceToken: existingToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء الدخول');
        setLoading(false);
        return;
      }

      localStorage.setItem('device_token', data.token);
      localStorage.setItem('member_name', data.name);
      localStorage.setItem('member_id', data.memberId);

      router.push('/teams');
    } catch (err) {
      console.error(err);
      setError('تعذر الاتصال بالخادم، تحقق من شبكة المدرسة');
      setLoading(false);
    }
  }

  async function handleAdminLogin(e) {
    e.preventDefault();
    if (!adminPassword) return;
    setAdminLoading(true);
    setAdminError('');

    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAdminError(data.error || 'كلمة المرور غير صحيحة');
        setAdminLoading(false);
        return;
      }

      localStorage.setItem('admin_token', data.token);
      router.push('/admin');
    } catch (err) {
      setAdminError('فشل تسجيل الدخول للمشرف');
      setAdminLoading(false);
    }
  }

  async function handleRecoverSession(e) {
    e.preventDefault();
    if (!recoveryToken.trim()) return;
    localStorage.setItem('device_token', recoveryToken.trim());
    window.location.reload();
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#0a0c10]">
        <div className="text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm">جاري استعادة الجلسة...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col justify-between p-6 max-w-md mx-auto bg-[#0a0c10] text-slate-200">
      {/* School & Event Header */}
      <header className="pt-8 text-center space-y-2">
        <div className="inline-block px-3 py-1 text-xs tracking-wider font-semibold rounded-full bg-slate-900 border border-slate-800 text-amber-500">
          مدرسة السويدي الدولية للتكنولوجيا التطبيقية
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          لغز مصر عبر الحضارات
        </h1>
        <p className="text-xs text-slate-400">
          رحلة البحث التاريخية وحل قضية المدرسة
        </p>
      </header>

      {/* Main Single-Input Form */}
      <section className="my-auto py-8">
        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <label htmlFor="student-name" className="block text-sm font-medium text-slate-300 mb-2">
              اسمك (كما هو مسجل في المدرسة)
            </label>
            <input
              id="student-name"
              type="text"
              dir="auto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اكتب اسمك هنا..."
              autoComplete="name"
              className="w-full px-4 py-3.5 rounded-xl bg-[#121620] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 text-center bg-rose-950/40 border border-rose-900/60 p-2.5 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 disabled:opacity-50 text-slate-950 font-bold text-base shadow-sm transition"
          >
            {loading ? 'جاري الدخول...' : 'ابدأ الرحلة'}
          </button>
        </form>

        {/* Recover session link */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => setShowRecovery(!showRecovery)}
            className="text-xs text-slate-500 hover:text-slate-400 transition"
          >
            مسحت بيانات المتصفح وتريد استعادة جلستك؟
          </button>

          {showRecovery && (
            <form onSubmit={handleRecoverSession} className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="أدخل رمز جهازك القديم (Token)..."
                value={recoveryToken}
                onChange={(e) => setRecoveryToken(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg bg-[#121620] border border-slate-800 text-slate-200"
              />
              <button
                type="submit"
                className="px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
              >
                استعادة
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Admin Login Link at Bottom */}
      <footer className="pb-4 text-center border-t border-slate-900/80 pt-4">
        {!showAdminLogin ? (
          <button
            type="button"
            onClick={() => setShowAdminLogin(true)}
            className="text-xs text-slate-600 hover:text-slate-400 transition"
          >
            أنا المشرف
          </button>
        ) : (
          <form onSubmit={handleAdminLogin} className="space-y-2 max-w-xs mx-auto text-right">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400">بوابة مشرف الرحلة</label>
              <button
                type="button"
                onClick={() => setShowAdminLogin(false)}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                إلغاء
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="كلمة مرور المشرف..."
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg bg-[#121620] border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-600"
              />
              <button
                type="submit"
                disabled={adminLoading}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950"
              >
                {adminLoading ? '...' : 'دخول'}
              </button>
            </div>
            {adminError && <p className="text-[11px] text-rose-400">{adminError}</p>}
          </form>
        )}
      </footer>
    </main>
  );
}
