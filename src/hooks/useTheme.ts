import { useEffect, useState } from 'react';
import { useSettings } from '../store/useSettings';

const QUERY = '(prefers-color-scheme: dark)';

/** The theme actually shown: 'system' resolves to the OS preference. */
export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useSettings((s) => s.theme);
  const [systemDark, setSystemDark] = useState(() => typeof matchMedia === 'function' && matchMedia(QUERY).matches);

  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia(QUERY);
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (theme === 'system') return systemDark ? 'dark' : 'light';
  return theme;
}
