import React, { createContext, useContext, useState, useCallback } from 'react';
import Icon from '../components/ui/Icon.jsx';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all transform animate-in slide-in-from-bottom-2
              ${toast.type === 'error' ? 'bg-error/10 border-error/30 text-error-fixed' : 
                toast.type === 'success' ? 'bg-secondary/10 border-secondary/30 text-secondary-fixed' : 
                'bg-surface-container-highest border-outline-variant text-on-surface'}`}
          >
            <Icon 
              name={toast.type === 'error' ? 'error_outline' : toast.type === 'success' ? 'check_circle' : 'info'} 
              size={20} 
            />
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-2 opacity-70 hover:opacity-100 focus:outline-none">
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
