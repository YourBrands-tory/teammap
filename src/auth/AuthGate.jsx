import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export default function AuthGate({ children }) {
  const restore = useStore(s => s.restoreSession);
  const initListener = useStore(s => s.initAuthListener);
  const loaded = useRef(false);

  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      restore();
    }
  }, [restore]);

  useEffect(() => {
    initListener();
    return () => {
      const sub = useStore.getState()._authSubscription;
      if (sub) sub.unsubscribe();
    };
  }, [initListener]);

  return children;
}
