import React from 'react';
import { Icon } from './Icon.jsx';

const SIZES = {
  sm: { h: 28, px: 10, fs: 'var(--text-sm)', gap: 6, icon: 16 },
  md: { h: 34, px: 14, fs: 'var(--text-base)', gap: 7, icon: 18 },
  lg: { h: 40, px: 18, fs: 'var(--text-md)', gap: 8, icon: 20 },
};

/**
 * DevLog button. Terminal-tactile: presses scale to 0.97.
 * variants: primary | secondary | ghost | danger
 */
export function Button({
  children, variant = 'secondary', size = 'md', icon, iconRight,
  disabled = false, onClick, style = {}, type = 'button', ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const [active, setActive] = React.useState(false);
  const [hover, setHover] = React.useState(false);

  const palettes = {
    primary: {
      bg: hover ? 'var(--accent-hover)' : 'var(--accent)',
      color: 'var(--text-on-accent)', border: 'transparent',
    },
    secondary: {
      bg: hover ? 'var(--surface-hover)' : 'var(--surface-raised)',
      color: 'var(--text-primary)', border: 'var(--border)',
    },
    ghost: {
      bg: hover ? 'var(--surface-hover)' : 'transparent',
      color: hover ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'transparent',
    },
    danger: {
      bg: hover ? 'var(--red-bg)' : 'transparent',
      color: 'var(--danger)', border: hover ? 'var(--danger)' : 'var(--border)',
    },
  };
  const p = palettes[variant] || palettes.secondary;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: s.gap,
        height: s.h, padding: `0 ${s.px}px`,
        fontFamily: 'var(--font-mono)', fontSize: s.fs, fontWeight: 'var(--fw-medium)',
        letterSpacing: '-0.01em',
        color: p.color, background: p.bg,
        border: `1px solid ${p.border}`, borderRadius: 'var(--radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transform: active && !disabled ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform var(--dur-instant) var(--ease-spring), background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
        whiteSpace: 'nowrap', userSelect: 'none',
        ...style,
      }}
      {...rest}
    >
      {icon && <Icon name={icon} size={s.icon} />}
      {children}
      {iconRight && <Icon name={iconRight} size={s.icon} />}
    </button>
  );
}
