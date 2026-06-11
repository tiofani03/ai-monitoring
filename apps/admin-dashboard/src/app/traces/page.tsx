'use client';

import { useState, useEffect } from 'react';
import { ListTree, Terminal, Search, Clock, Cpu } from 'lucide-react';
import { format } from 'date-fns';

export default function TracesPage() {
  const [traces, setTraces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrace, setSelectedTrace] = useState<any | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTraces = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (data && data.recentActivity) {
          setTraces(data.recentActivity);
        }
      } catch (err) {
        console.error('Failed to fetch traces:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTraces();
  }, []);

  const filteredTraces = traces.filter(t => 
    t.model?.toLowerCase().includes(search.toLowerCase()) ||
    t.tool?.toLowerCase().includes(search.toLowerCase()) ||
    t.device?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full max-h-screen">
      {/* Main Traces List */}
      <div className={`flex-1 flex flex-col min-w-0 ${selectedTrace ? 'hidden lg:flex lg:max-w-xl xl:max-w-3xl border-r border-[#2A2E35]' : ''}`}>
        <div className="p-6 border-b border-[#2A2E35] bg-[#1A1D23]">
          <h1 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <ListTree className="text-cyan-400" />
            Traces
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by model, tool, or device..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0F1115] border border-[#2A2E35] text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center text-gray-500 py-10">Loading traces...</div>
          ) : filteredTraces.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No traces found.</div>
          ) : (
            filteredTraces.map((trace, i) => (
              <div 
                key={i}
                onClick={() => setSelectedTrace(trace)}
                className={`p-4 rounded-xl cursor-pointer border transition-all ${
                  selectedTrace === trace 
                    ? 'bg-[#2A2E35] border-cyan-500/50' 
                    : 'bg-[#1A1D23] border-[#2A2E35] hover:border-gray-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-gray-200 text-sm">{trace.tool}</span>
                  </div>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(trace.time), 'MMM dd, HH:mm:ss')}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3" />
                    {trace.model || 'Unknown model'}
                  </span>
                  <span>{trace.tokens.toLocaleString()} tokens</span>
                  <span>Device: {trace.device}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Trace Details Side Panel */}
      {selectedTrace && (
        <div className="flex-1 flex flex-col min-w-0 bg-[#0F1115]">
          <div className="p-4 border-b border-[#2A2E35] bg-[#1A1D23] flex justify-between items-center shrink-0">
            <h2 className="text-lg font-semibold text-white truncate px-2">Trace Details</h2>
            <button 
              onClick={() => setSelectedTrace(null)}
              className="text-gray-400 hover:text-white px-3 py-1 rounded hover:bg-[#2A2E35] transition-colors lg:hidden"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Metadata Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#1A1D23] border border-[#2A2E35] p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Model</p>
                <p className="text-sm text-gray-200 font-medium truncate" title={selectedTrace.model}>{selectedTrace.model || 'Unknown'}</p>
              </div>
              <div className="bg-[#1A1D23] border border-[#2A2E35] p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Tokens</p>
                <p className="text-sm text-gray-200 font-medium">{selectedTrace.tokens.toLocaleString()}</p>
              </div>
              <div className="bg-[#1A1D23] border border-[#2A2E35] p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Integration</p>
                <p className="text-sm text-gray-200 font-medium truncate">{selectedTrace.tool}</p>
              </div>
              <div className="bg-[#1A1D23] border border-[#2A2E35] p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Time</p>
                <p className="text-sm text-gray-200 font-medium truncate">{format(new Date(selectedTrace.time), 'HH:mm:ss')}</p>
              </div>
            </div>

            {/* Conversation Log */}
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-[#2A2E35] pb-2">Conversation Logs</h3>
            <div className="space-y-6">
              {!selectedTrace.metadata?.messages ? (
                <div className="text-gray-500 text-sm">No message content available for this trace.</div>
              ) : (
                selectedTrace.metadata.messages.map((msg: any, j: number) => (
                  <div key={j} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                        msg.role === 'user' ? 'bg-blue-500/20 text-blue-400' : 'bg-cyan-500/20 text-cyan-400'
                      }`}>
                        {msg.role}
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap border font-mono ${
                      msg.role === 'user' 
                        ? 'bg-[#1A1D23] border-[#2A2E35] text-gray-300' 
                        : 'bg-[#0A0E17] border-cyan-500/20 text-cyan-50'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Raw JSON */}
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mt-12 mb-4 border-b border-[#2A2E35] pb-2">Raw Event Payload</h3>
            <pre className="bg-[#0A0E17] border border-[#2A2E35] p-4 rounded-lg text-xs text-gray-400 overflow-x-auto">
              {JSON.stringify(selectedTrace, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
