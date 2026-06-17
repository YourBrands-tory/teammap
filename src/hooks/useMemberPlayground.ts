import { useState, useCallback, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { uid } from '../lib/constants';
import useSpreadsheet from './useSpreadsheet';
import type { TabData } from '../utils/playgroundHelpers';

export default function useMemberPlayground() {
  const S = useStore(s => s.S);
  const memberId = useStore(s => s.session?.memberId);
  const upsertTask = useStore(s => s.upsertTask);

  const [serverTabs, setServerTabs] = useState<TabData[]>([{ id: uid(), name: 'Sheet 1', data: {} }]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!memberId || loaded) return;
    (async () => {
      const { data, error } = await supabase
        .from('member_sheets')
        .select('data')
        .eq('member_id', memberId)
        .maybeSingle();
      if (!error && data?.data?.tabs) {
        setServerTabs(data.data.tabs);
      }
      setLoaded(true);
    })();
  }, [memberId, loaded]);

  const persist = useCallback((tabs: TabData[]) => {
    setServerTabs(tabs);
    if (!memberId) return;
    supabase.from('member_sheets').upsert(
      { member_id: memberId, data: { tabs }, updated_at: new Date().toISOString() },
      { onConflict: 'member_id' }
    ).then(({ error }) => {
      if (error) console.error('[useMemberPlayground] persist error:', error);
    });
  }, [memberId]);

  return useSpreadsheet({ initialTabs: serverTabs, persist, S, upsertTask, memberId });
}
