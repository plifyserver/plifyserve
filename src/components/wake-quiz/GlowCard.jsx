import { motion } from "framer-motion";

export default function GlowCard({ children, selected, onClick, delay = 0, glowColor = "primary" }) {
  const glowColors = {
    primary: "shadow-primary/25 border-primary/50",
    accent: "shadow-accent/25 border-accent/50",
    purple: "shadow-purple-500/25 border-purple-500/50",
    rose: "shadow-rose-500/25 border-rose-500/50",
  };

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        duration: 0.6, 
        delay: delay * 0.1,
        ease: [0.16, 1, 0.3, 1] 
      }}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`
        w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer
        backdrop-blur-sm relative overflow-hidden group
        ${selected 
          ? `bg-white/90 ${glowColors[glowColor]} shadow-lg border-2` 
          : "bg-white/60 border-border/50 hover:bg-white/80 hover:border-border shadow-sm hover:shadow-md"
        }
      `}
    >
      {selected && (
        <motion.div 
          layoutId="selected-glow"
          className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
      <div className="relative z-10">
        {children}
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.button>
  );
}