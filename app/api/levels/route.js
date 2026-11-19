// ========================================================
// app/api/levels/route.js - 10 Levels Beat List (Locked vs Solved)
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
      `SELECT t.*, e.name as era_name, e.color as era_color, e.icon as era_icon, e.ruler as era_ruler
       FROM teams t
       JOIN eras e ON t.era_id = e.id
       WHERE t.id = ?`,
      [member.team_id]
    );

    if (!team) {
      return NextResponse.json({ error: 'الفريق غير موجود' }, { status: 404 });
    }

    // Get all 10 levels for this era
    const allLevels = await query(
      `SELECT id, level_number, title, story_text, clue_type, base_clue_text, photo_filename
       FROM levels
       WHERE era_id = ?
       ORDER BY level_number ASC`,
      [team.era_id]
    );

    // Get solved progress
    const progressList = await query(
      `SELECT level_number, solved_at, solution_submitted
       FROM team_level_progress
       WHERE team_id = ? AND solved_at IS NOT NULL`,
      [team.id]
    );

    const progressByLevel = {};
    for (const p of progressList) {
      progressByLevel[p.level_number] = p;
    }

    const beats = allLevels.map(lvl => {
      const isSolved = lvl.level_number < team.current_level;
      const isCurrent = lvl.level_number === team.current_level;
      const isLocked = lvl.level_number > team.current_level;

      if (isSolved) {
        return {
          levelNumber: lvl.level_number,
          title: lvl.title,
          status: 'SOLVED',
          storyUnlocked: lvl.story_text,
          solvedAt: progressByLevel[lvl.level_number]?.solved_at || null,
        };
      }

      if (isCurrent) {
        return {
          levelNumber: lvl.level_number,
          title: lvl.title,
          status: 'CURRENT',
        };
      }

      return {
        levelNumber: lvl.level_number,
        title: `المستوى ${lvl.level_number}`,
        status: 'LOCKED',
      };
    });

    return NextResponse.json({
      era: {
        id: team.era_id,
        name: team.era_name,
        ruler: team.era_ruler,
        color: team.era_color,
        icon: team.era_icon,
      },
      currentLevel: team.current_level,
      levels: beats,
    });
  } catch (err) {
    console.error('Levels GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

