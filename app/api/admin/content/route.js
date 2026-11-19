// ========================================================
// app/api/admin/content/route.js - Dynamic Full Content Editor API
// ========================================================

import { NextResponse } from 'next/server';
import { initSchema, query, queryOne, execute } from '@/lib/db';
import { verifyAdmin, logEvent } from '@/lib/authHelper';

export async function GET(request) {
  try {
    await initSchema();
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: 'غير مصرح لك (المشرف فقط)' }, { status: 403 });
    }

    const settings = await queryOne(`SELECT * FROM game_state WHERE id = 1`);
    const eras = await query(`SELECT * FROM eras ORDER BY id ASC`);
    const levels = await query(`SELECT * FROM levels ORDER BY era_id ASC, level_number ASC`);
    const variants = await query(`SELECT * FROM level_variant_overrides ORDER BY level_id ASC, variant ASC`);
    const booths = await query(`SELECT * FROM booths ORDER BY era_id ASC, level_number ASC`);
    const engineers = await query(`SELECT * FROM staff_engineers ORDER BY id ASC`);
    const qrTokens = await query(`SELECT * FROM qr_tokens ORDER BY era_id ASC, level_number ASC`);

    return NextResponse.json({
      settings,
      eras,
      levels,
      variants,
      booths,
      engineers,
      qrTokens,
    });
  } catch (err) {
    console.error('Admin content GET error:', err);
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
    const { target, data } = body;

    if (target === 'settings') {
      await execute(
        `UPDATE game_state SET
          safety_banner = ?,
          curse_text = ?,
          hint2_penalty_seconds = ?,
          hint3_penalty_seconds = ?,
          wrong_lockout_seconds = ?,
          updated_at = datetime('now')
         WHERE id = 1`,
        [
          data.safety_banner,
          data.curse_text,
          Number(data.hint2_penalty_seconds || 60),
          Number(data.hint3_penalty_seconds || 120),
          Number(data.wrong_lockout_seconds || 30),
        ]
      );
      await logEvent(null, null, 'SETTINGS_UPDATED');
      return NextResponse.json({ success: true });
    }

    if (target === 'era') {
      await execute(
        `UPDATE eras SET name = ?, ruler = ?, color = ?, script_text = ? WHERE id = ?`,
        [data.name, data.ruler, data.color, data.script_text, Number(data.id)]
      );
      await logEvent(null, null, 'ERA_UPDATED', { eraId: data.id });
      return NextResponse.json({ success: true });
    }

    if (target === 'level') {
      await execute(
        `UPDATE levels SET
          title = ?,
          story_text = ?,
          clue_type = ?,
          base_clue_text = ?,
          base_valid_answers = ?,
          hint1_text = ?,
          hint2_text = ?,
          hint3_text = ?,
          safety_warning = ?,
          photo_filename = ?
         WHERE id = ?`,
        [
          data.title,
          data.story_text,
          data.clue_type,
          data.base_clue_text,
          typeof data.base_valid_answers === 'string' ? data.base_valid_answers : JSON.stringify(data.base_valid_answers),
          data.hint1_text,
          data.hint2_text,
          data.hint3_text,
          data.safety_warning ? 1 : 0,
          data.photo_filename || null,
          Number(data.id),
        ]
      );
      await logEvent(null, null, 'LEVEL_UPDATED', { levelId: data.id });
      return NextResponse.json({ success: true });
    }

    if (target === 'variant') {
      await execute(
        `UPDATE level_variant_overrides SET
          clue_text = ?,
          valid_answers = ?,
          location_target = ?,
          qr_token = ?,
          booth_reward_code = ?
         WHERE id = ?`,
        [
          data.clue_text,
          typeof data.valid_answers === 'string' ? data.valid_answers : JSON.stringify(data.valid_answers),
          data.location_target,
          data.qr_token,
          data.booth_reward_code,
          Number(data.id),
        ]
      );
      await logEvent(null, null, 'VARIANT_UPDATED', { variantId: data.id });
      return NextResponse.json({ success: true });
    }

    if (target === 'booth') {
      await execute(
        `UPDATE booths SET
          game_name = ?,
          rules_ar = ?,
          win_condition = ?,
          safety_notes = ?,
          organizer_script = ?,
          reward_variant_a = ?,
          reward_variant_b = ?,
          reward_variant_c = ?
         WHERE id = ?`,
        [
          data.game_name,
          data.rules_ar,
          data.win_condition,
          data.safety_notes,
          data.organizer_script,
          data.reward_variant_a,
          data.reward_variant_b,
          data.reward_variant_c,
          Number(data.id),
        ]
      );
      await logEvent(null, null, 'BOOTH_UPDATED', { boothId: data.id });
      return NextResponse.json({ success: true });
    }

    if (target === 'engineer') {
      await execute(
        `UPDATE staff_engineers SET name = ?, facts_json = ? WHERE id = ?`,
        [data.name, typeof data.facts_json === 'string' ? data.facts_json : JSON.stringify(data.facts_json), data.id]
      );
      await logEvent(null, null, 'ENGINEER_UPDATED', { engineerId: data.id });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'هدف غير صالح' }, { status: 400 });
  } catch (err) {
    console.error('Admin content POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

