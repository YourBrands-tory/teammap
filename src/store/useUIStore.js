import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'teammap-ui-state-v1';

function debouncedLocalStorage(ms) {
  let timer = null;
  let pending = null;
  return {
    getItem: (name) => {
      try { return localStorage.getItem(name); } catch { return null; }
    },
    setItem: (name, value) => {
      pending = { name, value };
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        try { localStorage.setItem(pending.name, pending.value); } catch {}
        pending = null;
        timer = null;
      }, ms);
    },
    removeItem: (name) => {
      if (timer) { clearTimeout(timer); timer = null; pending = null; }
      try { localStorage.removeItem(name); } catch {}
    },
  };
}

export const useUIStore = create(
  persist(
    (set, get) => ({
      view: 'lu',

      openModal: null,

      viewStates: {},

      scrollPositions: {},

      clearUIState: () => set({ view: 'lu', openModal: null, viewStates: {}, scrollPositions: {} }),

      setView: (v) => set({ view: v }),

      setOpenModal: (modal) => set({ openModal: modal }),

      setViewState: (viewKey, patch) =>
        set((s) => ({
          viewStates: {
            ...s.viewStates,
            [viewKey]: { ...(s.viewStates[viewKey] || {}), ...patch },
          },
        })),

      setScrollPosition: (viewKey, pos) =>
        set((s) => ({
          scrollPositions: { ...s.scrollPositions, [viewKey]: pos },
        })),
    }),
    {
      name: STORAGE_KEY,
      storage: debouncedLocalStorage(300),
      partialize: (state) => ({
        view: state.view,
        openModal: state.openModal,
        viewStates: state.viewStates,
        scrollPositions: state.scrollPositions,
      }),
      version: 1,
    }
  )
);
