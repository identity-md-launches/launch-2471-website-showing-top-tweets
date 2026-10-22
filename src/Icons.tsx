import type { CSSProperties } from "react";

export type IconName =
  | "search"
  | "bookmark"
  | "arrow-up-right"
  | "arrow-down"
  | "arrow-right"
  | "sparkles"
  | "code"
  | "users"
  | "frog"
  | "close"
  | "info"
  | "link"
  | "check"
  | "signal"
  | "chevron-down"
  | "pin";

const paths: Record<Exclude<IconName, "frog">, React.ReactNode> = {
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  bookmark: <path d="M6 4h12v17l-6-4-6 4V4Z" />,
  "arrow-up-right": (
    <>
      <path d="M6 18 18 6M6 6h12v12" />
    </>
  ),
  "arrow-down": <path d="M12 4v16m-6-6 6 6 6-6" />,
  "arrow-right": <path d="M4 12h16m-6-6 6 6-6 6" />,
  sparkles: (
    <>
      <path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Z" />
      <path d="m20 2 .6 1.4L22 4l-1.4.6L20 6l-.6-1.4L18 4l1.4-.6L20 2Z" />
    </>
  ),
  code: (
    <>
      <path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6m1 3c2 .7 3 2 3 4v3" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6m0-10v.01" />
    </>
  ),
  link: (
    <>
      <path
        d="m10 13 4-4m-6 7-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 1 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"
        transform="translate(1 0)"
      />
    </>
  ),
  check: <path d="m5 12 4 4L20 5" />,
  signal: (
    <>
      <path d="M4 20v-4m5 4v-8m5 8V8m5 12V4" />
    </>
  ),
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  pin: (
    <>
      <path d="m8 3 13 13-5 1-4 4-1-5L3 8l5-5Z" />
      <path d="m3 21 5-5" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  if (name === "frog")
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={style}
      >
        <path
          d="M4.7 12.7C2.3 6.9 7 3.4 12 7.8c5-4.4 9.7-.9 7.3 4.9 3.7 4.8-.8 8.3-7.3 8.3S1 17.5 4.7 12.7Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M6 15.8c3.8 2.1 8.2 2.1 12 0"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M8 9v3m8-3v3"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {paths[name]}
    </svg>
  );
}

export function XMark({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l7.9-9L1 2h6.5l5.7 7.1L18.9 2ZM17.8 20h1.8L6.4 3.9H4.5L17.8 20Z" />
    </svg>
  );
}
