import React from 'react';

/**
 * DevLog wordmark / lockup. A blinking caret block + "devlog" in mono.
 * variant: "full" (caret + word), "mark" (caret only), "bracket" ([ devlog ]).
 */
export function Logo({ variant = 'full', size = 20, blink = false, color, style = {} }) {
  const word = 'var(--text-primary, #e3e7ec)';
  const accent = 'var(--accent, #5b94ff)';
  const caret = (
    <span
      style={{
        display: 'inline-block',
        width: Math.round(size * 0.32),
        height: size,
        background: accent,
        borderRadius: 1.5,
        animation: blink ? 'devlog-caret-blink 1.1s steps(1) infinite' : 'none',
      }}
    />
  );

  const wrap = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: Math.round(size * 0.42),
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    fontSize: size,
    letterSpacing: '-0.02em',
    color: color || word,
    lineHeight: 1,
    ...style,
  };

  if (variant === 'mark') return <span style={wrap}>{caret}</span>;
  if (variant === 'bracket') {
    return (
      <span style={wrap}>
        <span style={{ color: 'var(--text-faint, #565b63)' }}>[</span>
        devlog
        <span style={{ color: 'var(--text-faint, #565b63)' }}>]</span>
      </span>
    );
  }
  return (
    <span style={wrap}>
      {caret}
      <span>devlog</span>
      <style>{'@keyframes devlog-caret-blink{0%,50%{opacity:1}50.01%,100%{opacity:0}}'}</style>
    </span>
  );
}
