"use client";

import { useMemo, useState } from "react";
import { computeOffer, formatISK, type DestinationModel } from "@/lib/innies";

type Preset = DestinationModel & { key: string };

function NumberField({
  label,
  value,
  onChange,
  suffix,
  step = 1000,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={Number.isFinite(value) ? Math.round(value) : 0}
          min={min}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        {suffix && <span className="whitespace-nowrap text-xs text-neutral-400">{suffix}</span>}
      </div>
    </label>
  );
}

export function PricingCalculator({ presets }: { presets: Preset[] }) {
  const [activeKey, setActiveKey] = useState(presets[0]?.key ?? "custom");
  const active = presets.find((p) => p.key === activeKey);

  const [flight, setFlight] = useState(Math.round(presets[0]?.flightPerPax ?? 85000));
  const [hotel, setHotel] = useState(Math.round(presets[0]?.hotelPerPax ?? 42000));
  const [service, setService] = useState(Math.round(presets[0]?.servicePerPax ?? 19000));
  const [groupSize, setGroupSize] = useState(40);
  const [freeSeats, setFreeSeats] = useState(1);
  const [margin, setMargin] = useState(25);

  function applyPreset(key: string) {
    setActiveKey(key);
    const p = presets.find((x) => x.key === key);
    if (p) {
      setFlight(Math.round(p.flightPerPax));
      setHotel(Math.round(p.hotelPerPax));
      setService(Math.round(p.servicePerPax));
    }
  }

  const result = useMemo(
    () =>
      computeOffer({
        flightPerPax: flight,
        hotelPerPax: hotel,
        servicePerPax: service,
        groupSize,
        freeSeats,
        targetMarginPct: margin,
      }),
    [flight, hotel, service, groupSize, freeSeats, margin],
  );

  // rounded, sellable price (up to nearest 500 kr)
  const suggested = Math.ceil(result.offerPerPax / 500) * 500;
  const vsHistory = active ? suggested - active.pricePerPax : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
            Destination (loads historical cost basis)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeKey === p.key
                    ? "bg-violet-600 text-white"
                    : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                }`}
              >
                {p.destination}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Flight / person" value={flight} onChange={setFlight} suffix="kr" />
          <NumberField label="Hotel / person" value={hotel} onChange={setHotel} suffix="kr" />
          <NumberField label="Agency service fee / person" value={service} onChange={setService} suffix="kr" step={500} />
          <NumberField label="Group size (paying)" value={groupSize} onChange={setGroupSize} suffix="people" step={1} min={1} />
          <NumberField label="Free tour-leader seats" value={freeSeats} onChange={setFreeSeats} suffix="seats" step={1} />
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Target margin ({margin}% of price)
            </span>
            <input
              type="range"
              min={0}
              max={40}
              step={1}
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
              className="mt-2 w-full accent-violet-600"
            />
          </label>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Recommended offer to the school
          </p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
            {formatISK(suggested)}
            <span className="ml-1 text-sm font-normal text-neutral-500">/ person</span>
          </p>
          {vsHistory !== null && (
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {vsHistory >= 0 ? "+" : ""}
              {formatISK(vsHistory)} vs. historical average for {active?.destination}
            </p>
          )}
        </div>

        <dl className="space-y-1.5 border-t border-neutral-200 pt-3 text-sm dark:border-neutral-800">
          <Row label="Direct cost / person" value={formatISK(result.costPerPax)} />
          <Row
            label={`Free-seat recovery (${freeSeats} ÷ ${groupSize})`}
            value={formatISK(result.freeSeatRecoveryPerPax)}
          />
          <Row label="Break-even / person" value={formatISK(result.breakEvenPerPax)} strong />
          <Row label="Margin / person" value={formatISK(suggested - result.breakEvenPerPax)} accent />
        </dl>

        <dl className="space-y-1.5 border-t border-neutral-200 pt-3 text-sm dark:border-neutral-800">
          <Row label={`Total revenue (${groupSize} pax)`} value={formatISK(suggested * groupSize)} strong />
          <Row label="Total direct cost" value={formatISK(result.breakEvenPerPax * groupSize)} />
          <Row
            label="Total margin (profit)"
            value={formatISK(suggested * groupSize - result.breakEvenPerPax * groupSize)}
            accent
          />
        </dl>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          Break-even spreads {freeSeats} free tour-leader seat{freeSeats === 1 ? "" : "s"} (flight + hotel)
          across the paying group. Price rounded up to the nearest 500 kr.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  accent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd
        className={`tabular-nums ${
          accent
            ? "font-semibold text-emerald-600 dark:text-emerald-400"
            : strong
              ? "font-semibold text-neutral-900 dark:text-neutral-100"
              : "text-neutral-700 dark:text-neutral-300"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
