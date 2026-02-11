import { useState } from "react";
import { api } from "../services/api";
import DashboardLayout from "../components/DashboardLayout";

export default function HRInterview() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jobDescription, setJobDescription] = useState("Senior Software Engineer - Full Stack");
  const [resumeText, setResumeText] = useState("");
  const [level, setLevel] = useState("basic");

  const startInterview = async () => {
    if (!jobDescription.trim()) {
      setError("Please enter a job description");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const params = new URLSearchParams({
        job_description: jobDescription,
        interview_type: "hr",
        resume_text: resumeText
      });
      
      const res = await api.post(`/interview/start?${params.toString()}`);
      setQuestion(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to start interview");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      setError("Please provide an answer");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        job_description: jobDescription,
        previous_question: question,
        answer: answer,
        interview_type: "hr",
        level: level,
        resume_text: resumeText
      });
      
      const res = await api.post(`/interview/follow-up?${params.toString()}`);
      setQuestion(res.data);
      setAnswer("");
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to submit answer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          HR / Behavioral Interview
        </h1>
        <p className="text-gray-600">
          Practice behavioral questions and improve your communication skills with our AI interviewer
        </p>

        {!question ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Enter the job description or role you're applying for..."
                  className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Resume (Optional)
                </label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume here to help the interviewer ask relevant questions..."
                  className="w-full h-40 p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={startInterview}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Starting..." : "Start Interview"}
              </button>
            </div>

            <div className="bg-gradient-to-r from-teal-50 to-green-50 rounded-2xl p-6 border border-teal-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                What to Expect
              </h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• Ice-breaker questions to understand your background</li>
                <li>• Behavioral scenarios to assess your skills</li>
                <li>• Questions about teamwork and communication</li>
                <li>• Follow-ups about your strengths and growth areas</li>
                <li>• Real-life project and internship experiences</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Question</h2>
              <div className="bg-gray-50 rounded-xl p-4 whitespace-pre-wrap text-gray-800 leading-relaxed">
                {question}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer
              </label>
              <textarea
                placeholder="Share your thoughts here... Be honest and detailed."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full h-48 p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={submitAnswer}
                disabled={loading || !answer.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting..." : "Submit Answer"}
              </button>
              <button
                onClick={() => {
                  setQuestion("");
                  setAnswer("");
                  setError("");
                  setLevel("basic");
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Restart
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
