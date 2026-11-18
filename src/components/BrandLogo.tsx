import React, { useState } from 'react';
import { Package } from 'lucide-react';

export function BrandCrest({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect x="2" y="2" width="36" height="36" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M11 29V11L22 25V11M22 25L29 11V29"
        stroke="#C8A252"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

interface LuxuryImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function LuxuryImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackTitle,
}: LuxuryImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="w-full h-full bg-gradient-to-br from-[#141416] via-[#1C1C1F] to-[#09090B] flex flex-col items-center justify-center p-6 text-center border border-white/10"
      >
        <Package className="w-7 h-7 text-[#C8A252] mb-2" strokeWidth={1.5} />
        <span className="font-display text-base text-white tracking-wide">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
