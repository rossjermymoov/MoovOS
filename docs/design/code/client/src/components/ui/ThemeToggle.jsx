/**
 * ThemeToggle — pill form, direction 1c.
 *
 * Same context, same API, same behaviour as the previous icon-only version;
 * it just reads as a switch rather than a mystery icon. The track and knob
 * are positioned by moov-v2.css off :root[data-theme], so no inline state
 * styling is needed here.
 *
 * Drop-in replacement for components/ui/ThemeToggle.jsx. Requires moov-v2.css.
 */
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      className="v2-theme-toggle"
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
    >
      <span className="v2-theme-track" aria-hidden="true">
        <span className="v2-theme-knob" />
      </span>
      {isDark ? 'Dark' : 'Light'}
    </button>
  );
}
