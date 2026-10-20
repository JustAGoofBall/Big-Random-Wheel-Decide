import { useEffect } from 'react';
import { useUi } from '../store/useUi';

export function Toast() {
  const toast = useUi((s) => s.toast);
  const set = useUi((s) => s.set);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      if (useUi.getState().toast?.id === toast.id) set({ toast: null });
    }, toast.action ? 6000 : 3500);
    return () => clearTimeout(timer);
  }, [toast, set]);

  if (!toast) return null;
  return (
    <div className="toast" role="status" key={toast.id}>
      <span>{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.run();
            set({ toast: null });
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
