import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTheme, type ThemePreference } from "./useTheme";

/**
 * DemoShell — the shared demo "theme" for the KUI component family, ported
 * from the KUIviewer demo (topbar + brand + version + theme switcher,
 * collapsible left panel, main stage, bottom status bar). Styled entirely
 * with the Tailwind tokens already defined in globals.css so it flips with
 * the .dark class. Each demo (Calendar / Gantt / Player) drops its component
 * into the stage and fills the side panel + status bar with relevant content.
 */

export type StatusTone = "idle" | "loading" | "ready" | "error";

export interface DemoShellProps {
  /** Brand label, e.g. "KUI Calendar". */
  brand: string;
  /** Version pill, e.g. "v0.0.1". */
  version: string;
  /** Single-letter logo glyph (defaults to "K"). */
  logo?: string;
  /** Optional external link shown on the left of the action group. */
  link?: { href: string; label: string };
  /** Extra topbar action buttons (rendered before the theme switcher). */
  actions?: ReactNode;
  /** Left-panel header title. */
  sidebarTitle?: string;
  /** Left-panel header count badge. */
  sidebarCount?: ReactNode;
  /** Left-panel body content. Omit to hide the panel entirely. */
  sidebar?: ReactNode;
  /** Bottom status bar. */
  status?: { tone?: StatusTone; text?: ReactNode; meta?: ReactNode; right?: ReactNode };
  /** Extra classes for the stage scroll container (e.g. padding / centering). */
  stageClassName?: string;
  /** Stage content — the component being demoed. */
  children: ReactNode;
}

/* ---------- icons (inline so the shell has no asset deps) ---------- */

const Icon = ({ d, ...p }: { d: string } & React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <path d={d} />
  </svg>
);

const SunIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);
const MoonIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <Icon d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" {...p} />
);
const SystemIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);
const ChevronDown = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const ChevronLeft = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const Check = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

type ThemeOption = { value: ThemePreference; label: string; Icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement };

const SYSTEM_OPTION: ThemeOption = { value: "system", label: "System", Icon: SystemIcon };
const THEME_OPTIONS: ThemeOption[] = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
  SYSTEM_OPTION,
];

/* ---------- theme switcher ---------- */

function ThemeSwitcher() {
  const { preference, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = THEME_OPTIONS.find((o) => o.value === preference) ?? SYSTEM_OPTION;
  const CurrentIcon = current.Icon;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Toggle theme"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-[12.5px] font-medium text-text-secondary transition-colors hover:border-border-strong hover:bg-surface-overlay hover:text-text-primary"
      >
        <CurrentIcon className="h-[15px] w-[15px]" />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown className="h-3 w-3 opacity-70" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 flex min-w-[160px] flex-col gap-0.5 rounded-xl border border-border bg-surface-raised p-1 shadow-lg"
        >
          {THEME_OPTIONS.map(({ value, label, Icon: OptIcon }) => {
            const active = value === preference;
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={(e) => {
                  e.stopPropagation();
                  setTheme(value);
                  setOpen(false);
                }}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[12.5px] transition-colors hover:bg-surface-overlay ${
                  active ? "text-primary" : "text-text-primary"
                }`}
              >
                <OptIcon className={`h-[15px] w-[15px] ${active ? "text-primary" : "text-text-secondary"}`} />
                <span>{label}</span>
                {active && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- status dot tones ---------- */

const DOT_TONE: Record<StatusTone, string> = {
  idle: "bg-text-disabled",
  loading: "bg-primary animate-pulse",
  ready: "bg-success",
  error: "bg-error",
};

/* ---------- shell ---------- */

export default function DemoShell({
  brand,
  version,
  logo = "K",
  link,
  actions,
  sidebarTitle = "Demo",
  sidebarCount,
  sidebar,
  status,
  stageClassName = "",
  children,
}: DemoShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const hasSidebar = sidebar != null;
  const tone = status?.tone ?? "idle";

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-surface-base text-text-primary">
      {/* Topbar */}
      <header className="z-10 flex h-12 items-center gap-3 border-b border-border bg-surface-raised/85 px-5 backdrop-blur-md backdrop-saturate-150">
        <div className="flex items-center gap-2.5 text-sm font-semibold tracking-tight">
          <span className="grid h-[26px] w-[26px] place-items-center rounded-lg bg-gradient-to-br from-primary to-[#a78bfa] text-xs font-bold text-primary-fg shadow-[0_2px_6px_rgba(96,165,250,0.25)]">
            {logo}
          </span>
          <span>{brand}</span>
          <span className="ml-1 rounded-full bg-surface-overlay px-2 py-0.5 font-mono text-[10.5px] font-medium text-text-secondary">
            {version}
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          {link && (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-medium text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              {link.label}
            </a>
          )}
          {actions}
          <ThemeSwitcher />
        </div>
      </header>

      {/* Body: sidebar + stage */}
      <div className="flex min-h-0 flex-1">
        {hasSidebar && (
          <aside
            className={`flex flex-col border-r border-border bg-surface-raised transition-[width] duration-200 ${
              collapsed ? "w-10" : "w-[280px]"
            }`}
          >
            <div className="flex min-h-[44px] items-center gap-2 border-b border-border px-3.5">
              {!collapsed && (
                <>
                  <span className="text-[13px] font-semibold tracking-tight">{sidebarTitle}</span>
                  {sidebarCount != null && (
                    <span className="rounded-full bg-surface-overlay px-2 py-px text-[10.5px] font-medium text-text-secondary">
                      {sidebarCount}
                    </span>
                  )}
                  <span className="flex-1" />
                </>
              )}
              <button
                type="button"
                title={collapsed ? "Expand panel" : "Collapse panel"}
                aria-label="Toggle panel"
                onClick={() => setCollapsed((v) => !v)}
                className={`grid h-[26px] w-[26px] place-items-center rounded-md text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary ${
                  collapsed ? "mx-auto" : ""
                }`}
              >
                <ChevronLeft className={`h-3.5 w-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
              </button>
            </div>
            {!collapsed && <div className="flex-1 overflow-auto p-3">{sidebar}</div>}
          </aside>
        )}

        <main className={`relative min-w-0 flex-1 overflow-auto bg-surface-base ${stageClassName}`}>
          {children}
        </main>
      </div>

      {/* Bottom status bar */}
      <footer className="flex h-7 items-center gap-3 border-t border-border bg-surface-raised px-4 text-[11.5px] text-text-secondary">
        <span className={`h-2 w-2 rounded-full ${DOT_TONE[tone]}`} />
        <span>{status?.text ?? "Ready"}</span>
        {status?.meta != null && (
          <>
            <span className="h-3.5 w-px bg-border" />
            <span>{status.meta}</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-3">
          {status?.right}
          <span className="h-3.5 w-px bg-border" />
          <span>{brand} · demo</span>
        </div>
      </footer>
    </div>
  );
}
