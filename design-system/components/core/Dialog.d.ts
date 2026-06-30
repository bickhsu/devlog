import React from 'react';

export interface DialogProps {
  open?: boolean;
  title?: string;
  /** Material Symbols name shown before the title. */
  icon?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  /** If set, renders default Cancel + confirm footer. */
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  confirmVariant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Custom footer; overrides the default confirm/cancel buttons. */
  actions?: React.ReactNode;
  width?: number;
  style?: React.CSSProperties;
}

/** Centered modal dialog on a dim scrim. Note: positions absolutely within the nearest positioned ancestor. */
export function Dialog(props: DialogProps): JSX.Element | null;
