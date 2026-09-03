'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface Options {
  active: boolean;
  onClose?: () => void;
  returnFocus?: boolean;
  initialFocus?: 'first' | 'title';
  titleSelector?: string; // ex.: '[data-modal-title]'
}

export function useFocusTrap({
  active,
  onClose,
  returnFocus = true,
  initialFocus = 'first',
  titleSelector = '[data-modal-title]',
}: Options) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;

    // foco inicial
    const focusInitial = () => {
      if (initialFocus === 'title') {
        const title = container.querySelector<HTMLElement>(titleSelector);
        if (title) {
          title.setAttribute('tabindex', '-1');
          title.focus();
          return;
        }
      }
      const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE);
      const first = focusables[0];
      if (first) first.focus();
    };

    // pequeno delay para aguardar o elemento entrar no DOM
    const t = setTimeout(focusInitial, 30);

    // tab cycling
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKey);

    // trava scroll do body
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
      if (returnFocus && previouslyFocused.current) {
        previouslyFocused.current.focus();
      }
    };
  }, [active, onClose, returnFocus, initialFocus, titleSelector]);

  return containerRef;
}