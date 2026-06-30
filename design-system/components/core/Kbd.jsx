import React from 'react';

/** Keyboard key cap — for "/" "Tab" "⌘K" hints. Mono, tiny, bordered. */
export function Kbd({ children, style = {} }) {
  return (
    <kbd
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 18, height: 20, padding: '0 6px',
        fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 'var(--fw-medium)',
        color: 'var(--text-secondary)', background: 'var(--surface)',
        border: '1px solid var(--border)', borderBottomWidth: 2,
        borderRadius: 'var(--radius-xs)', lineHeight: 1,
        ...style,
      }}
    >
      {children}
    </kbd>
  );
}
