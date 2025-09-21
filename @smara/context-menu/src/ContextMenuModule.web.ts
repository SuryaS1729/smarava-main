import { registerWebModule, NativeModule } from 'expo';

import { ContextMenuModuleEvents } from './ContextMenu.types';

class ContextMenuModule extends NativeModule<ContextMenuModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ContextMenuModule, 'ContextMenuModule');
