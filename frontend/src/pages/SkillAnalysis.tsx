import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  TrendingUp,
  CheckCircle,
  XCircle,
  Lightbulb,
  AlertCircle,
  Clock,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../services/api';

interface AnalysisResults {
  summary: {
    fit_level: string;
    confidence_score: number;
  };
  skills: {
    matched_skills: string[];
    missing_skills: string[];
  };
  recommendations: {
    recommendations: string[];
  };
  explanation: string;
}

interface PreviousAnalysis {
  id: number;
  confidence_score: number;
  fit_level: string;
  matched_skills: string;
  missing_skills: string;
  created_at: string;
}

export default function SkillAnalysis() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [previousAnalyses, setPreviousAnalyses] = useState<PreviousAnalysis[]>([]);
  const [loadingPrevious, setLoadingPrevious] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<PreviousAnalysis | null>(null);

  useEffect(() => {
    loadPreviousAnalyses();
  }, []);

  const loadPreviousAnalyses = async () => {
    try {
      setLoadingPrevious(true);
      const response = await api.get('/analysis/history');
      setPreviousAnalyses(response.data);
    } catch (err) {
      console.error('Failed to load previous analyses:', err);
    } finally {
      setLoadingPrevious(false);
    }
  };

  const viewPreviousAnalysis = (analysis: PreviousAnalysis) => {
    setSelectedAnalysis(analysis);
    setShowResults(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file);
      setResumeUploaded(false);
      setError('');
      
      await uploadResume(file);
    }
  };

  const uploadResume = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.post('/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResumeUploaded(true);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to upload resume');
      setResumeFile(null);
    }
  };

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    if (!resumeFile && !resumeUploaded) {
      setError('Please upload a resume first');
      return;
    }

    setAnalyzing(true);
    setError('');
    setShowResults(false);

    try {
      if (resumeFile && !resumeUploaded) {
        await uploadResume(resumeFile);
      }

      const response = await api.post('/analysis/skill-gap', {
        job_description: jobDescription,
      });

      setResults(response.data);
      setShowResults(true);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        err.message || 
        'Failed to analyze skills. Make sure you have uploaded a resume.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--heading)' }}>
            Skill Analysis
          </h1>
          <p style={{ color: 'var(--text)' }}>
            Upload your resume and job description to get AI-powered insights
          </p>
        </motion.div>

        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Description */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-6 border"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--heading)' }}>
              Job Description
            </h2>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full h-64 p-4 border rounded-xl focus:outline-none focus:ring-2 resize-none"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            />
          </motion.div>

          {/* Resume Upload */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-6 border"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--heading)' }}>
              Upload Resume
            </h2>

            <label
              className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl cursor-pointer group transition-all"
              style={{
                borderColor: 'var(--border)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />

              {resumeFile ? (
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--primary)' }} />
                  <p className="font-medium" style={{ color: 'var(--heading)' }}>
                    {resumeFile.name}
                  </p>
                  <p className="text-sm mt-2" style={{ color: 'var(--text)' }}>
                    Click to change file
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload
                    className="w-16 h-16 mx-auto mb-4 group-hover:transition-colors"
                    style={{ color: 'var(--text)' }}
                  />
                  <p className="font-medium" style={{ color: 'var(--heading)' }}>
                    Click to upload resume
                  </p>
                  <p className="text-sm mt-2" style={{ color: 'var(--text)' }}>
                    PDF, DOC, or DOCX
                  </p>
                </div>
              )}
            </label>
          </motion.div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border rounded-xl"
            style={{
              backgroundColor: '#FEE2E2',
              borderColor: '#FCA5A5',
              color: '#DC2626',
            }}
          >
            {error}
          </motion.div>
        )}

        {/* Success Message */}
        {resumeUploaded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border rounded-xl flex items-center space-x-2"
            style={{
              backgroundColor: '#DCFCE7',
              borderColor: '#86EFAC',
              color: '#166534',
            }}
          >
            <CheckCircle className="w-5 h-5" />
            <span>Resume uploaded successfully!</span>
          </motion.div>
        )}

        {/* Analyze Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAnalyze}
            disabled={!jobDescription || (!resumeFile && !resumeUploaded) || analyzing}
            className="px-8 py-4 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
            style={{ background: 'var(--gradient-primary)' }}
          >
            {analyzing ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5" />
                <span>Analyze Skills</span>
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {showResults && results && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="space-y-6"
            >
              {/* Fit Level & Confidence Score */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl p-6 text-white shadow-lg"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Fit Level</h3>
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <p className="text-4xl font-bold">{results.summary.fit_level}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl p-6 border"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="text-xl font-semibold"
                      style={{ color: 'var(--heading)' }}
                    >
                      Confidence Score
                    </h3>
                    <TrendingUp className="w-8 h-8" style={{ color: 'var(--primary)' }} />
                  </div>
                  <div className="flex items-end space-x-2 mb-3">
                    <span className="text-4xl font-bold" style={{ color: 'var(--heading)' }}>
                      {results.summary.confidence_score}
                    </span>
                    <span className="text-2xl mb-1" style={{ color: 'var(--text)' }}>
                      %
                    </span>
                  </div>
                  <div className="w-full rounded-full h-3 overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${results.summary.confidence_score}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      style={{ background: 'var(--gradient-primary)' }}
                      className="h-full"
                    />
                  </div>
                </motion.div>
              </div>

              {/* Matched Skills */}
              {results.skills.matched_skills && results.skills.matched_skills.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-6 border"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div className="flex items-center space-x-2 mb-4">
                    <CheckCircle className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                    <h3 className="text-xl font-semibold" style={{ color: 'var(--heading)' }}>
                      Matched Skills
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {results.skills.matched_skills.map((skill, index) => (
                      <motion.span
                        key={skill}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="px-4 py-2 rounded-full font-medium"
                        style={{
                          backgroundColor: 'rgba(34, 197, 94, 0.15)',
                          color: 'var(--primary)',
                        }}
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Missing Skills */}
              {results.skills.missing_skills && results.skills.missing_skills.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-6 border"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div className="flex items-center space-x-2 mb-4">
                    <XCircle className="w-6 h-6" style={{ color: '#EA8500' }} />
                    <h3 className="text-xl font-semibold" style={{ color: 'var(--heading)' }}>
                      Missing Skills
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {results.skills.missing_skills.map((skill, index) => (
                      <motion.span
                        key={skill}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="px-4 py-2 rounded-full font-medium"
                        style={{
                          backgroundColor: 'rgba(234, 133, 0, 0.15)',
                          color: '#EA8500',
                        }}
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Recommendations */}
              {results.recommendations.recommendations && results.recommendations.recommendations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-6 border"
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.05)',
                    borderColor: 'var(--primary)',
                  }}
                >
                  <div className="flex items-center space-x-2 mb-4">
                    <Lightbulb className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                    <h3 className="text-xl font-semibold" style={{ color: 'var(--heading)' }}>
                      Recommendations
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {results.recommendations.recommendations.map((rec, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start space-x-3"
                      >
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                        <span style={{ color: 'var(--text)' }}>{rec}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Detailed Explanation */}
              {results.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-6 border"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--heading)' }}>
                    Detailed Explanation
                  </h3>
                  <p className="leading-relaxed" style={{ color: 'var(--text)' }}>
                    {results.explanation}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Previous Analyses Section */}
        {previousAnalyses.length > 0 && !selectedAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 pt-8 border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--heading)' }}>
              Previous Analyses
            </h2>
            <div className="grid gap-3">
              {previousAnalyses.map((analysis) => (
                <motion.div
                  key={analysis.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => viewPreviousAnalysis(analysis)}
                  className="p-4 border rounded-xl cursor-pointer transition-all hover:shadow-lg"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div
                          className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                          style={{ backgroundColor: 'var(--primary)' }}
                        >
                          {analysis.fit_level}
                        </div>
                        <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text)' }}>
                          <TrendingUp className="w-4 h-4" />
                          <span>{analysis.confidence_score}% confidence</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: 'var(--text)' }}>
                        <Clock className="w-4 h-4" />
                        <span>{new Date(analysis.created_at).toLocaleDateString()} at {new Date(analysis.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="mt-3 flex gap-4 text-xs flex-wrap">
                        <div>
                          <span style={{ color: 'var(--text)' }} className="opacity-70">Matched: </span>
                          <span style={{ color: 'var(--primary)' }} className="font-medium">{analysis.matched_skills.split(', ').length}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text)' }} className="opacity-70">Missing: </span>
                          <span style={{ color: '#EA8500' }} className="font-medium">{analysis.missing_skills.split(', ').length}</span>
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
                        viewPreviousAnalysis(analysis);
                      }}
                    >
                      View
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* View Previous Analysis Results */}
        {selectedAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pt-8 border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--heading)' }}>
                  Analysis Details
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
                  {new Date(selectedAnalysis.created_at).toLocaleDateString()} at {new Date(selectedAnalysis.created_at).toLocaleTimeString()}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedAnalysis(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'var(--page-bg)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              >
                Back
              </motion.button>
            </div>

            {/* Fit Level & Confidence Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl p-6 text-white shadow-lg"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Fit Level</h3>
                  <CheckCircle className="w-8 h-8" />
                </div>
                <p className="text-4xl font-bold">{selectedAnalysis.fit_level}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl p-6 border"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-xl font-semibold"
                    style={{ color: 'var(--heading)' }}
                  >
                    Confidence Score
                  </h3>
                  <TrendingUp className="w-8 h-8" style={{ color: 'var(--primary)' }} />
                </div>
                <div className="flex items-end space-x-2 mb-3">
                  <span className="text-4xl font-bold" style={{ color: 'var(--heading)' }}>
                    {selectedAnalysis.confidence_score}
                  </span>
                  <span className="text-2xl mb-1" style={{ color: 'var(--text)' }}>
                    %
                  </span>
                </div>
                <div className="w-full rounded-full h-3 overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedAnalysis.confidence_score}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    style={{ background: 'var(--gradient-primary)' }}
                    className="h-full"
                  />
                </div>
              </motion.div>
            </div>

            {/* Matched Skills */}
            {selectedAnalysis.matched_skills && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-6 border"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                  <h3 className="text-xl font-semibold" style={{ color: 'var(--heading)' }}>
                    Matched Skills
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedAnalysis.matched_skills.split(', ').map((skill, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-4 py-2 rounded-full font-medium"
                      style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        color: 'var(--primary)',
                      }}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Missing Skills */}
            {selectedAnalysis.missing_skills && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-6 border"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div className="flex items-center space-x-2 mb-4">
                  <XCircle className="w-6 h-6" style={{ color: '#EA8500' }} />
                  <h3 className="text-xl font-semibold" style={{ color: 'var(--heading)' }}>
                    Missing Skills
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedAnalysis.missing_skills.split(', ').map((skill, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-4 py-2 rounded-full font-medium"
                      style={{
                        backgroundColor: 'rgba(234, 133, 0, 0.15)',
                        color: '#EA8500',
                      }}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
