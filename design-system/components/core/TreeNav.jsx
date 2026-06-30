import React from 'react';
import { Icon } from './Icon.jsx';

/**
 * Sidebar context tree. Recursive, collapsible, with indentation guide lines.
 * `nodes` — array of { label, path?, children?, defaultOpen? }.
 * Active row is matched by `activePath`.
 */
export function TreeNav({ nodes = [], activePath, onSelect, style = {} }) {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', ...style }}>
      {nodes.map((n, i) => (
        <TreeNode key={n.path || n.label || i} node={n} depth={0} activePath={activePath} onSelect={onSelect} />
      ))}
    </div>
  );
}

function TreeNode({ node, depth, activePath, onSelect }) {
  const hasChildren = node.children && node.children.length > 0;
  const [open, setOpen] = React.useState(node.defaultOpen !== false);
  const [hover, setHover] = React.useState(false);
  const active = node.path && node.path === activePath;

  return (
    <div>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => { if (hasChildren) setOpen((o) => !o); if (node.path) onSelect && onSelect(node.path); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 8px', paddingLeft: 8 + depth * 16,
          borderRadius: 'var(--radius-xs)', cursor: 'pointer',
          background: active ? 'var(--surface-active)' : (hover ? 'var(--surface-hover)' : 'transparent'),
          color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
          boxShadow: active ? 'inset 2px 0 0 var(--accent)' : 'none',
          transition: 'background var(--dur-fast) var(--ease-out)',
        }}
      >
        {hasChildren ? (
          <Icon name="chevron-right" size={15} color="var(--text-faint)" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform var(--dur-fast) var(--ease-out)' }} />
        ) : (
          <span style={{ width: 15, display: 'inline-flex', justifyContent: 'center', color: 'var(--text-faint)' }}>└</span>
        )}
        <Icon name={hasChildren ? (open ? 'folder-open' : 'folder') : 'file-text'} size={15} color={active ? 'var(--accent)' : 'var(--text-faint)'} />
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: active ? 'var(--fw-medium)' : 'var(--fw-regular)' }}>{node.label}</span>
      </div>
      {hasChildren && (
        <div style={{
          overflow: 'hidden',
          maxHeight: open ? 1200 : 0, opacity: open ? 1 : 0,
          transition: 'max-height var(--dur-slow) var(--ease-out), opacity var(--dur-base) var(--ease-out)',
        }}>
          {node.children.map((c, i) => (
            <TreeNode key={c.path || c.label || i} node={c} depth={depth + 1} activePath={activePath} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
