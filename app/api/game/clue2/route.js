// ========================================================
// app/api/game/clue2/route.js - Unlock Clue 2 (5 Points Penalty)
// ========================================================

import { NextResponse } from 'next/server';
import { initSchema, queryOne, execute } from '@/lib/db';
import { getMemberFromRequest, logEvent } from '@/lib/authHelper';

export async function POST(request) {
  try {
    await initSchema();
    const member = await getMemberFromRequest(request);
    if (!member || !member.team_id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const team = await queryOne(`SELECT * FROM teams WHERE id = ?`, [member.team_id]);
    if (!team || team.current_level !== 1) {
      return NextResponse.json({ error: 'المرحلة غير صالحة لكشف المعلومة الثانية' }, { status: 400 });
    }

    // Role check: Only Leader or Designated Writer can unlock
    const canSubmit = Boolean(member.is_leader || member.can_submit);
    if (!canSubmit) {
      return NextResponse.json({ error: 'فقط قائد الفريق أو الكاتب يمكنه اتخاذ قرار كشف المعلومة الثانية' }, { status: 403 });
    }

    // Check if progress record exists for level 1
    const prog = await queryOne(
      `SELECT id FROM team_level_progress WHERE team_id = ? AND level_number = 1`,
      [team.id]
    );

    if (prog) {
      await execute(`UPDATE team_level_progress SET clue2_revealed = 1 WHERE id = ?`, [prog.id]);
    } else {
      await execute(
        `INSERT INTO team_level_progress (team_id, era_id, level_number, clue2_revealed, hints_used)
         VALUES (?, ?, 1, 1, '[]')`,
        [team.id, team.era_id]
      );
    }

    await logEvent(team.id, member.id, 'CLUE_2_REVEALED', {
      penalty: 'Max points reduced from 10 to 5',
    });

    return NextResponse.json({ success: true, clue2Revealed: true });
  } catch (err) {
    console.error('Clue2 reveal error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

