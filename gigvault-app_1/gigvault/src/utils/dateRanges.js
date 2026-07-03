// Date range helpers for week/month/year queries against the entries table.

export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfWeek(date = new Date()) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function startOfMonth(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfMonth(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfYear(date = new Date()) {
  return new Date(date.getFullYear(), 0, 1);
}

export function endOfYear(date = new Date()) {
  const d = new Date(date.getFullYear(), 11, 31);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function rangeForPeriod(period, date = new Date()) {
  switch (period) {
    case 'M':
      return { start: startOfMonth(date), end: endOfMonth(date) };
    case 'Y':
      return { start: startOfYear(date), end: endOfYear(date) };
    case 'W':
    default:
      return { start: startOfWeek(date), end: endOfWeek(date) };
  }
}

// Splits a week into 7 daily totals (Mon..Sun) from a list of entries.
export function bucketByDay(entries, weekStart) {
  const buckets = new Array(7).fill(0);
  entries.forEach((e) => {
    if (e.type !== 'income') return;
    const d = new Date(e.created_at);
    const dayIndex = Math.floor((d - weekStart) / (1000 * 60 * 60 * 24));
    if (dayIndex >= 0 && dayIndex < 7) {
      buckets[dayIndex] += e.amount;
    }
  });
  return buckets;
}
