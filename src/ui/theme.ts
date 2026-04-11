export const theme = {
  bg: '#0f0f23',
  boardBg: '#16213e',
  grid: '#2a3a5c',
  gridAccent: '#334155',
  player1: '#ef4444',
  player2: '#3b82f6',
  captureAlpha: 0.18,
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  accent: '#f59e0b',
  accentGlow: 'rgba(245, 158, 11, 0.3)',
  surface: '#1e293b',
  surfaceLight: '#263348',
  surfaceHover: '#334155',
  danger: '#ef4444',
  success: '#22c55e',
  border: '#334155',
  shadow: 'rgba(0, 0, 0, 0.4)',
  fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  borderRadius: '12px',
  borderRadiusSm: '8px',
  transition: '0.2s ease',
};

export function playerColor(player: 'red' | 'blue'): string {
  return player === 'red' ? theme.player1 : theme.player2;
}

export function playerColorAlpha(player: 'red' | 'blue', alpha: number): string {
  const hex = player === 'red' ? theme.player1 : theme.player2;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
