// ========================================================
// app/api/storyteller/route.js - Stage Storyteller Script Endpoint
// ========================================================

import { NextResponse } from 'next/server';
import { initSchema, queryOne, query } from '@/lib/db';
import { getMemberFromRequest, verifyAdmin } from '@/lib/authHelper';

export async function GET(request) {
  try {
    await initSchema();
    const { searchParams } = new URL(request.url);
    const adminEraId = searchParams.get('eraId');
    const isAdmin = verifyAdmin(request);

    // If admin previewing an era
    if (isAdmin && adminEraId) {
      const era = await queryOne(`SELECT * FROM eras WHERE id = ?`, [Number(adminEraId)]);
      if (!era) return NextResponse.json({ error: 'العصر غير موجود' }, { status: 404 });

      return NextResponse.json({
        authorized: true,
        era: {
          id: era.id,
          name: era.name,
          ruler: era.ruler,
          color: era.color,
          icon: era.icon,
          scriptText: era.script_text,
          isRevealedOnStage: Boolean(era.is_revealed_on_stage),
        },
        isAdminPreview: true,
      });
    }

    // Player access
    const member = await getMemberFromRequest(request);
    if (!member || !member.team_id) {
      return NextResponse.json({ authorized: false, error: 'غير مصرح' }, { status: 401 });
    }

    const team = await queryOne(`SELECT * FROM teams WHERE id = ?`, [member.team_id]);
    const era = await queryOne(`SELECT * FROM eras WHERE id = ?`, [team.era_id]);

    const isWinner = era.storyteller_team_id === team.id;

    if (!isWinner && team.current_level <= 10) {
      return NextResponse.json({
        authorized: false,
        isWinner: false,
        message: 'فريقكم لم ينهِ مستويات العصر بعد أو لم يتأهل كراوٍ للمسرح.',
      }, { status: 403 });
    }

    return NextResponse.json({
      authorized: true,
      isWinner,
      teamName: team.name,
      era: {
        id: era.id,
        name: era.name,
        ruler: era.ruler,
        color: era.color,
        icon: era.icon,
        scriptText: era.script_text,
        isRevealedOnStage: Boolean(era.is_revealed_on_stage),
      },
    });
  } catch (err) {
    console.error('Storyteller GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

