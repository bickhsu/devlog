import React from 'react';

export interface ColumnPickerProps {
  /** Nested tree: { segment: subtreeObjectOrNull }. null/empty = leaf. */
  tree: Record<string, any>;
  /** Currently-drilled segments, e.g. ['metai','cad-agent','adapter']. */
  path?: string[];
  /** Fired on any selection. (nextPath, hasChildren). */
  onSelect?: (path: string[], hasChildren: boolean) => void;
  /** Fired when a leaf (no children) is chosen. */
  onCommit?: (path: string[]) => void;
  style?: React.CSSProperties;
}

/**
 * Finder-style cascading column picker for drilling a context tree.
 * @startingPoint section="Context" subtitle="Cascading column picker" viewport="640x320"
 */
export function ColumnPicker(props: ColumnPickerProps): JSX.Element;
