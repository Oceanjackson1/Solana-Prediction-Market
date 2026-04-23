// Signature hero visual — 5-layer composite built entirely from CSS
// gradients and inline SVG. No image assets, all GPU-composited.
// PlayStation blue core + cyan halo + halftone dots + organic grain
// + slow-breathing cyan ring.

export function HeroNebula() {
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      aria-hidden
    >
      {/* Layer 1 — PS blue core glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 55% 50%, rgba(0,112,204,0.55), rgba(30,174,219,0.25) 30%, transparent 62%)",
        }}
      />

      {/* Layer 2 — cyan halo offset, screen blend for luminance */}
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          background:
            "radial-gradient(circle at 38% 68%, rgba(30,174,219,0.38), transparent 48%)",
        }}
      />

      {/* Layer 3 — halftone dot pattern with radial mask */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.14) 1.2px, transparent 1.2px)",
          backgroundSize: "7px 7px",
          WebkitMaskImage:
            "radial-gradient(circle at 50% 50%, black 0%, transparent 72%)",
          maskImage:
            "radial-gradient(circle at 50% 50%, black 0%, transparent 72%)",
        }}
      />

      {/* Layer 4 — organic turbulence (feTurbulence → cyan tint) */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen opacity-40"
        aria-hidden
      >
        <filter id="hero-grain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            seed="3"
          />
          <feColorMatrix
            values="0 0 0 0 0.12
                    0 0 0 0 0.68
                    0 0 0 0 0.86
                    0 0 0 0.55 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-grain)" />
      </svg>

      {/* Layer 5 — slow breathing ring */}
      <div
        className="absolute inset-[16%] rounded-full border border-[color:var(--ps-cyan)]/25 animate-pulse-slow"
        style={{ willChange: "transform, opacity" }}
      />
      <div
        className="absolute inset-[30%] rounded-full border border-white/8"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      />
    </div>
  );
}
