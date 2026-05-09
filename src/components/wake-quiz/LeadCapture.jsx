import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";

const captureSteps = [
  {
    key: "nome",
    title: "Qual é o seu nome?",
    subtitle: "Como podemos te chamar?",
    placeholder: "Digite seu nome e sobrenome...",
    label: "Nome e Sobrenome",
    type: "text",
  },
  {
    key: "whatsapp",
    title: "WhatsApp com DDD",
    subtitle: "Exemplo: 11 99999-0000",
    placeholder: "Digite seu WhatsApp com DDD...",
    label: "WhatsApp",
    type: "tel",
  },
  {
    key: "email",
    title: "Seu melhor e-mail",
    subtitle: "Vamos enviar seu plano por aqui",
    placeholder: "seuemail@exemplo.com",
    label: "E-mail",
    type: "email",
  },
];

export default function LeadCapture({ onComplete, onBack }) {
  const [captureStep, setCaptureStep] = useState(0);
  const [data, setData] = useState({ nome: "", whatsapp: "", email: "" });

  const current = captureSteps[captureStep];
  const value = data[current.key] ?? "";
  const isValid = value.trim().length >= 3;

  const handleNext = () => {
    if (!isValid) return;
    if (captureStep < captureSteps.length - 1) {
      setCaptureStep((p) => p + 1);
    } else {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (captureStep > 0) {
      setCaptureStep((p) => p - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col px-5 py-6 overflow-hidden" style={{ background: "linear-gradient(160deg, #ffffff 0%, #fff7ed 50%, #ffedd5 100%)" }}>


      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <motion.button
            onClick={handleBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl bg-white border border-orange-100 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>

          <div className="flex flex-col items-center">
            <span
              className="font-grotesk font-black tracking-tight"
              style={{
                fontSize: "1.1rem",
                background: "linear-gradient(135deg, #f97316 0%, #fb923c 60%, #fdba74 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              SILVA YARIN
            </span>
            <span className="text-[8px] tracking-widest text-orange-400 uppercase font-semibold">Wake</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {captureSteps.map((_, i) => (
            <div
              key={i}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === captureStep ? "24px" : "8px",
                background: i <= captureStep ? "#f97316" : "#e5e7eb",
              }}
            />
          ))}
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={captureStep}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-2xl font-grotesk font-bold text-foreground mb-1">
                {current.title}
              </h2>
              <p className="text-muted-foreground text-sm mb-6">{current.subtitle}</p>

              <div className="space-y-2 mb-6">
                <label className="text-xs font-medium text-muted-foreground">{current.label}</label>
                <input
                  type={current.type}
                  value={value}
                  onChange={(e) => setData((prev) => ({ ...prev, [current.key]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  placeholder={current.placeholder}
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-xl border-2 text-sm outline-none transition-all duration-200 bg-white"
                  style={{
                    borderColor: value.trim().length > 0 ? "#f97316" : "#e5e7eb",
                    boxShadow: value.trim().length > 0 ? "0 0 0 3px rgba(249,115,22,0.1)" : "none",
                  }}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.button
          onClick={handleNext}
          disabled={!isValid}
          whileHover={isValid ? { scale: 1.02, y: -1 } : {}}
          whileTap={isValid ? { scale: 0.98 } : {}}
          className="w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300 mb-4"
          style={{
            background: isValid ? "linear-gradient(135deg, #f97316, #fb923c)" : "#e5e7eb",
            color: isValid ? "white" : "#9ca3af",
            boxShadow: isValid ? "0 6px 24px rgba(249,115,22,0.3)" : "none",
            cursor: isValid ? "pointer" : "not-allowed",
          }}
        >
          <span>Continuar</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>

        <p className="text-center text-xs text-muted-foreground">
          🔒 Seus dados estão seguros e protegidos
        </p>
      </div>
    </div>
  );
}