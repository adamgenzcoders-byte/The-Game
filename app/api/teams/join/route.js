// ========================================================
// app/api/teams/join/route.js - Team Join Requests & Approval
// ========================================================

import { NextResponse } from 'next/server';
import { initSchema, query, queryOne, execute } from '@/lib/db';
import { getMemberFromRequest, verifyAdmin, logEvent } from '@/lib/authHelper';

// GET pending requests for current user's team
export async function GET(request) {
  try {
    await initSchema();
    const member = await getMemberFromRequest(request);
    const isAdmin = verifyAdmin(request);

    if (!member && !isAdmin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    let teamId = member?.team_id;
    const url = new URL(request.url);
    if (isAdmin && url.searchParams.get('teamId')) {
      teamId = url.searchParams.get('teamId');
    }

    if (!teamId) {
      return NextResponse.json({ requests: [] });
    }

    const requests = await query(
      `SELECT jr.id, jr.team_id, jr.member_id, jr.status, jr.created_at,
              m.name as member_name
       FROM join_requests jr
       JOIN members m ON jr.member_id = m.id
       WHERE jr.team_id = ? AND jr.status = 'PENDING'
       ORDER BY jr.created_at ASC`,
      [teamId]
    );

    return NextResponse.json({ requests });
  } catch (err) {
    console.error('Join requests GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST send join request
export async function POST(request) {
  try {
    await initSchema();
    const member = await getMemberFromRequest(request);
    if (!member) {
      return NextResponse.json({ error: 'يرجى تسجيل الاسم أولاً' }, { status: 401 });
    }

    if (member.team_id) {
      return NextResponse.json({ error: 'أنت مسجل بالفعل في فريق' }, { status: 400 });
    }

    const body = await request.json();
    const teamId = body.teamId;

    if (!teamId) {
      return NextResponse.json({ error: 'معرف الفريق مطلوب' }, { status: 400 });
    }

    // Check game state
    const gameState = await queryOne(`SELECT state FROM game_state WHERE id = 1`);
    if (gameState && gameState.state !== 'LOBBY') {
      return NextResponse.json({ error: 'تم إغلاق باب الانضمام للفرق' }, { status: 400 });
    }

    // Check team exists & count < 6
    const team = await queryOne(`SELECT * FROM teams WHERE id = ?`, [teamId]);
    if (!team) {
      return NextResponse.json({ error: 'الفريق غير موجود' }, { status: 404 });
    }

    const countRes = await queryOne(`SELECT COUNT(*) as cnt FROM members WHERE team_id = ?`, [teamId]);
    if (countRes && countRes.cnt >= 6) {
      return NextResponse.json({ error: 'الفريق اكتمل (الحد الأقصى 6 أعضاء)' }, { status: 400 });
    }

    // Check existing pending request
    const existing = await queryOne(
      `SELECT * FROM join_requests WHERE team_id = ? AND member_id = ? AND status = 'PENDING'`,
      [teamId, member.id]
    );
    if (existing) {
      return NextResponse.json({ success: true, message: 'تم إرسال طلب الانضمام مسبقاً، بانتظار موافقة قائد الفريق' });
    }

    await execute(
      `INSERT INTO join_requests (team_id, member_id, status, created_at) VALUES (?, ?, 'PENDING', datetime('now'))`,
      [teamId, member.id]
    );

    await logEvent(teamId, member.id, 'JOIN_REQUEST_SENT', { teamName: team.name });

    return NextResponse.json({ success: true, message: 'تم إرسال طلب الانضمام لقائد الفريق' });
  } catch (err) {
    console.error('Join POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT accept or reject join request
export async function PUT(request) {
  try {
    await initSchema();
    const member = await getMemberFromRequest(request);
    const isAdmin = verifyAdmin(request);

    if (!member && !isAdmin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, action } = body;

    if (!requestId || !['ACCEPT', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }

    const reqRecord = await queryOne(`SELECT * FROM join_requests WHERE id = ?`, [requestId]);
    if (!reqRecord || reqRecord.status !== 'PENDING') {
      return NextResponse.json({ error: 'الطلب غير متاح أو تمت معالجته بالفعل' }, { status: 400 });
    }

    // Only leader of this team or admin can accept/reject
    if (!isAdmin) {
      if (!member || member.team_id !== reqRecord.team_id || !member.is_leader) {
        return NextResponse.json({ error: 'فقط قائد الفريق أو المشرف يمكنه قبول أو رفض الطلبات' }, { status: 403 });
      }
    }

    if (action === 'REJECT') {
      await execute(`UPDATE join_requests SET status = 'REJECTED' WHERE id = ?`, [requestId]);
      await logEvent(reqRecord.team_id, reqRecord.member_id, 'JOIN_REQUEST_REJECTED');
      return NextResponse.json({ success: true, status: 'REJECTED' });
    }

    // Action is ACCEPT: Check team max limit (6)
    const countRes = await queryOne(`SELECT COUNT(*) as cnt FROM members WHERE team_id = ?`, [reqRecord.team_id]);
    if (countRes && countRes.cnt >= 6) {
      return NextResponse.json({ error: 'الفريق مكتمل بالفعل (6 أعضاء)' }, { status: 400 });
    }

    // Update request
    await execute(`UPDATE join_requests SET status = 'ACCEPTED' WHERE id = ?`, [requestId]);

    // Attach member to team
    await execute(`UPDATE members SET team_id = ?, is_leader = 0 WHERE id = ?`, [reqRecord.team_id, reqRecord.member_id]);

    // Reject any other pending requests from this member
    await execute(`UPDATE join_requests SET status = 'CANCELLED' WHERE member_id = ? AND id != ?`, [reqRecord.member_id, requestId]);

    await logEvent(reqRecord.team_id, reqRecord.member_id, 'MEMBER_JOINED_TEAM');

    return NextResponse.json({ success: true, status: 'ACCEPTED' });
  } catch (err) {
    console.error('Join PUT error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

