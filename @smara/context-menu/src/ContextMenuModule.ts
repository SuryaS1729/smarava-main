import { NativeModule, requireNativeModule } from 'expo';

import { ContextMenuModuleEvents } from './ContextMenu.types';

declare class ContextMenuModule extends NativeModule<ContextMenuModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ContextMenuModule>('ContextMenu');
