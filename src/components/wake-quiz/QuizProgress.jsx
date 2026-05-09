import { motion } from "framer-motion";

export default function QuizProgress({ current, total }) {
  const progress = ((current + 1) / total) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">
          Pergunta {current + 1} de {total}
        </span>
        <span className="text-xs font-semibold text-orange-500">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-2 bg-orange-50 rounded-full overflow-hidden border border-orange-100">
        <motion.div
          className="h-full w-full origin-left rounded-full"
          style={{
            background: "linear-gradient(90deg, #f97316, #fb923c, #fdba74)",
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress / 100 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}