'use client';

import { COMPARISON_DATA } from '@/lib/constants';
import FadeUp from '@/components/animations/FadeUp';

function StatusCell({ value }: { value: 'yes' | 'partial' | 'no' }) {
  if (value === 'yes') {
    return <span className="text-green-400 font-bold text-lg">{'\u2713'}</span>;
  }
  if (value === 'partial') {
    return <span className="text-amber-400 font-bold text-lg">~</span>;
  }
  return <span className="text-red-400 font-bold text-lg">{'\u2717'}</span>;
}

export default function ComparisonTable() {
  const headers: readonly { key: string; label: string; highlight?: boolean }[] = [
    { key: 'capability', label: 'Feature' },
    { key: 'agentflow', label: 'AgentFlow', highlight: true },
    { key: 'langchain', label: 'LangChain' },
    { key: 'crewai', label: 'CrewAI' },
    { key: 'autogen', label: 'AutoGen' },
    { key: 'semanticKernel', label: 'Sem. Kernel' },
  ];

  return (
    <FadeUp>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {headers.map((h) => (
                <th
                  key={h.key}
                  className={`px-4 py-3 text-left font-semibold ${
                    h.highlight
                      ? 'text-llm bg-llm/10'
                      : 'text-text-muted'
                  } ${h.key === 'capability' ? 'text-left' : 'text-center'}`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_DATA.map((row, i) => (
              <tr
                key={row.capability}
                className={`border-b border-border/50 ${
                  i % 2 === 0 ? 'bg-surface' : 'bg-bg'
                }`}
              >
                <td className="px-4 py-3 text-text-primary font-medium">
                  {row.capability}
                </td>
                <td className="px-4 py-3 text-center bg-llm/5">
                  <StatusCell value={row.agentflow} />
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusCell value={row.langchain} />
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusCell value={row.crewai} />
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusCell value={row.autogen} />
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusCell value={row.semanticKernel} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 text-xs text-text-dim">
        <span className="flex items-center gap-1.5">
          <span className="text-green-400 font-bold">{'\u2713'}</span> Full support
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-amber-400 font-bold">~</span> Partial
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-red-400 font-bold">{'\u2717'}</span> Not available
        </span>
      </div>
    </FadeUp>
  );
}
