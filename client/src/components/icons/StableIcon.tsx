export function StableIcon(props: React.SVGProps<SVGSVGElement>) {
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
      {/* Barn roof */}
      <path d="M4 10l8-6 8 6" />
      {/* Main barn structure */}
      <rect x="4" y="10" width="16" height="10" />
      {/* Door */}
      <rect x="9" y="12" width="6" height="8" />
      {/* Door handle */}
      <circle cx="14.5" cy="16" r="0.3" fill="currentColor" />
      {/* Windows */}
      <rect x="5" y="12" width="2.5" height="2.5" />
      <rect x="16.5" y="12" width="2.5" height="2.5" />
      {/* Roof peak detail */}
      <path d="M12 4v6" />
      {/* Stalls divider */}
      <line x1="12" y1="10" x2="12" y2="20" />
    </svg>
  );
}

