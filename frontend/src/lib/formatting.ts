export const money = (n: unknown) =>
  new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 2,
  }).format(Number(n || 0));

export const date = (n: string) =>
  new Date(n).toLocaleDateString("fr-MA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
