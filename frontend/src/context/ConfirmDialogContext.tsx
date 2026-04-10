import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmDialogContextType {
  showConfirm: (message: string) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null);

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [resolveCallback, setResolveCallback] = useState<((value: boolean) => void) | null>(null);

  const showConfirm = useCallback((msg: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setMessage(msg);
      setResolveCallback(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    resolveCallback?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveCallback?.(false);
  };

  return (
    <ConfirmDialogContext.Provider value={{ showConfirm }}>
      {children}
      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 bg-black bg-opacity-30 z-[9998]" onClick={handleCancel} />
          <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-sm w-full mx-4 pointer-events-auto">
              <p className="text-gray-800 text-lg font-medium mb-6">{message}</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </ConfirmDialogContext.Provider>
  );
};

export const useConfirmDialog = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
  }
  return context;
};
