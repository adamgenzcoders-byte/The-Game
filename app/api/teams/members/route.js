// ========================================================
// app/api/teams/members/route.js - Member removal / leave
// ========================================================

import { NextResponse } from 'next/server';
import { initSchema, queryOne, execute } from '@/lib/db';
import { getMemberFromRequest, verifyAdmin, logEvent } from '@/lib/authHelper';

export async function DELETE(request) {
  try {
    await initSchema();
    const currentMember = await getMemberFromRequest(request);
    const isAdmin = verifyAdmin(request);

    if (!currentMember && !isAdmin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetMemberId = searchParams.get('memberId') || currentMember?.id;

    if (!targetMemberId) {
      return NextResponse.json({ error: 'معرف العضو مطلوب' }, { status: 400 });
    }

    const targetMember = await queryOne(`SELECT * FROM members WHERE id = ?`, [targetMemberId]);
    if (!targetMember || !targetMember.team_id) {
      return NextResponse.json({ error: 'العضو غير مسجل في أي فريق' }, { status: 404 });
    }

    // Check permissions: either admin, or member leaving themselves, or leader kicking
    if (!isAdmin && currentMember.id !== targetMemberId) {
      if (currentMember.team_id !== targetMember.team_id || !currentMember.is_leader) {
        return NextResponse.json({ error: 'فقط قائد الفريق أو المشرف يمكنه حذف الأعضاء' }, { status: 403 });
      }
    }

    const teamId = targetMember.team_id;

    // If target is leader and leaves, transfer leadership or disband if empty
    if (targetMember.is_leader) {
      const otherMembers = await queryOne(
        `SELECT id FROM members WHERE team_id = ? AND id != ? LIMIT 1`,
        [teamId, targetMemberId]
      );
      if (otherMembers) {
        await execute(`UPDATE members SET is_leader = 1 WHERE id = ?`, [otherMembers.id]);
      } else {
        // No other members left, delete team
        await execute(`DELETE FROM teams WHERE id = ?`, [teamId]);
      }
    }

    // Detach member
    await execute(`UPDATE members SET team_id = NULL, is_leader = 0 WHERE id = ?`, [targetMemberId]);
    await logEvent(teamId, targetMemberId, 'MEMBER_REMOVED');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Member delete error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await initSchema();
    const currentMember = await getMemberFromRequest(request);
    if (!currentMember) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    if (!currentMember.is_leader) {
      return NextResponse.json({ error: 'فقط قائد الفريق يمكنه تحديد أدوار الأعضاء' }, { status: 403 });
    }

    const body = await request.json();
    const { targetMemberId, canSubmit } = body;

    if (!targetMemberId) {
      return NextResponse.json({ error: 'معرف العضو مطلوب' }, { status: 400 });
    }

    // Verify target belongs to the same team
    const targetMember = await queryOne(
      `SELECT * FROM members WHERE id = ? AND team_id = ?`,
      [targetMemberId, currentMember.team_id]
    );

    if (!targetMember) {
      return NextResponse.json({ error: 'العضو غير موجود في فريقك' }, { status: 404 });
    }

    if (targetMember.is_leader) {
      return NextResponse.json({ error: 'قائد الفريق كاتب دائماً ولا يمكن تغيير دوره' }, { status: 400 });
    }

    // Rule: Leader + 1 chosen member = 2 writers max!
    if (canSubmit) {
      // Set all other non-leader members to viewer (can_submit = 0)
      await execute(
        `UPDATE members SET can_submit = 0 WHERE team_id = ? AND is_leader = 0`,
        [currentMember.team_id]
      );
      // Set target to writer
      await execute(
        `UPDATE members SET can_submit = 1 WHERE id = ?`,
        [targetMemberId]
      );
    } else {
      await execute(
        `UPDATE members SET can_submit = 0 WHERE id = ?`,
        [targetMemberId]
      );
    }

    // Always ensure leader has can_submit = 1
    await execute(
      `UPDATE members SET can_submit = 1 WHERE team_id = ? AND is_leader = 1`,
      [currentMember.team_id]
    );

    await logEvent(currentMember.team_id, currentMember.id, 'WRITER_ROLE_UPDATED', {
      targetMemberId,
      canSubmit: Boolean(canSubmit),
    });

    return NextResponse.json({ success: true, targetMemberId, canSubmit: Boolean(canSubmit) });
  } catch (err) {
    console.error('Member PATCH error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


