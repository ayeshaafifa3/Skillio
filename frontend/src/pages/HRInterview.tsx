import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, MessageSquare } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { InterviewChatService, Session } from "../services/interview-chat-service";

export default function HRInterview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const allSessions = await InterviewChatService.getSessions();
      // Filter only HR sessions
      const hrSessions = allSessions.filter(s => s.mode === 'hr');
      setSessions(hrSessions);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const startInterview = async () => {
    setLoading(true);
    setError("");
    
    try {
      const result = await InterviewChatService.startSession(
        "HR / Behavioral Interview Practice",
        "hr",
        "",
        "HR Interview"
      );
      
      // Navigate to unified chat interface
      navigate(`/interview/chat?session=${result.session_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to start interview");
    } finally {
      setLoading(false);
    }
  };

  const resumeSession = (sessionId: number) => {
    navigate(`/interview/chat?session=${sessionId}`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto pt-8 pb-16 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--heading)' }}>
            HR / Behavioral Interview
          </h1>
          <p style={{ color: 'var(--text)' }}>
            Practice behavioral questions and improve your communication skills
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-8 border"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="space-y-6">
            {/* Info Section */}
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--page-bg)' }}>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--heading)' }}>
                What to expect:
              </h3>
              <ul style={{ color: 'var(--text)' }} className="text-sm space-y-1 list-disc list-inside">
                <li>Ice-breaker questions about your background</li>
                <li>Behavioral scenarios to assess soft skills</li>
                <li>Questions about teamwork and communication</li>
                <li>Real-life project and experience questions</li>
                <li>Questions about strengths and growth areas</li>
              </ul>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border rounded-xl text-sm"
                style={{
                  backgroundColor: '#FEE2E2',
                  borderColor: '#FCA5A5',
                  color: '#DC2626',
                }}
              >
                {error}
              </motion.div>
            )}

            {/* Start Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startInterview}
              disabled={loading}
              className="w-full py-4 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {loading ? "Starting Interview..." : "Start Interview"}
            </motion.button>
          </div>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 p-6 rounded-2xl border"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border)',
          }}
        >
          <h3 className="font-semibold mb-4" style={{ color: 'var(--heading)' }}>
            💡 Interview Tips
          </h3>
          <ul style={{ color: 'var(--text)' }} className="text-sm space-y-2">
            <li>✓ Be authentic and honest in your answers</li>
            <li>✓ Use the STAR method (Situation, Task, Action, Result)</li>
            <li>✓ Share specific examples from your experience</li>
            <li>✓ Listen carefully before answering</li>
            <li>✓ Show enthusiasm for the role and company</li>
          </ul>
        </motion.div>

        {/* Previous Chats Section */}
        {sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--heading)' }}>
              Previous Interviews
            </h2>
            <div className="grid gap-3">
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => resumeSession(session.id)}
                  className="p-4 border rounded-xl cursor-pointer transition-all hover:shadow-lg"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold" style={{ color: 'var(--heading)' }}>
                        {session.title}
                      </h4>
                      <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--text)' }}>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{session.message_count} messages</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(session.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white ml-4"
                      style={{ backgroundColor: 'var(--primary)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        resumeSession(session.id);
                      }}
                    >
                      Open
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
