'use client';

import FadeUp from '@/components/animations/FadeUp';

export default function ApprovalCardMockup() {
  return (
    <FadeUp>
      <div className="rounded-xl overflow-hidden border border-border bg-surface max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-amber-500/10 border-b border-amber-500/20">
          <span className="text-amber-400 text-sm font-semibold flex items-center gap-2">
            <span className="text-base">{'\u26A0'}</span>
            Approval Required
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 uppercase tracking-wide">
            Medium Risk
          </span>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs text-text-dim uppercase tracking-wide mb-1">Agent</p>
            <p className="text-text-primary font-medium">Research-Agent-7</p>
          </div>
          <div>
            <p className="text-xs text-text-dim uppercase tracking-wide mb-1">Action</p>
            <p className="text-text-primary font-medium">
              Publish financial analysis to client portal
            </p>
          </div>

          {/* Metadata */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex justify-between text-sm">
              <span className="text-text-dim">Confidence</span>
              <span className="text-text-primary font-mono">94.2%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-dim">Tokens Used</span>
              <span className="text-text-primary font-mono">12,847</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-dim">Est. Cost</span>
              <span className="text-text-primary font-mono">$0.38</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="flex-1 py-2.5 rounded-lg bg-green-500/20 text-green-400 font-semibold text-sm hover:bg-green-500/30 transition-colors cursor-default"
            >
              Approve
            </button>
            <button
              type="button"
              className="flex-1 py-2.5 rounded-lg border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/10 transition-colors cursor-default"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </FadeUp>
  );
}
