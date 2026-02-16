import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfidenceMeterProps {
  score: number; // 0-100
  isVisible: boolean;
}

export default function ConfidenceMeter({ score, isVisible }: ConfidenceMeterProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (isVisible) {
      // Animate score from 0 to final value
      const interval = setInterval(() => {
        setDisplayScore((prev) => {
          if (prev < score) {
            return Math.min(prev + 2, score);
          }
          return prev;
        });
      }, 20);
      return () => clearInterval(interval);
    } else {
      setDisplayScore(0);
    }
  }, [score, isVisible]);

  const getConfidenceLevel = () => {
    if (score >= 75) return 'High Confidence';
    if (score >= 50) return 'Moderate Confidence';
    return 'Needs Improvement';
  };

  const getConfidenceColor = () => {
    if (score >= 75) return '#10B981'; // Green
    if (score >= 50) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getGradientColor = () => {
    if (score >= 75) return '#10B98166';
    if (score >= 50) return '#F59E0B66';
    return '#EF444466';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center mb-6"
        >
          <style>{`
            @keyframes circleStrokeAnim {
              0% {
                stroke-dashoffset: 220;
              }
              100% {
                stroke-dashoffset: 220 - (220 * ${displayScore} / 100);
              }
            }

            .confidence-circle-stroke {
              stroke-dasharray: 220;
              stroke-dashoffset: 220;
              stroke-linecap: round;
              transition: stroke-dashoffset 0.6s ease;
            }
          `}</style>

          <div className="relative flex flex-col items-center">
            {/* Circular Progress */}
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-full h-full" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="55"
                  fill="none"
                  stroke="rgba(100, 100, 100, 0.1)"
                  strokeWidth="4"
                />

                {/* Progress circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="55"
                  fill="none"
                  stroke={getConfidenceColor()}
                  strokeWidth="4"
                  className="confidence-circle-stroke"
                  style={{
                    strokeDasharray: 220,
                    strokeDashoffset: 220 - (220 * displayScore) / 100,
                  }}
                />
              </svg>

              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div
                  className="text-3xl font-bold"
                  style={{ color: getConfidenceColor() }}
                >
                  {displayScore}%
                </div>
                <div
                  className="text-xs font-semibold mt-1"
                  style={{ color: getConfidenceColor(), opacity: 0.8 }}
                >
                  SCORE
                </div>
              </div>

              {/* Glow effect */}
              <div
                className="absolute inset-0 rounded-full blur-lg opacity-30"
                style={{ backgroundColor: getGradientColor() }}
              ></div>
            </div>

            {/* Confidence Level Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <p
                className="text-sm font-semibold mb-2"
                style={{ color: getConfidenceColor() }}
              >
                {getConfidenceLevel()}
              </p>
              <p className="text-xs opacity-70" style={{ color: 'var(--text)' }}>
                {score >= 75 && 'Excellent answer! Clear and confident.'}
                {score >= 50 && score < 75 && 'Good effort. Room for improvement.'}
                {score < 50 && 'Try speaking more clearly and slowly.'}
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
