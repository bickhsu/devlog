import React from 'react';

/**
 * Date divider between groups of log entries. Faint date label + hairline rule.
 * Faithful to the wireframe's "2026/06/12 ─────" treatment.
 */
export function DateDivider({ date = '2026/06/12', sticky = false, style = {} }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0',
      position: sticky ? 'sticky' : 'static', top: 0, zIndex: 'var(--z-sticky)',
      ...style,
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-medium)',
        letterSpacing: 'var(--tracking-wide)', color: 'var(--text-faint)', whiteSpace: 'nowrap',
      }}>{date}</span>
      <span style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
    </div>
  );
}
