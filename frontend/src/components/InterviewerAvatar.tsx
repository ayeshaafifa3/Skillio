import { useState, useEffect } from 'react';

interface InterviewerAvatarProps {
  speaking: boolean;
  listening: boolean;
}

export default function InterviewerAvatar({ speaking, listening }: InterviewerAvatarProps) {
  const [animationState, setAnimationState] = useState<'idle' | 'speaking' | 'listening'>('idle');

  useEffect(() => {
    if (speaking) {
      setAnimationState('speaking');
    } else if (listening) {
      setAnimationState('listening');
    } else {
      setAnimationState('idle');
    }
  }, [speaking, listening]);

  return (
    <div className="flex justify-center mb-8">
      <style>{`
        /* Breathing animation for glow layer */
        @keyframes breathe {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.6;
          }
          50% { 
            transform: scale(1.05);
            opacity: 0.8;
          }
        }

        /* Speaking pulse - faster breathing + glow increase */
        @keyframes speakingPulse {
          0%, 100% { 
            transform: scale(1.02);
            opacity: 0.8;
          }
          50% { 
            transform: scale(1.06);
            opacity: 1;
          }
        }

        /* Inner vibration for speaking - very subtle */
        @keyframes speakingVibration {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(0.5px); }
          75% { transform: translateX(-0.5px); }
        }

        /* Rotating ring */
        @keyframes rotateRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Reverse rotation for listening state */
        @keyframes rotateRingReverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }

        /* Expanding ripple waves for listening */
        @keyframes rippleExpand {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        /* Ripple 1 - fastest */
        @keyframes ripple1 {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }

        /* Ripple 2 - medium */
        @keyframes ripple2 {
          0% {
            transform: scale(0.8);
            opacity: 0.7;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }

        /* Ripple 3 - slowest */
        @keyframes ripple3 {
          0% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          100% {
            transform: scale(2.6);
            opacity: 0;
          }
        }

        /* Container */
        .avatar-container {
          position: relative;
          width: 180px;
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Base core orb */
        .orb-base {
          position: absolute;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: radial-gradient(
            circle at 35% 35%,
            rgba(129, 140, 248, 0.9) 0%,
            rgba(79, 70, 229, 0.7) 30%,
            rgba(124, 58, 237, 0.6) 60%,
            rgba(6, 182, 212, 0.4) 100%
          );
          filter: blur(2px);
          z-index: 2;
        }

        /* Energy glow layer - soft outer glow */
        .orb-glow {
          position: absolute;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: radial-gradient(
            circle at 35% 35%,
            rgba(99, 102, 241, 0.4) 0%,
            rgba(124, 58, 237, 0.2) 40%,
            transparent 70%
          );
          filter: blur(8px);
          mix-blend-mode: screen;
          z-index: 1;
          animation: breathe 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        /* Rotating energy ring */
        .orb-ring {
          position: absolute;
          width: 130px;
          height: 130px;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            rgba(99, 102, 241, 0.6) 0deg,
            rgba(139, 92, 246, 0.4) 90deg,
            rgba(6, 182, 212, 0.3) 180deg,
            rgba(99, 102, 241, 0.6) 360deg
          );
          padding: 2px;
          background-clip: padding-box;
          border-radius: 50%;
          animation: rotateRing 20s linear infinite;
          z-index: 0;
          opacity: 0.4;
          mask: radial-gradient(circle, transparent 48px, black 49px, black 50px, transparent 51px);
          -webkit-mask: radial-gradient(circle, transparent 48px, black 49px, black 50px, transparent 51px);
        }

        /* Listening ripple rings */
        .ripple {
          position: absolute;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          border: 2px solid rgba(6, 182, 212, 0.6);
          opacity: 0;
          z-index: 0;
        }

        .ripple-1 {
          animation: ripple1 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .ripple-2 {
          animation: ripple2 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          animation-delay: 0.3s;
        }

        .ripple-3 {
          animation: ripple3 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          animation-delay: 0.6s;
        }

        /* State-specific animations */

        /* Speaking state */
        .avatar-container.speaking .orb-base {
          animation: speakingVibration 0.15s ease-in-out infinite;
        }

        .avatar-container.speaking .orb-glow {
          animation: speakingPulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          opacity: 1;
        }

        .avatar-container.speaking .orb-ring {
          animation: rotateRing 8s linear infinite;
          opacity: 0.8;
        }

        /* Listening state */
        .avatar-container.listening .orb-glow {
          animation: breathe 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          opacity: 0.7;
        }

        .avatar-container.listening .orb-ring {
          animation: rotateRingReverse 15s linear infinite;
          opacity: 0.3;
        }

        .avatar-container.listening .ripple {
          display: block;
        }

        /* Idle state */
        .avatar-container.idle .orb-glow {
          animation: breathe 3.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .avatar-container.idle .orb-ring {
          animation: rotateRing 25s linear infinite;
          opacity: 0.25;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .avatar-container {
            width: 140px;
            height: 140px;
          }

          .orb-base {
            width: 90px;
            height: 90px;
          }

          .orb-glow {
            width: 105px;
            height: 105px;
          }

          .orb-ring {
            width: 100px;
            height: 100px;
            mask: radial-gradient(circle, transparent 37px, black 38px, black 39px, transparent 40px);
            -webkit-mask: radial-gradient(circle, transparent 37px, black 38px, black 39px, transparent 40px);
          }

          .ripple {
            width: 75px;
            height: 75px;
          }
        }
      `}</style>

      <div className={`avatar-container ${animationState}`}>
        {/* Listening ripples */}
        <div className="ripple ripple-1"></div>
        <div className="ripple ripple-2"></div>
        <div className="ripple ripple-3"></div>

        {/* Rotating ring */}
        <div className="orb-ring"></div>

        {/* Energy glow layer */}
        <div className="orb-glow"></div>

        {/* Base core */}
        <div className="orb-base"></div>
      </div>
    </div>
  );
}
