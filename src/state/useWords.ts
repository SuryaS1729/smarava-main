import { create } from "zustand";
import { getRecentWords, initDb, insertWord, softDeleteWord, WordRow } from "../db";

type Store = {
  words: WordRow[];
  loading: boolean;
  initAndLoad: () => void;
  add: (text: string) => void;
  remove: (id: number) => void;
  reload: () => void;
};

export const useWords = create<Store>((set, get) => ({
  words: [],
  loading: false,

  initAndLoad: () => {
    set({ loading: true });
    initDb();
    const rows = getRecentWords();
    set({ words: rows, loading: false });
  },

  reload: () => {
    const rows = getRecentWords();
    set({ words: rows });
  },

  add: (text: string) => {
    const t = text.trim();
    if (!t) return;
    insertWord(t);
    get().reload();
  },

  remove: (id: number) => {
    softDeleteWord(id);
    get().reload();
  },
}));
