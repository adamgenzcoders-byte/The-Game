// ========================================================
// app/api/race-projector/route.js - 4-Lane Live Race Data
// ========================================================

import { NextResponse } from 'next/server';
import { initSchema, query, queryOne } from '@/lib/db';

export async function GET() {
  try {
    await initSchema();
    const gameState = await queryOne(`SELECT state, start_at_epoch FROM game_state WHERE id = 1`);

    const eras = await query(`SELECT id, name, ruler, color, icon FROM eras ORDER BY id ASC`);

    const teams = await query(`
      SELECT t.id, t.name, t.icon, t.era_id, t.variant, t.current_level,
             t.total_penalty_seconds, t.started_at, t.finished_at,
             COUNT(m.id) as member_count
      FROM teams t
      LEFT JOIN members m ON m.team_id = t.id
      GROUP BY t.id
    `);

    // Group teams by era
    const lanes = eras.map(era => {
      const eraTeams = teams
        .filter(t => t.era_id === era.id)
        .map(t => {
          let elapsedSeconds = 0;
          if (t.started_at) {
            const start = new Date(t.started_at).getTime();
            const end = t.finished_at ? new Date(t.finished_at).getTime() : Date.now();
            elapsedSeconds = Math.max(0, Math.floor((end - start) / 1000));
          }
          const totalEffective = elapsedSeconds + (t.total_penalty_seconds || 0);

          return {
            id: t.id,
            name: t.name,
            icon: t.icon,
            variant: t.variant,
            currentLevel: Math.min(10, t.current_level),
            isFinished: t.current_level > 10,
            elapsedSeconds,
            penaltySeconds: t.total_penalty_seconds || 0,
            totalEffective,
            memberCount: t.member_count,
          };
        });

      // Sort teams in this era
      eraTeams.sort((a, b) => {
        if (b.isFinished !== a.isFinished) return b.isFinished ? 1 : -1;
        if (b.currentLevel !== a.currentLevel) return b.currentLevel - a.currentLevel;
        return a.totalEffective - b.totalEffective;
      });

      return {
        eraId: era.id,
        eraName: era.name,
        ruler: era.ruler,
        color: era.color,
        icon: era.icon,
        teams: eraTeams,
      };
    });

    return NextResponse.json({
      gameState: gameState ? gameState.state : 'LOBBY',
      serverNow: Date.now(),
      startAtEpoch: gameState ? gameState.start_at_epoch : null,
      lanes,
    });
  } catch (err) {
    console.error('Race projector GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

