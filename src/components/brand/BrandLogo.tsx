import Image from 'next/image';

/**
 * Brand logo for Pradip's Homoe.
 *
 * Uses the official approved logo (single source of truth: /public/logo.png).
 * Responsive heights per spec:
 *   - Desktop: 60px
 *   - Tablet:  54px
 *   - Mobile:  46px
 * Width is auto (preserves aspect ratio). Never stretches/crops.
 *
 * Usage:
 *   <BrandLogo />                     // default responsive
 *   <BrandLogo size={80} />           // fixed size
 *   <BrandLogo variant="light" />     // for dark backgrounds
 *   <BrandLogo showText />            // with brand name next to logo
 */

type BrandLogoProps = {
  /** Optional fixed height in px. If omitted, uses responsive defaults. */
  size?: number;
  /** Show on dark background (default works on light) */
  variant?: 'default' | 'light';
  /** Show the brand name text next to the logo */
  showText?: boolean;
  /** Optional className for wrapper */
  className?: string;
  /** Priority loading (for above-the-fold logos) */
  priority?: boolean;
};

export function BrandLogo({
  size,
  variant = 'default',
  showText = false,
  className = '',
  priority = false,
}: BrandLogoProps) {
  // Responsive classes: 46px on mobile, 54px on tablet, 60px on desktop
  const heightClass = size ? '' : 'h-[46px] sm:h-[54px] md:h-[60px]';
  const style = size ? { height: `${size}px`, width: 'auto' } : undefined;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.png"
        alt="Pradip's Homoe logo"
        width={size ?? 60}
        height={size ?? 60}
        priority={priority}
        className={`${heightClass} w-auto object-contain`}
        style={style}
      />
      {showText && (
        <span
          className={`font-serif italic tracking-wide ${
            variant === 'light' ? 'text-amber-200' : 'text-emerald-900'
          }`}
        >
          Pradip&apos;s Homoe
        </span>
      )}
    </span>
  );
}

/**
 * Compact logo for tight spaces (e.g., mobile nav).
 */
export function BrandLogoCompact({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Pradip's Homoe"
      width={40}
      height={40}
      className={`h-[40px] w-auto object-contain ${className}`}
    />
  );
}
