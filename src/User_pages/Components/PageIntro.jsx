import React from 'react'

function PageIntro({ eyebrow, title, subtitle, stats = [] }) {
  const visibleStats = Array.isArray(stats) ? stats.filter((item) => item?.label && item?.value) : []

  return (
    <section className="mb-8 rounded-[2rem] border border-[#e3d1b4] bg-gradient-to-br from-[#fff7ec] via-[#fffaf4] to-[#f7ecee] px-5 py-8 shadow-[0_24px_60px_-48px_rgba(58,21,29,0.75)] sm:mb-10 sm:px-8 sm:py-10">
      {eyebrow ? <p className="mb-3 text-kicker">{eyebrow}</p> : null}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h1 className="font-bodoni text-3xl font-medium tracking-[0.04em] text-ink sm:text-4xl md:text-5xl">{title}</h1>
          {subtitle ? (
            <p className="text-helper mt-4 max-w-2xl sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>

        {visibleStats.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visibleStats.map((item) => (
              <div
                key={`${item.label}-${item.value}`}
                className="min-w-[9rem] rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-left backdrop-blur"
              >
                <p className="text-kicker">{item.label}</p>
                <p className="mt-2 text-stat">{item.value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default PageIntro
