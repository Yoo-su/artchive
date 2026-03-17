import { SVGProps } from "react";

export function DachshundIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Librarian Dachshund"
      {...props}
    >
      {/* Background Circle */}
      <circle cx="50" cy="50" r="48" fill="#eef2ff" />

      {/* Body */}
      <path
        d="M20 70C20 70 25 55 45 55H65C75 55 80 65 80 70V80H20V70Z"
        fill="#8B4513"
      />

      {/* Head */}
      <path
        d="M45 35C45 25 55 20 65 20C75 20 80 28 80 35C80 45 70 50 60 50"
        fill="#8B4513"
      />

      {/* Ears */}
      <path d="M60 22C55 22 50 28 50 40C50 48 55 50 58 50" fill="#654321" />

      {/* Librarian Vest */}
      <path d="M30 65H70V80H30V65Z" fill="#4F46E5" />
      <rect
        x="35"
        y="65"
        width="30"
        height="15"
        rx="2"
        fill="#4338ca"
        opacity="0.8"
      />

      {/* Glasses */}
      <circle
        cx="62"
        cy="32"
        r="6"
        stroke="#1f2937"
        strokeWidth="2"
        fill="white"
        fillOpacity="0.5"
      />
      <circle
        cx="74"
        cy="32"
        r="6"
        stroke="#1f2937"
        strokeWidth="2"
        fill="white"
        fillOpacity="0.5"
      />
      <line x1="68" y1="32" x2="68" y2="32" stroke="#1f2937" strokeWidth="2" />

      {/* Snout */}
      <circle cx="78" cy="38" r="3" fill="#1f2937" />
    </svg>
  );
}
