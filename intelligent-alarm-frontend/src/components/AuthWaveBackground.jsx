import { motion } from "framer-motion";

function AuthWaveBackground() {
  return (
    <div className="auth-wave-bg" aria-hidden="true">
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="wave-svg wave-back"
      >
        <motion.path
          fill="rgba(244, 197, 66, 0.05)"
          initial={{ d: "M0,160 C320,220 420,100 720,140 C1020,180 1120,80 1440,140 L1440,320 L0,320 Z" }}
          animate={{
            d: [
              "M0,160 C320,220 420,100 720,140 C1020,180 1120,80 1440,140 L1440,320 L0,320 Z",
              "M0,140 C320,100 420,220 720,180 C1020,140 1120,200 1440,160 L1440,320 L0,320 Z",
              "M0,160 C320,220 420,100 720,140 C1020,180 1120,80 1440,140 L1440,320 L0,320 Z",
            ],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="wave-svg wave-front"
      >
        <motion.path
          fill="rgba(184, 134, 43, 0.06)"
          initial={{ d: "M0,220 C300,260 480,180 760,200 C1040,220 1200,260 1440,220 L1440,320 L0,320 Z" }}
          animate={{
            d: [
              "M0,220 C300,260 480,180 760,200 C1040,220 1200,260 1440,220 L1440,320 L0,320 Z",
              "M0,200 C300,180 480,260 760,240 C1040,220 1200,180 1440,200 L1440,320 L0,320 Z",
              "M0,220 C300,260 480,180 760,200 C1040,220 1200,260 1440,220 L1440,320 L0,320 Z",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
      </svg>
    </div>
  );
}

export default AuthWaveBackground;