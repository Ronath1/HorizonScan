"use client";

import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  KeyRound,
  LoaderCircle,
  LogOut,
  RotateCw,
  Settings2,
} from "lucide-react";
import { Header } from "@/components/Header";
import {
  AdminGuests,
  type AdminGuest,
  type GuestChange,
} from "@/components/AdminGuests";
import { WorkspaceTabs } from "@/components/WorkspaceTabs";

type Settings = {
  model: string;
  guest_daily_limit: number;
  ip_daily_limit: number;
  global_daily_limit: number;
  daily_budget_usd: number;
  requests_per_minute: number;
  scans_enabled: boolean;
};
type Dashboard = {
  settings: Settings;
  usage: { day: string; totals: Record<string, number>; guests: AdminGuest[] };
  configuration: Record<string, boolean>;
  models: {
    id: string;
    label: string;
    input: number;
    output: number;
    legacy: boolean;
  }[];
};
type AdminTab = "overview" | "model" | "limits" | "guests";
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "model", label: "AI model" },
  { id: "limits", label: "Access & limits" },
  { id: "guests", label: "Guests" },
] as const;
const PROVIDER_LABELS: Record<string, string> = {
  gemini: "Gemini API",
  tavily: "Web search",
  session: "Sessions",
  admin: "Admin access",
  shared_store: "Shared storage",
};
class RequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new RequestError(
      data.error || `Request failed (${response.status}).`,
      response.status,
    );
  return data;
}

function NumberField({
  label,
  help,
  value,
  max,
  min = 0,
  step = 1,
  onChange,
}: {
  label: string;
  help: string;
  value: number;
  max: number;
  min?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-describedby={`${id}-help`}
        className="input"
        type="number"
        required
        min={min}
        max={max}
        step={step}
        value={Number.isNaN(value) ? "" : value}
        onChange={(event) =>
          onChange(event.target.value === "" ? NaN : Number(event.target.value))
        }
      />
      <span className="field-help" id={`${id}-help`}>
        {help}
      </span>
    </div>
  );
}

export default function AdminPage() {
  const [code, setCode] = useState("");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [draft, setDraft] = useState<Settings | null>(null);
  const [tab, setTab] = useState<AdminTab>("overview");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const data = (await request("/api/admin", "GET")) as Dashboard;
    setDashboard(data);
    setDraft(data.settings);
  }, []);
  useEffect(() => {
    void load()
      .catch((err) => {
        if (!(err instanceof RequestError && err.status === 401))
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load administration.",
          );
      })
      .finally(() => setLoading(false));
  }, [load]);
  const handleError = (err: unknown) => {
    if (err instanceof RequestError && err.status === 401) {
      setDashboard(null);
      setDraft(null);
    }
    setError(
      err instanceof Error
        ? err.message
        : "The request could not be completed.",
    );
  };
  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request("/api/admin/session", "POST", { code });
      setCode("");
      await load();
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request("/api/admin", "PATCH", {
        action: "settings",
        settings: draft,
      });
      setDashboard((value) =>
        value ? { ...value, settings: { ...draft } } : value,
      );
      setNotice("Settings saved. New scans will use these controls.");
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };
  const guestChange = async (id: string, change: GuestChange) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request("/api/admin", "PATCH", {
        action: "guest",
        guest_id: id,
        ...change,
      });
      setDashboard((value) =>
        value
          ? {
              ...value,
              usage: {
                ...value.usage,
                guests: value.usage.guests.map((guest) =>
                  guest.id === id
                    ? {
                        ...guest,
                        override: {
                          blocked: change.blocked,
                          ...(change.daily_limit === null
                            ? {}
                            : { daily_limit: change.daily_limit }),
                        },
                      }
                    : guest,
                ),
              },
            }
          : value,
      );
      setNotice("Guest allowance saved.");
    } catch (err) {
      if (err instanceof RequestError && err.status === 401) handleError(err);
      throw err;
    } finally {
      setBusy(false);
    }
  };
  const logout = async () => {
    setBusy(true);
    setError("");
    try {
      await request("/api/admin/session", "DELETE");
      setDashboard(null);
      setDraft(null);
      setNotice("");
      setTab("overview");
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };
  const refresh = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await load();
      setNotice("Usage and settings refreshed.");
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };
  const dirty = Boolean(
    dashboard &&
      draft &&
      JSON.stringify(dashboard.settings) !== JSON.stringify(draft),
  );
  const model = dashboard?.models.find((value) => value.id === draft?.model);
  const changeField = (key: keyof Settings, value: number | string | boolean) =>
    setDraft((previous) =>
      previous ? { ...previous, [key]: value } : previous,
    );

  return (
    <div className="app-shell">
      <Header admin />
      <div className="main-shell">
        <main className="content" id="main-content">
          {error ? (
            <div
              className="notice error"
              role="alert"
              style={{ marginBottom: 20 }}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          ) : null}
          {notice ? (
            <div
              className="notice success"
              role="status"
              style={{ marginBottom: 20 }}
            >
              <Check size={16} />
              {notice}
            </div>
          ) : null}
          {loading ? (
            <p className="panel loading-placeholder" role="status">
              Loading administration…
            </p>
          ) : !dashboard || !draft ? (
            <form className="panel login-panel" onSubmit={signIn}>
              <span className="example-icon">
                <KeyRound size={20} />
              </span>
              <p className="eyebrow">Private workspace</p>
              <h1>
                A little control.
                <br />A clearer overview.
              </h1>
              <p>
                Sign in to manage research models, public scanning, and your
                daily spending limits.
              </p>
              <label className="field" htmlFor="admin-code">
                Admin access code
                <input
                  id="admin-code"
                  className="input"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  disabled={busy}
                />
              </label>
              <button className="button primary" disabled={busy || !code}>
                {busy ? <LoaderCircle size={15} className="spin" /> : null}Sign
                in
                <ArrowRight size={14} />
              </button>
            </form>
          ) : (
            <>
              <div className="report-topline admin-topline">
                <div>
                  <p className="eyebrow">
                    <Settings2 size={13} />
                    Administration
                  </p>
                  <h1>Your research, under control.</h1>
                  <p>
                    Manage models, guest access, and estimated Gemini spending.
                  </p>
                </div>
                <div className="report-actions">
                  <button
                    className="button"
                    disabled={busy || dirty}
                    onClick={refresh}
                  >
                    <RotateCw size={13} />
                    Refresh usage
                  </button>
                  <button
                    className="button"
                    disabled={busy || dirty}
                    onClick={logout}
                  >
                    <LogOut size={13} />
                    Sign out
                  </button>
                </div>
              </div>
              {dirty ? (
                <div className="notice" role="status">
                  You have unsaved settings. Save or cancel them in AI model or
                  Access & limits before refreshing or signing out.
                </div>
              ) : null}
              <WorkspaceTabs
                tabs={TABS}
                active={tab}
                onChange={setTab}
                label="Administration sections"
                prefix="admin"
              />
              <div
                role="tabpanel"
                id={`admin-panel-${tab}`}
                aria-labelledby={`admin-tab-${tab}`}
                tabIndex={0}
                className="report-body"
              >
                {tab === "overview" ? (
                  <>
                    <div className="admin-grid">
                      <article className="panel metric">
                        <p className="metric-label">Scans started today</p>
                        <p className="metric-value">
                          {dashboard.usage.totals.scans || 0}{" "}
                          <small>
                            / {dashboard.settings.global_daily_limit}
                          </small>
                        </p>
                        <p className="metric-caption">
                          Sitewide daily limit · {dashboard.usage.day} UTC
                        </p>
                      </article>
                      <article className="panel metric">
                        <p className="metric-label">Estimated Gemini cost</p>
                        <p className="metric-value">
                          $
                          {Number(
                            dashboard.usage.totals.actual_usd || 0,
                          ).toFixed(4)}
                        </p>
                        <p className="metric-caption">
                          Confirmed token usage; excludes search and hosting.
                        </p>
                      </article>
                      <article className="panel metric">
                        <p className="metric-label">Budget remaining</p>
                        <p className="metric-value">
                          $
                          {Math.max(
                            0,
                            dashboard.settings.daily_budget_usd -
                              Number(dashboard.usage.totals.reserved_usd || 0),
                          ).toFixed(4)}
                        </p>
                        <p className="metric-caption">
                          After reservations · $
                          {dashboard.settings.daily_budget_usd.toFixed(2)} daily
                          cap
                        </p>
                      </article>
                    </div>
                    <section className="panel admin-section">
                      <h2>Provider readiness</h2>
                      <p>
                        Configuration checks indicate whether credentials are
                        present. A live scan is still needed to verify provider
                        access.
                      </p>
                      <div className="provider-grid">
                        {Object.entries(dashboard.configuration).map(
                          ([name, ready]) => (
                            <div
                              className={`provider-status ${ready ? "" : "missing"}`}
                              key={name}
                            >
                              {PROVIDER_LABELS[name] || name}
                              <span>{ready ? "Configured" : "Missing"}</span>
                            </div>
                          ),
                        )}
                      </div>
                    </section>
                    <section className="panel admin-section">
                      <h2>Current scan setup</h2>
                      <p>
                        {dashboard.settings.scans_enabled
                          ? "Public scanning is enabled."
                          : "New public scans are paused."}{" "}
                        Guests receive {dashboard.settings.guest_daily_limit}{" "}
                        scans per UTC day.
                      </p>
                      <div className="model-details">
                        <strong>
                          {dashboard.models.find(
                            (value) => value.id === dashboard.settings.model,
                          )?.label || dashboard.settings.model}
                        </strong>
                        <p>Selected model · No automatic model fallback.</p>
                        <button
                          className="text-button"
                          onClick={() => setTab("model")}
                        >
                          Review model settings
                          <ArrowRight size={12} />
                        </button>
                      </div>
                      <p style={{ marginTop: 18 }}>
                        Budget held after settlements and pending reservations:
                        $
                        {Number(
                          dashboard.usage.totals.reserved_usd || 0,
                        ).toFixed(4)}
                        . Uncertain provider usage retains its reservation.
                      </p>
                    </section>
                  </>
                ) : null}
                {tab === "model" || tab === "limits" ? (
                  <form className="panel admin-section" onSubmit={save}>
                    {tab === "model" ? (
                      <>
                        <h2>Choose your analysis model</h2>
                        <p>
                          Changes apply to new research. Saved reports retain
                          the model that produced them.
                        </p>
                        <label className="field" style={{ marginTop: 24 }}>
                          Gemini model
                          <select
                            className="select"
                            value={draft.model}
                            disabled={busy}
                            onChange={(event) =>
                              changeField("model", event.target.value)
                            }
                          >
                            {dashboard.models.map((value) => (
                              <option key={value.id} value={value.id}>
                                {value.label}
                                {value.legacy ? " · Check project access" : ""}
                              </option>
                            ))}
                          </select>
                        </label>
                        {model ? (
                          <div className="model-details">
                            <strong>{model.label}</strong>
                            <p>
                              ${model.input.toFixed(2)} / million input tokens ·
                              ${model.output.toFixed(2)} / million output tokens
                            </p>
                            <p>
                              {model.label.includes("Lite")
                                ? "Lower-cost model family for compact research extraction."
                                : "Higher-cost model option. Compare report quality and token usage before increasing traffic."}
                            </p>
                            {model.legacy ? (
                              <p>
                                Access to this model may be limited for newer
                                projects. Verify it with your API key.
                              </p>
                            ) : null}
                            <p>
                              Text token estimates from the configured rate
                              table, reviewed 12 Oct 2026. Verify current
                              provider pricing. Search credits and hosting are
                              separate.
                            </p>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <h2>Public access & spending limits</h2>
                        <p>
                          Set an allowance for guests and a maximum daily Gemini
                          budget. All daily limits reset at midnight UTC.
                        </p>
                        <label
                          className="checkbox-label"
                          style={{ marginTop: 22 }}
                        >
                          <input
                            type="checkbox"
                            checked={draft.scans_enabled}
                            disabled={busy}
                            onChange={(event) =>
                              changeField("scans_enabled", event.target.checked)
                            }
                          />
                          Allow new public scans
                        </label>
                        <fieldset
                          disabled={busy}
                          style={{ border: 0, margin: 0, padding: 0 }}
                        >
                          <legend className="sr-only">Scan limits</legend>
                          <div className="admin-fields">
                            <NumberField
                              label="Guest scans per day"
                              help="Default for each browser guest. Range: 0–100."
                              value={draft.guest_daily_limit}
                              max={100}
                              onChange={(value) =>
                                changeField("guest_daily_limit", value)
                              }
                            />
                            <NumberField
                              label="Network scans per day"
                              help="Shared allowance across a network. Range: 0–1,000."
                              value={draft.ip_daily_limit}
                              max={1000}
                              onChange={(value) =>
                                changeField("ip_daily_limit", value)
                              }
                            />
                            <NumberField
                              label="All scans per day"
                              help="Sitewide daily maximum. Range: 0–10,000."
                              value={draft.global_daily_limit}
                              max={10000}
                              onChange={(value) =>
                                changeField("global_daily_limit", value)
                              }
                            />
                            <NumberField
                              label="Daily Gemini budget (USD)"
                              help="Estimated token spending cap. Excludes Tavily and hosting."
                              value={draft.daily_budget_usd}
                              max={100}
                              step={0.01}
                              onChange={(value) =>
                                changeField("daily_budget_usd", value)
                              }
                            />
                            <NumberField
                              label="Requests per network per minute"
                              help="Traffic throttle. Range: 1–120."
                              value={draft.requests_per_minute}
                              min={1}
                              max={120}
                              onChange={(value) =>
                                changeField("requests_per_minute", value)
                              }
                            />
                          </div>
                        </fieldset>
                        <div className="notice">
                          Fresh research reserves budget before calling
                          providers. Failed or uncertain usage can retain the
                          reservation. Cached reports avoid provider calls.
                        </div>
                      </>
                    )}
                    <div className="save-bar">
                      <button
                        className="button primary"
                        disabled={busy || !dirty}
                      >
                        {busy ? (
                          <LoaderCircle size={14} className="spin" />
                        ) : null}
                        Save settings
                      </button>
                      <button
                        className="button"
                        type="button"
                        disabled={busy || !dirty}
                        onClick={() => {
                          setDraft({ ...dashboard.settings });
                          setError("");
                        }}
                      >
                        Cancel changes
                      </button>
                      <p>
                        {dirty ? "Unsaved changes" : "Settings are up to date"}
                      </p>
                    </div>
                  </form>
                ) : null}
                {tab === "guests" ? (
                  <AdminGuests
                    guests={dashboard.usage.guests}
                    defaultLimit={dashboard.settings.guest_daily_limit}
                    busy={busy}
                    onSave={guestChange}
                  />
                ) : null}
              </div>
            </>
          )}
          <footer className="site-footer">
            <span>HorizonScan administration</span>
            <span>
              API keys remain server-side and are never displayed here.
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
