import React from 'react';
import { ContextBadge } from './ContextBadge.jsx';
import { Icon } from './Icon.jsx';

/**
 * The DevLog composer. A large rounded field with the current context badge
 * pinned top-left and a multiline log input below. Focus thickens the border
 * to 2px accent (faithful to the wireframe). Cmd/Ctrl+Enter or the send button submits.
 * Pass `popover` to render a floating element (command list / column picker) above it.
 */
export function Composer({
  context = '/metai/cad-agent/adapter',
  value, defaultValue = '', placeholder = 'log what you did…  (/ to switch context)',
  onChange, onSubmit, onBadgeClick, badgeActive = false,
  popover = null, autoFocus = false, style = {},
}) {
  const [internal, setInternal] = React.useState(defaultValue);
  const [focused, setFocused] = React.useState(false);
  const val = value !== undefined ? value : internal;
  const ref = React.useRef(null);

  const setVal = (v) => { if (value === undefined) setInternal(v); onChange && onChange(v); };
  const submit = () => { if (val.trim()) { onSubmit && onSubmit(val); if (value === undefined) setInternal(''); } };

  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      {popover && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 'calc(100% + 10px)', zIndex: 'var(--z-popover)' }}>
          {popover}
        </div>
      )}
      <div
        onClick={() => ref.current && ref.current.focus()}
        style={{
          background: 'var(--surface-raised)',
          border: `2px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px 12px',
          boxShadow: focused ? '0 0 0 3px var(--focus-ring)' : 'var(--shadow-sm)',
          transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
          cursor: 'text',
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <ContextBadge path={context} size="sm" active={badgeActive} onClick={(e) => { e.stopPropagation(); onBadgeClick && onBadgeClick(); }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <textarea
            ref={ref}
            rows={1}
            value={val}
            autoFocus={autoFocus}
            placeholder={placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => { setVal(e.target.value); const t = e.target; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 200) + 'px'; }}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } }}
            style={{
              flex: 1, resize: 'none', border: 'none', outline: 'none', background: 'transparent',
              fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', lineHeight: 'var(--lh-normal)',
              color: 'var(--text-primary)', padding: '2px 0', maxHeight: 200, overflowY: 'auto',
            }}
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); submit(); }}
            disabled={!val.trim()}
            title="Send  (⌘↵)"
            style={{
              flex: '0 0 auto', width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--radius-sm)', border: 'none', cursor: val.trim() ? 'pointer' : 'default',
              background: val.trim() ? 'var(--accent)' : 'var(--surface-hover)',
              color: val.trim() ? 'var(--text-on-accent)' : 'var(--text-faint)',
              transition: 'background var(--dur-fast) var(--ease-out)',
            }}
          >
            <Icon name="arrow-up" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
