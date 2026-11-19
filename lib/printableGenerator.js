// ========================================================
// lib/printableGenerator.js - Printable A4/A5 Sheets Generator
// ========================================================

const QRCode = require('qrcode');

/**
 * Generates Printable A4 QR Sheets
 */
async function generateQrSheetsHtml(qrList, baseUrl = 'https://sewedy-chronicle.vercel.app', isAdminCopy = false) {
  const cards = [];
  for (const item of qrList) {
    const targetUrl = `${baseUrl}/q/${item.token}`;
    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 250,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });

    cards.push({
      token: item.token,
      label: item.label,
      location: item.location_name,
      eraId: item.era_id,
      levelNum: item.level_number,
      variant: item.variant,
      qrDataUrl,
    });
  }

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>شيت ملصقات الـ QR - مدرسة السويدي</title>
  <style>
    @page { size: A4; margin: 10mm; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; background: #fff; color: #111; }
    .no-print { background: #1e293b; color: #fff; padding: 10px; text-align: center; }
    .btn { background: #c59b27; color: #000; border: none; padding: 8px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 15px; }
    .header h1 { margin: 0; font-size: 20px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
    .card { border: 2px dashed #444; border-radius: 8px; padding: 12px; text-align: center; page-break-inside: avoid; background: #fafafa; }
    .card img { width: 170px; height: 170px; margin: 4px auto; display: block; }
    .card .loc { font-size: 13px; font-weight: bold; color: #991b1b; }
    .card h3 { margin: 4px 0; font-size: 15px; }
    .card .admin-meta { font-size: 11px; background: #fef3c7; color: #92400e; padding: 3px 6px; border-radius: 4px; display: inline-block; margin-top: 4px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn" onclick="window.print()">طباعة ملصقات الـ QR (A4)</button>
  </div>
  <div class="header">
    <h1>مدرسة السويدي الدولية • ملصقات الـ QR الميدانية</h1>
    <p>لغز مصر عبر الحضارات - عدد الملصقات: ${cards.length} ${isAdminCopy ? '(نسخة المنظمين مع أرقام المراحل)' : ''}</p>
  </div>
  <div class="grid">
    ${cards
      .map(
        (c) => `
      <div class="card">
        <div class="loc">${c.location || 'المبنى المدرسي'}</div>
        <h3>${c.label}</h3>
        <img src="${c.qrDataUrl}" alt="${c.token}" />
        <div style="font-family: monospace; font-size: 11px; color: #666;">Token: ${c.token}</div>
        ${
          isAdminCopy && (c.eraId || c.levelNum)
            ? `<div class="admin-meta">خاص بالمنظم: العصر ${c.eraId || 'الكل'} - المستوى ${c.levelNum || 'الكل'} ${c.variant ? `(تفريعة ${c.variant})` : ''}</div>`
            : ''
        }
      </div>`
      )
      .join('')}
  </div>
</body>
</html>`;
}

/**
 * Generates Printable A5 Booth Script Sheets with 3 Colored Variant Cards
 */
function generateBoothScriptsHtml(boothsList) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>كروت محطات البوثات - A5 - مدرسة السويدي</title>
  <style>
    @page { size: A5 landscape; margin: 8mm; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; background: #fff; color: #111; font-size: 12px; }
    .no-print { background: #1e293b; color: #fff; padding: 8px; text-align: center; }
    .btn { background: #059669; color: #fff; border: none; padding: 6px 14px; border-radius: 4px; font-weight: bold; cursor: pointer; }
    .page-break { page-break-after: always; padding: 8px; border: 2px solid #334155; border-radius: 8px; margin-bottom: 20px; }
    h1 { font-size: 16px; margin: 0 0 4px 0; color: #0f172a; border-bottom: 2px solid #c59b27; padding-bottom: 4px; }
    .meta { font-size: 11px; color: #475569; margin-bottom: 8px; }
    .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; margin-bottom: 6px; }
    .box-title { font-weight: bold; color: #0f172a; margin-bottom: 2px; }
    .variants-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
    .v-card { border-radius: 6px; padding: 8px; text-align: center; border: 2px solid #000; }
    .v-a { background: #fef3c7; border-color: #d97706; }
    .v-b { background: #e0f2fe; border-color: #0284c7; }
    .v-c { background: #dcfce7; border-color: #16a34a; }
    .code { font-family: monospace; font-size: 14px; font-weight: bold; margin-top: 4px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn" onclick="window.print()">طباعة كروت البوثات (A5)</button>
  </div>
  ${boothsList
    .map(
      (b) => `
    <div class="page-break">
      <h1>بوث لعبة: ${b.game_name} (العصر ${b.era_id} - المستوى ${b.level_number})</h1>
      <div class="meta">وقت التحدي: حوالي دقيقتين | إشراف منظم البوث</div>

      <div class="box">
        <div class="box-title">قواعد اللعبة وطريقة الفوز:</div>
        <div>${b.rules_ar}</div>
        <div style="font-weight:bold; margin-top:3px; color:#166534;">شرط الفوز: ${b.win_condition}</div>
      </div>

      <div class="box">
        <div class="box-title">ماذا تقول للفريق بصوت القصة:</div>
        <div style="font-style:italic;">"${b.organizer_script}"</div>
      </div>

      ${b.safety_notes ? `<div style="font-size:10px; color:#b91c1c; font-weight:bold;">ملاحظات السلامة: ${b.safety_notes}</div>` : ''}

      <div style="font-weight:bold; margin-top:6px;">كروت المكافأة للمنظم (اسأل الفريق عن تفريعته A أو B أو C وسلمه الكود الخاص به فقط):</div>
      <div class="variants-grid">
        <div class="v-card v-a">
          <strong>تفريعة A (الصفراء)</strong>
          <div class="code">${b.reward_variant_a}</div>
        </div>
        <div class="v-card v-b">
          <strong>تفريعة B (الزرقاء)</strong>
          <div class="code">${b.reward_variant_b}</div>
        </div>
        <div class="v-card v-c">
          <strong>تفريعة C (الخضراء)</strong>
          <div class="code">${b.reward_variant_c}</div>
        </div>
      </div>
    </div>`
    )
    .join('')}
</body>
</html>`;
}

/**
 * Generates Printable Emergency Backup Sheet
 */
function generateEmergencyBackupSheet(levelsList) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>شيت أكواد الطوارئ الميدانية - مدرسة السويدي</title>
  <style>
    @page { size: A4 landscape; margin: 8mm; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; background: #fff; color: #111; font-size: 11px; }
    h1 { font-size: 16px; margin: 0 0 4px 0; text-align: center; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #94a3b8; padding: 4px 6px; text-align: right; }
    th { background: #1e293b; color: #fff; }
    tr:nth-child(even) { background: #f8fafc; }
    .code { font-family: monospace; font-weight: bold; color: #047857; }
    .no-print { background: #334155; color: #fff; padding: 8px; text-align: center; }
    .btn { background: #dc2626; color: #fff; border: none; padding: 5px 12px; font-weight: bold; border-radius: 4px; cursor: pointer; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn" onclick="window.print()">طباعة كود الطوارئ الورقي</button>
  </div>
  <h1>مدرسة السويدي الدولية • شيت حلول الطوارئ لجميع المستويات (سري للمنظمين)</h1>
  <table>
    <thead>
      <tr>
        <th>العصر</th>
        <th>المستوى</th>
        <th>العنوان</th>
        <th>نوع اللغز</th>
        <th>إجابة تفريعة A</th>
        <th>إجابة تفريعة B</th>
        <th>إجابة تفريعة C</th>
      </tr>
    </thead>
    <tbody>
      ${levelsList
        .map(
          (l) => `
        <tr>
          <td><strong>${l.era_name}</strong></td>
          <td style="text-align:center;">${l.level_number}</td>
          <td>${l.title}</td>
          <td>${l.clue_type}</td>
          <td class="code">${l.ans_a || '---'}</td>
          <td class="code">${l.ans_b || '---'}</td>
          <td class="code">${l.ans_c || '---'}</td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>`;
}

module.exports = {
  generateQrSheetsHtml,
  generateBoothScriptsHtml,
  generateEmergencyBackupSheet,
};

