import React from 'react';

interface LogoProps {
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ size = 26 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <rect width="32" height="32" rx="7" fill="#141518" stroke="#2e3038" strokeWidth="1.5" />
      <path
        d="M9 11L14 16L9 21"
        stroke="#f0f0f3"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 21H23"
        stroke="#8d9099"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="21" cy="11" r="2" fill="#818cf8" />
    </svg>
  );
};
