// Reexport the native module. On web, it will be resolved to ContextMenuModule.web.ts
// and on native platforms to ContextMenuModule.ts

export * from './ContextMenu.types';
export { default as ContextMenuView } from './ContextMenuView';

import { WordSavedEventPayload } from './ContextMenu.types';
import ContextMenuModule from './ContextMenuModule';

export type WordSavedEvent = WordSavedEventPayload;

export function listenWordSaved(cb: (event: WordSavedEvent) => void): () => void {
  const subscription = ContextMenuModule.addListener('WordSaved', cb);
  return () => subscription?.remove();
}

export { ContextMenuModule };
export default ContextMenuModule;