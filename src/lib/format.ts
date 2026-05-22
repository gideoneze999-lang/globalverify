export const formatNGN = (n: number | string | null | undefined) =>
  `₦${Number(n ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
