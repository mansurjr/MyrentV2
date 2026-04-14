const normalizeStallSortValue = (value: string | null | undefined) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

export const sortByStallNumberAsc = (
  a: string | null | undefined,
  b: string | null | undefined,
) => {
  const left = normalizeStallSortValue(a);
  const right = normalizeStallSortValue(b);

  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  });
};
