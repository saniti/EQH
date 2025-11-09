export function StableIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 34 32"
      fill="currentColor"
      className={className}
    >
      {/* Barn/Stable structure - dark navy blue */}
      <g fill="currentColor">
        {/* Roof - triangular */}
        <path d="M17 2 L2 14 L32 14 Z" />
        
        {/* Main building body */}
        <rect x="2" y="14" width="30" height="16" />
        
        {/* Left door opening */}
        <rect x="4" y="16" width="7" height="12" fill="white" opacity="0.15" />
        
        {/* Right door opening */}
        <rect x="23" y="16" width="7" height="12" fill="white" opacity="0.15" />
        
        {/* Left window */}
        <circle cx="12" cy="20" r="2" fill="white" opacity="0.25" />
        
        {/* Right window */}
        <circle cx="22" cy="20" r="2" fill="white" opacity="0.25" />
        
        {/* Door divider line */}
        <line x1="17" y1="16" x2="17" y2="28" stroke="white" strokeWidth="0.8" opacity="0.3" />
      </g>
    </svg>
  );
}

