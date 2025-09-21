import { requireNativeView } from 'expo';
import * as React from 'react';

import { ContextMenuViewProps } from './ContextMenu.types';

const NativeView: React.ComponentType<ContextMenuViewProps> =
  requireNativeView('ContextMenu');

export default function ContextMenuView(props: ContextMenuViewProps) {
  return <NativeView {...props} />;
}
