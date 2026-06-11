'use client';

import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { Settings, HelpCircle, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    inputTokens: 0,
    outputTokens: 0,
    cost: 0,
    events: 0,
    connected: false,
    recentActivity: [] as any[],
    metricsOverTime: [] as any[],
    modelDistribution: [] as any[]
  });
  const [chartMode, setChartMode] = useState<'tokens' | 'cost'>('tokens');
  const [timeRange, setTimeRange] = useState('all');
  const [tableMode, setTableMode] = useState<'model' | 'provider'>('model');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/stats?range=${timeRange}`);
        const data = await res.json();
        if (data && !data.error) {
          setStats({
            ...data,
            connected: true
          });
        }
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const groupedProviderData = useMemo(() => {
    if (tableMode === 'model') return stats.modelDistribution;
    
    const providers: Record<string, any> = {};
    for (const row of stats.modelDistribution) {
      if (!providers[row.provider]) {
        providers[row.provider] = {
          name: row.provider,
          provider: '-',
          requests: 0,
          cost: 0,
          lastUsed: row.lastUsed
        };
      }
      providers[row.provider].requests += row.requests;
      providers[row.provider].cost += row.cost;
      if (new Date(row.lastUsed) > new Date(providers[row.provider].lastUsed)) {
        providers[row.provider].lastUsed = row.lastUsed;
      }
    }
    return Object.values(providers).sort((a, b) => b.requests - a.requests);
  }, [stats.modelDistribution, tableMode]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1A1D23] border border-[#2A2E35] p-3 rounded shadow-xl text-sm">
          <p className="text-gray-400 mb-1">{label ? format(new Date(label), 'MMM dd, yyyy') : 'Unknown'}</p>
          <p className="text-white font-medium">
            {chartMode === 'tokens' ? `${payload[0].value.toLocaleString()} Tokens` : `$${payload[0].value.toFixed(4)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-grid-pattern bg-[#0B0F19] text-slate-300 p-6 md:p-8">
      
      {/* Header */}
      <header className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1 flex items-center gap-2">
            <span className="w-4 h-4 bg-cyan-500 rounded-sm inline-block shadow-[0_0_10px_rgba(6,182,212,0.5)]"></span>
            Local Usage & Analytics
          </h1>
          <p className="text-sm text-gray-400">Monitor local LLM usage and cost on this workstation</p>
        </div>
        <div className="flex gap-4 items-center">
          <button className="bg-[#111827] hover:bg-[#1F2937] border border-[#1F2937] text-white px-4 py-2 rounded-lg text-sm transition-colors">
            Support Project
          </button>
          <Settings className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" />
          <HelpCircle className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" />
        </div>
      </header>

      {/* Toggles */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex bg-[#111827] p-1 rounded-lg border border-[#1F2937]">
          <button className="px-4 py-1.5 text-sm font-medium text-white bg-[#1F2937] rounded-md shadow-sm">
            Overview
          </button>
          <button 
            onClick={() => router.push('/traces')}
            className="px-4 py-1.5 text-sm font-medium text-gray-400 hover:text-white"
          >
            Details
          </button>
        </div>
        <div className="flex bg-[#111827] p-1 rounded-lg border border-[#1F2937]">
          {['all', 'Today', '24h', '7D', '30D'].map(r => (
            <button 
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 text-xs rounded ${timeRange === r ? 'text-cyan-400 bg-[#1F2937]' : 'text-gray-400 hover:text-white'}`}
            >
              {r === 'all' ? 'All' : r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#111827] p-5 rounded-xl border border-[#1F2937]">
          <h2 className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-3">Total Requests</h2>
          <div className="text-3xl font-bold text-white drop-shadow-sm">
            {stats.events.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#111827] p-5 rounded-xl border border-[#1F2937]">
          <h2 className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-3">Total Input Tokens</h2>
          <div className="text-3xl font-bold text-[#06B6D4] drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
            {stats.inputTokens.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#111827] p-5 rounded-xl border border-[#1F2937]">
          <h2 className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-3">Output Tokens</h2>
          <div className="text-3xl font-bold text-[#A855F7] drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]">
            {stats.outputTokens.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#111827] p-5 rounded-xl border border-[#1F2937]">
          <h2 className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-3">Est. Cost</h2>
          <div className="text-3xl font-bold text-[#10B981] mb-1 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
            ~${stats.cost.toFixed(4)}
          </div>
          <div className="text-[10px] text-gray-500">Estimated, not actual billing</div>
        </div>
      </div>

      {/* Chart and Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Area Chart */}
        <div className="bg-[#111827] rounded-xl border border-[#1F2937] lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#1F2937] flex items-center gap-2">
            <div className="flex bg-black/20 p-1 rounded-lg border border-[#1F2937]/50">
              <button 
                onClick={() => setChartMode('tokens')}
                className={`px-3 py-1 text-xs font-medium rounded ${chartMode === 'tokens' ? 'bg-[#06B6D4] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Tokens
              </button>
              <button 
                onClick={() => setChartMode('cost')}
                className={`px-3 py-1 text-xs font-medium rounded ${chartMode === 'cost' ? 'bg-[#06B6D4] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Cost
              </button>
            </div>
          </div>
          <div className="h-72 p-4 pt-6">
            {stats.metricsOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.metricsOverTime} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="#4B5563" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val ? format(new Date(val), 'MMM dd') : ''} 
                  />
                  <YAxis 
                    stroke="#4B5563" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => chartMode === 'tokens' ? `${(val/1000).toFixed(0)}k` : `$${val}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey={chartMode} 
                    stroke="#0EA5E9" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data available</div>
            )}
          </div>
        </div>

        {/* Recent Requests Table */}
        <div className="bg-[#111827] rounded-xl border border-[#1F2937] flex flex-col h-[350px]">
          <div className="p-4 border-b border-[#1F2937]">
            <h2 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Recent Requests</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="text-[10px] uppercase text-gray-500 sticky top-0 bg-[#111827] z-10">
                <tr>
                  <th className="font-normal px-3 py-2">Model</th>
                  <th className="font-normal px-3 py-2 text-right">In / Out</th>
                  <th className="font-normal px-3 py-2 text-right">When</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentActivity.map((req, idx) => (
                  <tr key={idx} className="hover:bg-white/5 border-b border-[#1F2937]/50 group cursor-pointer transition-colors">
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#A855F7] shadow-[0_0_5px_rgba(168,85,247,0.8)]"></div>
                        <span className="text-gray-300 max-w-[120px] truncate" title={req.model}>
                          {req.model?.split('/').pop() || 'unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap text-xs font-mono">
                      <span className="text-[#06B6D4]">{req.input_tokens?.toLocaleString() || 0}↑</span>
                      <span className="text-gray-600 mx-1"></span>
                      <span className="text-[#A855F7]">{req.output_tokens?.toLocaleString() || 0}↓</span>
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap text-gray-400 text-xs">
                      {req.time ? formatDistanceToNow(new Date(req.time), { addSuffix: true }).replace('about ', '') : '-'}
                    </td>
                  </tr>
                ))}
                {stats.recentActivity.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-gray-500 text-sm">No recent requests.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Usage by Model / Provider Table */}
      <div className="bg-[#111827] rounded-xl border border-[#1F2937] overflow-hidden">
        <div className="p-4 border-b border-[#1F2937] flex items-center justify-between">
          <select 
            value={tableMode}
            onChange={(e) => setTableMode(e.target.value as 'model' | 'provider')}
            className="bg-black/20 border border-[#1F2937] text-white text-sm rounded px-3 py-1.5 outline-none"
          >
            <option value="model">Usage by Model</option>
            <option value="provider">Usage by Provider</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="text-xs uppercase text-gray-500 bg-black/20">
              <tr>
                <th className="font-semibold px-6 py-4">{tableMode === 'model' ? 'Model' : 'Provider'}</th>
                <th className="font-semibold px-6 py-4">{tableMode === 'model' ? 'Provider' : '-'}</th>
                <th className="font-semibold px-6 py-4 text-right">Requests</th>
                <th className="font-semibold px-6 py-4 text-right">Last Used</th>
                <th className="font-semibold px-6 py-4 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {groupedProviderData.map((row, idx) => (
                <tr key={idx} className="border-b border-[#1F2937] hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <ChevronRight className="w-4 h-4 text-[#06B6D4]" />
                      <span className="text-gray-200 font-medium">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{row.provider}</td>
                  <td className="px-6 py-4 text-right text-gray-300">{row.requests.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-gray-400">
                    {row.lastUsed ? formatDistanceToNow(new Date(row.lastUsed), { addSuffix: true }) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-[#10B981]">
                    ${row.cost.toFixed(4)}
                  </td>
                </tr>
              ))}
              {stats.modelDistribution.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">No model usage data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
