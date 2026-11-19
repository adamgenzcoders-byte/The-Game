'use client';

// ========================================================
// app/admin/page.jsx - Comprehensive School Mystery Admin Dashboard
// ========================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active Main Tab
  const [activeTab, setActiveTab] = useState('journey'); // 'journey' | 'teams' | 'monitor' | 'content' | 'stage' | 'printables'
  const [durationMinutes, setDurationMinutes] = useState(180); // Default 3 hours

  // Dashboard Data
  const [journeyData, setJourneyData] = useState(null);
  const [teams, setTeams] = useState([]);
  const [content, setContent] = useState(null);
  const [stageData, setStageData] = useState(null);

  // Announcement Broadcast State
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementEra, setAnnouncementEra] = useState('');
  const [announcementLoading, setAnnouncementLoading] = useState(false);

  // Content Editor Sub-tab
  const [contentSubTab, setContentSubTab] = useState('levels'); // 'settings' | 'eras' | 'levels' | 'variants' | 'booths' | 'engineers'
  const [selectedLevelId, setSelectedLevelId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Check admin token on mount
  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      try {
        const res = await fetch('/api/auth/admin', {
          headers: { 'x-admin-key': token },
        });
        const data = await res.json();
        if (data.isAdmin) {
          setIsAdmin(true);
          setAdminToken(token);
        }
      } catch (err) {
        console.error(err);
      }
    }

    checkAuth();
  }, []);

  // Poll Data when admin
  useEffect(() => {
    if (!isAdmin) return;

    async function loadAdminData() {
      const token = localStorage.getItem('admin_token');
      const headers = { 'x-admin-key': token };

      try {
        // Journey & era stats
        const jRes = await fetch('/api/journey', { headers });
        const jData = await jRes.json();
        setJourneyData(jData);

        // Teams list
        const tRes = await fetch('/api/teams', { headers });
        const tData = await tRes.json();
        setTeams(tData.teams || []);

        // Stage reveal
        const sRes = await fetch('/api/stage-reveal', { headers });
        const sData = await sRes.json();
        setStageData(sData);
      } catch (err) {
        console.error('Error polling admin data:', err);
      }
    }

    loadAdminData();
    const interval = setInterval(loadAdminData, 3000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  // Load Content for Editor
  async function loadContentData() {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/admin/content', {
        headers: { 'x-admin-key': token },
      });
      const data = await res.json();
      setContent(data);
      if (data.levels && data.levels.length > 0 && !selectedLevelId) {
        setSelectedLevelId(data.levels[0].id);
        setEditingItem(data.levels[0]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (isAdmin && activeTab === 'content') {
      loadContentData();
    }
  }, [isAdmin, activeTab]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'كلمة المرور غير صحيحة');
        setLoginLoading(false);
        return;
      }

      localStorage.setItem('admin_token', data.token);
      setAdminToken(data.token);
      setIsAdmin(true);
    } catch (err) {
      setLoginError('فشل الاتصال بالخادم');
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('admin_token');
    setAdminToken('');
    setIsAdmin(false);
  }

  // Announcement Handlers
  async function handleSendAnnouncement(e) {
    if (e) e.preventDefault();
    if (!announcementText.trim()) return;
    setAnnouncementLoading(true);
    try {
      await triggerJourneyAction('SEND_ANNOUNCEMENT', {
        text: announcementText.trim(),
        eraId: announcementEra ? Number(announcementEra) : null,
      });
      setAnnouncementText('');
    } finally {
      setAnnouncementLoading(false);
    }
  }

  async function handleClearAnnouncement() {
    await triggerJourneyAction('CLEAR_ANNOUNCEMENT');
  }

  // Journey Action Handler
  async function triggerJourneyAction(action, payload = {}) {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    if (action === 'RESET') {
      if (!confirm('⚠️ تحذير: هل أنت متأكد من إعادة ضبط اللعبة بالكامل؟ سيتم مسح جميع الفرق والأعضاء وإعادة زرع البيانات الأساسية!')) {
        return;
      }
    }

    try {
      const res = await fetch('/api/journey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': token,
        },
        body: JSON.stringify({ action, ...payload }),
      });

      const data = await res.json();
      if (data.success) {
        // Refresh journey
        const jRes = await fetch('/api/journey', { headers: { 'x-admin-key': token } });
        setJourneyData(await jRes.json());
      } else {
        alert(data.error || 'فشل تنفيذ الإجراء');
      }
    } catch (err) {
      alert('خطأ في الاتصال بالشبكة');
    }
  }

  // Manual Team Reassign
  async function handleManualTeamMove(teamId, eraId, variant) {
    await triggerJourneyAction('MANUAL_MOVE', { teamId, eraId, variant });
    // Refresh teams
    const token = localStorage.getItem('admin_token');
    const tRes = await fetch('/api/teams', { headers: { 'x-admin-key': token } });
    const tData = await tRes.json();
    setTeams(tData.teams || []);
  }

  // Stage Reveal Toggle
  async function handleStageToggle(eraId, isRevealed) {
    const token = localStorage.getItem('admin_token');
    try {
      await fetch('/api/stage-reveal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': token,
        },
        body: JSON.stringify({ eraId, isRevealed }),
      });

      const sRes = await fetch('/api/stage-reveal', { headers: { 'x-admin-key': token } });
      setStageData(await sRes.json());
    } catch (e) {
      console.error(e);
    }
  }

  // Save Content
  async function handleSaveContent(target, data) {
    const token = localStorage.getItem('admin_token');
    setSaveLoading(true);
    setSaveMessage('');

    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': token,
        },
        body: JSON.stringify({ target, data }),
      });

      const json = await res.json();
      if (json.success) {
        setSaveMessage('تم حفظ التعديلات بنجاح');
        setTimeout(() => setSaveMessage(''), 3000);
        await loadContentData();
      } else {
        setSaveMessage(json.error || 'حدث خطأ في الحفظ');
      }
    } catch (e) {
      setSaveMessage('خطأ في الاتصال');
    } finally {
      setSaveLoading(false);
    }
  }

  // LOGIN SCREEN
  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#0a0c10] text-slate-100">
        <form
          onSubmit={handleLogin}
          className="p-6 rounded-2xl bg-[#121620] border border-slate-800 max-w-sm w-full space-y-4"
        >
          <div className="text-center space-y-1">
            <div className="text-3xl">🛡️</div>
            <h1 className="text-lg font-bold">بوابة إدارة الرحلة</h1>
            <p className="text-xs text-slate-400">مدرسة السويدي الدولية للتكنولوجيا التطبيقية</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              كلمة مرور المشرف
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-600"
              autoFocus
            />
          </div>

          {loginError && (
            <p className="text-xs text-rose-400 bg-rose-950/40 p-2 rounded-lg text-center border border-rose-900">
              {loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs"
          >
            {loginLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>
      </main>
    );
  }

  const gameState = journeyData?.state || 'LOBBY';
  const totalStudents = teams.reduce((acc, t) => acc + (t.member_count || t.members?.length || 0), 0);

  return (
    <main className="min-h-screen bg-[#0a0c10] text-slate-100 flex flex-col">
      {/* Top Admin Navbar */}
      <nav className="border-b border-slate-900 bg-[#121620]/80 backdrop-blur px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏛️</span>
          <div>
            <h1 className="text-sm font-bold text-slate-100">
              لوحة التحكم المركزية • لغز مصر عبر الحضارات
            </h1>
            <p className="text-[11px] text-slate-400">
              مدرسة السويدي • {teams.length} فريق مسجل ({totalStudents} طالب)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick links to projector views */}
          <Link
            href="/race-projector"
            target="_blank"
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-600 text-amber-400 font-semibold transition"
          >
            🖥️ شاشة سباق البروجيكتور
          </Link>
          <Link
            href="/stage-reveal"
            target="_blank"
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-600 text-amber-400 font-semibold transition"
          >
            🎭 شاشة المسرح النهائي
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 border border-rose-900 text-rose-300 font-semibold transition"
          >
            خروج
          </button>
        </div>
      </nav>

      {/* Main Tabs Navigation */}
      <div className="border-b border-slate-900 bg-[#0d1017] px-6">
        <div className="flex gap-2 py-2 overflow-x-auto">
          {[
            { id: 'journey', label: '🚀 التحكم في الرحلة', badge: gameState },
            { id: 'teams', label: `👥 الفرق والتوزيع (${teams.length})` },
            { id: 'monitor', label: '🏎️ شاشة السباق المباشر' },
            { id: 'stage', label: '🎭 المنصة وكشف التعويذة' },
            { id: 'content', label: '📝 محرر المحتوى الشامل' },
            { id: 'printables', label: '🖨️ المطبوعات والطوارئ' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-amber-600 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-amber-300 font-mono">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT AREA */}
      <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* ==================================================== */}
        {/* TAB 1: JOURNEY CONTROL */}
        {/* ==================================================== */}
        {activeTab === 'journey' && (
          <div className="space-y-6">
            {/* Status & Key Metrics Banner */}
            <div className="p-6 rounded-2xl bg-[#121620] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500 uppercase font-semibold block mb-1">
                  الحالة التشغيلية للنظام
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xl font-black px-4 py-1.5 rounded-xl border ${
                      gameState === 'RUNNING'
                        ? 'bg-emerald-950/60 border-emerald-600 text-emerald-400'
                        : gameState === 'LOCKED'
                        ? 'bg-blue-950/60 border-blue-600 text-blue-400'
                        : gameState === 'COUNTDOWN'
                        ? 'bg-amber-950/60 border-amber-600 text-amber-400 animate-pulse'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    {gameState}
                  </span>
                  <span className="text-xs text-slate-400">
                    {gameState === 'LOBBY' && 'التسجيل مفتوح للطلاب لإنشاء والانضمام للفرق'}
                    {gameState === 'LOCKED' && 'تم توزيع الفرق على العصور والتفريعات A/B/C'}
                    {gameState === 'COUNTDOWN' && 'العد التنازلي التزامني جارٍ على جميع الهواتف'}
                    {gameState === 'RUNNING' && 'المنافسة الميدانية جارية بالكامل'}
                    {gameState === 'PAUSED' && 'المنافسة متوقفة مؤقتاً'}
                    {gameState === 'ENDED' && 'انتهت الرحلة وتم إغلاق استقبال الإجابات'}
                  </span>
                </div>
              </div>

              {/* Duration Selector for Game Master */}
              <div className="w-full border-t border-slate-800/80 pt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">⏱️ مدة المسابقة (للإغلاق التلقائي):</span>
                  <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    {[
                      { min: 60, label: 'ساعة' },
                      { min: 120, label: 'ساعتان' },
                      { min: 180, label: '3 ساعات' },
                    ].map((d) => (
                      <button
                        key={d.min}
                        type="button"
                        onClick={() => setDurationMinutes(d.min)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition ${
                          durationMinutes === d.min
                            ? 'bg-amber-600 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <span>أو:</span>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value) || 60)}
                      className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-100 text-xs text-center"
                    />
                    <span>دقيقة</span>
                  </div>
                </div>

                {/* Live Remaining Time when RUNNING */}
                {gameState === 'RUNNING' && journeyData?.endAtEpoch && (
                  <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-amber-600/50">
                    <span className="text-xs text-slate-400 font-semibold">الوقت المتبقي حتى انتهاء المسابقة:</span>
                    <span className="text-sm font-mono font-black text-amber-400">
                      {Math.max(0, Math.floor((journeyData.endAtEpoch - Date.now()) / 1000 / 60))} دقيقة متبقية
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {gameState === 'LOBBY' && (
                  <button
                    type="button"
                    onClick={() => triggerJourneyAction('LOCK_AND_ASSIGN')}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow"
                  >
                    🔒 قفل التسجيل وتوزيع العصور تلقائياً
                  </button>
                )}

                {gameState === 'LOCKED' && (
                  <>
                    <button
                      type="button"
                      onClick={() => triggerJourneyAction('START_COUNTDOWN', { seconds: 34, durationMinutes })}
                      className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shadow animate-pulse flex items-center gap-2"
                    >
                      <span>🚀 بدء الرحلة والعد التنازلي التزامني (30 ثانية مع وقفة الحماس 12..0)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerJourneyAction('START_NOW', { durationMinutes })}
                      className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                    >
                      بدء فوري بدون عد
                    </button>
                  </>
                )}

                {gameState === 'RUNNING' && (
                  <button
                    type="button"
                    onClick={() => triggerJourneyAction('PAUSE')}
                    className="px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs"
                  >
                    ⏸️ إيقاف مؤقت للعبة
                  </button>
                )}

                {gameState === 'PAUSED' && (
                  <button
                    type="button"
                    onClick={() => triggerJourneyAction('RESUME')}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    ▶️ استئناف اللعبة
                  </button>
                )}

                {(gameState === 'RUNNING' || gameState === 'PAUSED') && (
                  <button
                    type="button"
                    onClick={() => triggerJourneyAction('END')}
                    className="px-4 py-2.5 rounded-xl bg-rose-950 border border-rose-900 text-rose-300 hover:bg-rose-900 font-bold text-xs"
                  >
                    ⏹️ إنهاء الرحلة
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => triggerJourneyAction('RESET')}
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900 text-xs font-medium transition"
                >
                  🔄 إعادة ضبط اللعبة (Reset)
                </button>
              </div>
            </div>

            {/* Eras Balance Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(journeyData?.eraStats || []).map((era) => (
                <div
                  key={era.id}
                  className="p-4 rounded-xl bg-[#121620] border space-y-2"
                  style={{ borderColor: `${era.color}40` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: era.color }}>
                      {era.name}
                    </span>
                    <span className="text-xl">{era.icon}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-200">
                    الحاكم: {era.ruler}
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
                    <span>عدد الفرق: <strong className="text-slate-200">{era.team_count || 0}</strong></span>
                    <span>الطلاب: <strong className="text-slate-200">{era.member_count || 0}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            {/* Announcement Broadcast Box */}
            <div className="p-6 rounded-2xl bg-[#121620] border border-amber-900/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📢</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      بث إعلان عاجل من الجيم ماستر (Pop-up Announcement)
                    </h3>
                    <p className="text-xs text-slate-400">
                      يظهر فوراً كرسالة منبثقة عاجلة مع صوت تنبيهي على شاشات الطلاب (في صالة الانتظار وأثناء اللعب)
                    </p>
                  </div>
                </div>
                {journeyData?.announcement && (
                  <button
                    type="button"
                    onClick={handleClearAnnouncement}
                    className="px-3 py-1.5 rounded-lg bg-rose-950 border border-rose-800 text-rose-300 hover:bg-rose-900 text-xs font-bold transition"
                  >
                    مسح الإعلان النشط ✖️
                  </button>
                )}
              </div>

              {journeyData?.announcement && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/50 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
                    <span>الإعلان المعروض على هواتف الطلاب حالياً:</span>
                    <span>
                      {journeyData.announcement.eraId
                        ? `موجه لعصر معين (#${journeyData.announcement.eraId})`
                        : 'موجه لجميع الفرق والعصور'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-semibold leading-relaxed">
                    {journeyData.announcement.text}
                  </p>
                </div>
              )}

              <form onSubmit={handleSendAnnouncement} className="space-y-3">
                <textarea
                  rows={2}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="اكتب نص الإعلان المنبثق هنا (مثال: تنبيه لجميع الفرق: متبقي 15 دقيقة، أو تعليمات خاصة بعصر معين)..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-600 placeholder:text-slate-500"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">الجمهور المستهدف:</span>
                    <select
                      value={announcementEra}
                      onChange={(e) => setAnnouncementEra(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-600"
                    >
                      <option value="">📢 جميع العصور والفرق (عام)</option>
                      <option value="1">👑 العصر الفرعوني فقط</option>
                      <option value="2">📜 مصر البطلمية فقط</option>
                      <option value="3">⚔️ مصر الرومانية فقط</option>
                      <option value="4">🏺 العصر الإسلامي فقط</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={announcementLoading || !announcementText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-600/20"
                  >
                    {announcementLoading ? 'جاري الإرسال...' : 'إرسال الإعلان المنبثق 📢'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: TEAMS & BALANCING */}
        {/* ==================================================== */}
        {activeTab === 'teams' && (
          <div className="p-5 rounded-2xl bg-[#121620] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-100">
                  كشف الفرق والتوزيع الميداني ({teams.length} فريق)
                </h2>
                <p className="text-xs text-slate-400">
                  يمكن للمشرف نقل أي فريق بين العصور أو تغيير التفريعة (A/B/C) يدوياً في أي وقت
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">رقم الفريق</th>
                    <th className="py-2.5 px-3">الفريق</th>
                    <th className="py-2.5 px-3">النقاط</th>
                    <th className="py-2.5 px-3">عدد الأعضاء</th>
                    <th className="py-2.5 px-3">الأعضاء</th>
                    <th className="py-2.5 px-3">العصر المخصص</th>
                    <th className="py-2.5 px-3">التفريعة</th>
                    <th className="py-2.5 px-3">المستوى</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {teams.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">
                        #{t.team_number || 1}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-200 flex items-center gap-2">
                        <span>{t.icon}</span>
                        <span>{t.name}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                        💎 {t.points ?? 100}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {t.member_count || t.members?.length || 0} طلاب
                      </td>
                      <td className="py-3 px-3 text-slate-400 max-w-xs truncate">
                        {(t.members || []).map((m) => m.name).join(' • ') || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={t.era_id || ''}
                          onChange={(e) => handleManualTeamMove(t.id, e.target.value, t.variant || 'A')}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 text-xs"
                        >
                          <option value="">غير مخصص</option>
                          <option value="1">1 الفرعوني (أخناتون)</option>
                          <option value="2">2 البطلمي (بطليموس الثامن)</option>
                          <option value="3">3 الإسلامي (صلاح الدين)</option>
                          <option value="4">4 الخديوي (الخديوي إسماعيل)</option>
                        </select>
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={t.variant || 'A'}
                          onChange={(e) => handleManualTeamMove(t.id, t.era_id || 1, e.target.value)}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 text-xs"
                        >
                          <option value="A">تفريعة A</option>
                          <option value="B">تفريعة B</option>
                          <option value="C">تفريعة C</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">
                        {t.current_level > 10 ? '🏆 أنهى' : `L${t.current_level}/10`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: LIVE RACE MONITOR */}
        {/* ==================================================== */}
        {activeTab === 'monitor' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-100">
                المتابعة الحية للسباق الميداني
              </h2>
              <Link
                href="/race-projector"
                target="_blank"
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 text-slate-950 font-bold"
              >
                فتح نافذة البروجيكتور المستقلة
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(journeyData?.eraStats || []).map((era) => {
                const eraTeams = teams.filter((t) => t.era_id === era.id);

                return (
                  <div
                    key={era.id}
                    className="p-4 rounded-xl bg-[#121620] border space-y-3"
                    style={{ borderColor: `${era.color}50` }}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-xs" style={{ color: era.color }}>
                        {era.name} ({era.ruler})
                      </span>
                      <span className="text-xs text-slate-400">
                        {eraTeams.length} فرق
                      </span>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {eraTeams.map((t, idx) => (
                        <div
                          key={t.id}
                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-500">#{idx + 1}</span>
                            <span>{t.icon}</span>
                            <span className="font-semibold text-slate-200">{t.name}</span>
                            <span className="text-[10px] text-slate-400">({t.variant})</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono text-amber-400 font-bold">
                              {t.current_level > 10 ? '🏆 تم' : `مستوى ${t.current_level}/10`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: STAGE REVEAL CONTROLS */}
        {/* ==================================================== */}
        {activeTab === 'stage' && (
          <div className="p-6 rounded-2xl bg-[#121620] border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-100">
                  التحكم في فقرة المسرح الكبير وكشف اللعنة
                </h2>
                <p className="text-xs text-slate-400">
                  عند انتهاء كل راوٍ من إلقاء نصه في الميكروفون، اضغط "كشف على الشاشة" لإظهاره
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleStageToggle(null, true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                كشف الأجزاء الأربعة والتعويذة دفعة واحدة
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(stageData?.slots || []).map((slot) => (
                <div
                  key={slot.eraId}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                    slot.isRevealed
                      ? 'bg-emerald-950/20 border-emerald-600/70'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold" style={{ color: slot.color }}>
                        {slot.eraName}
                      </span>
                      <span className="text-lg">{slot.icon}</span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-200 mb-1">
                      {slot.ruler}
                    </h4>
                    <p className="text-[11px] text-amber-400 mb-2">
                      فريق: {slot.winningTeamName}
                    </p>

                    <p className="text-xs text-slate-300 font-serif line-clamp-4 bg-slate-950/60 p-2 rounded">
                      «{slot.scriptText}»
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStageToggle(slot.eraId, !slot.isRevealed)}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition ${
                      slot.isRevealed
                        ? 'bg-slate-800 hover:bg-slate-700 text-rose-300'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                    }`}
                  >
                    {slot.isRevealed ? 'إخفاء من الشاشة' : 'كشف على شاشة المسرح'}
                  </button>
                </div>
              ))}
            </div>

            {/* Curse Text Box */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-amber-400">
                نص التعويذة الكامل الذي سيظهر عند كشف الأجزاء الأربعة:
              </span>
              <p className="text-sm font-serif text-slate-200">
                «{stageData?.curseText}»
              </p>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: DYNAMIC CONTENT EDITOR */}
        {/* ==================================================== */}
        {activeTab === 'content' && (
          <div className="p-6 rounded-2xl bg-[#121620] border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-100">
                  محرر المحتوى الشامل (Dynamic Content Engine)
                </h2>
                <p className="text-xs text-slate-400">
                  تعديل القصة، المستويات، الأسئلة، الأجوبة، التلميحات، محطات البوثات، وبيانات المهندسين مباشرة في قاعدة البيانات بدون كود
                </p>
              </div>

              {saveMessage && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-900">
                  {saveMessage}
                </span>
              )}
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { id: 'levels', label: 'المستويات (Beats 1-10)' },
                { id: 'variants', label: 'تفريعات المستويات (A/B/C)' },
                { id: 'booths', label: 'محطات البوثات (Booths 1-10)' },
                { id: 'engineers', label: 'بيانات المهندسين' },
                { id: 'eras', label: 'العصور والرواة' },
                { id: 'settings', label: 'إعدادات عامة' },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setContentSubTab(sub.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    contentSubTab === sub.id
                      ? 'bg-amber-600 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* SUBTAB: LEVELS */}
            {contentSubTab === 'levels' && content?.levels && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Levels list sidebar */}
                <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                  {content.levels.map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => {
                        setSelectedLevelId(lvl.id);
                        setEditingItem({ ...lvl });
                      }}
                      className={`w-full text-right p-2.5 rounded-lg border text-xs transition block ${
                        selectedLevelId === lvl.id
                          ? 'bg-amber-950/40 border-amber-600 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-bold">
                        عصر {lvl.era_id} • مستوى {lvl.level_number}: {lvl.title}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        النوع: {lvl.clue_type}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Edit Form */}
                {editingItem && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveContent('level', editingItem);
                    }}
                    className="lg:col-span-2 space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          عنوان المستوى
                        </label>
                        <input
                          type="text"
                          value={editingItem.title || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          نوع الدليل (Clue Type)
                        </label>
                        <input
                          type="text"
                          value={editingItem.clue_type || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, clue_type: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        نص القصة التاريخية
                      </label>
                      <textarea
                        rows={2}
                        value={editingItem.story_text || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, story_text: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        نص الدليل الأساسي
                      </label>
                      <textarea
                        rows={2}
                        value={editingItem.base_clue_text || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, base_clue_text: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        الإجابات الصحيحة المقبولة (JSON Array أو نص)
                      </label>
                      <input
                        type="text"
                        value={editingItem.base_valid_answers || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, base_valid_answers: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">تلميح 1 (مجاني)</label>
                        <input
                          type="text"
                          value={editingItem.hint1_text || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, hint1_text: e.target.value })}
                          className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-100 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">تلميح 2 (+60ث)</label>
                        <input
                          type="text"
                          value={editingItem.hint2_text || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, hint2_text: e.target.value })}
                          className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-100 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">تلميح 3 (+120ث)</label>
                        <input
                          type="text"
                          value={editingItem.hint3_text || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, hint3_text: e.target.value })}
                          className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-100 text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={saveLoading}
                      className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs"
                    >
                      {saveLoading ? 'جاري الحفظ...' : 'حفظ التعديلات على المستوى'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* SUBTAB: BOOTHS */}
            {contentSubTab === 'booths' && content?.booths && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {content.booths.map((b) => (
                    <div key={b.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400">
                          عصر {b.era_id} • بوث {b.level_number}: {b.game_name}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">القواعد: </span>
                        <span>{b.rules_ar}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">شرط الفوز: </span>
                        <span>{b.win_condition}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-800 text-[11px] grid grid-cols-3 gap-1 font-mono text-slate-300">
                        <div>A: <strong className="text-amber-300">{b.reward_variant_a}</strong></div>
                        <div>B: <strong className="text-amber-300">{b.reward_variant_b}</strong></div>
                        <div>C: <strong className="text-amber-300">{b.reward_variant_c}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUBTAB: STAFF ENGINEERS */}
            {contentSubTab === 'engineers' && content?.engineers && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {content.engineers.map((eng) => {
                  let facts = {};
                  try {
                    facts = JSON.parse(eng.facts_json);
                  } catch (e) {}

                  return (
                    <div key={eng.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                      <h4 className="font-bold text-amber-400 text-sm">
                        م. {eng.name}
                      </h4>
                      <div className="space-y-1 text-slate-300">
                        {Object.entries(facts).map(([k, v]) => (
                          <div key={k}>
                            <span className="text-slate-400 font-semibold">{k}: </span>
                            <span>{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 6: PRINTABLES & EMERGENCY */}
        {/* ==================================================== */}
        {activeTab === 'printables' && (
          <div className="p-6 rounded-2xl bg-[#121620] border border-slate-800 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                المطبوعات الميدانية وكروت الطوارئ (Ready to Print)
              </h2>
              <p className="text-xs text-slate-400">
                مجهزة بقياسات الطباعة الدقيقة (A4 للملصقات و A5 للبوثات) مع جاهزية العمل أوفلاين في حال انقطاع الشبكة
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <a
                href={`/api/admin/print/qr?key=${encodeURIComponent(adminToken || 'AD@776@z776')}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  const token = adminToken || localStorage.getItem('admin_token') || 'AD@776@z776';
                  window.open(`/api/admin/print/qr?key=${encodeURIComponent(token)}`, '_blank');
                }}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-600 transition block space-y-2 group cursor-pointer"
              >
                <div className="text-3xl">🖨️</div>
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-400">
                  ملصقات الـ QR الميدانية (A4)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  جاهزة للطباعة على ورق A4 ولصقها في أرجاء المدرسة والملاعب والفصول للفرق.
                </p>
                <span className="inline-block text-xs text-amber-500 font-semibold pt-1">
                  فتح صفحة الطباعة ←
                </span>
              </a>

              <a
                href={`/api/admin/print/booths?key=${encodeURIComponent(adminToken || 'AD@776@z776')}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  const token = adminToken || localStorage.getItem('admin_token') || 'AD@776@z776';
                  window.open(`/api/admin/print/booths?key=${encodeURIComponent(token)}`, '_blank');
                }}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-600 transition block space-y-2 group cursor-pointer"
              >
                <div className="text-3xl">🎪</div>
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-400">
                  كروت منظمي البوثات (A5)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  كروت بقياس A5 تسلم لمنظم كل بوث تحوي القواعد وسيناريو الإلقاء وكروت الأكواد الملونة A/B/C.
                </p>
                <span className="inline-block text-xs text-amber-500 font-semibold pt-1">
                  فتح كروت البوثات ←
                </span>
              </a>

              <a
                href={`/api/admin/print/backup?key=${encodeURIComponent(adminToken || 'AD@776@z776')}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  const token = adminToken || localStorage.getItem('admin_token') || 'AD@776@z776';
                  window.open(`/api/admin/print/backup?key=${encodeURIComponent(token)}`, '_blank');
                }}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-600 transition block space-y-2 group cursor-pointer"
              >
                <div className="text-3xl">📋</div>
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-400">
                  شيت الطوارئ والحلول البديلة
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  جدول كامل لجميع المستويات والحلول وأكواد الطوارئ يمسكه المشرف لحل أي أزمة ميدانية يدوياً.
                </p>
                <span className="inline-block text-xs text-amber-500 font-semibold pt-1">
                  فتح شيت الطوارئ ←
                </span>
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
