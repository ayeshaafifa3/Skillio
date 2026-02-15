import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, MessageSquare, Trash2 } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { InterviewChatService, Session } from "../services/interview-chat-service";

type Difficulty = "beginner" | "intermediate" | "advanced";

export default function ProgrammingInterview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("beginner");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const allSessions = await InterviewChatService.getSessions();
      // Filter only programming sessions
      const programmingSessions = allSessions.filter(s => s.mode === 'programming');
      setSessions(programmingSessions);
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
        "Programming Interview Practice",
        "programming",
        "",
        "Programming Interview",
        selectedDifficulty
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

  const handleDeleteClick = (sessionId: number) => {
    setConfirmDeleteId(sessionId);
  };

  const confirmDelete = async (sessionId: number) => {
    setDeletingId(sessionId);
    try {
      await InterviewChatService.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setConfirmDeleteId(null);
    } catch (err: any) {
      console.error('Failed to delete session:', err);
      setError('Failed to delete session. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setConfirmDeleteId(null);
  };

  const getDifficultyColor = (level: Difficulty) => {
    switch (level) {
      case "beginner":
        return "var(--primary)";
      case "intermediate":
        return "#EAB308";
      case "advanced":
        return "#EF4444";
      default:
        return "var(--primary)";
    }
  };

  const getDifficultyDescription = (level: Difficulty) => {
    switch (level) {
      case "beginner":
        return "Basic arrays, loops, simple logic problems";
      case "intermediate":
        return "Data structures, algorithms, edge case handling";
      case "advanced":
        return "Optimization, complexity analysis, tricky problems";
      default:
        return "";
    }
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
            Programming Interview
          </h1>
          <p style={{ color: 'var(--text)' }}>
            Practice data structures, algorithms, and coding problems
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
                How it works:
              </h3>
              <ul style={{ color: 'var(--text)' }} className="text-sm space-y-1 list-disc list-inside">
                <li>AI will ask programming and DSA questions</li>
                <li>Answer each question and get follow-up questions</li>
                <li>Explain your approach and discuss trade-offs</li>
                <li>All conversations are saved to your profile</li>
              </ul>
            </div>

            {/* Difficulty Selector */}
            <div className="space-y-3">
              <label style={{ color: 'var(--heading)' }} className="block font-semibold text-sm">
                Select Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <motion.button
                    key={level}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedDifficulty(level)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedDifficulty === level ? 'border-current' : 'border-transparent'
                    }`}
                    style={{
                      backgroundColor: 'var(--page-bg)',
                      color: selectedDifficulty === level ? getDifficultyColor(level) : 'var(--text)',
                      borderColor: selectedDifficulty === level ? getDifficultyColor(level) : 'var(--border)',
                    }}
                  >
                    <div className="font-semibold capitalize text-sm mb-1">{level}</div>
                    <div className="text-xs opacity-70">{getDifficultyDescription(level)}</div>
                  </motion.button>
                ))}
              </div>
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
            💡 Tips for Success
          </h3>
          <ul style={{ color: 'var(--text)' }} className="text-sm space-y-2">
            <li>✓ Think out loud - explain your approach</li>
            <li>✓ Ask clarifying questions about requirements</li>
            <li>✓ Discuss trade-offs and complexity analysis</li>
            <li>✓ Code solutions step by step</li>
            <li>✓ Test edge cases and handle errors</li>
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
                          <span className="px-2 py-1 rounded capitalize" style={{ backgroundColor: 'var(--page-bg)' }}>
                            {session.difficulty}
                          </span>
                        </div>
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
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white ml-2"
                      style={{ backgroundColor: 'var(--primary)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        resumeSession(session.id);
                      }}
                    >
                      Open
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white ml-2"
                      style={{ backgroundColor: '#EF4444' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(session.id);
                      }}
                      disabled={deletingId === session.id}
                    >
                      {deletingId === session.id ? 'Deleting...' : 'Delete'}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Delete Confirmation Dialog */}
        <AnimatePresence>
          {confirmDeleteId !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={cancelDelete}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm mx-4 border"
                onClick={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border)',
                }}
              >
                <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--heading)' }}>
                  Delete Interview Session?
                </h3>
                <p className="mb-8" style={{ color: 'var(--text)' }}>
                  Are you sure you want to delete this interview session? This action cannot be undone.
                </p>
                <div className="flex gap-4 justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={cancelDelete}
                    className="px-6 py-2 rounded-lg font-medium transition-all"
                    style={{
                      backgroundColor: 'var(--page-bg)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => confirmDelete(confirmDeleteId)}
                    disabled={deletingId !== null}
                    className="px-6 py-2 rounded-lg font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: '#EF4444' }}
                  >
                    {deletingId === confirmDeleteId ? 'Deleting...' : 'Delete'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
