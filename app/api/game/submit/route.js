// ========================================================
// app/api/game/submit/route.js - Friendly Answer Evaluation & Progression
// ========================================================

import { NextResponse } from 'next/server';
import { initSchema, queryOne, execute } from '@/lib/db';
import { getMemberFromRequest, logEvent } from '@/lib/authHelper';
import { checkAnswer } from '@/lib/normalizer';

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

    // Role Check: Only Leader and Designated Writer can submit answers
    const canSubmit = Boolean(member.is_leader || member.can_submit);
    if (!canSubmit) {
      return NextResponse.json({
        error: 'أنت في وضع المشاهدة. فقط قائد الفريق أو الكاتب المعتمد يمكنه تسليم الإجابة!'
      }, { status: 403 });
    }

    // Check game state
    const gameState = await queryOne(`SELECT state, end_at_epoch FROM game_state WHERE id = 1`);
    if (!gameState || gameState.state !== 'RUNNING') {
      return NextResponse.json({ error: 'المنافسة غير جارية حالياً (انتظر إشارة الجيم ماستر)' }, { status: 400 });
    }

    // Check time expired
    if (gameState.end_at_epoch && Date.now() >= gameState.end_at_epoch) {
      return NextResponse.json({ error: 'انتهى الوقت المحدد للمسابقة!' }, { status: 400 });
    }

    const team = await queryOne(`SELECT * FROM teams WHERE id = ?`, [member.team_id]);
    if (!team) {
      return NextResponse.json({ error: 'الفريق غير موجود' }, { status: 404 });
    }

    if (team.current_level > 10) {
      return NextResponse.json({ correct: true, finished: true });
    }

    const body = await request.json();
    const submittedAnswer = body.answer;

    // Fetch Level & Variant Override
    const level = await queryOne(
      `SELECT * FROM levels WHERE era_id = ? AND level_number = ?`,
      [team.era_id, team.current_level]
    );

    if (!level) {
      return NextResponse.json({ error: 'المستوى غير موجود' }, { status: 404 });
    }

    const override = await queryOne(
      `SELECT * FROM level_variant_overrides WHERE level_id = ? AND variant = ?`,
      [level.id, team.variant || 'A']
    );

    const validAnswersRaw = (override && override.valid_answers) ? override.valid_answers : level.base_valid_answers;

    let isCorrect = false;

    // Check if multi-field (Beat 1 Engineer Facts)
    if (level.clue_type === 'ENGINEER_FACTS' || typeof submittedAnswer === 'object') {
      try {
        const parsedExpected = JSON.parse(validAnswersRaw);
        if (parsedExpected && parsedExpected.expected && Array.isArray(parsedExpected.expected)) {
          const ans1 = submittedAnswer?.ans1 || '';
          const ans2 = submittedAnswer?.ans2 || '';
          const check1 = checkAnswer(ans1, parsedExpected.expected[0] || []);
          const check2 = checkAnswer(ans2, parsedExpected.expected[1] || []);
          isCorrect = check1 && check2;
        } else if (Array.isArray(parsedExpected)) {
          isCorrect = checkAnswer(String(submittedAnswer?.ans1 || submittedAnswer), parsedExpected);
        }
      } catch (e) {
        console.error('Error checking multi-field answer:', e);
      }
    } else {
      // Standard single answer
      let validList = [];
      try {
        validList = JSON.parse(validAnswersRaw);
      } catch (e) {
        validList = [validAnswersRaw];
      }
      if (!Array.isArray(validList)) validList = [String(validList)];

      isCorrect = checkAnswer(String(submittedAnswer || ''), validList);
    }

    // IF WRONG (No Lockout, No penalty! Just friendly retry)
    if (!isCorrect) {
      const newAttempts = (team.wrong_attempts || 0) + 1;
      await execute(`UPDATE teams SET wrong_attempts = ? WHERE id = ?`, [newAttempts, team.id]);
      await logEvent(team.id, member.id, 'WRONG_ANSWER_ATTEMPT', { attempts: newAttempts });

      return NextResponse.json({
        correct: false,
        attempts: newAttempts,
        message: 'إجابة غير صحيحة، راجع الدليل والتلميحات وحاول مجدداً مع فريقك!',
      });
    }

    // IF CORRECT
    await execute(`UPDATE teams SET wrong_attempts = 0 WHERE id = ?`, [team.id]);

    // Record solution in progress
    const nowIso = new Date().toISOString();
    const existingProg = await queryOne(
      `SELECT id FROM team_level_progress WHERE team_id = ? AND level_number = ?`,
      [team.id, team.current_level]
    );

    if (existingProg) {
      await execute(
        `UPDATE team_level_progress SET solved_at = ?, solution_submitted = ? WHERE id = ?`,
        [nowIso, JSON.stringify(submittedAnswer), existingProg.id]
      );
    } else {
      await execute(
        `INSERT INTO team_level_progress (team_id, era_id, level_number, solved_at, solution_submitted, hints_used)
         VALUES (?, ?, ?, ?, ?, '[]')`,
        [team.id, team.era_id, team.current_level, nowIso, JSON.stringify(submittedAnswer)]
      );
    }

    // Check if Beat 10 (Game Finished!)
    if (team.current_level >= 10) {
      await execute(
        `UPDATE teams SET current_level = 11, finished_at = ? WHERE id = ?`,
        [nowIso, team.id]
      );

      // Check if era storyteller is assigned
      const era = await queryOne(`SELECT storyteller_team_id FROM eras WHERE id = ?`, [team.era_id]);
      let isStoryteller = false;

      if (!era.storyteller_team_id) {
        // First team to finish this era becomes the Era Storyteller!
        await execute(`UPDATE eras SET storyteller_team_id = ? WHERE id = ?`, [team.id, team.era_id]);
        isStoryteller = true;
        await logEvent(team.id, member.id, 'ERA_STORYTELLER_CROWNED', { eraId: team.era_id });
      }

      await logEvent(team.id, member.id, 'TEAM_FINISHED_GAME', { isStoryteller });

      return NextResponse.json({
        correct: true,
        finished: true,
        isStoryteller,
        storyPiece: level.story_text,
        message: isStoryteller
          ? 'مبروك! فريقكم هو أول من أنهى العصر وتأهل لإلقاء نص كسر اللعنة على المسرح!'
          : 'أحسنتم! لقد أتممتم جميع مستويات العصر بنجاح!',
      });
    }

    // Advance to next level
    const nextLevel = team.current_level + 1;
    await execute(
      `UPDATE teams SET current_level = ? WHERE id = ?`,
      [nextLevel, team.id]
    );

    await logEvent(team.id, member.id, 'LEVEL_SOLVED', { levelSolved: team.current_level, nextLevel });

    return NextResponse.json({
      correct: true,
      nextLevel,
      storyPiece: level.story_text,
      message: 'إجابة صحيحة! تم فتح الجزء التالي من القصة.',
    });
  } catch (err) {
    console.error('Game submit error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
