import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
  children: React.ReactNode;
  onClose?: () => void;
}

/**
 * ModalPortal — renders children via React Portal directly into document.body.
 * This escapes any parent overflow:hidden / overflow:auto clipping that would
 * otherwise hide fixed-position overlays.
 */
export const ModalPortal: React.FC<ModalProps> = ({ children, onClose }) => {
  // Lock body scroll when any modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto animate-fadeIn"
      onClick={handleBackdropClick}
      style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
    >
      <div
        className="w-full flex justify-center px-4 my-auto"
        style={{ minHeight: 'min-content' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
