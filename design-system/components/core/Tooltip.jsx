import React from 'react';

/**
 * Lightweight hover tooltip. Wraps a trigger; shows `label` (string or node) on hover.
 * Used to reveal a log entry's time + context on hover.
 */
export function Tooltip({ label, children, placement = 'top', style = {} }) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top:    { bottom: 'calc(100% + 7px)', left: '50%', transform: 'translateX(-50%)' },
    bottom: { top: 'calc(100% + 7px)', left: '50%', transform: 'translateX(-50%)' },
    right:  { left: 'calc(100% + 7px)', top: '50%', transform: 'translateY(-50%)' },
    left:   { right: 'calc(100% + 7px)', top: '50%', transform: 'translateY(-50%)' },
  }[placement];

  return (
    <span
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      style={{ position: 'relative', display: 'inline-flex', ...style }}
    >
      {children}
      {show && (
        <span
          role="tooltip"
          style={{
            position: 'absolute', zIndex: 'var(--z-popover)', whiteSpace: 'nowrap', pointerEvents: 'none',
            padding: '5px 9px', borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-overlay)', border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
            fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)',
            animation: 'devlog-tip-in var(--dur-fast) var(--ease-out)',
            ...pos,
          }}
        >
          {label}
          <style>{'@keyframes devlog-tip-in{from{opacity:0;transform:translate(var(--tx,-50%),3px)}to{opacity:1}}'}</style>
        </span>
      )}
    </span>
  );
}
