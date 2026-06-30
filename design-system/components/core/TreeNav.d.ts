import React from 'react';

export interface TreeNode {
  label: string;
  path?: string;
  children?: TreeNode[];
  defaultOpen?: boolean;
}

export interface TreeNavProps {
  nodes: TreeNode[];
  /** Path of the active node (highlighted). */
  activePath?: string;
  onSelect?: (path: string) => void;
  style?: React.CSSProperties;
}

/**
 * Collapsible sidebar context tree.
 * @startingPoint section="Navigation" subtitle="Sidebar context tree" viewport="320x420"
 */
export function TreeNav(props: TreeNavProps): JSX.Element;
