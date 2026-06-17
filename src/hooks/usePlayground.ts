import { useCallback } from 'react';
import { useStore } from '../store/useStore';
import { uid } from '../lib/constants';
import useSpreadsheet from './useSpreadsheet';
import type { TabData } from '../utils/playgroundHelpers';

export default function usePlayground() {
  const S = useStore(s => s.S);
  const setStateKey = useStore(s => s.setStateKey);
  const upsertTask = useStore(s => s.upsertTask);

  const pg: any = S.playground || { tabs: [{ id: uid(), name: 'Sheet 1', data: {} }] };

  const persist = useCallback((tabs: TabData[]) => {
    setStateKey('playground', { tabs });
  }, [setStateKey]);

  return useSpreadsheet({ initialTabs: pg.tabs, persist, S, upsertTask });
}
