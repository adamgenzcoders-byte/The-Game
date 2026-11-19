// ========================================================
// app/api/admin/print/[type]/route.js - Printable Sheets Delivery
// ========================================================

import { NextResponse } from 'next/server';
import { initSchema, query } from '@/lib/db';
import { verifyAdmin } from '@/lib/authHelper';
import {
  generateQrSheetsHtml,
  generateBoothScriptsHtml,
  generateEmergencyBackupHtml,
} from '@/lib/printableGenerator';

export async function GET(request, { params }) {
  try {
    await initSchema();
    if (!verifyAdmin(request)) {
      return new NextResponse('غير مصرح لك (المشرف فقط)', { status: 403 });
    }

    const type = params.type;
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const isAdminCopy = url.searchParams.get('admin') === 'true';

    let html = '';

    if (type === 'qr') {
      const qrList = await query(`SELECT * FROM qr_tokens ORDER BY era_id ASC, level_number ASC`);
      html = await generateQrSheetsHtml(qrList, baseUrl, isAdminCopy);
    } else if (type === 'booths') {
      const booths = await query(`
        SELECT b.*, e.name as era_name
        FROM booths b
        LEFT JOIN eras e ON b.era_id = e.id
        ORDER BY b.era_id ASC, b.level_number ASC
      `);
      html = generateBoothScriptsHtml(booths);
    } else if (type === 'backup') {
      const levels = await query(`
        SELECT l.*, e.name as era_name, e.ruler as era_ruler
        FROM levels l
        JOIN eras e ON l.era_id = e.id
        ORDER BY l.era_id ASC, l.level_number ASC
      `);
      const overrides = await query(`SELECT * FROM level_variant_overrides`);
      const booths = await query(`SELECT * FROM booths`);
      const engineers = await query(`SELECT * FROM staff_engineers`);

      html = generateEmergencyBackupHtml({ levels, overrides, booths, engineers });
    } else {
      return new NextResponse('نوع مستند غير صالح', { status: 400 });
    }

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (err) {
    console.error('Print GET error:', err);
    return new NextResponse('Server error', { status: 500 });
  }
}
