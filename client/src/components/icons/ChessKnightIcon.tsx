import React from 'react';

interface ChessKnightIconProps {
  className?: string;
  size?: number;
}

export const ChessKnightIcon: React.FC<ChessKnightIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Knight head */}
      <path d="M8 8c0-1.5 1-3 2-3.5.5-.5 1.5-1 2-1s1.5.5 2 1c1 .5 2 2 2 3.5" />
      {/* Knight neck */}
      <path d="M12 4.5v2" />
      {/* Knight body */}
      <path d="M10 6.5h4" />
      <path d="M9 7c-1 .5-2 1.5-2 2.5v2" />
      <path d="M15 7c1 .5 2 1.5 2 2.5v2" />
      {/* Knight base */}
      <path d="M8 11.5h8" />
      <path d="M7 12v2" />
      <path d="M17 12v2" />
      <path d="M7 14h10" />
      {/* Knight stand */}
      <path d="M9 14v3" />
      <path d="M15 14v3" />
      <path d="M8 17h8" />
    </svg>
  );
};

export default ChessKnightIcon;

