import React from 'react';

const TONES = {
  neutral: { fg: 'var(--text-secondary)', bg: 'var(--surface-hover)', bd: 'var(--border)' },
  accent:  { fg: 'var(--accent)', bg: 'var(--blue-bg)', bd: 'transparent' },
  success: { fg: 'var(--success)', bg: 'var(--green-bg)', bd: 'transparent' },
  warning: { fg: 'var(--warning)', bg: 'var(--amber-bg)', bd: 'transparent' },
  danger:  { fg: 'var(--danger)', bg: 'var(--red-bg)', bd: 'transparent' },
  context: { fg: 'var(--violet-400)', bg: 'var(--violet-bg)', bd: 'transparent' },
};

/**
 * Small status / category pill. Use `dot` for a status indicator.
 * tones: neutral | accent | success | warning | danger | context
 */
export function Tag({ children, tone = 'neutral', dot = false, style = {} }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 22, padding: dot ? '0 9px 0 8px' : '0 9px',
        fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 'var(--fw-medium)',
        letterSpacing: '0.01em',
        color: t.fg, background: t.bg, border: `1px solid ${t.bd}`,
        borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap', lineHeight: 1,
        ...style,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.fg, flex: '0 0 auto' }} />}
      {children}
    </span>
  );
}
