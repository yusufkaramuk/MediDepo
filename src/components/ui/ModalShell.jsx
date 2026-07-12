import React, { useEffect, useRef, useCallback } from 'react';

// Ortak erişilebilir modal kabuğu.
// - role="dialog" + aria-modal + aria-labelledby
// - Escape ile kapanma
// - Focus trap (Tab döngüsü) ve açılışta ilk odaklanabilir öğeye odak
// - Kapanışta odağın açan öğeye geri dönmesi
// - Mobilde bottom-sheet (items-end), sm+ ekranda ortalanmış dialog
//
// Kullanım:
//   <ModalShell onClose={onClose} labelledBy="settings-title" maxWidth="max-w-md">
//     <h2 id="settings-title">…</h2> …
//   </ModalShell>

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export const ModalShell = ({
  onClose,
  labelledBy,
  children,
  maxWidth = 'max-w-md',
  dismissable = true,
  panelClassName = '',
  initialFocusRef = null,
  zIndex = 'z-50',
}) => {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);

  // Açılışta odak yönetimi + kapanışta geri verme
  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    const panel = panelRef.current;
    if (panel) {
      const target = initialFocusRef?.current
        || panel.querySelector('[data-autofocus]')
        || panel.querySelector(FOCUSABLE)
        || panel;
      // panel kendisi odaklanabilsin diye tabIndex -1 veriyoruz
      requestAnimationFrame(() => target?.focus?.({ preventScroll: true }));
    }
    return () => {
      previouslyFocused.current?.focus?.({ preventScroll: true });
    };
  }, [initialFocusRef]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && dismissable) {
      e.stopPropagation();
      onClose?.();
      return;
    }
    if (e.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = [...panel.querySelectorAll(FOCUSABLE)]
      .filter(el => el.offsetParent !== null || el === document.activeElement);
    if (focusables.length === 0) { e.preventDefault(); return; }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }, [dismissable, onClose]);

  return (
    <div
      className={`fixed inset-0 ${zIndex} flex items-end sm:items-center justify-center p-0 sm:p-4`}
      onClick={dismissable ? onClose : undefined}
      onKeyDown={handleKeyDown}
    >
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] animate-fade" aria-hidden="true"></div>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative bg-white dark:bg-slate-900 w-full ${maxWidth} rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90dvh] animate-slide-up outline-none ${panelClassName}`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default ModalShell;
