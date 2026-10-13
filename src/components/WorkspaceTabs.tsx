"use client";
import type { KeyboardEvent } from "react";

export function WorkspaceTabs<T extends string>({
  tabs,
  active,
  onChange,
  label,
  prefix,
}: {
  tabs: readonly { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
  label: string;
  prefix: string;
}) {
  const onKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let next: number;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    onChange(tabs[next].id);
    document.getElementById(`${prefix}-tab-${tabs[next].id}`)?.focus();
  };
  return (
    <div className="report-tabs no-print" role="tablist" aria-label={label}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          id={`${prefix}-tab-${tab.id}`}
          role="tab"
          aria-selected={active === tab.id}
          aria-controls={`${prefix}-panel-${tab.id}`}
          tabIndex={active === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => onKeyDown(event, index)}
        >
          {tab.label}
          {tab.count !== undefined ? (
            <span className="tag">{tab.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
