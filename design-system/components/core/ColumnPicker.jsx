import React from 'react';
import { Icon } from './Icon.jsx';

/**
 * macOS-Finder-style cascading column picker. Drill down a context tree level
 * by level. Opens from `cd`+Tab or clicking the context badge.
 *
 * `tree`  — nested object: { segment: subtreeObjectOrNull }, null = leaf.
 * `path`  — array of currently-drilled segments, e.g. ['metai','cad-agent','adapter'].
 */
export function ColumnPicker({ tree = {}, path = [], onSelect, onCommit, style = {} }) {
  // Build the list of columns: root, then children of each selected segment.
  const columns = [];
  let level = tree;
  columns.push({ items: Object.keys(level), depth: 0 });
  for (let i = 0; i < path.length; i++) {
    const seg = path[i];
    const sub = level && level[seg];
    if (sub && typeof sub === 'object') {
      columns.push({ items: Object.keys(sub), depth: i + 1 });
      level = sub;
    } else { break; }
  }

  return (
    <div
      style={{
        display: 'flex', alignItems: 'stretch',
        background: 'var(--surface-overlay)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-popover)',
        overflow: 'hidden',
        animation: 'devlog-pop-up var(--dur-base) var(--ease-out)',
        ...style,
      }}
    >
      {columns.map((col, ci) => {
        const subtreeAt = (seg) => {
          let lvl = tree;
          for (let k = 0; k < ci; k++) lvl = lvl[path[k]];
          return lvl[seg];
        };
        return (
          <div key={ci} style={{
            minWidth: 168, maxWidth: 220, padding: 6,
            borderRight: ci < columns.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            maxHeight: 300, overflowY: 'auto',
            animation: `devlog-col-in var(--dur-base) var(--ease-out) ${ci * 45}ms both`,
          }}>
            {col.items.map((seg) => {
              const selected = path[ci] === seg;
              const sub = subtreeAt(seg);
              const hasChildren = sub && typeof sub === 'object' && Object.keys(sub).length > 0;
              return (
                <div
                  key={seg}
                  onClick={() => { const next = [...path.slice(0, ci), seg]; onSelect && onSelect(next, hasChildren); if (!hasChildren) onCommit && onCommit(next); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    padding: '6px 8px 6px 9px', borderRadius: 'var(--radius-xs)', cursor: 'pointer',
                    background: selected ? 'var(--surface-active)' : 'transparent',
                    boxShadow: selected ? 'inset 2px 0 0 var(--accent)' : 'none',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: selected ? 'var(--fw-medium)' : 'var(--fw-regular)',
                  }}>{seg}</span>
                  {hasChildren && <Icon name="chevron-right" size={15} color={selected ? 'var(--accent)' : 'var(--text-faint)'} />}
                </div>
              );
            })}
          </div>
        );
      })}
      <style>{'@keyframes devlog-col-in{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}'}</style>
    </div>
  );
}
