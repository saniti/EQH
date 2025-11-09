export function FontAwesomeHorseIcon({ className = "w-6 h-6" }: { className?: string }) {
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
      {/* Horse body - full side view */}
      {/* Head */}
      <path d="M 48 12 Q 56 12 56 20 Q 56 28 48 28 L 32 28" />
      
      {/* Ear */}
      <path d="M 44 8 Q 48 4 52 8" />
      
      {/* Eye */}
      <circle cx="52" cy="18" r="2" fill="currentColor" />
      
      {/* Neck */}
      <path d="M 32 28 L 24 36" />
      
      {/* Body */}
      <path d="M 24 36 Q 20 40 16 40 L 8 40" />
      
      {/* Front legs */}
      <path d="M 20 40 L 20 56" />
      <path d="M 16 40 L 16 56" />
      
      {/* Back legs */}
      <path d="M 12 40 L 12 56" />
      <path d="M 8 40 L 8 56" />
      
      {/* Tail */}
      <path d="M 8 40 Q 4 44 4 52" />
      
      {/* Mane */}
      <path d="M 28 24 Q 32 18 36 24" />
    </svg>
  );
}

