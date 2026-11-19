// ========================================================
// app/api/stage-reveal/route.js - 4-Slot Stage Projector Reveal
// ========================================================

import { NextResponse } from 'next/server';
import { initSchema, queryOne, query, execute } from '@/lib/db';
import { verifyAdmin, logEvent } from '@/lib/authHelper';

export async function GET() {
  try {
    await initSchema();
    const gameState = await queryOne(`SELECT curse_text FROM game_state WHERE id = 1`);

    const eras = await query(`
      SELECT e.id, e.name, e.ruler, e.color, e.icon, e.script_text, e.is_revealed_on_stage,
             t.name as winning_team_name, t.icon as winning_team_icon
      FROM eras e
      LEFT JOIN teams t ON e.storyteller_team_id = t.id
      ORDER BY e.id ASC
    `);

    const slots = eras.map(e => ({
      eraId: e.id,
      eraName: e.name,
      ruler: e.ruler,
      color: e.color,
      icon: e.icon,
      scriptText: e.script_text,
      isRevealed: Boolean(e.is_revealed_on_stage),
      winningTeamName: e.winning_team_name || 'قيد المنافسة...',
      winningTeamIcon: e.winning_team_icon || '⏳',
    }));

    const allRevealed = slots.every(s => s.isRevealed);

    return NextResponse.json({
      slots,
      allRevealed,
      curseText: gameState ? gameState.curse_text : '',
    });
  } catch (err) {
    console.error('Stage reveal GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await initSchema();
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: 'غير مصرح لك (المشرف فقط)' }, { status: 403 });
    }

    const body = await request.json();
    const { eraId, isRevealed, revealAll } = body;

    if (revealAll) {
      await execute(`UPDATE eras SET is_revealed_on_stage = 1`);
      await logEvent(null, null, 'STAGE_REVEAL_ALL');
      return NextResponse.json({ success: true, allRevealed: true });
    }

    if (eraId) {
      await execute(`UPDATE eras SET is_revealed_on_stage = ? WHERE id = ?`, [isRevealed ? 1 : 0, Number(eraId)]);
      await logEvent(null, null, 'STAGE_REVEAL_SLOT', { eraId, isRevealed });
      return NextResponse.json({ success: true, eraId, isRevealed });
    }

    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  } catch (err) {
    console.error('Stage reveal POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

