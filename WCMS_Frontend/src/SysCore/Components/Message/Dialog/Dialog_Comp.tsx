import { createContext, useContext, useState } from 'react';
import type{ ReactNode } from 'react';

type MessageType = 'info' | 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  type: MessageType;
  sticky?: boolean;
}

interface ConfirmOptions {
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface MessageContextType {
  showToast: (message: string, type?: MessageType, sticky?: boolean) => void;
  showConfirm: (options: ConfirmOptions) => void;
}

const MessageContext = createContext<MessageContextType | null>(null);

export const useMessage = () => {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error("useMessage must be used within MessageProvider");
  return ctx;
};

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<ConfirmOptions | null>(null);

  const showToast = (message: string, type: MessageType = 'info', sticky = false) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, sticky }]);
    if (!sticky) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    }
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showConfirm = (options: ConfirmOptions) => {
    setConfirm(options);
  };

  return (
    <MessageContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.message}
            {t.sticky && <button onClick={() => removeToast(t.id)}>×</button>}
          </div>
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirm && (
        <div className="dialog-backdrop">
          <div className="dialog">
            <p>{confirm.message}</p>
            <div className="dialog-buttons">
              <button onClick={() => { confirm.onConfirm(); setConfirm(null); }}>確認</button>
              <button onClick={() => { confirm.onCancel?.(); setConfirm(null); }}>取消</button>
            </div>
          </div>
        </div>
      )}
    </MessageContext.Provider>
  );
};