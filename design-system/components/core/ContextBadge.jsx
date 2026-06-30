import React from 'react';
import { Icon } from './Icon.jsx';

/**
 * The context path badge — DevLog's signature element. Renders a path like
 * /metai/cad-agent/adapter as a clickable pill that opens the column picker.
 * Segments are subtly de-emphasized except the leaf; the slash separators are faint.
 */
export function ContextBadge({
  path = '/metai/cad-agent/adapter',
  size = 'md',
  active = false,
  interactive = true,
  onClick,
  style = {},
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const segs = path.replace(/^\//, '').split('/').filter(Boolean);

  const dims = size === 'sm'
    ? { h: 24, px: 8, fs: 'var(--text-xs)', icon: 14 }
    : { h: 30, px: 10, fs: 'var(--text-sm)', icon: 16 };

  const lit = active || hover;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: dims.h, padding: `0 ${dims.px}px`,
        fontFamily: 'var(--font-mono)', fontSize: dims.fs, fontWeight: 'var(--fw-medium)',
        background: lit ? 'var(--surface-active)' : 'var(--surface)',
        border: `1px solid ${active ? 'var(--accent)' : (hover ? 'var(--border-strong)' : 'var(--border)')}`,
        borderRadius: 'var(--radius-sm)',
        cursor: interactive ? 'pointer' : 'default',
        transform: press && interactive ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform var(--dur-instant) var(--ease-spring), background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
        boxShadow: active ? '0 0 0 3px var(--focus-ring)' : 'none',
        whiteSpace: 'nowrap', userSelect: 'none', lineHeight: 1,
      }}
    >
      <Icon name="at-sign" size={dims.icon} color={active ? 'var(--accent)' : 'var(--text-faint)'} style={{ marginInlineEnd: 1 }} />
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        <Sep />
        {segs.map((seg, i) => {
          const leaf = i === segs.length - 1;
          return (
            <React.Fragment key={i}>
              <span style={{ color: leaf ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: leaf ? 'var(--fw-semibold)' : 'var(--fw-regular)' }}>{seg}</span>
              {!leaf && <Sep />}
            </React.Fragment>
          );
        })}
      </span>
    </button>
  );
}

function Sep() {
  return <span style={{ color: 'var(--text-faint)', padding: '0 1px' }}>/</span>;
}
