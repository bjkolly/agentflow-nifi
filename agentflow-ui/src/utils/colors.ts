export const PROCESSOR_COLORS: Record<string, string> = {
  LLMInferenceProcessor: '#7c3aed',
  ToolExecutorProcessor: '#f59e0b',
  MemoryManagerProcessor: '#06b6d4',
  TaskPlannerProcessor: '#10b981',
  AgentRouterProcessor: '#3b82f6',
  HumanInTheLoopProcessor: '#ec4899',
  GuardrailsEnforcerProcessor: '#ef4444',
  default: '#6366f1',
};

export const RELATIONSHIP_COLORS: Record<string, string> = {
  success: '#22c55e',
  failure: '#ef4444',
  tool_call: '#f59e0b',
  rate_limit: '#f97316',
  pass: '#22c55e',
  violation: '#ef4444',
  approved: '#22c55e',
  rejected: '#ef4444',
  default: '#6366f1',
};

export const STATE_COLORS: Record<string, string> = {
  RUNNING: '#22c55e',
  STOPPED: '#6b7280',
  INVALID: '#ef4444',
  DISABLED: '#374151',
};

export function getProcessorColor(type: string): string {
  const shortName = type.includes('.') ? type.split('.').pop()! : type;
  return PROCESSOR_COLORS[shortName] ?? PROCESSOR_COLORS.default;
}
