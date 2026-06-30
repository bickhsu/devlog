import React from 'react';

/* Convert a Material-style / kebab / snake name to Lucide's PascalCase key.
   "panel-left-open" | "panel_left_open" | "PanelLeftOpen" → "PanelLeftOpen" */
function toPascal(name) {
  if (!name) return '';
  if (/^[A-Z]/.test(name) && !/[-_]/.test(name)) return name;
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

/**
 * Lucide icon — the DevLog icon system. Renders from the Lucide UMD global
 * (window.lucide), so the host page must load:
 *   <script src="https://unpkg.com/lucide@latest"></script>
 * before the bundle. Names are Lucide names in kebab-case ("panel-left-open",
 * "chevron-right", "copy") or PascalCase. Stroke 2 by default, terminal-calm.
 */
export function Icon({ name, size = 20, stroke = 2, color, style = {}, className = '', ...rest }) {
  // Re-render once if Lucide loads after first paint (defensive — host should
  // load the UMD script before the bundle, but async loads still resolve).
  const [, force] = React.useState(0);
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !window.lucide) {
      let tries = 0;
      const id = setInterval(() => {
        tries += 1;
        if (window.lucide || tries > 40) { clearInterval(id); force((n) => n + 1); }
      }, 50);
      return () => clearInterval(id);
    }
  }, []);

  const lib = (typeof window !== 'undefined' && window.lucide) || null;
  const node = lib && lib.icons ? lib.icons[toPascal(name)] : (lib ? lib[toPascal(name)] : null);

  const svgProps = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color || 'currentColor',
    strokeWidth: stroke,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    style: { display: 'inline-block', verticalAlign: 'middle', flex: '0 0 auto', ...style },
    'aria-hidden': true,
    ...rest,
  };

  // node is an IconNode: Array<[tag, attrs]>. Render children into an <svg>.
  const children = Array.isArray(node)
    ? node.map((entry, i) => {
        const [tag, attrs] = entry;
        return React.createElement(tag, { key: i, ...attrs });
      })
    : null;

  return React.createElement('svg', svgProps, children);
}
