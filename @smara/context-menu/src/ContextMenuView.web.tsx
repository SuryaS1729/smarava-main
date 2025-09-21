import * as React from 'react';

import { ContextMenuViewProps } from './ContextMenu.types';

export default function ContextMenuView(props: ContextMenuViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
