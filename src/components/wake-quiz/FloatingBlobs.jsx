import { motion } from "framer-motion";

const blobConfigs = [
  { color: "from-primary/20 to-purple-400/20", size: "w-72 h-72", position: "top-[-5%] left-[-10%]", delay: 0 },
  { color: "from-accent/20 to-emerald-400/20", size: "w-96 h-96", position: "top-[30%] right-[-15%]", delay: 2 },
  { color: "from-pink-400/15 to-rose-400/15", size: "w-80 h-80", position: "bottom-[-10%] left-[20%]", delay: 4 },
];

export default function FloatingBlobs({ variant = 0 }) {
  const configs = [
    blobConfigs,
    [
      { color: "from-emerald-400/20 to-teal-400/20", size: "w-80 h-80", position: "top-[-8%] right-[-5%]", delay: 0 },
      { color: "from-amber-400/15 to-orange-400/15", size: "w-72 h-72", position: "bottom-[10%] left-[-10%]", delay: 1.5 },
      { color: "from-primary/15 to-indigo-400/15", size: "w-96 h-96", position: "top-[50%] left-[50%]", delay: 3 },
    ],
    [
      { color: "from-violet-400/20 to-fuchsia-400/20", size: "w-96 h-96", position: "top-[-10%] left-[30%]", delay: 0.5 },
      { color: "from-sky-400/15 to-cyan-400/15", size: "w-72 h-72", position: "bottom-[-5%] right-[-8%]", delay: 2 },
      { color: "from-rose-400/15 to-pink-400/15", size: "w-80 h-80", position: "top-[40%] left-[-12%]", delay: 3.5 },
    ],
    [
      { color: "from-amber-400/20 to-yellow-400/20", size: "w-80 h-80", position: "top-[5%] right-[10%]", delay: 0 },
      { color: "from-emerald-400/20 to-green-400/20", size: "w-96 h-96", position: "bottom-[-8%] left-[-5%]", delay: 1 },
      { color: "from-primary/20 to-blue-400/20", size: "w-72 h-72", position: "top-[60%] right-[-10%]", delay: 2.5 },
    ],
  ];

  const activeBlobs = configs[variant % configs.length];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {activeBlobs.map((blob, i) => (
        <motion.div
          key={`${variant}-${i}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: blob.delay * 0.2 }}
          className={`absolute ${blob.position} ${blob.size}`}
        >
          <div
            className={`w-full h-full rounded-full bg-gradient-to-br ${blob.color} blur-3xl`}
            style={{ animation: `blob-move ${8 + i * 2}s ease-in-out infinite ${blob.delay}s` }}
          />
        </motion.div>
      ))}
    </div>
  );
}