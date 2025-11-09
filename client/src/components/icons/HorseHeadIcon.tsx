export function HorseHeadIcon(props: React.SVGProps<SVGSVGElement>) {
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
      {/* Horse head profile */}
      <path d="M6 8h4v2h-1v4h1v2H8v2H6v-2H5v-4H4V8h2z" />
      {/* Muzzle */}
      <path d="M4 10h-1v2h1" />
      {/* Ears */}
      <path d="M7 6v2M9 6v2" />
      {/* Mane */}
      <path d="M10 7c1-1 2-1 2-1" />
      {/* Eye */}
      <circle cx="6.5" cy="9" r="0.5" fill="currentColor" />
      {/* Nostril */}
      <circle cx="3.5" cy="10.5" r="0.3" fill="currentColor" />
    </svg>
  );
}

