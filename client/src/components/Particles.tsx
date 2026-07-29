import { useMemo } from 'react'

export default function Particles() {
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 15}s`,
      duration: `${8 + Math.random() * 12}s`,
      size: `${1 + Math.random() * 3}px`,
      color: ['#00f5ff', '#ff2d95', '#b537f2', '#4d7cff'][Math.floor(Math.random() * 4)],
    })), [])

  return (
    <div className="particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 6px ${p.color}`,
          }}
        />
      ))}
    </div>
  )
}
