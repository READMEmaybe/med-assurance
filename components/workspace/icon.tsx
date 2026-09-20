export function Icon({
  name,
  size = 18,
}: {
  name:
    | "home"
    | "claims"
    | "tasks"
    | "search"
    | "arrow"
    | "close"
    | "check"
    | "file"
    | "clock"
    | "chevron"
    | "logout";
  size?: number;
}) {
  const paths = {
    home: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
    claims:
      "M8 4H5a2 2 0 0 0-2 2v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6a2 2 0 0 0-2-2h-3M8 3h8v4H8zM7 12h10M7 16h6",
    tasks: "m4 6 2 2 4-4m-6 9 2 2 4-4m-6 9 2 2 4-4M14 6h6M14 13h6M14 20h6",
    search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    arrow: "M5 12h14m-5-5 5 5-5 5",
    close: "m6 6 12 12M6 18 18 6",
    check: "m5 12 4 4L19 6",
    file: "M14 2H5v20h14V7zM14 2v6h5M8 13h8M8 17h6",
    clock: "M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
    chevron: "m9 5 7 7-7 7",
    logout: "M9 3H4v18h5m5-14 5 5-5 5M8 12h13",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
