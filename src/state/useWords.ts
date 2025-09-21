import { create } from "zustand";
import { getAllWordsDebug, getRecentWords, initDb, insertWord, softDeleteWord, WordRow } from "../db";

type Store = {
  words: WordRow[];
  loading: boolean;
  initAndLoad: () => void;
  reload: () => void;
  add: (text: string) => void;
  remove: (id: number) => void;
};

export const useWords = create<Store>((set, get) => ({
  words: [],
  loading: false,

  initAndLoad: () => {
    set({ loading: true });
    try {
      initDb();
      const words = getRecentWords();
      console.log('initAndLoad - words loaded:', words.length);
      console.log('initAndLoad - setting words:', words);
      set({ words, loading: false });
    } catch (error) {
      console.error('initAndLoad error:', error);
      set({ loading: false });
    }
  },

  reload: () => {
    console.log('Reloading words...');
    try {
      const words = getRecentWords();
      console.log('All words debug:', getAllWordsDebug());
      console.log('Reload - setting words:', words);
      set({ words });
    } catch (error) {
      console.error('Reload error:', error);
    }
  },

  add: (text: string) => {
    const t = text.trim();
    if (!t) return;
    try {
      insertWord(t);
      get().reload();
    } catch (error) {
      console.error('Add word error:', error);
    }
  },

  remove: (id: number) => {
    try {
      softDeleteWord(id);
      get().reload();
    } catch (error) {
      console.error('Remove word error:', error);
    }
  },
}));
