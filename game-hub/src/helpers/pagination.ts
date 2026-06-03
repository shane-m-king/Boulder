// Parses and clamps pagination params from a URL's searchParams.
// Falls back to sane defaults on missing / invalid / out-of-range values,
// and caps limit to avoid whole-collection dumps.
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;

export const getPagination = (searchParams: URLSearchParams) => {
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const rawLimit = parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};
