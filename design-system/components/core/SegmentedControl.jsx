import React from 'react';

/**
 * Segmented control — a row of mutually-exclusive options with a sliding
 * accent indicator. Used for "Copy Context Range" (Today / Last Week / All).
 */
export function SegmentedControl({ options = [], value, defaultValue, onChange, size = 'md', style = {} }) {
  const [internal, setInternal] = React.useState(defaultValue ?? (options[0] && (options[0].value ?? options[0])));
  const val = value !== undefined ? value : internal;
  const opts = options.map((o) => (typeof o === 'string' ? { label: o, value: o } : o));
  const idx = Math.max(0, opts.findIndex((o) => o.value === val));
  const h = size === 'sm' ? 28 : 32;

  return (
    <div style={{
      position: 'relative', display: 'inline-flex', padding: 3, gap: 0,
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
      ...style,
    }}>
      <span style={{
        position: 'absolute', top: 3, bottom: 3, left: `calc(3px + ${idx} * (100% - 6px) / ${opts.length})`,
        width: `calc((100% - 6px) / ${opts.length})`,
        background: 'var(--surface-active)', border: '1px solid var(--border-strong)',
        borderRadius: 'calc(var(--radius-sm) - 2px)',
        transition: 'left var(--dur-base) var(--ease-out)',
      }} />
      {opts.map((o) => {
        const on = o.value === val;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => { if (value === undefined) setInternal(o.value); onChange && onChange(o.value); }}
            style={{
              position: 'relative', zIndex: 1, height: h, padding: '0 14px', border: 'none', background: 'transparent',
              fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: on ? 'var(--fw-medium)' : 'var(--fw-regular)',
              color: on ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer',
              transition: 'color var(--dur-fast) var(--ease-out)', whiteSpace: 'nowrap',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
