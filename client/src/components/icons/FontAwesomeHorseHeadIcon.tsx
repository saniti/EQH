export function FontAwesomeHorseHeadIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Horse head outline */}
      {/* Muzzle/face */}
      <path d="M 48 16 Q 56 16 56 28 Q 56 40 48 40 L 24 40 Q 16 40 16 28 Q 16 16 24 16" />
      
      {/* Ear */}
      <path d="M 44 8 Q 48 4 52 8" />
      
      {/* Eye */}
      <circle cx="50" cy="24" r="2" fill="currentColor" />
      
      {/* Nostril */}
      <circle cx="56" cy="32" r="1.5" fill="currentColor" />
      
      {/* Neck line */}
      <path d="M 24 28 L 12 48" />
      
      {/* Mane */}
      <path d="M 28 12 Q 32 8 36 12" />
    </svg>
  );
}

