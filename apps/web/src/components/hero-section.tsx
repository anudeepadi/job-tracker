"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";

const STAGGER_DELAY = 0.05;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: STAGGER_DELAY,
    },
  },
} as const;

const wordVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
  },
} as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] },
  }),
};

function SplitText({
  text,
  className,
  renderWord,
}: {
  text: string;
  className?: string;
  renderWord?: (word: string, index: number) => React.ReactNode;
}) {
  const words = text.split(" ");
  return (
    <motion.span
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block"
          variants={wordVariants}
        >
          {renderWord ? renderWord(word, i) : word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </motion.span>
  );
}

function HeadlineLine({
  words,
  italicRange,
  delayOffset = 0,
}: {
  words: string[];
  italicRange?: [number, number];
  delayOffset?: number;
}) {
  return (
    <motion.span
      className="block"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      transition={{
        staggerChildren: STAGGER_DELAY,
        delayChildren: delayOffset,
      }}
    >
      {words.map((word, i) => {
        const isItalic =
          italicRange && i >= italicRange[0] && i <= italicRange[1];
        return (
          <motion.span
            key={`${word}-${i}`}
            className="inline-block"
            variants={wordVariants}
          >
            {isItalic ? (
              <span className="italic font-[var(--font-instrument-serif)]">
                {word}
              </span>
            ) : (
              word
            )}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        );
      })}
    </motion.span>
  );
}

export function HeroSection() {
  const line1Words = ["Your", "job", "search,"];
  const line2Words = ["handled", "by", "agents"];
  const totalHeadlineWords = line1Words.length + line2Words.length;
  const badgeDelay = 0;
  const headlineDelay = 0.3;
  const subtitleDelay =
    headlineDelay + totalHeadlineWords * STAGGER_DELAY + 0.2;
  const ctaDelay = subtitleDelay + 0.4;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[900px] h-[900px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: badgeDelay,
            ease: [0.25, 0.4, 0.25, 1],
          }}
        >
          <span className="inline-block border border-white/20 bg-white/5 rounded-full px-4 py-1.5 text-xs text-white/50 tracking-wide">
            AI-Powered Job Search
          </span>
        </motion.div>

        {/* H1 */}
        <h1 className="text-[72px] md:text-[96px] font-extralight tracking-[-3px] leading-[0.95] text-white mb-8">
          <HeadlineLine words={line1Words} delayOffset={headlineDelay} />
          <HeadlineLine
            words={line2Words}
            italicRange={[2, 2]}
            delayOffset={headlineDelay + line1Words.length * STAGGER_DELAY}
          />
        </h1>

        {/* Supporting text */}
        <motion.p
          className="text-white/40 text-lg max-w-lg mx-auto leading-relaxed mb-12"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={subtitleDelay}
        >
          AI agents search across every job board, tailor your resume, and track
          applications — while you focus on landing interviews.
        </motion.p>

        {/* CTA row */}
        <motion.div
          className="flex items-center justify-center gap-6"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={ctaDelay}
        >
          <Link
            href="/register"
            className="inline-flex items-center justify-center bg-white text-black rounded-full px-8 py-3 text-sm font-medium hover:bg-white/90 transition-colors"
          >
            Get Early Access
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            See how it works →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
