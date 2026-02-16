'use client'

export function LoginBackground() {
  const bars = [
    { h: '20%', delay: 0, dur: 2.5 },
    { h: '45%', delay: 0.3, dur: 2.2 },
    { h: '65%', delay: 0.6, dur: 2.8 },
    { h: '35%', delay: 0.1, dur: 2.4 },
    { h: '80%', delay: 0.4, dur: 2.1 },
    { h: '55%', delay: 0.7, dur: 2.6 },
    { h: '40%', delay: 0.2, dur: 2.3 },
    { h: '70%', delay: 0.5, dur: 2.7 },
    { h: '30%', delay: 0.8, dur: 2.0 },
    { h: '50%', delay: 0.15, dur: 2.5 },
  ]

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Gradiente de fundo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(86,130,3,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(86,130,3,0.04),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_20%_60%,rgba(86,130,3,0.05),transparent_50%)]" />

      {/* Barras animadas - linha inferior */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-around items-end gap-1 px-8 pb-4 h-32 opacity-[0.12]">
        {bars.map((b, i) => (
          <div
            key={i}
            className="w-3 rounded-t-sm bg-avocado animate-bar-up"
            style={{
              height: b.h,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.dur}s`,
            }}
          />
        ))}
      </div>

      {/* Segunda linha de barras - mais alta, atrás */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-around items-end gap-2 px-16 pb-8 h-40 opacity-[0.06]">
        {[35, 60, 45, 75, 50, 65, 40, 55, 70, 48].map((h, i) => (
          <div
            key={i}
            className="w-4 rounded-t bg-avocado-light animate-bar-up"
            style={{
              height: `${h}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${2 + (i % 3) * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Mini gráfico de linhas - canto superior direito */}
      <svg className="absolute top-20 right-10 w-48 h-24 opacity-[0.08]" viewBox="0 0 120 60">
        <polyline
          fill="none"
          stroke="#568203"
          strokeWidth="1.5"
          points="0,50 20,45 40,35 60,40 80,25 100,30 120,15"
        />
        <polyline
          fill="none"
          stroke="#6b9e0a"
          strokeWidth="1"
          strokeDasharray="3 3"
          points="0,55 20,50 40,48 60,45 80,42 100,38 120,35"
        />
      </svg>

      {/* Mini gráfico - canto inferior esquerdo */}
      <svg className="absolute bottom-32 left-10 w-40 h-20 opacity-[0.07]" viewBox="0 0 100 50">
        <polyline
          fill="none"
          stroke="#568203"
          strokeWidth="1.5"
          points="0,40 15,38 30,30 45,25 60,20 75,15 90,10"
        />
      </svg>

      {/* Área preenchida decorativa */}
      <svg className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-64 opacity-[0.04]" preserveAspectRatio="none">
        <defs>
          <linearGradient id="loginGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#568203" stopOpacity="0" />
            <stop offset="50%" stopColor="#568203" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#568203" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,150 Q200,100 400,120 T800,80 T1200,100 T1600,90 L1600,200 L0,200 Z"
          fill="url(#loginGrad)"
          className="animate-wave"
        />
      </svg>
    </div>
  )
}
