import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, MessageCircle, Pencil } from "lucide-react";

function EditableBlock({ children, editMode, onEdit, className = "" }) {
  if (!editMode) return children;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit?.();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit?.();
        }
      }}
      className={`group relative cursor-pointer rounded-2xl outline-none ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 z-[4] rounded-2xl ring-2 ring-transparent transition-shadow group-hover:ring-orange-400/65 group-focus-visible:ring-orange-500" />
      {children}
      <span className="pointer-events-none absolute -top-0.5 right-0 z-[6] flex items-center gap-0.5 rounded-md bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 max-sm:opacity-100">
        <Pencil className="size-3" />
        Editar
      </span>
    </div>
  );
}
const loadingSteps = [
  { label: "Analisando suas respostas", icon: "🔍" },
  { label: "Identificando oportunidades para seu salão", icon: "💡" },
  { label: "Criando seu plano personalizado", icon: "🚀" },
];

function LoadingScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 1.5;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    if (progress > 33 && step === 0) setStep(1);
    if (progress > 66 && step === 1) setStep(2);
  }, [progress, step]);

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden" style={{ background: "linear-gradient(160deg, #ffffff 0%, #fff7ed 50%, #ffedd5 100%)" }}>
      <div className="relative z-10 max-w-sm w-full text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="relative w-28 h-28 mx-auto mb-8"
        >
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fff3eb" strokeWidth="6" />
            <motion.circle
              cx="50" cy="50" r="45" fill="none"
              stroke="url(#ogradient)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={283}
              initial={{ strokeDashoffset: 283 }}
              animate={{ strokeDashoffset: 283 - (283 * progress) / 100 }}
              transition={{ duration: 0.1 }}
              transform="rotate(-90 50 50)"
            />
            <defs>
              <linearGradient id="ogradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#fdba74" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold font-grotesk text-orange-500">{Math.round(progress)}%</span>
          </div>
        </motion.div>

        <div className="space-y-3 mb-6">
          {loadingSteps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: step >= i ? 1 : 0.3, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.2 }}
              className="flex items-center gap-3 justify-center"
            >
              <span className="text-xl">{s.icon}</span>
              <span className={`text-sm font-medium ${step >= i ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {step > i && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle className="w-4 h-4 text-orange-500" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Generate a fixed-ish random number in range (seeded by time bucket so it doesn't flicker)
function pickRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function countryCallingCode(country) {
  switch (country) {
    case "PT":
      return "351";
    case "US":
      return "1";
    case "MX":
      return "52";
    case "AR":
      return "54";
    case "CL":
      return "56";
    case "CO":
      return "57";
    case "BR":
    default:
      return "55";
  }
}

function ResultScreen({ leadData, hero, logoUrl, editMode, onEditSection }) {
  const [crescimento] = useState(() => pickRandom(30, 40));
  const [clientes] = useState(() => pickRandom(15, 30));
  const baseStats = Array.isArray(hero?.resultStats) && hero.resultStats.length === 3
    ? hero.resultStats
    : [
        { icon: "📈", label: "Potencial de crescimento", value: `+${crescimento}%`, barPct: 86 },
        { icon: "👥", label: "Novos clientes estimados/mês", value: `${clientes}+`, barPct: 76 },
        { icon: "⚡", label: "Tempo para primeiros resultados", value: "30 dias", barPct: 66 },
      ];
  const stats = baseStats.map((s, i) => {
    // Mantém dinâmica padrão se o usuário não definir valores
    const value =
      typeof s.value === "string" && s.value.trim().length
        ? s.value
        : i === 0
          ? `+${crescimento}%`
          : i === 1
            ? `${clientes}+`
            : "30 dias";
    const barPct = typeof s.barPct === "number" ? Math.max(0, Math.min(100, Math.round(s.barPct))) : 70;
    return { ...s, value, barPct };
  });

  const cc = countryCallingCode(hero?.whatsappCountry);
  const digits = String(hero?.whatsappNumber ?? "").replace(/\D/g, "");
  const whatsappNumber = `${cc}${digits}`;
  const msg = String(hero?.whatsappMessage ?? "").trim();
  const whatsappMsg = encodeURIComponent(msg.length ? msg : "Olá! Acabei de fazer o quiz e quero saber mais.");
  const whatsappUrl = digits.length >= 8 ? `https://wa.me/${whatsappNumber}?text=${whatsappMsg}` : null;

  const logoImgMaxH = Math.min(280, Math.max(40, Number(hero?.logoImageMaxHeightPx ?? 88) || 88));

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start px-5 py-8 overflow-hidden" style={{ background: "linear-gradient(160deg, #ffffff 0%, #fff7ed 50%, #ffedd5 100%)" }}>
      <div className="relative z-10 max-w-lg w-full">
        {/* Header logo (sem setinha) */}
        <div className="flex items-center justify-center mb-6">
          <EditableBlock editMode={editMode} onEdit={() => onEditSection?.("logo")} className="px-2 py-1 -mx-2">
            <div className="flex flex-col items-center gap-1">
              {logoUrl ? (
                <div className="mx-auto flex w-[min(360px,92vw)] items-center justify-center" style={{ maxHeight: `${logoImgMaxH}px` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt={hero?.logoText ?? "Logo"} className="w-auto max-w-full object-contain" style={{ maxHeight: `${logoImgMaxH}px` }} />
                </div>
              ) : (
                <span className="font-grotesk font-black tracking-tight" style={{ fontSize: "1.1rem", background: "linear-gradient(135deg, #f97316 0%, #fb923c 60%, #fdba74 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {hero?.logoText ?? "SILVA YARIN"}
                </span>
              )}
              {(hero?.tagline ?? "").trim() ? (
                <span className="text-[8px] tracking-widest text-orange-400 uppercase font-semibold">{hero.tagline}</span>
              ) : null}
            </div>
          </EditableBlock>
        </div>
        {/* Celebration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="text-center mb-6"
        >
          <div className="mb-4 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
            <EditableBlock editMode={editMode} onEdit={() => onEditSection?.("result_icon")} className="inline-flex">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 1, delay: 0.2 }}
                className="inline-flex items-center justify-center w-18 h-18 rounded-3xl"
                style={{ background: "linear-gradient(135deg, #f97316, #fb923c)", padding: "20px", borderRadius: "24px", boxShadow: "0 8px 32px rgba(249,115,22,0.35)" }}
              >
              {(hero?.resultTopIcon ?? "✨").trim() ? (
                <span className="text-4xl leading-none" aria-hidden>
                  {hero?.resultTopIcon ?? "✨"}
                </span>
              ) : null}
              </motion.div>
            </EditableBlock>

            <EditableBlock editMode={editMode} onEdit={() => onEditSection?.("result_badge")} className="inline-flex">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border"
                style={{ background: "#fff7ed", color: "#f97316", borderColor: "#fed7aa" }}
              >
                {(hero?.resultBadgeIcon ?? "🎉").trim() ? (
                  <span aria-hidden>{hero?.resultBadgeIcon ?? "🎉"}</span>
                ) : null}
                <span>
                  {(hero?.resultBadgeText ?? "Seu plano está pronto!").replace("{nome}", leadData?.nome?.split(" ")[0] ?? "")}
                </span>
              </motion.div>
            </EditableBlock>
          </div>

          <EditableBlock editMode={editMode} onEdit={() => onEditSection?.("result_title")}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-2xl md:text-3xl font-grotesk font-bold text-foreground mb-2 leading-tight"
          >
            {hero?.resultTitleLine1 ?? "Montamos um plano exclusivo"}
            <br />
            <span style={{
              background: "linear-gradient(135deg, #f97316, #fb923c, #fdba74)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {hero?.resultTitleLine2 ?? "para lotar seu salão 💈"}
            </span>
          </motion.h2>
          </EditableBlock>

          <EditableBlock editMode={editMode} onEdit={() => onEditSection?.("result_title")}>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-muted-foreground text-sm max-w-sm mx-auto"
          >
            {hero?.resultSubtitle ?? "Com base nas suas respostas, vamos elevar o marketing do seu salão e lotar sua agenda com previsibilidade."}
          </motion.p>
          </EditableBlock>
        </motion.div>

        {/* Stats */}
        <EditableBlock editMode={editMode} onEdit={() => onEditSection?.("result_stats")}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid gap-3 mb-6"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={`${stat.label}-${i}`}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.15 }}
                className="flex items-center gap-4 p-4 rounded-2xl border"
                style={{ background: "#fff7ed", borderColor: "#fed7aa" }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                  style={{ background: "rgba(249,115,22,0.1)" }}
                  aria-hidden
                >
                  {(stat.icon ?? "").trim() ? stat.icon : ""}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                  <div className="font-bold font-grotesk text-lg text-foreground">{stat.value}</div>
                </div>
                <div className="w-16 h-2 bg-orange-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.barPct}%` }}
                    transition={{ delay: 1.2 + i * 0.2, duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #f97316, #fdba74)" }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </EditableBlock>

        {/* Message about contact */}
        <EditableBlock editMode={editMode} onEdit={() => onEditSection?.("result_contact")}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="p-4 rounded-2xl border mb-6 text-center"
          style={{ background: "#fff7ed", borderColor: "#fed7aa" }}
        >
          <p className="text-sm font-semibold text-foreground mb-1">
            {hero?.resultContactTitle ?? "📞 Em breve entraremos em contato!"}
          </p>
          <p className="text-xs text-muted-foreground">
            {hero?.resultContactBody ?? "Nossa equipe vai entrar em contato com você em até 24h para marcar nossa reunião gratuita de diagnóstico."}
          </p>
        </motion.div>
        </EditableBlock>

        {/* WhatsApp CTA */}
        <EditableBlock editMode={editMode} onEdit={() => onEditSection?.("result_whatsapp")}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mb-4"
        >
          {whatsappUrl ? (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-shadow duration-300 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "white",
                  boxShadow: "0 6px 24px rgba(34,197,94,0.3)",
                }}
              >
                <MessageCircle className="w-5 h-5" />
                <span>{hero?.whatsappButtonLabel ?? "Falar no WhatsApp Agora"}</span>
              </motion.div>
            </a>
          ) : (
            <div className="w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 border border-orange-200 bg-white text-orange-700">
              Defina seu WhatsApp no editor
            </div>
          )}
          <EditableBlock editMode={editMode} onEdit={() => onEditSection?.("result_footer")}>
            <p className="text-center text-xs text-muted-foreground mt-2">
              {hero?.resultAfterWhatsappText ?? "Ou aguarde — entraremos em contato em até 24h para marcar sua reunião 📅"}
            </p>
          </EditableBlock>
        </motion.div>
        </EditableBlock>

        <EditableBlock editMode={editMode} onEdit={() => onEditSection?.("result_footer")}>
          <p className="text-center text-xs text-muted-foreground pb-6">
            {hero?.resultFooterSmallText ?? "🔒 Seus dados estão seguros"}
          </p>
        </EditableBlock>
      </div>
    </div>
  );
}

export default function QuizResult({ leadData, hero, logoUrl, editMode, onEditSection }) {
  const [showResult, setShowResult] = useState(false);

  if (!showResult) {
    return <LoadingScreen onComplete={() => setShowResult(true)} />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="result"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <ResultScreen leadData={leadData} hero={hero} logoUrl={logoUrl} editMode={editMode} onEditSection={onEditSection} />
      </motion.div>
    </AnimatePresence>
  );
}