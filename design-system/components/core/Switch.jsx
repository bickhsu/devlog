import React from 'react';

/** Toggle switch. Used for theme / boolean settings. */
export function Switch({ checked, defaultChecked = false, onChange, disabled = false, style = {} }) {
  const [internal, setInternal] = React.useState(defaultChecked);
  const on = checked !== undefined ? checked : internal;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => { if (checked === undefined) setInternal(!on); onChange && onChange(!on); }}
      style={{
        width: 38, height: 22, padding: 2, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: 'var(--radius-pill)', opacity: disabled ? 0.5 : 1,
        background: on ? 'var(--accent)' : 'var(--surface-active)',
        transition: 'background var(--dur-base) var(--ease-out)',
        display: 'inline-flex', alignItems: 'center',
        ...style,
      }}
    >
      <span style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transform: on ? 'translateX(16px)' : 'translateX(0)',
        transition: 'transform var(--dur-base) var(--ease-spring)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
      }} />
    </button>
  );
}
