// ========================================================
// app/api/qr/[token]/route.js - QR Scanner & Token Resolver
// ========================================================

import { NextResponse } from 'next/server';
import { initSchema, queryOne } from '@/lib/db';
import { getMemberFromRequest } from '@/lib/authHelper';

export async function GET(request, { params }) {
  try {
    await initSchema();
    const token = params.token;
    if (!token) {
      return NextResponse.json({ error: 'رمز QR غير موجود' }, { status: 400 });
    }

    const member = await getMemberFromRequest(request);

    // Look up token
    const qrRecord = await queryOne(`SELECT * FROM qr_tokens WHERE token = ?`, [token]);
    if (!qrRecord) {
      return NextResponse.json({
        found: false,
        message: 'رمز QR غير معروف في نظام اللعبة'
      }, { status: 404 });
    }

    // Check if team context matches
    let matchesCurrentLevel = false;
    let hintMessage = '';

    if (member && member.team_id) {
      const team = await queryOne(`SELECT * FROM teams WHERE id = ?`, [member.team_id]);
      if (team) {
        if (qrRecord.era_id === team.era_id && qrRecord.level_number === team.current_level) {
          matchesCurrentLevel = true;
          hintMessage = 'أحسنت! هذا الرمز مخصص للمستوى الحالي لفريقك.';
        } else if (qrRecord.level_number < team.current_level) {
          hintMessage = 'هذا الرمز لمستوى سابق تم تجاوزه بالفعل.';
        } else {
          hintMessage = 'هذا الرمز لمستوى آخر لم يصل إليه فريقك بعد!';
        }
      }
    }

    return NextResponse.json({
      found: true,
      label: qrRecord.label,
      location: qrRecord.location_name,
      revealedContent: qrRecord.revealed_content,
      matchesCurrentLevel,
      hintMessage,
    });
  } catch (err) {
    console.error('QR resolver error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

