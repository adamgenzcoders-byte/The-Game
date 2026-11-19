// ========================================================
// app/api/game/hint/route.js - Free Helpful Hint Ladder (No Penalties)
// ========================================================

import { NextResponse } from 'next/server';
import { initSchema, queryOne, execute } from '@/lib/db';
import { getMemberFromRequest, logEvent } from '@/lib/authHelper';

export async function POST(request) {
  try {
    await initSchema();
    const member = await getMemberFromRequest(request);
    if (!member) {
      return NextResponse.json({ error: 'غير مسجل' }, { status: 401 });
    }

    if (!member.team_id) {
      return NextResponse.json({ error: 'لست في فريق' }, { status: 403 });
    }

    const gameState = await queryOne(`SELECT state FROM game_state WHERE id = 1`);
    if (!gameState || gameState.state !== 'RUNNING') {
      return NextResponse.json({ error: 'المرحلة غير جارية حالياً' }, { status: 400 });
    }

    const team = await queryOne(`SELECT * FROM teams WHERE id = ?`, [member.team_id]);
    if (!team) {
      return NextResponse.json({ error: 'الفريق غير موجود' }, { status: 404 });
    }

    const body = await request.json();
    const hintNumber = Number(body.hintNumber);

    if (![1, 2, 3].includes(hintNumber)) {
      return NextResponse.json({ error: 'رقم تلميح غير صالح' }, { status: 400 });
    }

    // Fetch Level
    const level = await queryOne(
      `SELECT * FROM levels WHERE era_id = ? AND level_number = ?`,
      [team.era_id, team.current_level]
    );

    if (!level) {
      return NextResponse.json({ error: 'المستوى غير موجود' }, { status: 404 });
    }

    // Get current hints used
    const prog = await queryOne(
      `SELECT id, hints_used FROM team_level_progress WHERE team_id = ? AND level_number = ?`,
      [team.id, team.current_level]
    );

    let hintsUsed = [];
    if (prog && prog.hints_used) {
      try {
        hintsUsed = JSON.parse(prog.hints_used);
      } catch (e) {
        hintsUsed = [];
      }
    }

    // Check ladder order
    if (hintNumber === 2 && !hintsUsed.includes(1)) {
      return NextResponse.json({ error: 'يجب كشف التلميح الأول أولاً' }, { status: 400 });
    }
    if (hintNumber === 3 && !hintsUsed.includes(2)) {
      return NextResponse.json({ error: 'يجب كشف التلميح الثاني أولاً' }, { status: 400 });
    }

    let hintText = '';
    if (hintNumber === 1) hintText = level.hint1_text;
    if (hintNumber === 2) hintText = level.hint2_text;
    if (hintNumber === 3) hintText = level.hint3_text;

    if (!hintsUsed.includes(hintNumber)) {
      hintsUsed.push(hintNumber);

      // Upsert team_level_progress
      if (prog) {
        await execute(
          `UPDATE team_level_progress SET hints_used = ? WHERE id = ?`,
          [JSON.stringify(hintsUsed), prog.id]
        );
      } else {
        await execute(
          `INSERT INTO team_level_progress (team_id, era_id, level_number, hints_used)
           VALUES (?, ?, ?, ?)`,
          [team.id, team.era_id, team.current_level, JSON.stringify(hintsUsed)]
        );
      }

      await logEvent(team.id, member.id, 'HINT_UNLOCKED', { hintNumber });
    }

    return NextResponse.json({
      success: true,
      hintNumber,
      text: hintText,
    });
  } catch (err) {
    console.error('Game hint POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
