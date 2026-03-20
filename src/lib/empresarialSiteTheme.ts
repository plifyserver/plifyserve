import type { CSSProperties } from 'react'
import type { EmpresarialSiteMode } from '@/types/empresarialProposal'

/** Mesma base do login (`tailwind neutral-100`) */
export const EMPRESARIAL_LIGHT_BG = '#f5f5f5'

export function getEmpresarialSiteVisual(siteMode: EmpresarialSiteMode) {
  const L = siteMode === 'light'

  const dotGridDark: CSSProperties = {
    backgroundColor: '#000000',
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
    backgroundSize: '28px 28px',
  }

  const dotGridLight: CSSProperties = {
    backgroundColor: EMPRESARIAL_LIGHT_BG,
    backgroundImage: 'radial-gradient(circle, rgba(15,23,42,0.07) 1px, transparent 1px)',
    backgroundSize: '28px 28px',
  }

  return {
    siteMode,
    isLight: L,

    p1: {
      shell: L ? 'relative text-slate-900' : 'relative text-white',
      header: L
        ? 'sticky top-0 z-50 flex items-center justify-end border-b border-slate-200/90 bg-white/92 px-4 py-4 backdrop-blur-md md:px-10 md:py-5'
        : 'sticky top-0 z-50 flex items-center justify-end border-b border-white/10 bg-black/80 px-4 py-4 backdrop-blur-md md:px-10 md:py-5',
      logoText: L
        ? 'text-center text-lg font-semibold uppercase tracking-wide text-slate-900 md:text-xl'
        : 'text-center text-lg font-semibold uppercase tracking-wide text-white md:text-xl',
      contactBtn: L
        ? 'relative z-10 shrink-0 rounded-full border border-slate-300 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-800 transition-colors hover:bg-slate-100 md:px-4 md:text-xs'
        : 'relative z-10 shrink-0 rounded-full border border-white/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10 md:px-4 md:text-xs',
      heroSection: L ? dotGridLight : dotGridDark,
      sobreNosBtn: L
        ? 'rounded-full bg-slate-900 px-10 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90 md:px-14 md:py-3.5 md:text-base'
        : 'rounded-full bg-white px-10 py-3 text-sm font-semibold uppercase tracking-wide text-black transition-opacity hover:opacity-90 md:px-14 md:py-3.5 md:text-base',
      bottomNav: L
        ? 'grid grid-cols-5 border-t border-slate-200/90 bg-white/95 backdrop-blur-sm'
        : 'grid grid-cols-5 border-t border-white/10 bg-zinc-900/90 backdrop-blur-sm',
      bottomNavCell: L ? 'border-slate-200/80' : 'border-white/10',
      bottomNavIcon: L ? 'text-slate-700' : 'text-white/90',
      bottomNavLabel: L ? 'text-slate-600' : 'text-white/85',
    },

    proposalBand: L
      ? 'border-t border-slate-200/80 bg-neutral-100 text-slate-900'
      : 'border-t border-white/10 bg-black text-white',
    proposalBandBorder: L ? 'border-slate-200/90' : 'border-white/10',
    proposalBandMutedText: L ? 'text-slate-600' : 'text-white/70',
    proposalFooterText: L ? 'text-slate-500' : 'text-white/55',

    p2: {
      section: L
        ? 'relative border-t border-slate-200 bg-neutral-100 text-slate-900'
        : 'relative border-t border-white/10 bg-zinc-950 text-white',
      bridgeWrap: L
        ? { background: 'linear-gradient(180deg, #f5f5f5 0%, #efefef 50%, #e8e8e8 100%)' }
        : { background: 'linear-gradient(180deg, #000000 0%, #09090b 45%, #09090b 100%)' },
      bridgeLine: L ? 'from-transparent via-slate-400/35 to-slate-500/45' : 'from-transparent via-white/30 to-white/50',
      bridgeHint: L ? 'text-slate-500/90' : 'text-white/40',
      bridgeArrow: L ? 'text-slate-500' : 'text-white/50',
      eyebrowText: L ? 'text-slate-800' : 'text-white/90',
      headline: L ? 'text-slate-900' : 'text-white',
      card: L
        ? 'overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-900/5'
        : 'overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 shadow-xl shadow-black/40 backdrop-blur-sm',
      cardMediaBg: L ? 'bg-slate-100' : 'bg-zinc-800/80',
      cardPlaceholder: L ? 'text-slate-400' : 'text-white/35',
      cardPlaceholderIcon: L ? 'text-slate-600' : 'text-white',
      cardTitle: L ? 'text-slate-900' : 'text-white',
      cardDesc: L ? 'text-slate-600' : 'text-zinc-400',
    },

    p3: {
      section: L ? 'relative border-t border-slate-200 bg-neutral-100 text-slate-900' : 'relative border-t border-white/10 bg-black text-white',
      bridgeWrap: L
        ? { background: 'linear-gradient(180deg, #e8e8e8 0%, #f0f0f0 50%, #f5f5f5 100%)' }
        : { background: 'linear-gradient(180deg, #09090b 0%, #000000 50%, #000000 100%)' },
      bridgeLine: L ? 'from-slate-400/30 via-slate-400/15 to-transparent' : 'from-white/40 via-white/20 to-transparent',
      bridgeHint: L ? 'text-slate-500/90' : 'text-white/35',
      bridgeArrow: L ? 'text-slate-500' : 'text-white/45',
      phraseTitle: L ? 'text-slate-900' : 'text-white',
      emptyHint: L ? 'text-slate-500' : 'text-white/50',
      emptyStrong: L ? 'text-slate-700' : 'text-white/70',
      planArticle: L
        ? 'group border border-slate-200/90 bg-white shadow-lg shadow-slate-900/5'
        : 'group border border-white/10 bg-zinc-950/80 shadow-2xl shadow-black/50',
      planHeader: L
        ? 'border-b border-slate-200/90 text-slate-600'
        : 'border-b border-white/10 text-white/60',
      planMediaBg: L ? 'bg-slate-100' : 'bg-zinc-900',
      planDesc: L ? 'text-slate-600' : 'text-zinc-400',
      planBenefit: L ? 'text-slate-700' : 'text-zinc-300',
      planBenefitsBorder: L ? 'border-slate-200/80' : 'border-white/5',
      investBorder: L ? 'border-slate-200/90' : 'border-white/10',
      investLabel: L ? 'text-slate-500' : 'text-white/40',
      price: L ? 'text-slate-900' : 'text-white',
      priceSuffix: L ? 'text-slate-500' : 'text-zinc-500',
    },

    p31: {
      section: L
        ? 'relative overflow-hidden border-t border-slate-200 bg-neutral-100 text-slate-900'
        : 'relative overflow-hidden border-t border-white/10 bg-black text-white',
      dotGrid: L
        ? ({
            backgroundColor: EMPRESARIAL_LIGHT_BG,
            backgroundImage: 'radial-gradient(circle, rgba(15,23,42,0.07) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          } satisfies CSSProperties)
        : ({
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          } satisfies CSSProperties),
      statsBorder: L ? 'border-slate-200/90' : 'border-white/10',
      statValue: L ? 'text-slate-900' : 'text-white',
      statLabel: L ? 'text-slate-600' : 'text-white/55',
      testimonialBtn: L
        ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 md:h-12 md:w-12'
        : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-white/40 hover:bg-white/5 md:h-12 md:w-12',
      quote: L ? 'text-slate-800' : 'text-white/90',
      author: L ? 'text-slate-600' : 'text-white/60',
      counter: L ? 'text-slate-400' : 'text-white/40',
      counterLine: L ? 'bg-slate-300/80' : 'bg-white/20',
      marqueeBar: L ? 'border-t border-slate-200 bg-white' : 'border-t border-white/10 bg-zinc-950',
      marqueeStroke: L ? '1px rgba(15,23,42,0.12)' : '1px rgba(255,255,255,0.12)',
    },

    p4: {
      section: L ? 'relative flex min-h-[min(100dvh,920px)] flex-col bg-neutral-100 text-slate-900' : 'relative flex min-h-[min(100dvh,920px)] flex-col bg-black text-white',
      overlayStrong: L
        ? 'bg-gradient-to-r from-white/95 via-white/88 to-white/78'
        : 'bg-gradient-to-r from-black/88 via-black/72 to-black/55',
      overlaySoft: L ? 'bg-gradient-to-t from-white/90 via-transparent to-white/55' : 'bg-gradient-to-t from-black/70 via-transparent to-black/40',
      fallbackBg: L ? 'bg-gradient-to-br from-neutral-100 via-neutral-200/80 to-slate-200/90' : 'bg-gradient-to-br from-zinc-900 via-black to-zinc-950',
      backBtn: L
        ? 'mb-8 w-fit text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 underline-offset-4 transition-colors hover:text-slate-900 hover:underline md:mb-10'
        : 'mb-8 w-fit text-left text-xs font-semibold uppercase tracking-[0.2em] text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline md:mb-10',
      headline: L ? 'text-slate-900' : 'text-white',
      gridLine: L ? 'bg-slate-300/90' : 'bg-white/18',
      cell: L ? 'bg-white/95 backdrop-blur-sm' : 'bg-black/75 backdrop-blur-sm',
      index: L ? 'text-slate-400' : 'text-white/35',
      iconRing: L ? 'border-slate-200 bg-white' : 'border-white/25 bg-white/5',
      iconClass: L ? 'text-slate-800' : 'text-white/90',
      quadTitle: L ? 'text-slate-900' : 'text-white',
      quadSub: L ? 'text-slate-600' : 'text-white/65',
      marqueeBar: L ? 'border-t border-slate-200/80' : '',
    },

    p5: {
      section: L ? 'flex min-h-[min(100dvh,880px)] flex-col bg-neutral-100 text-slate-900' : 'flex min-h-[min(100dvh,880px)] flex-col bg-[#121212] text-white',
      topBar: L ? 'border-b border-slate-200/90' : 'border-b border-white/10',
      backBtn: L
        ? 'text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 underline-offset-4 transition-colors hover:text-slate-900 hover:underline'
        : 'text-left text-xs font-semibold uppercase tracking-[0.2em] text-white/50 underline-offset-4 transition-colors hover:text-white hover:underline',
      logoFallback: L ? 'text-slate-900' : 'text-white',
      tagline: L ? 'text-slate-600' : 'text-white/65',
      colTitle: L ? 'text-slate-900' : 'text-white',
      contactLink: L ? 'text-slate-800 hover:text-slate-950' : 'text-white/90 hover:text-white',
      contactIcon: L ? 'text-slate-400 group-hover:text-slate-600' : 'text-white/40 group-hover:text-white/70',
      empty: L ? 'text-slate-400' : 'text-white/40',
      addressIcon: L ? 'text-slate-400' : 'text-white/35',
      addressText: L ? 'text-slate-600' : 'text-white/70',
      socialLink: L ? 'text-slate-800 hover:text-slate-950' : 'text-white/85 hover:text-white',
      socialIcon: L ? 'text-slate-500 group-hover:text-slate-800' : 'text-white/45 group-hover:text-white/80',
      bottomBar: L ? 'border-t border-slate-200/90 bg-white/60' : 'border-t border-white/10 bg-black/40',
      copyright: L ? 'text-slate-500' : 'text-white/45',
      topBtn: L
        ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900'
        : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-white/40 hover:bg-white/5 hover:text-white',
      brandBorder: L ? 'border-slate-200/90' : 'border-white/10',
    },
  }
}
