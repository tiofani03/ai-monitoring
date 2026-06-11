import { NextRequest, NextResponse } from 'next/server';
import { initDb, getDashboardStats, getLocalMetricsOverTime, getLocalModelDistribution } from '@ai-monitoring/db-local';
import { subDays, subHours } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const db = initDb();
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

    const stats = getDashboardStats(db, options);
    const metricsOverTime = getLocalMetricsOverTime(db, options);
    const modelDistribution = getLocalModelDistribution(db, options);

    return NextResponse.json({
      ...stats,
      metricsOverTime,
      modelDistribution
    });
  } catch (error) {
    console.error('Failed to fetch local stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
