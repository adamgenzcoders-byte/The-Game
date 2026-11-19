// ========================================================
// app/api/game/current/route.js - Safe Sanitized Active Level Delivery
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
      return NextResponse.json({ error: 'لست منضماً لأي فريق بعد' }, { status: 403 });
    }

    // Check game state & auto-transition if countdown finished
    let gameState = await queryOne(`SELECT * FROM game_state WHERE id = 1`);
    if (gameState && gameState.state === 'COUNTDOWN' && gameState.start_at_epoch) {
      if (Date.now() >= gameState.start_at_epoch) {
        await execute(`UPDATE game_state SET state = 'RUNNING', updated_at = datetime('now') WHERE id = 1`);
        await execute(`UPDATE teams SET started_at = datetime('now') WHERE started_at IS NULL`);
        gameState.state = 'RUNNING';
      }
    }

    if (!gameState || gameState.state !== 'RUNNING') {
      return NextResponse.json({
        gameState: gameState ? gameState.state : 'LOBBY',
        startAtEpoch: gameState ? gameState.start_at_epoch : null,
      });
    }

    // Team info
    const team = await queryOne(
      `SELECT t.*, e.name as era_name, e.ruler as era_ruler, e.color as era_color, e.icon as era_icon, e.storyteller_team_id
       FROM teams t
       JOIN eras e ON t.era_id = e.id
       WHERE t.id = ?`,
      [member.team_id]
    );

    if (!team) {
      return NextResponse.json({ error: 'بيانات الفريق غير موجودة' }, { status: 404 });
    }

    // Check if finished (completed 10 levels)
    if (team.current_level > 10) {
      const isStoryteller = team.storyteller_team_id === team.id;
      return NextResponse.json({
        finished: true,
        isStoryteller,
        eraId: team.era_id,
        eraName: team.era_name,
        eraColor: team.era_color,
        eraRuler: team.era_ruler,
        finishedAt: team.finished_at,
        curseText: gameState.curse_text,
      });
    }

    // Fetch Level
    const level = await queryOne(
      `SELECT * FROM levels WHERE era_id = ? AND level_number = ?`,
      [team.era_id, team.current_level]
    );

    if (!level) {
      return NextResponse.json({ error: 'المستوى غير موجود' }, { status: 404 });
    }

    // Fetch Variant Override
    const override = await queryOne(
      `SELECT * FROM level_variant_overrides WHERE level_id = ? AND variant = ?`,
      [level.id, team.variant || 'A']
    );

    // Active progress record for unlocked hints
    const progress = await queryOne(
      `SELECT hints_used FROM team_level_progress WHERE team_id = ? AND level_number = ?`,
      [team.id, team.current_level]
    );

    let hintsUsed = [];
    if (progress && progress.hints_used) {
      try {
        hintsUsed = JSON.parse(progress.hints_used);
      } catch (e) {
        hintsUsed = [];
      }
    }

    // Effective clue text
    const effectiveClueText = (override && override.clue_text) ? override.clue_text : level.base_clue_text;

    // Hints payload - only reveal text if unlocked
    const hints = {
      1: { unlocked: hintsUsed.includes(1), text: hintsUsed.includes(1) ? level.hint1_text : null },
      2: { unlocked: hintsUsed.includes(2), text: hintsUsed.includes(2) ? level.hint2_text : null },
      3: { unlocked: hintsUsed.includes(3), text: hintsUsed.includes(3) ? level.hint3_text : null },
    };

    // Parse answer types
    let answerTypes = ['text'];
    try {
      answerTypes = JSON.parse(level.base_answer_types);
    } catch (e) {
      answerTypes = ['text'];
    }

    // If Beat 1 (Engineers facts), parse questions if multi
    let questions = null;
    if (level.clue_type === 'ENGINEER_FACTS' || answerTypes.includes('multi')) {
      try {
        const valObj = JSON.parse((override && override.valid_answers) || level.base_valid_answers);
        if (valObj.questions) {
          questions = valObj.questions;
        }
      } catch (e) {}
    }

    // Booth info if Beat 4
    let booth = null;
    if (level.clue_type === 'BOOTH_GAME' || level.clue_type === 'BOOTH') {
      const bRow = await queryOne(
        `SELECT game_name, rules_ar, win_condition, safety_notes FROM booths WHERE era_id = ? AND level_number = ?`,
        [team.era_id, team.current_level]
      );
      if (bRow) {
        booth = bRow;
      }
    }

    // Photo URL
    let photoUrl = null;
    if (level.photo_filename) {
      photoUrl = `/media/catalog/${level.photo_filename}`;
    }

    return NextResponse.json({
      gameState: 'RUNNING',
      serverNow: Date.now(),
      endAtEpoch: gameState.end_at_epoch,
      team: {
        id: team.id,
        teamNumber: team.team_number || 1,
        points: team.points !== undefined ? team.points : 100,
        name: team.name,
        icon: team.icon,
        variant: team.variant,
        eraId: team.era_id,
        eraName: team.era_name,
        eraRuler: team.era_ruler,
        eraColor: team.era_color,
        eraIcon: team.era_icon,
        wrongAttempts: team.wrong_attempts,
      },
      level: {
        levelNumber: level.level_number,
        title: level.title,
        storyText: level.story_text,
        clueType: level.clue_type,
        clueText: effectiveClueText,
        answerTypes,
        questions,
        booth,
        photoUrl,
        safetyWarning: Boolean(level.safety_warning),
      },
      hints,
      safetyBanner: gameState.safety_banner,
    });
  } catch (err) {
    console.error('Game current GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
