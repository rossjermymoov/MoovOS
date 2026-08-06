import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * useMe — resolves the current person for "my tasks" and notifications.
 *
 * When signed in, that's the authenticated staff member. In bypass mode (no
 * passwords set yet) there is no real identity, so we let the user pick a
 * "view as" staff member — stored locally and shared across the app (bell + page)
 * via a window event so both update together.
 */
const KEY = 'moov_view_as';
const EVT = 'moov-view-as-changed';

export function setViewAs(id) {
  if (id) localStorage.setItem(KEY, id);
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVT));
}

export function useMe() {
  const { user, bypass } = useAuth();
  const [viewAs, setVA] = useState(() => localStorage.getItem(KEY));

  useEffect(() => {
    const handler = () => setVA(localStorage.getItem(KEY));
    window.addEventListener(EVT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const id = user?.id || (bypass ? viewAs : null);
  return { id, name: user?.full_name || null, isReal: !!user?.id, bypass, viewAs };
}
