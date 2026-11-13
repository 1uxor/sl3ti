const styles = {
  base: "inline-block rounded-full text-[10px] capitalize font-extrabold px-2.5 py-1 whitespace-nowrap",
  positive: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  neutral: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export function Badge({ value }: { value: string }) {
  const variant = /OUT|ISSUE|overdue|retard|maintenance/i.test(value)
    ? "warning"
    : /RECEIPT|IN|available|active|returned/i.test(value)
      ? "positive"
      : "neutral";
  return (
    <span className={`${styles.base} ${styles[variant]}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
