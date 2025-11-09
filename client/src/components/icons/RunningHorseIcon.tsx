export function RunningHorseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Horse body */}
      <ellipse cx="10" cy="10" rx="4" ry="3" />
      {/* Horse neck and head */}
      <path d="M13 8c1-1 2-1.5 3-1.5" />
      <path d="M16 6.5c1 0 1.5 0.5 1.5 1.5" />
      {/* Head */}
      <circle cx="17.5" cy="8" r="1" />
      {/* Ears */}
      <path d="M17 7v-1M18 7v-1" />
      {/* Front legs (running) */}
      <path d="M12 13v3" />
      <path d="M14 13v2" />
      {/* Back legs (running) */}
      <path d="M8 13v2" />
      <path d="M6 13v3" />
      {/* Tail */}
      <path d="M6 10c-2 0-3 1-3 2" />
      {/* Mane */}
      <path d="M14 7c0.5-0.5 1-1 1.5-1" />
    </svg>
  );
}

