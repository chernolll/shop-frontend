const DAY_END_OFFSET = 24 * 60 * 60 * 1000 - 1;

export function toOptionalNumber(value: unknown) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  const result = Number(value);
  return Number.isFinite(result) ? result : undefined;
}

export function resolveDateRange(value: unknown): {
  end?: number;
  start?: number;
} {
  if (!Array.isArray(value)) {
    return {};
  }

  const start = toOptionalNumber(value[0]);
  const endBase = toOptionalNumber(value[1]);

  return {
    end: endBase === undefined ? undefined : endBase + DAY_END_OFFSET,
    start,
  };
}
