import React from 'react';

export interface IconProps extends React.SVGAttributes<SVGElement> {
  /** Lucide icon name — kebab-case ("panel-left-open", "chevron-right", "copy") or PascalCase. */
  name: string;
  /** Pixel size (width = height). Default 20. */
  size?: number;
  /** Stroke width. Default 2. */
  stroke?: number;
  /** Stroke color; defaults to currentColor. */
  color?: string;
}

/**
 * Lucide icon — the DevLog icon primitive. Requires the Lucide UMD global:
 * load `<script src="https://unpkg.com/lucide@latest"></script>` before the bundle.
 */
export function Icon(props: IconProps): JSX.Element;
