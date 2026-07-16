"use client";

import { useMemo, useSyncExternalStore } from "react";

interface LocalDateTimeProps {
  value: Date | number;
  dateOnly?: boolean;
}

const subscribeToHydration = () => () => {};

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};
const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DATE_OPTIONS,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};
const LOCAL_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", DATE_OPTIONS);
const LOCAL_DATE_TIME_FORMATTER = new Intl.DateTimeFormat(
  "en-US",
  DATE_TIME_OPTIONS,
);
const UTC_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  ...DATE_OPTIONS,
  timeZone: "UTC",
});
const UTC_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  ...DATE_TIME_OPTIONS,
  timeZone: "UTC",
});

function formatDate(value: Date, dateOnly: boolean, timeZone?: string): string {
  if (timeZone === "UTC") {
    return (dateOnly ? UTC_DATE_FORMATTER : UTC_DATE_TIME_FORMATTER).format(
      value,
    );
  }
  return (dateOnly ? LOCAL_DATE_FORMATTER : LOCAL_DATE_TIME_FORMATTER).format(
    value,
  );
}

/**
 * Renders a deterministic UTC value during SSR, then switches to the user's
 * local timezone after hydration.
 */
export function LocalDateTime({ value, dateOnly = false }: LocalDateTimeProps) {
  const timestamp = value instanceof Date ? value.getTime() : value;
  const date = useMemo(() => new Date(timestamp), [timestamp]);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const formatted = formatDate(date, dateOnly, hydrated ? undefined : "UTC");

  return <time dateTime={date.toISOString()}>{formatted}</time>;
}
