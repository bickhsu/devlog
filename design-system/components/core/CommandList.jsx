import React from 'react';
import { Icon } from './Icon.jsx';

/**
 * The "/" command palette — a flat list of every context path, filterable.
 * Highlights the active row; rows stagger in. Renders a path with faint slashes.
 */
export function CommandList({
  paths = [], query = '', activeIndex = 0, onSelect, onHover, header = 'switch context', style = {},
}) {
  const q = query.replace(/^\//, '').toLowerCase();
  const filtered = q ? paths.filter((p) => p.toLowerCase().includes(q)) : paths;

  return (
    <div
      style={{
        background: 'var(--surface-overlay)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-popover)',
        overflow: 'hidden',
        animation: 'devlog-pop-up var(--dur-base) var(--ease-out)',
        ...style,
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 'var(--fw-medium)',
        letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-faint)',
      }}>
        <Icon name="zap" size={13} color="var(--accent)" />
        {header}
      </div>
      <div style={{ maxHeight: 280, overflowY: 'auto', padding: 6 }}>
        {filtered.length === 0 && (
          <div style={{ padding: '14px 12px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-faint)' }}>
            no match — <span style={{ color: 'var(--text-secondary)' }}>↵</span> to create <span style={{ color: 'var(--path)' }}>/{q}</span>
          </div>
        )}
        {filtered.map((p, i) => {
          const on = i === activeIndex;
          return (
            <Row key={p} path={p} active={on} index={i} onSelect={() => onSelect && onSelect(p)} onHover={() => onHover && onHover(i)} />
          );
        })}
      </div>
      <style>{'@keyframes devlog-pop-up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes devlog-row-in{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:translateX(0)}}'}</style>
    </div>
  );
}

function Row({ path, active, index, onSelect, onHover }) {
  const segs = path.replace(/^\//, '').split('/');
  return (
    <div
      onMouseEnter={onHover}
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
        background: active ? 'var(--blue-bg)' : 'transparent',
        boxShadow: active ? 'inset 2px 0 0 var(--accent)' : 'none',
        animation: `devlog-row-in var(--dur-base) var(--ease-out) ${Math.min(index, 10) * 18}ms both`,
      }}
    >
      <Icon name="chevron-right" size={15} color={active ? 'var(--accent)' : 'var(--text-faint)'} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>
        <span style={{ color: 'var(--text-faint)' }}>/</span>
        {segs.map((s, i) => {
          const leaf = i === segs.length - 1;
          return (
            <React.Fragment key={i}>
              <span style={{ color: leaf ? (active ? 'var(--text-primary)' : 'var(--text-secondary)') : 'var(--text-muted)', fontWeight: leaf ? 'var(--fw-medium)' : 'var(--fw-regular)' }}>{s}</span>
              {!leaf && <span style={{ color: 'var(--text-faint)' }}>/</span>}
            </React.Fragment>
          );
        })}
      </span>
    </div>
  );
}
