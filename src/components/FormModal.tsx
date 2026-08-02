import React from 'react';
import { X } from 'lucide-react';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  maxWidth = 'sm'
}) => {
  if (!isOpen) return null;

  const maxWidthClass =
    maxWidth === 'lg'
      ? 'max-w-lg'
      : maxWidth === 'md'
      ? 'max-w-md'
      : 'max-w-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`relative w-full ${maxWidthClass} overflow-hidden rounded-2xl clean-modal border border-slate-200 shadow-2xl p-5 space-y-4 max-h-[90vh] flex flex-col`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            {icon}
            <span>{title}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 text-slate-800 space-y-3">
          {children}
        </div>
      </div>
    </div>
  );
};
