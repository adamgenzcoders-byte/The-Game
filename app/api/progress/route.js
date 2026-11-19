// ========================================================
// app/api/progress/route.js - Team Progress, Era Rank & Race Strip
// ========================================================

import { NextResponse } from 'next/server';
import { initSchema, queryOne, query } from '@/lib/db';
import { getMemberFromRequest } from '@/lib/authHelper';

export async function GET(request) {
  try {
    await initSchema();
    const member = await getMemberFromRequest(request);
    if (!member) {
      return NextResponse.json({ error: 'غير مسجل' }, { status: 401 });
    }

    if (!member.team_id) {
      return NextResponse.json({ error: 'لست في فريق' }, { status: 403 });
    }

    const team = await queryOne(
      `SELECT t.*, e.name as era_name, e.ruler as era_ruler, e.color as era_color, e.icon as era_icon
       FROM teams t
       JOIN eras e ON t.era_id = e.id
       WHERE t.id = ?`,
      [member.team_id]
    );

    if (!team) {
      return NextResponse.json({ error: 'الفريق غير موجود' }, { status: 404 });
    }

    // Members list
    const teamMembers = await query(
      `SELECT id, name, is_leader FROM members WHERE team_id = ? ORDER BY is_leader DESC, name ASC`,
      [team.id]
    );

    // All teams in this era to compute ranking and race strip
    const eraTeams = await query(
      `SELECT id, team_number, points, name, icon, current_level, started_at, finished_at
       FROM teams
       WHERE era_id = ?
       ORDER BY current_level DESC, started_at ASC`,
      [team.era_id]
    );

    // Calculate score / rank:
    // Ranked primarily by current_level (higher is better), then actual time
    const rankedEraTeams = eraTeams.map((t) => {
      let elapsedSeconds = 0;
      if (t.started_at) {
        const start = new Date(t.started_at).getTime();
        const end = t.finished_at ? new Date(t.finished_at).getTime() : Date.now();
        elapsedSeconds = Math.max(0, Math.floor((end - start) / 1000));
      }

      return {
        id: t.id,
        teamNumber: t.team_number || 1,
        points: t.points !== undefined ? t.points : 100,
        name: t.name,
        icon: t.icon,
        currentLevel: Math.min(10, t.current_level),
        isFinished: t.current_level > 10,
        elapsedSeconds,
        isMyTeam: t.id === team.id,
      };
    });

    // Sort ranked: finished first, then current level DESC, then elapsedSeconds ASC
    rankedEraTeams.sort((a, b) => {
      if (b.isFinished !== a.isFinished) return b.isFinished ? 1 : -1;
      if (b.currentLevel !== a.currentLevel) return b.currentLevel - a.currentLevel;
      return a.elapsedSeconds - b.elapsedSeconds;
    });

    const myRankIndex = rankedEraTeams.findIndex(t => t.id === team.id);
    const myRank = myRankIndex !== -1 ? myRankIndex + 1 : 1;

    let teamElapsedSeconds = 0;
    if (team.started_at) {
      const start = new Date(team.started_at).getTime();
      const end = team.finished_at ? new Date(team.finished_at).getTime() : Date.now();
      teamElapsedSeconds = Math.max(0, Math.floor((end - start) / 1000));
    }

    return NextResponse.json({
      team: {
        id: team.id,
        teamNumber: team.team_number || 1,
        points: team.points !== undefined ? team.points : 100,
        name: team.name,
        icon: team.icon,
        eraId: team.era_id,
        eraName: team.era_name,
        eraRuler: team.era_ruler,
        eraColor: team.era_color,
        eraIcon: team.era_icon,
        variant: team.variant,
        currentLevel: Math.min(10, team.current_level),
        isFinished: team.current_level > 10,
        finishedAt: team.finished_at,
        elapsedSeconds: teamElapsedSeconds,
        rankInEra: myRank,
        totalTeamsInEra: rankedEraTeams.length,
      },
      members: teamMembers.map(m => ({
        id: m.id,
        name: m.name,
        isLeader: Boolean(m.is_leader),
      })),
      raceStrip: rankedEraTeams,
    });
  } catch (err) {
    console.error('Progress GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
