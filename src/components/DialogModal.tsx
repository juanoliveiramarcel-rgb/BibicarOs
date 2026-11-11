import React from 'react';
import { AlertCircle, CheckCircle, Info, Trash2 } from 'lucide-react';

interface DialogModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel: () => void;
}

export const DialogModal: React.FC<DialogModalProps> = ({
  isOpen,
  title,
  message,
  type = 'info',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const renderIcon = () => {
    switch (type) {
      case 'confirm':
        return <Trash2 className="w-10 h-10 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-10 h-10 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-10 h-10 text-emerald-500" />;
      default:
        return <Info className="w-10 h-10 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 text-center border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-center mb-3">
          {renderIcon()}
        </div>
        <h3 className="text-base font-extrabold text-slate-900 mb-1.5">
          {title}
        </h3>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex justify-center gap-2">
          {type === 'confirm' ? (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onConfirm) onConfirm();
                  onCancel();
                }}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-sm"
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 rounded-lg bg-slate-900 hover:bg-black text-white font-bold text-xs transition"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
