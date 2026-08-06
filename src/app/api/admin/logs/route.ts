/** GET /api/admin/logs — combined login/pin/audit logs (admin only)
 *
 * Query params:
 *   type   — all | login | pin | audit (default: all)
 *   limit  — max records (default: 50, max: 200)
 *   userId — filter by specific user
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/require-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'all';
  const limit = Math.min(200, parseInt(url.searchParams.get('limit') || '50', 10));
  const userId = url.searchParams.get('userId') || undefined;

  const loginWhere = userId ? { userId } : {};
  const pinWhere = userId ? { userId } : {};
  const auditWhere = userId ? { userId } : {};

  const [loginLogs, pinLogs, auditLogs] = await Promise.all([
    (type === 'all' || type === 'login')
      ? db.loginLog.findMany({ where: loginWhere, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } } } })
      : Promise.resolve([]),
    (type === 'all' || type === 'pin')
      ? db.pinLog.findMany({ where: pinWhere, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } } } })
      : Promise.resolve([]),
    (type === 'all' || type === 'audit')
      ? db.auditLog.findMany({ where: auditWhere, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } } } })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    loginLogs: loginLogs.map(l => ({ ...l, ts: l.createdAt })),
    pinLogs: pinLogs.map(l => ({ ...l, ts: l.createdAt })),
    auditLogs: auditLogs.map(l => ({ ...l, ts: l.createdAt })),
  });
}
