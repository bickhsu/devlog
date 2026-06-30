import React from 'react';
import { Icon } from './Icon.jsx';

/**
 * Square icon-only button with a faint hover backing — used in the top bar
 * (panel toggle, copy) and toolbars. Tooltip-friendly (pass title).
 */
export function IconButton({
  icon, size = 34, iconSize, active = false, disabled = false,
  onClick, title, style = {}, ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const is = iconSize || Math.round(size * 0.56);
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        width: size, height: size,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'var(--surface-active)' : (hover ? 'var(--surface-hover)' : 'transparent'),
        color: active ? 'var(--accent)' : (hover ? 'var(--text-primary)' : 'var(--text-secondary)'),
        border: '1px solid transparent',
        borderRadius: 'var(--radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transform: press && !disabled ? 'scale(0.92)' : 'scale(1)',
        transition: 'transform var(--dur-instant) var(--ease-spring), background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)',
        ...style,
      }}
      {...rest}
    >
      <Icon name={icon} size={is} />
    </button>
  );
}
