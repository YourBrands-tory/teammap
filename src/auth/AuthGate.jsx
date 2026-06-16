import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export default function AuthGate({ children }) {
  const restore = useStore(s => s.restoreSession);
  const loaded = useRef(false);

  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      restore();
    }
  }, [restore]);

  return children;
}
