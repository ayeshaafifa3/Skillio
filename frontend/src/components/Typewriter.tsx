import { useEffect, useState } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  isComplete?: boolean;
}

/**
 * Typewriter Component
 * Displays text with a typewriter animation effect for streaming responses
 */
export default function Typewriter({ text, speed = 30, isComplete = true }: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      return;
    }

    // If text should be displayed completely (streaming finished), show it all
    if (isComplete) {
      setDisplayedText(text);
      return;
    }

    // Typewriter animation for live streaming
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, isComplete]);

  return (
    <div
      className="whitespace-pre-wrap text-base leading-relaxed"
      style={{
        color: 'var(--text)',
        fontSize: 'var(--font-size-base)',
        lineHeight: 'var(--line-height-normal)',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
      }}
    >
      {displayedText}
      {!isComplete && <span className="animate-pulse">▌</span>}
    </div>
  );
}
