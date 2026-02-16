import { useState } from 'react';

interface VoiceWaveformProps {
  isActive: boolean;
  isSpeaking: boolean;
}

export default function VoiceWaveform({ isActive, isSpeaking }: VoiceWaveformProps) {
  return (
    <div className="flex justify-center items-center py-6">
      <style>{`
        .waveform-container {
          width: 200px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        /* Listening mode - smooth growing/shrinking circles */
        @keyframes pulse1 {
          0%, 100% { transform: scale(0.5); opacity: 0.4; }
          50% { transform: scale(1); opacity: 1; }
        }

        @keyframes pulse2 {
          0%, 100% { transform: scale(0.6); opacity: 0.5; }
          50% { transform: scale(1); opacity: 1; }
        }

        @keyframes pulse3 {
          0%, 100% { transform: scale(0.7); opacity: 0.6; }
          50% { transform: scale(1); opacity: 1; }
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3B82F6, #06B6D4);
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
        }

        .active .dot:nth-child(1) {
          animation: pulse1 1.4s ease-in-out infinite;
        }

        .active .dot:nth-child(2) {
          animation: pulse2 1.4s ease-in-out infinite;
          animation-delay: 0.1s;
        }

        .active .dot:nth-child(3) {
          animation: pulse3 1.4s ease-in-out infinite;
          animation-delay: 0.2s;
        }

        .active .dot:nth-child(4) {
          animation: pulse3 1.4s ease-in-out infinite;
          animation-delay: 0.2s;
        }

        .active .dot:nth-child(5) {
          animation: pulse2 1.4s ease-in-out infinite;
          animation-delay: 0.1s;
        }

        .active .dot:nth-child(6) {
          animation: pulse1 1.4s ease-in-out infinite;
        }

        /* Speaking mode - fast bouncing */
        @keyframes bounce1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        @keyframes bounce2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
        }

        .speaking .dot {
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          box-shadow: 0 0 12px rgba(139, 92, 246, 0.6);
        }

        .speaking .dot:nth-child(1) {
          animation: bounce1 0.5s ease-in-out infinite;
        }

        .speaking .dot:nth-child(2) {
          animation: bounce2 0.5s ease-in-out infinite;
          animation-delay: 0.08s;
        }

        .speaking .dot:nth-child(3) {
          animation: bounce2 0.5s ease-in-out infinite;
          animation-delay: 0.16s;
        }

        .speaking .dot:nth-child(4) {
          animation: bounce2 0.5s ease-in-out infinite;
          animation-delay: 0.16s;
        }

        .speaking .dot:nth-child(5) {
          animation: bounce2 0.5s ease-in-out infinite;
          animation-delay: 0.08s;
        }

        .speaking .dot:nth-child(6) {
          animation: bounce1 0.5s ease-in-out infinite;
        }

        /* Idle mode - barely visible */
        @keyframes breathe {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }

        .idle .dot {
          animation: breathe 3s ease-in-out infinite;
          opacity: 0.3;
        }
      `}</style>

      <div className={`waveform-container ${isSpeaking ? 'speaking' : isActive ? 'active' : 'idle'}`}>
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
    </div>
  );
}
