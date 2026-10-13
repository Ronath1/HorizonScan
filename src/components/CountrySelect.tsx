"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function CountrySelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const listId = useId();
  const container = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [active, setActive] = useState(-1);
  const countries = COUNTRIES.filter(
    (country) =>
      normalize(country.name).includes(normalize(filter.trim())) ||
      country.code.toLowerCase() === filter.trim().toLowerCase(),
  );
  const choose = (name: string) => {
    onChange(name);
    setOpen(false);
    setActive(-1);
  };

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !container.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);

  useEffect(() => {
    if (open && active >= 0)
      document
        .getElementById(`${listId}-${active}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, listId, open]);

  return (
    <div
      className="field country-field"
      ref={container}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label htmlFor="country">Country or region</label>
      <div className="input-wrap">
        <Globe2 />
        <input
          ref={input}
          id="country"
          className="input country-input"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && !disabled}
          aria-controls={listId}
          aria-activedescendant={
            open && active >= 0 ? `${listId}-${active}` : undefined
          }
          autoComplete="off"
          value={value}
          maxLength={80}
          required
          disabled={disabled}
          placeholder="Search all countries…"
          onFocus={() => {
            setOpen(true);
            setFilter("");
            setActive(-1);
          }}
          onChange={(event) => {
            onChange(event.target.value);
            setFilter(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              if (!open) {
                setOpen(true);
                setFilter("");
                setActive(event.key === "ArrowDown" ? 0 : COUNTRIES.length - 1);
              } else if (countries.length)
                setActive((index) =>
                  event.key === "ArrowDown"
                    ? (index + 1) % countries.length
                    : index < 0
                      ? countries.length - 1
                      : (index - 1 + countries.length) % countries.length,
                );
            } else if (event.key === "Enter" && open && countries[active]) {
              event.preventDefault();
              choose(countries[active].name);
            } else if (event.key === "Escape" && open) {
              event.preventDefault();
              setOpen(false);
            }
          }}
        />
        <button
          className="country-toggle"
          type="button"
          disabled={disabled}
          aria-label={open ? "Hide countries" : "Show countries"}
          aria-expanded={open && !disabled}
          aria-controls={listId}
          onClick={() => {
            if (open) setOpen(false);
            else {
              input.current?.focus();
              setFilter("");
              setActive(-1);
              setOpen(true);
            }
          }}
        >
          <ChevronDown size={18} />
        </button>
      </div>
      {open && !disabled ? (
        <div className="country-dropdown">
          <p className="country-list-caption" role="status">
            {countries.length}{" "}
            {countries.length === 1
              ? "country or territory"
              : "countries and territories"}
            {filter ? " matching your search" : " · A–Z"}
          </p>
          <div
            role="listbox"
            id={listId}
            aria-label="Countries and territories"
            className="country-options"
          >
            {countries.length ? (
              countries.map((country, index) => (
                <div
                  id={`${listId}-${index}`}
                  key={country.code}
                  role="option"
                  aria-selected={value === country.name}
                  className={`country-option${index === active ? " highlighted" : ""}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(country.name)}
                >
                  <span>{country.name}</span>
                  {value === country.name ? (
                    <Check size={16} aria-hidden="true" />
                  ) : null}
                </div>
              ))
            ) : (
              <p className="country-empty">
                No matching countries. You can still enter a region.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
