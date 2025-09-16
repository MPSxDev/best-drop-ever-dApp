"use client"

export function GradientBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        background:
          "radial-gradient(120% 120% at 0% 0%, hsl(196 100% 83% / 0.6), transparent 60%), radial-gradient(120% 120% at 100% 100%, hsl(193 85% 66% / 0.5), transparent 60%), linear-gradient(180deg, hsl(195 100% 50% / 0.15), hsl(0 0% 0%))",
      }}
    />
  )
}
