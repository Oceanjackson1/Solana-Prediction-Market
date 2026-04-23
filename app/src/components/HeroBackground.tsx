// Ambient full-section hero background. Replaces HeroNebula (which
// was constrained to a grid column and failed to render visibly).
// Three drifting aurora blobs (PS blue / PS cyan / violet) + a
// subtle grid + radial dot texture. All CSS-composited, no image
// assets. Keep it under-the-content — z-0 absolute inset-0.

export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Deep base — keeps pure black where blobs don't reach */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0a0d12_0%,_#000_85%)]" />

      {/* Grid lines — radial-masked so they fade at edges */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      {/* Aurora blob 1 — PS blue, drifts top-left */}
      <div
        className="absolute w-[820px] h-[820px] rounded-full blur-3xl animate-blob-1"
        style={{
          top: "-12%",
          left: "-8%",
          background:
            "radial-gradient(circle, rgba(0,112,204,0.75), rgba(0,112,204,0.25) 40%, transparent 70%)",
        }}
      />

      {/* Aurora blob 2 — PS cyan, drifts right */}
      <div
        className="absolute w-[720px] h-[720px] rounded-full blur-3xl animate-blob-2"
        style={{
          top: "12%",
          right: "-10%",
          background:
            "radial-gradient(circle, rgba(30,174,219,0.70), rgba(30,174,219,0.22) 45%, transparent 72%)",
        }}
      />

      {/* Aurora blob 3 — violet accent, drifts bottom */}
      <div
        className="absolute w-[900px] h-[900px] rounded-full blur-3xl animate-blob-3"
        style={{
          bottom: "-22%",
          left: "20%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.55), rgba(139,92,246,0.18) 45%, transparent 72%)",
        }}
      />

      {/* Aurora blob 4 — extra cyan bloom behind featured card area */}
      <div
        className="absolute w-[520px] h-[520px] rounded-full blur-3xl animate-blob-2"
        style={{
          top: "30%",
          right: "8%",
          background:
            "radial-gradient(circle, rgba(83,177,255,0.45), transparent 65%)",
          animationDelay: "-8s",
        }}
      />

      {/* Halftone dot pattern — adds texture over blobs */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1.2px)",
          backgroundSize: "22px 22px",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 10%, transparent 70%)",
          maskImage:
            "radial-gradient(ellipse at center, black 10%, transparent 70%)",
        }}
      />

      {/* SVG grain — organic fractal noise */}
      <svg
        className="absolute inset-0 h-full w-full mix-blend-overlay opacity-30"
        aria-hidden
      >
        <filter id="hero-grain-v2" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed="7"
          />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-grain-v2)" />
      </svg>

      {/* Bottom fade to black so content below reads clean */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-black" />
    </div>
  );
}
