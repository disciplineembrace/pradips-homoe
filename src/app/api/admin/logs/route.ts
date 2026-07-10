/** GET /api/admin/logs — combined login/pin/audit logs (admin only) */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/require-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;
  
  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'all'; // all | login | pin | audit
  const limit = Math.min(200, parseInt(url.searchParams.get('limit') || '50', 10));
  
  const [loginLogs, pinLogs, auditLogs] = await Promise.all([
    (type === 'all' || type === 'login') ? db.loginLog.findMany({ take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { loginId: true, fullName: true } } } }) : Promise.resolve([]),
    (type === 'all' || type === 'pin') ? db.pinLog.findMany({ take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { loginId: true, fullName: true } } } }) : Promise.resolve([]),
    (type === 'all' || type === 'audit') ? db.auditLog.findMany({ take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { loginId: true, fullName: true } } } }) : Promise.resolve([]),
  ]);
  
  return NextResponse.json({
    loginLogs: loginLogs.map(l => ({ ...l, ts: l.createdAt })),
    pinLogs: pinLogs.map(l => ({ ...l, ts: l.createdAt })),
    auditLogs: auditLogs.map(l => ({ ...l, ts: l.createdAt })),
  });
}
