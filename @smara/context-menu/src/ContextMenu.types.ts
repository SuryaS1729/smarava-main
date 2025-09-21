import type { StyleProp, ViewStyle } from 'react-native';

export type OnLoadEventPayload = {
  url: string;
};

export type ContextMenuModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
  WordSaved: (params: WordSavedEventPayload) => void;
};

export type ChangeEventPayload = {
  value: string;
};

export type WordSavedEventPayload = {
  id?: string;
  text: string;
  created_at: string;
};

export type ContextMenuViewProps = {
  url: string;
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};
