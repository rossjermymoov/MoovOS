/**
 * TasksPage — /tasks
 *
 * The Moov OS Tasks module. This first cut embeds the approved, self-contained
 * Tasks prototype (tasksMockup.html) so the exact reviewed design ships now,
 * behind the per-user "tasks" page permission. Record deep-links (customer,
 * carrier, query, tracking, staff) are wired to the real MoovOS router via
 * postMessage, so clicking a linked record navigates the actual app.
 *
 * Roadmap (see INTEGRATION.md): replace the embedded prototype with native
 * React components and swap the prototype's demo data for live data from
 * /api/tasks + the existing customers/queries/tracking/carriers endpoints.
 */
import { useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import tasksHtml from './tasksMockup.html?raw';

export default function TasksPage() {
  const { canAccess, bypass } = useAuth();
  const navigate = useNavigate();

  // Gate: only users granted the 'tasks' page permission (or admins / bypass mode)
  // may open the page directly by URL. The sidebar already hides it otherwise.
  const allowed = bypass || canAccess('tasks');

  useEffect(() => {
    function onMessage(e) {
      const d = e.data;
      if (d && d.type === 'moov-navigate' && typeof d.route === 'string') {
        navigate(d.route);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [navigate]);

  if (!allowed) return <Navigate to="/" replace />;

  return (
    <iframe
      title="Moov OS — Tasks"
      srcDoc={tasksHtml}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
    />
  );
}
