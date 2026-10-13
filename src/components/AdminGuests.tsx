"use client";
import { useState } from "react";
import { Search } from "lucide-react";

export type AdminGuest = {
  id: string;
  usage: Record<string, number>;
  override: { daily_limit?: number; blocked?: boolean };
};
export type GuestChange = { daily_limit: number | null; blocked: boolean };

function GuestRow({
  guest,
  defaultLimit,
  busy,
  onSave,
}: {
  guest: AdminGuest;
  defaultLimit: number;
  busy: boolean;
  onSave: (id: string, change: GuestChange) => Promise<void>;
}) {
  const [limit, setLimit] = useState(
    String(guest.override.daily_limit ?? defaultLimit),
  );
  const [blocked, setBlocked] = useState(Boolean(guest.override.blocked));
  const [useDefault, setUseDefault] = useState(
    guest.override.daily_limit === undefined,
  );
  const [error, setError] = useState("");
  const changed =
    blocked !== Boolean(guest.override.blocked) ||
    useDefault !== (guest.override.daily_limit === undefined) ||
    (!useDefault && Number(limit) !== guest.override.daily_limit);
  const reset = () => {
    setLimit(String(guest.override.daily_limit ?? defaultLimit));
    setBlocked(Boolean(guest.override.blocked));
    setUseDefault(guest.override.daily_limit === undefined);
    setError("");
  };
  return (
    <form
      className="guest-row"
      aria-label={`Allowance for guest ${guest.id}`}
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        try {
          await onSave(guest.id, {
            daily_limit: useDefault ? null : Number(limit),
            blocked,
          });
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "The guest could not be updated.",
          );
        }
      }}
    >
      <div className="guest-row-top">
        <div>
          <code>{guest.id}</code>
          <p className="muted" style={{ fontSize: 14, marginTop: 5 }}>
            {guest.usage.scans || 0} scans today · Estimated Gemini cost $
            {Number(guest.usage.actual_usd || 0).toFixed(4)}
          </p>
        </div>
        <span className={`badge ${guest.override.blocked ? "risk" : ""}`}>
          {guest.override.blocked ? "Blocked" : "Active guest"}
        </span>
      </div>
      <div className="guest-row-actions">
        <label className="field">
          Daily scan limit
          <input
            className="input"
            type="number"
            min={0}
            max={100}
            step={1}
            value={useDefault ? defaultLimit : limit}
            disabled={busy || useDefault}
            required
            onChange={(event) => setLimit(event.target.value)}
          />
        </label>
        <button
          className="button primary"
          type="submit"
          disabled={busy || !changed}
        >
          Save guest
        </button>
        <button
          className="button"
          type="button"
          disabled={busy || !changed}
          onClick={reset}
        >
          Cancel
        </button>
      </div>
      <div
        style={{ display: "flex", gap: 22, flexWrap: "wrap", marginTop: 16 }}
      >
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={useDefault}
            disabled={busy}
            onChange={(event) => setUseDefault(event.target.checked)}
          />
          Use default allowance ({defaultLimit})
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={blocked}
            disabled={busy}
            onChange={(event) => setBlocked(event.target.checked)}
          />
          Block new scans
        </label>
      </div>
      {error ? (
        <p role="alert" className="notice error" style={{ marginTop: 15 }}>
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function AdminGuests({
  guests,
  defaultLimit,
  busy,
  onSave,
}: {
  guests: AdminGuest[];
  defaultLimit: number;
  busy: boolean;
  onSave: (id: string, change: GuestChange) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const filtered = guests.filter((guest) =>
    guest.id.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <section className="panel admin-section">
      <h2>Guest allowances</h2>
      <p>
        Guests are identified by browser cookies, rather than verified accounts.
        Limits reset at midnight UTC; network and sitewide limits still apply.
      </p>
      <div className="input-wrap" style={{ marginTop: 20 }}>
        <Search />
        <input
          className="input"
          aria-label="Search guest IDs"
          placeholder="Search by guest ID…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="guest-list">
        {filtered.length ? (
          filtered.map((guest) => (
            <GuestRow
              key={`${guest.id}-${guest.override.daily_limit}-${guest.override.blocked}-${defaultLimit}`}
              guest={guest}
              defaultLimit={defaultLimit}
              busy={busy}
              onSave={onSave}
            />
          ))
        ) : (
          <div className="empty-state">
            <h3>
              {guests.length ? "No matching guests" : "No guest scans yet"}
            </h3>
            <p>
              {guests.length
                ? "Try another guest ID."
                : "Recent guests will appear here after they scan a market."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
