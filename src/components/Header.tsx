"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  Compass,
  LayoutDashboard,
  Plus,
  ScanLine,
  UserRound,
} from "lucide-react";

export type GuestState = {
  guest_id: string;
  daily_limit: number;
  used: number;
  blocked: boolean;
  scans_enabled: boolean;
  resets_at: string;
};

export function Brand({ mobile = false }: { mobile?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand${mobile ? " mobile-brand" : ""}`}
      aria-label="HorizonScan home"
    >
      <span className="brand-mark">
        <Compass size={21} />
      </span>
      HorizonScan<span style={{ color: "#90ae9d", fontSize: 20 }}>.</span>
    </Link>
  );
}

export function Header({
  guest,
  hasReport,
  onNewScan,
  admin = false,
  onSample,
}: {
  guest?: GuestState | null;
  hasReport?: boolean;
  onNewScan?: () => void;
  admin?: boolean;
  onSample?: () => void;
}) {
  const remaining = guest ? Math.max(0, guest.daily_limit - guest.used) : null;
  const allowance = guest?.blocked
    ? "Scanning unavailable"
    : guest && !guest.scans_enabled
      ? "New scans paused"
      : remaining === null
        ? "Guest workspace"
        : `${remaining} scan${remaining === 1 ? "" : "s"} remaining today`;
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar no-print">
        <Brand />
        <p className="sidebar-caption">A wider perspective.</p>
        <p className="nav-label">Workspace</p>
        <nav aria-label="Main navigation">
          {admin ? (
            <Link className="nav-item" href="/">
              <ScanLine size={17} />
              Market scan
            </Link>
          ) : (
            <button
              className={`nav-item ${!hasReport ? "active" : ""}`}
              onClick={onNewScan}
              aria-current={!hasReport ? "page" : undefined}
            >
              <ScanLine size={17} />
              Market scan
              <Plus size={13} style={{ marginLeft: "auto" }} />
            </button>
          )}
          {hasReport ? (
            <a className="nav-item active" href="#report" aria-current="page">
              <BookOpen size={17} />
              Current report
            </a>
          ) : null}
          {admin ? (
            <Link className="nav-item active" href="/admin" aria-current="page">
              <LayoutDashboard size={17} />
              Administration
            </Link>
          ) : null}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Compass size={20} color="#b8d5a5" />
            <p>
              <strong>See the bigger picture.</strong>
              <br />
              Six perspectives on the forces shaping your market.
            </p>
            {admin ? (
              <Link
                href="/"
                className="text-button"
                style={{ color: "#c9e9b8" }}
              >
                Return to scans <ArrowUpRight size={13} />
              </Link>
            ) : (
              <button onClick={onSample}>
                Explore a sample <ArrowUpRight size={13} />
              </button>
            )}
          </div>
          <div className="sidebar-footer">
            <span className="dot" />
            Evidence-led research
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar no-print">
          <Brand mobile />
          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={12} />
            <strong>
              {admin
                ? "Administration"
                : hasReport
                  ? "Market report"
                  : "Market scan"}
            </strong>
          </div>
          <div className="topbar-right">
            {admin ? (
              <Link href="/" className="text-button">
                Return to scans <ArrowUpRight size={13} />
              </Link>
            ) : (
              <span
                className="allowance"
                title={
                  guest
                    ? `Allowance resets ${new Date(guest.resets_at).toLocaleString()}. Network and sitewide limits also apply.`
                    : undefined
                }
              >
                <span className="dot" />
                {allowance}
              </span>
            )}
            <span
              className="guest-avatar"
              aria-label={admin ? "Admin workspace" : "Guest workspace"}
            >
              <UserRound size={15} />
            </span>
          </div>
        </header>
      </div>
    </>
  );
}
