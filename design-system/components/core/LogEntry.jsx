import React from 'react';
import { Icon } from './Icon.jsx';
import { ContextBadge } from './ContextBadge.jsx';

const STATUS = {
  done: 'var(--success)', progress: 'var(--warning)', failed: 'var(--danger)', note: 'var(--accent)',
};

/**
 * A single work-log entry in the thread. Mono body with an optional bold first-line
 * title. Hovering reveals the timestamp, context, and a copy affordance (faithful to
 * the wireframe's "hover message → show time and context"). Optional status accent rail.
 */
export function LogEntry({
  title, body, time = '14:32', context, status, onCopy, style = {},
}) {
  const [hover, setHover] = React.useState(false);
  const rail = status && STATUS[status];

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', padding: '12px 12px 12px 14px', borderRadius: 'var(--radius-sm)',
        background: hover ? 'var(--surface)' : 'transparent',
        transition: 'background var(--dur-fast) var(--ease-out)',
        ...style,
      }}
    >
      {rail && <span style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 0, borderRadius: 2, background: 'transparent' }} />}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {title && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)', marginBottom: 2 }}>{title}</div>
          )}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', lineHeight: 'var(--lh-relaxed)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{body}</div>

          {/* hover meta */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginTop: hover ? 8 : 0,
            maxHeight: hover ? 32 : 0, opacity: hover ? 1 : 0, overflow: 'hidden',
            transition: 'max-height var(--dur-base) var(--ease-out), opacity var(--dur-base) var(--ease-out), margin-top var(--dur-base) var(--ease-out)',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>
              <Icon name="clock" size={13} /> {time}
            </span>
            {context && <ContextBadge path={context} size="sm" interactive={false} />}
          </div>
        </div>

        <button
          type="button"
          onClick={onCopy}
          title="Copy entry"
          style={{
            flex: '0 0 auto', width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 'var(--radius-xs)',
            color: 'var(--text-faint)', opacity: hover ? 1 : 0, transition: 'opacity var(--dur-fast) var(--ease-out)',
          }}
        >
          <Icon name="copy" size={15} />
        </button>
      </div>
    </div>
  );
}
