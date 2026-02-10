'use client';

import { type ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  children: ReactNode;
}

export function Tabs({ tabs, activeTab, onChange, children }: TabsProps) {
  return (
    <div>
      <div className="flex gap-1 border-b border-[var(--color-border)] mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-white border border-b-0 border-[var(--color-border)] text-[var(--color-primary)]'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{children}</div>
    </div>
  );
}
