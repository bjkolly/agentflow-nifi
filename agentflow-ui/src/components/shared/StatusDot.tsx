import { STATE_COLORS } from '../../utils/colors';

type StatusDotProps = {
  state: string;
  size?: number;
};

export default function StatusDot({ state, size = 8 }: StatusDotProps) {
  const color = STATE_COLORS[state] ?? STATE_COLORS.STOPPED;
  const isRunning = state === 'RUNNING';

  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      {isRunning && (
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
          style={{ backgroundColor: color }}
        />
      )}
      <span
        className="relative inline-flex rounded-full h-full w-full"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}
