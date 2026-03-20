'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Button, type ButtonProps } from './Button';

type AlertDialogRequest = {
  type: 'alert';
  title?: string;
  message: string;
  okText: string;
};

type ConfirmDialogRequest = {
  type: 'confirm';
  title?: string;
  message: string;
  cancelText: string;
  confirmText: string;
  confirmVariant: ButtonProps['variant'];
};

type DialogRequest = AlertDialogRequest | ConfirmDialogRequest;

type DialogResolver = {
  resolve: (() => void) | ((value: boolean) => void);
  requestType: DialogRequest['type'];
};

type AppDialogsContextValue = {
  alert: (message: string, options?: { title?: string; okText?: string }) => Promise<void>;
  confirm: (message: string, options?: { title?: string; cancelText?: string; confirmText?: string; danger?: boolean }) => Promise<boolean>;
};

const AppDialogsContext = createContext<AppDialogsContextValue | null>(null);

export function AppDialog({
  title,
  children,
  footer,
  onClose,
}: {
  title?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-white shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'dialog'}
        dir="rtl"
      >
        {title !== undefined && (
          <div className="border-b border-[var(--color-border)] px-5 py-3">
            {title ? <h2 className="text-base font-semibold text-slate-900">{title}</h2> : null}
          </div>
        )}
        <div className="px-5 py-4 text-sm text-slate-700 leading-relaxed">{children}</div>
        <div className="flex flex-row-reverse gap-2 justify-end border-t border-[var(--color-border)] px-5 py-3">{footer}</div>
      </div>
    </div>
  );
}

export function AppDialogsProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<DialogRequest | null>(null);
  const resolverRef = useRef<DialogResolver | null>(null);

  const close = useCallback(() => {
    setRequest(null);
    resolverRef.current = null;
  }, []);

  const resolveAndClose = useCallback(
    (value?: boolean) => {
      const resolver = resolverRef.current;
      if (!resolver) {
        close();
        return;
      }

      if (resolver.requestType === 'confirm') {
        (resolver.resolve as (v: boolean) => void)(value ?? false);
      } else {
        (resolver.resolve as () => void)();
      }

      close();
    },
    [close],
  );

  const alert = useCallback<AppDialogsContextValue['alert']>((message, options) => {
    return new Promise<void>((resolve) => {
      resolverRef.current = { resolve, requestType: 'alert' };
      setRequest({
        type: 'alert',
        title: options?.title,
        message,
        okText: options?.okText ?? 'باشه',
      });
    });
  }, []);

  const confirm = useCallback<AppDialogsContextValue['confirm']>((message, options) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = { resolve, requestType: 'confirm' };
      setRequest({
        type: 'confirm',
        title: options?.title,
        message,
        cancelText: options?.cancelText ?? 'انصراف',
        confirmText: options?.confirmText ?? 'تایید',
        confirmVariant: options?.danger ? 'danger' : 'primary',
      });
    });
  }, []);

  const value = useMemo<AppDialogsContextValue>(() => ({ alert, confirm }), [alert, confirm]);

  return (
    <AppDialogsContext.Provider value={value}>
      {children}
      {request && request.type === 'alert' && (
        <AppDialog
          title={request.title}
          onClose={() => resolveAndClose()}
          footer={
            <Button
              onClick={() => resolveAndClose()}
              variant="primary"
              size="md"
              className="min-w-[120px]"
            >
              {request.okText}
            </Button>
          }
        >
          {request.message}
        </AppDialog>
      )}
      {request && request.type === 'confirm' && (
        <AppDialog
          title={request.title}
          onClose={() => resolveAndClose(false)}
          footer={
            <>
              <Button
                onClick={() => resolveAndClose(false)}
                variant="outline"
                size="md"
                className="min-w-[120px]"
              >
                {request.cancelText}
              </Button>
              <Button
                onClick={() => resolveAndClose(true)}
                variant={request.confirmVariant}
                size="md"
                className="min-w-[120px]"
              >
                {request.confirmText}
              </Button>
            </>
          }
        >
          {request.message}
        </AppDialog>
      )}
    </AppDialogsContext.Provider>
  );
}

export function useAppDialogs() {
  const ctx = useContext(AppDialogsContext);
  if (!ctx) throw new Error('useAppDialogs must be used within AppDialogsProvider');
  return ctx;
}

