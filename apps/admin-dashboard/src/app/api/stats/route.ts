import { NextRequest, NextResponse } from 'next/server';
import { initDb, getAdminDashboardStats, getAdminMetricsOverTime, getAdminModelDistribution } from '@ai-monitoring/db-admin';
import { subDays, subHours } from 'date-fns';

const db = initDb(process.env.DATABASE_URL!);

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || 'all';

    let startDate: string | undefined;
    const now = new Date();
    
    if (range === 'Today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startDate = today.toISOString();
    } else if (range === '24h') {
      startDate = subHours(now, 24).toISOString();
    } else if (range === '7D') {
      startDate = subDays(now, 7).toISOString();
    } else if (range === '30D') {
      startDate = subDays(now, 30).toISOString();
    } else if (range === '60D') {
      startDate = subDays(now, 60).toISOString();
    }

    const options = { startDate };

    const [stats, metricsOverTime, modelDistribution] = await Promise.all([
      getAdminDashboardStats(db, options),
      getAdminMetricsOverTime(db, options),
      getAdminModelDistribution(db, options)
    ]);
    return NextResponse.json({
      ...stats,
      metricsOverTime,
      modelDistribution
    });
  } catch (error: any) {
    console.error('Error fetching admin dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
