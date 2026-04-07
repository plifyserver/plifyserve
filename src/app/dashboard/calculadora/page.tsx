'use client'

import { useEffect, useMemo, useState } from 'react'
import { Percent, Divide, X as Times, Minus, Plus, Equal, Delete, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { SITE_CONTAINER_LG } from '@/lib/siteLayout'

type Mode = 'basica' | 'juros' | 'parcelas'
type InterestMode = 'simples' | 'composto'

function clampNumber(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function safeNumber(v: string) {
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function formatBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatPct(n: number) {
  return `${n.toLocaleString('pt-BR', { maximumFractionDigits: 6 })}%`
}

function computePMT(pv: number, ratePerPeriod: number, periods: number) {
  if (periods <= 0) return 0
  if (Math.abs(ratePerPeriod) < 1e-12) return pv / periods
  const r = ratePerPeriod
  return (pv * r) / (1 - Math.pow(1 + r, -periods))
}

function tryEvalExpression(expr: string) {
  const cleaned = expr
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
  if (!cleaned) return null
  if (!/^[0-9+\-*/().%]+$/.test(cleaned)) return null
  // % como percent: "100+10%" -> "100+0.10"
  const percentReplaced = cleaned.replace(/(\d+(\.\d+)?)%/g, (_, a) => String(Number(a) / 100))
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${percentReplaced});`)
    const out = fn()
    return typeof out === 'number' && Number.isFinite(out) ? out : null
  } catch {
    return null
  }
}

function Key({
  label,
  onClick,
  className,
}: {
  label: React.ReactNode
  onClick: () => void
  className?: string
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        'h-12 rounded-2xl border border-white/10 bg-white/5 text-slate-100 shadow-none hover:bg-white/10 hover:border-white/15 active:scale-[0.99]',
        className
      )}
      onClick={onClick}
    >
      {label}
    </Button>
  )
}

export default function CalculadoraPage() {
  const [mode, setMode] = useState<Mode>('basica')

  // Básica
  const [expr, setExpr] = useState('0')
  const [result, setResult] = useState<number | null>(0)
  const [history, setHistory] = useState<{ expr: string; result: number }[]>([])

  // Juros
  const [interestMode, setInterestMode] = useState<InterestMode>('composto')
  const [principal, setPrincipal] = useState('1000')
  const [ratePct, setRatePct] = useState('2') // % ao mês
  const [periods, setPeriods] = useState('12')
  const [contribution, setContribution] = useState('0') // aporte mensal

  // Parcelas / Financiamento
  const [pv, setPv] = useState('10000')
  const [rateFinPct, setRateFinPct] = useState('2.5') // % ao mês
  const [nper, setNper] = useState('24')

  const basicDisplay = useMemo(() => expr || '0', [expr])

  useEffect(() => {
    const out = tryEvalExpression(expr)
    setResult(out)
  }, [expr])

  const pushHistory = (e: string, r: number) => {
    setHistory((prev) => [{ expr: e, result: r }, ...prev].slice(0, 8))
  }

  const basic = {
    append: (s: string) => {
      setExpr((prev) => {
        const p = prev === '0' && /[0-9.]/.test(s) ? '' : prev
        return (p + s).slice(0, 64)
      })
    },
    op: (s: string) => {
      setExpr((prev) => (prev + s).slice(0, 64))
    },
    backspace: () => {
      setExpr((prev) => {
        const next = prev.length <= 1 ? '0' : prev.slice(0, -1)
        return next
      })
    },
    clear: () => {
      setExpr('0')
      setResult(0)
    },
    equals: () => {
      const out = tryEvalExpression(expr)
      if (out == null) return
      pushHistory(expr, out)
      setExpr(String(out))
    },
  }

  const juros = useMemo(() => {
    const P = safeNumber(principal)
    const r = safeNumber(ratePct) / 100
    const t = Math.max(0, Math.floor(safeNumber(periods)))
    const aporte = Math.max(0, safeNumber(contribution))

    if (t === 0) {
      return {
        montante: P,
        juros: 0,
        totalAportes: P,
        efetivo: 0,
      }
    }

    if (interestMode === 'simples') {
      const montante = P * (1 + r * t) + aporte * t
      const totalAportes = P + aporte * t
      const jurosTotal = montante - totalAportes
      const efetivo = totalAportes > 0 ? (jurosTotal / totalAportes) * 100 : 0
      return { montante, juros: jurosTotal, totalAportes, efetivo }
    }

    // Composto + aportes: FV = P(1+r)^t + aporte * [((1+r)^t - 1)/r]
    const pow = Math.pow(1 + r, t)
    const montante = P * pow + (Math.abs(r) < 1e-12 ? aporte * t : aporte * ((pow - 1) / r))
    const totalAportes = P + aporte * t
    const jurosTotal = montante - totalAportes
    const efetivo = totalAportes > 0 ? (jurosTotal / totalAportes) * 100 : 0
    return { montante, juros: jurosTotal, totalAportes, efetivo }
  }, [principal, ratePct, periods, contribution, interestMode])

  const parcelas = useMemo(() => {
    const PV = Math.max(0, safeNumber(pv))
    const r = safeNumber(rateFinPct) / 100
    const N = clampNumber(Math.floor(safeNumber(nper)), 1, 600)
    const pmt = computePMT(PV, r, N)
    const total = pmt * N
    const jurosTotal = total - PV
    return { pmt, total, jurosTotal, N, PV, r }
  }, [pv, rateFinPct, nper])

  const buildAmort = () => {
    const rows: { i: number; payment: number; interest: number; principal: number; balance: number }[] = []
    let balance = parcelas.PV
    const pmt = parcelas.pmt
    for (let i = 1; i <= parcelas.N; i++) {
      const interest = balance * parcelas.r
      const principalPaid = pmt - interest
      balance = Math.max(0, balance - principalPaid)
      rows.push({ i, payment: pmt, interest, principal: principalPaid, balance })
      if (rows.length >= 24) break // resumo (primeiras 24)
    }
    return rows
  }

  const amort = useMemo(() => buildAmort(), [parcelas])

  return (
    <div className="min-h-screen w-full max-w-full min-w-0 bg-transparent">
      <div className={cn(SITE_CONTAINER_LG, 'py-6 w-full min-w-0')}>
        <div className="rounded-2xl border border-white/10 bg-[#121212] shadow-sm overflow-hidden max-w-full min-w-0">
          <div className="relative border-b border-white/10 bg-[radial-gradient(900px_380px_at_20%_20%,rgba(59,130,246,.26),transparent_55%),radial-gradient(800px_340px_at_90%_10%,rgba(16,185,129,.16),transparent_60%),linear-gradient(180deg,#161616,#0f0f10)] px-4 py-5 sm:px-6 sm:py-6">
            <div className="absolute inset-0 opacity-[0.10] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,.9)_1px,transparent_0)] [background-size:18px_18px]" />
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Calculadora</h1>
                <p className="text-sm text-slate-300">
                  Básica, juros e simulação de parcelas — rápida para decisões no dia a dia.
                </p>
              </div>

              <div className="flex w-full min-w-0 gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 shadow-sm sm:w-auto sm:shrink-0">
                <button
                  type="button"
                  onClick={() => setMode('basica')}
                  className={cn(
                    'min-w-0 flex-1 px-2 py-2 text-center text-xs font-semibold leading-tight rounded-xl transition-colors sm:flex-none sm:px-4 sm:text-sm sm:rounded-2xl',
                    mode === 'basica'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-200 hover:bg-white/10'
                  )}
                >
                  Básica
                </button>
                <button
                  type="button"
                  onClick={() => setMode('juros')}
                  className={cn(
                    'min-w-0 flex-1 px-2 py-2 text-center text-xs font-semibold leading-tight rounded-xl transition-colors sm:flex-none sm:px-4 sm:text-sm sm:rounded-2xl',
                    mode === 'juros'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-200 hover:bg-white/10'
                  )}
                >
                  Juros
                </button>
                <button
                  type="button"
                  onClick={() => setMode('parcelas')}
                  className={cn(
                    'min-w-0 flex-1 px-2 py-2 text-center text-xs font-semibold leading-tight rounded-xl transition-colors sm:flex-none sm:px-4 sm:text-sm sm:rounded-2xl',
                    mode === 'parcelas'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-200 hover:bg-white/10'
                  )}
                >
                  Parcelas
                </button>
              </div>
            </div>
          </div>

          {mode === 'basica' && (
            <div className="px-4 py-6 sm:px-6 sm:py-7 grid gap-5 w-full min-w-0 max-w-full lg:grid-cols-[1.1fr_.9fr]">
              <Card className="rounded-2xl border border-white/10 bg-white/5 shadow-none">
                <CardContent className="p-5">
                  <div className="space-y-4">
                    <div className="mt-3 rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 px-4 pt-7 pb-4">
                      <p className="text-xs font-medium text-slate-400">Expressão</p>
                      <input
                        value={basicDisplay}
                        onChange={(e) => setExpr(e.target.value)}
                        className="mt-1 w-full bg-transparent text-2xl font-semibold tracking-tight text-slate-50 outline-none"
                        inputMode="decimal"
                      />
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-400">
                          Aceita:{' '}
                          <span className="font-medium text-slate-200">+ − × ÷ ( )</span> e{' '}
                          <span className="font-medium text-slate-200">%</span>
                        </p>
                        <div className="flex items-baseline justify-between sm:justify-end gap-3">
                          <p className="text-xs text-slate-400">Resultado</p>
                          <p className="text-lg font-black text-slate-50">
                            {result == null ? '—' : result.toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <Key
                        label={<RefreshCw className="h-4 w-4" />}
                        onClick={basic.clear}
                        className="bg-white/5"
                      />
                      <Key label="(" onClick={() => basic.append('(')} />
                      <Key label=")" onClick={() => basic.append(')')} />
                      <Key label={<Delete className="h-4 w-4" />} onClick={basic.backspace} />

                      <Key label="7" onClick={() => basic.append('7')} />
                      <Key label="8" onClick={() => basic.append('8')} />
                      <Key label="9" onClick={() => basic.append('9')} />
                      <Key label={<Divide className="h-4 w-4" />} onClick={() => basic.op('÷')} />

                      <Key label="4" onClick={() => basic.append('4')} />
                      <Key label="5" onClick={() => basic.append('5')} />
                      <Key label="6" onClick={() => basic.append('6')} />
                      <Key label={<Times className="h-4 w-4" />} onClick={() => basic.op('×')} />

                      <Key label="1" onClick={() => basic.append('1')} />
                      <Key label="2" onClick={() => basic.append('2')} />
                      <Key label="3" onClick={() => basic.append('3')} />
                      <Key label={<Minus className="h-4 w-4" />} onClick={() => basic.op('-')} />

                      <Key label="0" onClick={() => basic.append('0')} className="col-span-2" />
                      <Key label="," onClick={() => basic.append(',')} />
                      <Key label={<Plus className="h-4 w-4" />} onClick={() => basic.op('+')} />

                      <Key label={<Percent className="h-4 w-4" />} onClick={() => basic.append('%')} />
                      <Key label="." onClick={() => basic.append('.')} />
                      <Key
                        label={
                          <>
                            <Equal className="h-4 w-4" /> Calcular
                          </>
                        }
                        onClick={basic.equals}
                        className="col-span-2 bg-gradient-to-b from-emerald-300 to-emerald-500 text-black hover:from-emerald-200 hover:to-emerald-400 border-emerald-300/60 font-bold shadow-[0_12px_26px_rgba(16,185,129,.22)]"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-white/10 bg-white/5 shadow-none">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 pt-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-50">Histórico</p>
                      <p className="text-xs text-slate-400">Últimos cálculos (até 8)</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                      onClick={() => setHistory([])}
                      disabled={history.length === 0}
                    >
                      Limpar
                    </Button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {history.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                        Faça um cálculo para ele aparecer aqui.
                      </div>
                    ) : (
                      history.map((h, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setExpr(h.expr)}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10 transition-colors shadow-none"
                        >
                          <p className="text-xs text-slate-400">{h.expr}</p>
                          <p className="text-sm font-semibold text-slate-50">
                            {h.result.toLocaleString('pt-BR')}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {mode === 'juros' && (
            <div className="px-4 py-5 sm:px-6 sm:py-6 grid gap-4 w-full min-w-0 max-w-full lg:grid-cols-[.95fr_1.05fr] [color-scheme:light] dark:[color-scheme:dark]">
              <Card className="rounded-2xl border-slate-200 bg-white text-slate-900 shadow-[0_12px_34px_rgba(15,23,42,.08)] min-w-0 dark:border-slate-800/80 dark:bg-slate-900/60 dark:text-slate-50 dark:shadow-none">
                <CardContent className="px-4 pt-6 pb-5 sm:px-5 sm:pt-7 space-y-4">
                  <div className="inline-flex w-full rounded-2xl border border-slate-200/70 bg-slate-50/60 p-1 text-slate-900 dark:border-slate-800/80 dark:bg-slate-900/30 dark:text-slate-50">
                    <Button
                      type="button"
                      variant={interestMode === 'composto' ? 'default' : 'outline'}
                      className={cn(
                        'min-w-0 flex-1 rounded-2xl text-xs sm:text-sm',
                        interestMode === 'composto'
                          ? ''
                          : 'border-slate-200/70 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-800'
                      )}
                      onClick={() => setInterestMode('composto')}
                    >
                      Juros compostos
                    </Button>
                    <Button
                      type="button"
                      variant={interestMode === 'simples' ? 'default' : 'outline'}
                      className={cn(
                        'min-w-0 flex-1 rounded-2xl text-xs sm:text-sm',
                        interestMode === 'simples'
                          ? ''
                          : 'border-slate-200/70 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-800'
                      )}
                      onClick={() => setInterestMode('simples')}
                    >
                      Juros simples
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-200">Valor inicial (R$)</label>
                      <Input className="rounded-xl border-slate-200" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-200">Taxa (% ao mês)</label>
                      <Input className="rounded-xl border-slate-200" value={ratePct} onChange={(e) => setRatePct(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-200">Períodos (meses)</label>
                      <Input className="rounded-xl border-slate-200" value={periods} onChange={(e) => setPeriods(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-200">Aporte mensal (R$)</label>
                      <Input className="rounded-xl border-slate-200" value={contribution} onChange={(e) => setContribution(e.target.value)} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-slate-50 to-white p-4 dark:border-slate-800/80 dark:from-slate-900/40 dark:to-slate-900/20">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Dica</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                      Use aporte mensal para simular investimento/caixa recorrente. A taxa é <strong>ao mês</strong>.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 bg-white text-slate-900 shadow-[0_12px_34px_rgba(15,23,42,.08)] min-w-0 dark:border-slate-800/80 dark:bg-slate-900/60 dark:text-slate-50 dark:shadow-none">
                <CardContent className="px-4 pt-6 pb-5 sm:px-5 sm:pt-7 min-w-0">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,.06)] dark:border-slate-800/80 dark:bg-slate-900/40 dark:shadow-none">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Montante final</p>
                      <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-50">{formatBRL(juros.montante)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,.06)] dark:border-slate-800/80 dark:bg-slate-900/40 dark:shadow-none">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Juros ganhos</p>
                      <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-50">{formatBRL(juros.juros)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,.06)] dark:border-slate-800/80 dark:bg-slate-900/40 dark:shadow-none">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Total aportado</p>
                      <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-50">{formatBRL(juros.totalAportes)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,.06)] dark:border-slate-800/80 dark:bg-slate-900/40 dark:shadow-none">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Rentabilidade (sobre aportes)</p>
                      <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-50">{formatPct(juros.efetivo)}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900/40">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Resumo</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                      <li>
                        <strong>Modelo</strong>: {interestMode === 'composto' ? 'Composto' : 'Simples'}
                      </li>
                      <li>
                        <strong>Taxa</strong>: {formatPct(safeNumber(ratePct))} ao mês
                      </li>
                      <li>
                        <strong>Períodos</strong>: {Math.max(0, Math.floor(safeNumber(periods)))} mês(es)
                      </li>
                      <li>
                        <strong>Aporte</strong>: {formatBRL(Math.max(0, safeNumber(contribution)))} / mês
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {mode === 'parcelas' && (
            <div className="px-4 py-5 sm:px-6 sm:py-6 grid gap-4 w-full min-w-0 max-w-full lg:grid-cols-[.95fr_1.05fr] [color-scheme:light] dark:[color-scheme:dark]">
              <Card className="rounded-2xl border-slate-200 bg-white text-slate-900 shadow-[0_12px_34px_rgba(15,23,42,.08)] min-w-0 dark:border-slate-800/80 dark:bg-slate-900/60 dark:text-slate-50 dark:shadow-none">
                <CardContent className="px-4 pt-6 pb-5 sm:px-5 sm:pt-7 space-y-4 min-w-0">
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-200">Valor financiado (R$)</label>
                      <Input className="rounded-xl border-slate-200" value={pv} onChange={(e) => setPv(e.target.value)} />
                    </div>
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-200">Taxa (% ao mês)</label>
                      <Input className="rounded-xl border-slate-200" value={rateFinPct} onChange={(e) => setRateFinPct(e.target.value)} />
                    </div>
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-200">Nº de parcelas</label>
                      <Input className="rounded-xl border-slate-200" value={nper} onChange={(e) => setNper(e.target.value)} />
                    </div>
                    <div className="flex items-end gap-2 sm:col-span-2 min-w-0">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-100 dark:hover:bg-slate-900"
                        onClick={() => {
                          setPv('10000')
                          setRateFinPct('2.5')
                          setNper('24')
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Exemplo
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-slate-50 to-white p-4 dark:border-slate-800/80 dark:from-slate-900/40 dark:to-slate-900/20">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Observação</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                      Cálculo padrão de prestação fixa (PMT). Serve para simular financiamento, parcelamento e
                      antecipar “quanto dá por mês”.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 bg-white text-slate-900 shadow-[0_12px_34px_rgba(15,23,42,.08)] min-w-0 dark:border-slate-800/80 dark:bg-slate-900/60 dark:text-slate-50 dark:shadow-none">
                <CardContent className="px-4 pt-6 pb-5 sm:px-5 sm:pt-7 min-w-0 overflow-x-hidden">
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,.06)] dark:border-slate-800/80 dark:bg-slate-900/40 dark:shadow-none">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Parcela estimada</p>
                      <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-50">{formatBRL(parcelas.pmt)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,.06)] dark:border-slate-800/80 dark:bg-slate-900/40 dark:shadow-none">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Total pago</p>
                      <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-50">{formatBRL(parcelas.total)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,.06)] dark:border-slate-800/80 dark:bg-slate-900/40 dark:shadow-none">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Juros totais</p>
                      <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-50">{formatBRL(parcelas.jurosTotal)}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-900/40">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Amortização (resumo)</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Primeiras {amort.length} parcelas</p>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatPct(safeNumber(rateFinPct))}/m · {Math.floor(safeNumber(nper))}x
                      </p>
                    </div>
                    <div className="mt-3 -mx-1 min-w-0 overflow-x-auto overscroll-x-contain sm:mx-0">
                      <table className="w-full min-w-[260px] text-xs sm:text-sm table-fixed">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-200/70 sm:text-xs sm:normal-case sm:tracking-normal dark:text-slate-400 dark:border-slate-800/80">
                            <th className="text-left font-medium py-2 pr-1 w-[8%] sm:pr-3">#</th>
                            <th className="text-right font-medium py-2 px-1 w-[22%] sm:px-3">Parcela</th>
                            <th className="text-right font-medium py-2 px-1 w-[22%] sm:px-3">Juros</th>
                            <th className="text-right font-medium py-2 px-1 w-[22%] sm:px-3">Amort.</th>
                            <th className="text-right font-medium py-2 pl-1 w-[26%] sm:pl-3">Saldo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/70">
                          {amort.map((r) => (
                            <tr key={r.i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                              <td className="py-1.5 pr-1 text-slate-600 tabular-nums sm:py-2 sm:pr-3 dark:text-slate-300">{r.i}</td>
                              <td className="py-1.5 px-1 text-right font-medium tabular-nums text-slate-900 sm:py-2 sm:px-3 dark:text-slate-50">{formatBRL(r.payment)}</td>
                              <td className="py-1.5 px-1 text-right tabular-nums text-slate-700 sm:py-2 sm:px-3 dark:text-slate-200">{formatBRL(r.interest)}</td>
                              <td className="py-1.5 px-1 text-right tabular-nums text-slate-700 sm:py-2 sm:px-3 dark:text-slate-200">{formatBRL(r.principal)}</td>
                              <td className="py-1.5 pl-1 text-right tabular-nums text-slate-700 sm:py-2 sm:pl-3 dark:text-slate-200">{formatBRL(r.balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

