// ========================================================
// lib/printableService.js - Printable A4 HTML Sheets Generator
// ========================================================

const QRCode = require('qrcode');

/**
 * Generates an A4 printable HTML page containing a grid of QR codes
 */
async function generateQrPrintableHtml(qrCodesList, baseUrl = 'https://sewedy-chronicle.vercel.app') {
  const items = [];
  for (const qr of qrCodesList) {
    const targetUrl = `${baseUrl}/q/${qr.id}`;
    const dataUrl = await QRCode.toDataURL(targetUrl, {
      width: 260,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });
    items.push({
      id: qr.id,
      label: qr.label,
      locationName: qr.location_name || 'غير محدد',
      zone: qr.zone || '',
      notes: qr.notes || '',
      targetUrl,
      dataUrl,
    });
  }

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>أكواد QR للملصقات - مدرسة السويدي الدولية</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #111; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 16px; }
    .header h1 { margin: 0 0 4px 0; font-size: 20px; }
    .header p { margin: 0; font-size: 13px; color: #555; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .card { border: 2px dashed #444; border-radius: 8px; padding: 12px; text-align: center; page-break-inside: avoid; background: #fafafa; }
    .card img { width: 180px; height: 180px; margin: 4px auto; display: block; }
    .card h3 { margin: 6px 0 2px 0; font-size: 15px; color: #000; }
    .card .loc { font-size: 13px; font-weight: bold; color: #b45309; margin-bottom: 4px; }
    .card .id { font-size: 11px; font-family: monospace; color: #666; background: #eee; padding: 2px 6px; border-radius: 4px; display: inline-block; }
    .card .notes { font-size: 11px; color: #555; margin-top: 4px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none; }
    }
    .print-bar { background: #1e293b; color: white; padding: 10px; text-align: center; margin-bottom: 15px; }
    .btn { background: #d97706; color: white; border: none; padding: 8px 18px; font-size: 14px; border-radius: 6px; cursor: pointer; font-weight: bold; }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <button class="btn" onclick="window.print()">طباعة شيتات الـ QR (A4)</button>
    <span style="margin-right: 15px; font-size: 13px;">تأكد من ضبط مقاس الطباعة على A4 في نافذة الطابعة</span>
  </div>
  <div class="header">
    <h1>مدرسة السويدي الدولية - لعبة مصر عبر الحضارات</h1>
    <p>شيت ملصقات الـ QR الميدانية - عدد الأكواد: ${items.length}</p>
  </div>
  <div class="grid">
    ${items
      .map(
        (it) => `
      <div class="card">
        <div class="loc">${it.locationName} ${it.zone ? `(${it.zone})` : ''}</div>
        <h3>${it.label}</h3>
        <img src="${it.dataUrl}" alt="${it.id}">
        <div class="id">ID: ${it.id}</div>
        ${it.notes ? `<div class="notes">${it.notes}</div>` : ''}
      </div>`
      )
      .join('')}
  </div>
</body>
</html>`;
}

/**
 * Generates an A4 printable sheet for Staff, Booths, and Tomb Guardians
 */
function generateGuardianCheatSheetHtml(staffList) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>كروت المنظمين وحراس المقابر - مدرسة السويدي</title>
  <style>
    @page { size: A4; margin: 10mm; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #111; }
    .header { text-align: center; border-bottom: 2px solid #b45309; padding-bottom: 6px; margin-bottom: 14px; }
    .header h1 { margin: 0 0 4px 0; font-size: 20px; color: #78350f; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
    .card { border: 2px solid #334155; border-radius: 8px; padding: 12px; page-break-inside: avoid; background: #f8fafc; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; color: white; margin-bottom: 6px; }
    .type-PERSON { background: #059669; }
    .type-BOOTH { background: #d97706; }
    .type-GUARDIAN { background: #dc2626; }
    .card h2 { margin: 2px 0 6px 0; font-size: 16px; color: #0f172a; }
    .meta { font-size: 12px; color: #475569; margin-bottom: 8px; }
    .box { background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; margin-top: 6px; font-size: 12px; }
    .box-title { font-weight: bold; color: #1e293b; margin-bottom: 2px; }
    .code-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 6px 10px; border-radius: 6px; text-align: center; font-size: 15px; font-weight: bold; color: #92400e; margin-top: 8px; }
    .pin { float: left; font-family: monospace; font-size: 12px; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; }
    .print-bar { background: #1e293b; color: white; padding: 10px; text-align: center; margin-bottom: 15px; }
    .btn { background: #059669; color: white; border: none; padding: 8px 18px; font-size: 14px; border-radius: 6px; cursor: pointer; font-weight: bold; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <button class="btn" onclick="window.print()">طباعة كروت المنظمين والحراس</button>
  </div>
  <div class="header">
    <h1>دليل محطات المنظمين وحراس المقابر (سري للغاية)</h1>
    <p>كل منظم يستلم كرته فقط - لا تشارك كود التسليم إلا بعد تنفيذ الفريق للتحدي بنجاح</p>
  </div>
  <div class="grid">
    ${staffList
      .map(
        (s) => `
      <div class="card">
        <span class="badge type-${s.type}">${s.type === 'PERSON' ? 'شخصية بالقصة' : s.type === 'BOOTH' ? 'بوث أنشطة' : 'حارس مقبرة'}</span>
        <span class="pin">PIN الدخول: ${s.pin_code || '---'}</span>
        <h2>${s.name}</h2>
        <div class="meta"><strong>المكان:</strong> ${s.location_name || 'غير محدد'} | <strong>الدور:</strong> ${s.role_title || ''}</div>
        
        <div class="box">
          <div class="box-title">ماذا تقول للفريق عند وصوله:</div>
          <div>${s.instructions_what_to_say || 'أهلاً بكم في المحطة، هل أنتم مستعدون للتحدي؟'}</div>
        </div>

        <div class="box">
          <div class="box-title">التحدي المطلوب تنفيذه:</div>
          <div>${s.challenge_description || 'أداء التحدي الميداني المقرر.'}</div>
        </div>

        <div class="code-box">
          كود التسليم بعد النجاح: <span>${s.handout_code || '---'}</span>
        </div>
      </div>`
      )
      .join('')}
  </div>
</body>
</html>`;
}

/**
 * Generates an Emergency Backup Cheat Sheet listing all levels & answers
 */
function generateEmergencyBackupSheetHtml(levelsWithPaths) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>شيت أكواد الطوارئ - إدارة اللعبة</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; padding: 0; background: #fff; font-size: 11px; }
    h1 { font-size: 16px; margin: 0 0 4px 0; text-align: center; }
    p { margin: 0 0 10px 0; text-align: center; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; }
    th { background: #1e293b; color: white; font-size: 11px; }
    tr:nth-child(even) { background: #f8fafc; }
    .ans { font-weight: bold; color: #047857; font-family: monospace; font-size: 12px; }
    .print-bar { background: #334155; color: white; padding: 8px; text-align: center; margin-bottom: 10px; }
    .btn { background: #dc2626; color: white; border: none; padding: 6px 14px; font-weight: bold; border-radius: 4px; cursor: pointer; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <button class="btn" onclick="window.print()">طباعة كود الطوارئ (ورقة للمنظمين)</button>
  </div>
  <h1>مدرسة السويدي الدولية - شيت الطوارئ وأكواد الحلول الميدانية</h1>
  <p>يُستخدم في حال انقطاع شبكة الهاتف أو حدوث خلل في قراءة QR أحد الفصول لدفع الفريق عبر الأدمن</p>
  <table>
    <thead>
      <tr>
        <th style="width: 15%;">المسار (الحضارة)</th>
        <th style="width: 5%;">الليفل</th>
        <th style="width: 20%;">عنوان المهمة</th>
        <th style="width: 15%;">الموقع الميداني</th>
        <th style="width: 10%;">نوع الإدخال</th>
        <th style="width: 25%;">الإجابة الصحيحة المقبولة</th>
        <th style="width: 10%;">كود طوارئ سريع</th>
      </tr>
    </thead>
    <tbody>
      ${levelsWithPaths
        .map(
          (l) => `
        <tr>
          <td><strong>${l.path_name}</strong></td>
          <td style="text-align: center;">${l.level_number}</td>
          <td>${l.title}</td>
          <td>${l.location_name || 'غير محدد'}</td>
          <td>${l.answer_types_json}</td>
          <td class="ans">${l.valid_answers_json}</td>
          <td><code style="background:#e2e8f0; padding:2px 4px; border-radius:3px;">EMG-${l.path_id}-${l.level_number}</code></td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>`;
}

module.exports = {
  generateQrPrintableHtml,
  generateGuardianCheatSheetHtml,
  generateEmergencyBackupSheetHtml,
};

