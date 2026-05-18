import React from 'react'

export default function GestivaLogo({ className = "w-10 h-10", ...props }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id="gestiva-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="55%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
      </defs>
      
      {/* Outer open loop representing the G curve with rounded edges */}
      <path 
        d="M 52 24 C 36 24, 25 36, 25 52 C 25 68, 36 80, 52 80 C 62 80, 70 73, 73 64 C 74 61, 71 58, 68 58 C 65 58, 63 60, 62 62 C 60 67, 56 70, 52 70 C 42 70, 36 62, 36 52 C 36 42, 42 34, 52 34 C 55 34, 58 35, 60 37"
        fill="url(#gestiva-gradient)"
      />

      {/* Diagonal growth arrow flowing smoothly up-right */}
      <path 
        d="M 33 58 C 39 52, 49 43, 62 30" 
        stroke="url(#gestiva-gradient)" 
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />

      {/* Clean integrated arrow head at the top right */}
      <path 
        d="M 50 20 L 72 20 L 72 42" 
        stroke="url(#gestiva-gradient)" 
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />

      {/* Small internal hook loop completing the G's center curve */}
      <path 
        d="M 46 64 C 56 64, 62 58, 62 50" 
        stroke="url(#gestiva-gradient)" 
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  )
}
