import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MessageSquare, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import InterviewerAvatar from '../components/InterviewerAvatar';
import VoiceWaveform from '../components/VoiceWaveform';
import ConfidenceMeter from '../components/ConfidenceMeter';
import { InterviewChatService, Message, SessionDetail } from '../services/interview-chat-service';

const SpeechRecognition =
  (typeof window !== 'undefined' && ((window as any).SpeechRecognition ||
  (window as any).webkitSpeechRecognition)) || null;

const InterviewChat: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // State management
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [error, setError] = useState('');
  
  // Audio state
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceNotSupported, setVoiceNotSupported] = useState(false);
  
  // New: AI speaking state
  const [aiSpeaking, setAiSpeaking] = useState(false);

  // New: Confidence scoring
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [showConfidence, setShowConfidence] = useState(false);
  const [speakingDuration, setSpeakingDuration] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const lastAIMessageRef = useRef<string>('');
  const speakingStartRef = useRef<number>(0);
  const STORAGE_KEY = 'interview_session_id';

  // Initialize session on component mount
  useEffect(() => {
    initializeSession();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (!SpeechRecognition) {
      setVoiceNotSupported(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setInterimTranscript('');
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (final) {
        setInput((prev) => prev + final);
        setInterimTranscript('');
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-speak AI messages
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage.role === 'ai' && 
        lastMessage.content && 
        lastMessage.content !== lastAIMessageRef.current &&
        voiceEnabled) {
      lastAIMessageRef.current = lastMessage.content;
      speak(lastMessage.content);
    }
  }, [messages, voiceEnabled]);

  const speak = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined') return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => setAiSpeaking(true);
    utterance.onend = () => setAiSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setVoiceNotSupported(true);
      return;
    }
    speakingStartRef.current = Date.now();
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    const duration = Date.now() - speakingStartRef.current;
    setSpeakingDuration(duration);
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const cancelSpeech = () => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
      setAiSpeaking(false);
    }
  };

  // Calculate confidence score based on speech characteristics
  const calculateConfidenceScore = (transcript: string): number => {
    let score = 50; // Base score

    // Factor 1: Length (words spoken)
    const wordCount = transcript.trim().split(/\s+/).length;
    if (wordCount > 20) score += 20;
    else if (wordCount > 10) score += 10;
    else if (wordCount < 3) score -= 15;

    // Factor 2: Speaking duration (ms)
    const durationSeconds = speakingDuration / 1000;
    if (durationSeconds > 15) score += 15;
    else if (durationSeconds > 8) score += 10;
    else if (durationSeconds < 2) score -= 10;

    // Factor 3: Speech quality (punctuation, capitalization as proxy)
    if (transcript.includes('.') || transcript.includes('?') || transcript.includes('!')) {
      score += 10;
    }

    // Factor 4: Avoid going over 100 or below 0
    return Math.min(100, Math.max(0, score));
  };

  const initializeSession = async () => {
    try {
      setIsLoadingSession(true);
      
      // Step 1: Check URL query params first (for form page redirects)
      const querySessionId = searchParams.get('session');
      if (querySessionId) {
        const sessionIdNum = parseInt(querySessionId);
        await loadSession(sessionIdNum);
        return;
      }
      
      // Step 2: Check localStorage for existing session ID
      const storedSessionId = localStorage.getItem(STORAGE_KEY);
      
      if (storedSessionId) {
        // Restore from localStorage
        const sessionIdNum = parseInt(storedSessionId);
        await loadSession(sessionIdNum);
      } else {
        // Step 3: Try to fetch latest session from backend
        try {
          const latestSession = await InterviewChatService.getLatestSession();
          
          // Found latest session - load it and store ID
          setSessionDetail(latestSession);
          setSessionId(latestSession.session_id);
          setMessages(latestSession.messages);
          localStorage.setItem(STORAGE_KEY, latestSession.session_id.toString());
          setError('');
        } catch (err: any) {
          // No existing session - show UI to start new interview
          if (err.response?.status === 404) {
            setError('no-session');
          } else {
            setError('failed-load');
          }
        }
      }
    } catch (err) {
      setError('failed-load');
      console.error('Failed to initialize session:', err);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const loadSession = async (id: number) => {
    try {
      const data = await InterviewChatService.getSessionMessages(id);
      setSessionDetail(data);
      setSessionId(data.session_id);
      setMessages(data.messages);
      localStorage.setItem(STORAGE_KEY, id.toString());
      setError('');
    } catch (err: any) {
      setError('Session not found or expired');
      localStorage.removeItem(STORAGE_KEY);
      console.error('Failed to load session:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !sessionId) return;

    const userMessage = input;
    
    // Calculate confidence score before clearing input
    const confidence = calculateConfidenceScore(userMessage);
    setConfidenceScore(confidence);
    setShowConfidence(true);

    setInput('');

    // Add user message to UI immediately
    const newUserMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    setIsLoading(true);
    setError('');
    
    try {
      const aiResponse = await InterviewChatService.sendMessage(
        sessionId,
        userMessage
      );
      setMessages((prev) => [...prev, aiResponse]);
      
      // Hide confidence meter after showing briefly
      setTimeout(() => setShowConfidence(false), 2000);
    } catch (err: any) {
      setError('Failed to get response. Please try again.');
      setMessages((prev) => prev.slice(0, -1)); // Remove the user message if AI fails
      console.error('Failed to send message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewInterview = (mode: 'programming' | 'hr') => {
    // Clear session and navigate
    localStorage.removeItem(STORAGE_KEY);
    navigate(`/interview/${mode === 'hr' ? 'behavioral' : 'programming'}`);
  };

  const getModeColor = () => {
    return sessionDetail?.mode === 'hr' ? '#2DD4BF' : 'var(--primary)';
  };

  const getModeBadge = () => {
    const mode = sessionDetail?.mode === 'hr' ? 'HR Interview' : 'Programming Interview';
    const difficulty = sessionDetail?.difficulty ? ` (${sessionDetail.difficulty.charAt(0).toUpperCase() + sessionDetail.difficulty.slice(1)})` : '';
    return mode + difficulty;
  };

  // Loading state
  if (isLoadingSession) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
            <div className="w-12 h-12 border-4 rounded-full" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // No session state - show start screen
  if (error === 'no-session' || !sessionDetail) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <MessageSquare className="w-16 h-16 mx-auto mb-6" style={{ color: 'var(--primary)' }} />
            </motion.div>
            
            <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--heading)' }}>
              No Active Interview
            </h2>
            <p style={{ color: 'var(--text)' }} className="mb-8">
              Start a new interview session by choosing a type below.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => startNewInterview('programming')}
                className="p-6 border rounded-xl transition-all hover:shadow-lg"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text)',
                }}
              >
                <div className="text-2xl mb-2">💻</div>
                <div className="font-semibold">Programming</div>
                <div className="text-xs mt-2 opacity-70">DSA & Coding</div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => startNewInterview('hr')}
                className="p-6 border rounded-xl transition-all hover:shadow-lg"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text)',
                }}
              >
                <div className="text-2xl mb-2">🎤</div>
                <div className="font-semibold">HR / Behavioral</div>
                <div className="text-xs mt-2 opacity-70">Soft Skills</div>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--page-bg)' }}>
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--card-bg)',
          }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              style={{ color: 'var(--text)' }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--heading)' }}>
                {sessionDetail?.title}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: getModeColor() }}
                >
                  {getModeBadge()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Voice Status */}
            <motion.div
              className="flex items-center gap-1 px-3 py-2 rounded-lg"
              style={{
                backgroundColor: 'var(--page-bg)',
              }}
              title={voiceEnabled ? 'Voice Output Enabled' : 'Voice Output Disabled'}
            >
              {voiceEnabled ? (
                <Volume2 className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              ) : (
                <VolumeX className="w-4 h-4" style={{ color: '#9CA3AF' }} />
              )}
              <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                {voiceEnabled ? 'Voice On' : 'Voice Off'}
              </span>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startNewInterview(sessionDetail?.mode === 'hr' ? 'hr' : 'programming')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: 'var(--page-bg)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              }}
            >
              New Interview
            </motion.button>
          </div>
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto p-6 space-y-4"
          style={{ backgroundColor: 'var(--page-bg)' }}
        >
          {/* Avatar Section */}
          <div className="pt-4">
            <InterviewerAvatar speaking={aiSpeaking} listening={isListening} />
          </div>

          {/* Voice Waveform */}
          {(isListening || aiSpeaking) && <VoiceWaveform isActive={isListening || aiSpeaking} isSpeaking={aiSpeaking} />}

          {/* Confidence Meter */}
          <ConfidenceMeter score={confidenceScore} isVisible={showConfidence} />

          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md lg:max-w-2xl px-5 py-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'text-white rounded-br-none'
                      : 'text-gray-800 rounded-bl-none'
                  }`}
                  style={{
                    backgroundColor:
                      msg.role === 'user' ? 'var(--primary)' : '#f0f0f0',
                  }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  <p
                    className="text-xs mt-2 opacity-60"
                    style={{ color: msg.role === 'user' ? '#ffffff' : '#666' }}
                  >
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex justify-start"
              >
                <div
                  className="px-5 py-3 rounded-lg rounded-bl-none flex gap-2"
                  style={{ backgroundColor: '#f0f0f0' }}
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: 0,
                    }}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--primary)' }}
                  />
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: 0.2,
                    }}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--primary)' }}
                  />
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: 0.4,
                    }}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--primary)' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        {error && error !== 'no-session' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-3 border-t"
            style={{
              backgroundColor: '#FEE2E2',
              borderColor: '#FCA5A5',
            }}
          >
            <p style={{ color: '#DC2626' }} className="text-sm">
              {error}
            </p>
          </motion.div>
        )}

        {/* Input Area */}
        <div
          className="px-6 py-4 border-t"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--card-bg)',
          }}
        >
          {/* Voice Input Transcript Display */}
          {interimTranscript && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 rounded-lg"
              style={{
                backgroundColor: 'var(--page-bg)',
              }}
            >
              <p style={{ color: 'var(--text)' }} className="text-sm flex items-center gap-2">
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
                  🎤
                </motion.span>
                Listening: {interimTranscript}
              </p>
            </motion.div>
          )}

          {/* Voice Not Supported Warning */}
          {voiceNotSupported && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 rounded-lg text-sm"
              style={{
                backgroundColor: '#FEF3C7',
                color: '#92400E',
              }}
            >
              ⚠️ Voice input is not supported in your browser. Please use text input or try a different browser.
            </motion.div>
          )}

          <div className="max-w-4xl mx-auto flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Your answer... (Shift+Enter for new line, or use the microphone)"
              className="flex-1 p-4 rounded-lg resize-none focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--page-bg)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
                '--tw-ring-color': 'var(--primary)',
              } as any}
              rows={3}
              disabled={isLoading || isListening}
            />
            
            <div className="flex flex-col gap-2 h-fit self-end">
              {/* Microphone Button */}
              {!voiceNotSupported && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={isListening ? stopListening : startListening}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg font-medium text-white transition-all flex items-center gap-2 ${
                    isListening ? 'animate-pulse' : ''
                  }`}
                  style={{
                    backgroundColor: isListening ? '#EF4444' : '#10B981',
                    opacity: isLoading ? 0.5 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                  }}
                  title={isListening ? 'Stop Listening' : 'Start Listening'}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span className="text-sm">Stop</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span className="text-sm">Mic</span>
                    </>
                  )}
                </motion.button>
              )}

              {/* Voice Toggle Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setVoiceEnabled(!voiceEnabled);
                  cancelSpeech();
                }}
                className="px-4 py-2 rounded-lg font-medium text-white transition-all flex items-center justify-center"
                style={{
                  backgroundColor: voiceEnabled ? 'var(--primary)' : '#9CA3AF',
                }}
                title={voiceEnabled ? 'Voice On' : 'Voice Off'}
              >
                {voiceEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </motion.button>

              {/* Send Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50 transition-opacity"
                style={{
                  backgroundColor: 'var(--primary)',
                }}
              >
                Send
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InterviewChat;
