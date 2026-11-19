// ========================================================
// app/api/journey/route.js - Game State Machine & Transitions
// ========================================================

import { NextResponse } from 'next/server';
import { initSchema, query, queryOne, execute } from '@/lib/db';
import { verifyAdmin, logEvent } from '@/lib/authHelper';
import { balanceErasAndVariants } from '@/lib/eraBalancer';
import { seedGameData } from '@/lib/seedEngine';

export async function GET() {
  try {
    await initSchema();
    const gameState = await queryOne(`SELECT * FROM game_state WHERE id = 1`);

    // Era stats
    const eraStats = await query(`
      SELECT e.id, e.name, e.ruler, e.color, e.icon,
             COUNT(DISTINCT t.id) as team_count,
             COUNT(m.id) as member_count
      FROM eras e
      LEFT JOIN teams t ON t.era_id = e.id
      LEFT JOIN members m ON m.team_id = t.id
      GROUP BY e.id
      ORDER BY e.id ASC
    `);

    return NextResponse.json({
      state: gameState ? gameState.state : 'LOBBY',
      serverNow: Date.now(),
      startAtEpoch: gameState ? gameState.start_at_epoch : null,
      curseText: gameState ? gameState.curse_text : '',
      safetyBanner: gameState ? gameState.safety_banner : '',
      eraStats,
    });
  } catch (err) {
    console.error('Journey GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await initSchema();
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: 'غير مصرح لك (صلاحيات المشرف فقط)' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'LOCK_AND_ASSIGN') {
      // Balance teams across 4 eras and assign variants A/B/C
      const assignments = await balanceErasAndVariants(query);

      for (const item of assignments) {
        await execute(
          `UPDATE teams SET era_id = ?, variant = ? WHERE id = ?`,
          [item.eraId, item.variant, item.teamId]
        );
      }

      await execute(
        `UPDATE game_state SET state = 'LOCKED', updated_at = datetime('now') WHERE id = 1`
      );

      await logEvent(null, null, 'GAME_STATE_LOCKED', { assignmentsCount: assignments.length });

      return NextResponse.json({
        success: true,
        state: 'LOCKED',
        assignmentsCount: assignments.length,
      });
    }

    if (action === 'START_COUNTDOWN') {
      const countdownMs = (body.seconds || 10) * 1000;
      const startAtEpoch = Date.now() + countdownMs;

      await execute(
        `UPDATE game_state SET state = 'COUNTDOWN', start_at_epoch = ?, updated_at = datetime('now') WHERE id = 1`,
        [startAtEpoch]
      );

      await logEvent(null, null, 'COUNTDOWN_STARTED', { startAtEpoch });

      return NextResponse.json({
        success: true,
        state: 'COUNTDOWN',
        startAtEpoch,
      });
    }

    if (action === 'START_NOW' || action === 'RUNNING') {
      await execute(
        `UPDATE game_state SET state = 'RUNNING', updated_at = datetime('now') WHERE id = 1`
      );

      // Set started_at for all teams that don't have it
      await execute(
        `UPDATE teams SET started_at = datetime('now') WHERE started_at IS NULL`
      );

      await logEvent(null, null, 'JOURNEY_RUNNING');

      return NextResponse.json({ success: true, state: 'RUNNING' });
    }

    if (action === 'PAUSE') {
      await execute(
        `UPDATE game_state SET state = 'PAUSED', updated_at = datetime('now') WHERE id = 1`
      );
      await logEvent(null, null, 'JOURNEY_PAUSED');
      return NextResponse.json({ success: true, state: 'PAUSED' });
    }

    if (action === 'RESUME') {
      await execute(
        `UPDATE game_state SET state = 'RUNNING', updated_at = datetime('now') WHERE id = 1`
      );
      await logEvent(null, null, 'JOURNEY_RESUMED');
      return NextResponse.json({ success: true, state: 'RUNNING' });
    }

    if (action === 'END') {
      await execute(
        `UPDATE game_state SET state = 'ENDED', updated_at = datetime('now') WHERE id = 1`
      );
      await logEvent(null, null, 'JOURNEY_ENDED');
      return NextResponse.json({ success: true, state: 'ENDED' });
    }

    if (action === 'MANUAL_MOVE') {
      const { teamId, eraId, variant } = body;
      if (!teamId || !eraId || !variant) {
        return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
      }

      await execute(
        `UPDATE teams SET era_id = ?, variant = ? WHERE id = ?`,
        [Number(eraId), variant.toUpperCase(), teamId]
      );

      await logEvent(teamId, null, 'TEAM_MANUAL_MOVED', { eraId, variant });

      return NextResponse.json({ success: true });
    }

    if (action === 'RESET') {
      // Clear all team/game data and re-seed
      await execute(`DELETE FROM team_level_progress`);
      await execute(`DELETE FROM join_requests`);
      await execute(`DELETE FROM members`);
      await execute(`DELETE FROM teams`);
      await execute(`DELETE FROM event_logs`);
      await execute(`UPDATE eras SET storyteller_team_id = NULL, is_revealed_on_stage = 0`);
      await execute(`
        UPDATE game_state SET state = 'LOBBY', start_at_epoch = NULL, updated_at = datetime('now') WHERE id = 1
      `);

      await seedGameData(query, queryOne, execute);
      await logEvent(null, null, 'GAME_RESET_BY_ADMIN');

      return NextResponse.json({ success: true, state: 'LOBBY' });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (err) {
    console.error('Journey POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

