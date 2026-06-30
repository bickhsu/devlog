import React from 'react';

export interface KbdProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/** Keyboard key cap for shortcut hints (e.g. /, Tab, ⌘K). */
export function Kbd(props: KbdProps): JSX.Element;
