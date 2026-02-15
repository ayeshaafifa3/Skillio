import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  ChevronDown,
  Award,
  Zap,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { api, getATSScore, getResumeImprovements } from '../services/api';

interface Resume {
  id: number;
  filename: string;
  uploaded_at: string;
}

interface JobDescription {
  id: number;
  title: string;
  uploaded_at: string;
}

interface PreviousAnalysis {
  id: number;
  confidence_score: number;
  fit_level: string;
  matched_skills: string;
  missing_skills: string;
  created_at: string;
}

interface ATSResult {
  ats_score: number;
  level: string;
  keyword_density: number;
  matched_keywords: string[];
  missing_keywords: string[];
  formatting_issues: string[];
}

interface ResumeImprovement {
  original: string;
  improved: string;
  category: string;
  impact: string;
}

interface ResumeImprovementResult {
  total_suggestions: number;
  improvement_score: number;
  improvements: ResumeImprovement[];
  missing_keywords: string[];
  summary: string;
}

export default function SkillAnalysis() {
  // Saved documents
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  
  // Manual uploads
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  
  // Selection mode
  const [useManualResume, setUseManualResume] = useState(true);
  const [useManualJD, setUseManualJD] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [selectedJdId, setSelectedJdId] = useState<number | null>(null);
  
  // Analysis
  const [analyzing, setAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [previousAnalyses, setPreviousAnalyses] = useState<PreviousAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<PreviousAnalysis | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null);
  const [loadingATS, setLoadingATS] = useState(false);
  
  const [resumeImprovement, setResumeImprovement] = useState<ResumeImprovementResult | null>(null);
  const [loadingImprovement, setLoadingImprovement] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadResumes();
    loadJobDescriptions();
    loadPreviousAnalyses();
  }, []);

  const loadResumes = async () => {
    try {
      const response = await api.get('/analysis/resumes');
      setResumes(response.data.resumes);
      if (response.data.resumes.length > 0) {
        setSelectedResumeId(response.data.resumes[0].id);
      }
    } catch (err) {
      console.error('Failed to load resumes:', err);
    }
  };

  const loadJobDescriptions = async () => {
    try {
      const response = await api.get('/analysis/job-descriptions');
      setJobDescriptions(response.data.job_descriptions);
      if (response.data.job_descriptions.length > 0) {
        setSelectedJdId(response.data.job_descriptions[0].id);
      }
    } catch (err) {
      console.error('Failed to load job descriptions:', err);
    }
  };

  const loadPreviousAnalyses = async () => {
    try {
      const response = await api.get('/analysis/history');
      setPreviousAnalyses(response.data);
    } catch (err) {
      console.error('Failed to load previous analyses:', err);
    }
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
      // Reload resumes list
      loadResumes();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to upload resume');
      setResumeFile(null);
    }
  };

  const viewPreviousAnalysis = (analysis: PreviousAnalysis) => {
    setSelectedAnalysis(analysis);
    setShowResults(false);
  };

  const handleDeleteClick = (analysisId: number) => {
    setConfirmDeleteId(analysisId);
  };

  const confirmDelete = async (analysisId: number) => {
    setDeletingId(analysisId);
    try {
      await api.delete(`/analysis/history/${analysisId}`);
      setPreviousAnalyses((prev) => prev.filter((a) => a.id !== analysisId));
      setConfirmDeleteId(null);
    } catch (err: any) {
      console.error('Failed to delete analysis:', err);
      setError('Failed to delete analysis. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setConfirmDeleteId(null);
  };

  const _parseATSResult = (textResult: string): ATSResult => {
    const scoreMatch = textResult.match(/ATS Score: (\d+)\/100/);
    const levelMatch = textResult.match(/Level: (\w+)/);
    const densityMatch = textResult.match(/Keyword Density: ([\d.]+)%/);
    const matchedMatch = textResult.match(/Matched Keywords \((\d+)\):(.*?)(?=Missing Keywords|$)/s);
    const missingMatch = textResult.match(/Missing Keywords \((\d+)\):(.*?)(?=Formatting Issues|$)/s);
    const formattingMatch = textResult.match(/Formatting Issues:(.*?)$/s);
    
    const parseKeywords = (str: string | undefined) => {
      if (!str) return [];
      return str
        .split(',')
        .map(k => k.trim())
        .filter(k => k && !k.includes('...') && k !== 'None')
        .slice(0, 10);
    };

    const parseIssues = (str: string | undefined) => {
      if (!str) return [];
      return str
        .split('•')
        .map(i => i.trim())
        .filter(i => i);
    };
    
    return {
      ats_score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
      level: levelMatch ? levelMatch[1] : 'Unknown',
      keyword_density: densityMatch ? parseFloat(densityMatch[1]) : 0,
      matched_keywords: parseKeywords(matchedMatch?.[2]),
      missing_keywords: parseKeywords(missingMatch?.[2]),
      formatting_issues: parseIssues(formattingMatch?.[1])
    };
  };

  const handleAnalyze = async () => {
    // Validate resume
    if (useManualResume) {
      if (!resumeFile && !resumeUploaded) {
        setError('Please upload a resume first');
        return;
      }
    } else {
      if (!selectedResumeId) {
        setError('Please select a resume');
        return;
      }
    }

    // Validate job description
    if (useManualJD) {
      if (!jobDescription.trim()) {
        setError('Please enter a job description');
        return;
      }
    } else {
      if (!selectedJdId) {
        setError('Please select a job description');
        return;
      }
    }

    setAnalyzing(true);
    setError('');
    setShowResults(false);
    setAtsResult(null);
    setResumeImprovement(null);

    try {
      // Upload resume if needed
      if (useManualResume && resumeFile && !resumeUploaded) {
        await uploadResume(resumeFile);
      }

      // Get job description text
      const jobDescText = useManualJD ? jobDescription : 
        (jobDescriptions.find(jd => jd.id === selectedJdId)?.title || '');

      if (!jobDescText) {
        setError('Job description not found');
        return;
      }

      // Analyze ATS score
      setLoadingATS(true);
      try {
        const atsResponse = await getATSScore(jobDescText);
        const atsTextResult = atsResponse.data.result;
        const atsData = _parseATSResult(atsTextResult);
        setAtsResult(atsData);
      } catch (err) {
        console.error('Failed to calculate ATS score:', err);
      } finally {
        setLoadingATS(false);
      }

      // Analyze resume improvements
      setLoadingImprovement(true);
      try {
        const improvementResponse = await getResumeImprovements(jobDescText);
        setResumeImprovement(improvementResponse.data);
      } catch (err) {
        console.error('Failed to get resume improvements:', err);
      } finally {
        setLoadingImprovement(false);
      }

      setShowResults(true);
      loadPreviousAnalyses();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to analyze resume'
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
            Resume Optimization
          </h1>
          <p style={{ color: 'var(--text)' }}>
            Get ATS compatibility score and powerful resume improvement suggestions
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--heading)' }}>
                Job Description
              </h2>
              {jobDescriptions.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!useManualJD}
                    onChange={(e) => setUseManualJD(!e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm" style={{ color: 'var(--text)' }}>Use saved</span>
                </label>
              )}
            </div>

            {useManualJD ? (
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
            ) : (
              <div className="relative">
                <select
                  value={selectedJdId || ''}
                  onChange={(e) => setSelectedJdId(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--page-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                    '--tw-ring-color': 'var(--primary)',
                  } as any}
                >
                  {jobDescriptions.map((jd) => (
                    <option key={jd.id} value={jd.id}>
                      {jd.title} ({new Date(jd.uploaded_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-3 w-5 h-5 pointer-events-none"
                  style={{ color: 'var(--text)' }}
                />
              </div>
            )}
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--heading)' }}>
                Resume
              </h2>
              {resumes.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!useManualResume}
                    onChange={(e) => setUseManualResume(!e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm" style={{ color: 'var(--text)' }}>Use saved</span>
                </label>
              )}
            </div>

            {useManualResume ? (
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
            ) : (
              <div className="relative">
                <select
                  value={selectedResumeId || ''}
                  onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--page-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                    '--tw-ring-color': 'var(--primary)',
                  } as any}
                >
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.filename} ({new Date(resume.uploaded_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-3 w-5 h-5 pointer-events-none"
                  style={{ color: 'var(--text)' }}
                />
              </div>
            )}
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
            disabled={analyzing || (useManualJD && !jobDescription) || (useManualResume && !resumeFile && !resumeUploaded) || (!useManualJD && !selectedJdId) || (!useManualResume && !selectedResumeId)}
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
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="space-y-6"
            >
              {/* Loading States */}
              {loadingATS && (
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
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-8 h-8 border-2 rounded-full"
                      style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
                    />
                    <p style={{ color: 'var(--text)' }}>📊 Analyzing ATS compatibility...</p>
                  </div>
                </motion.div>
              )}

              {loadingImprovement && (
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
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-8 h-8 border-2 rounded-full"
                      style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
                    />
                    <p style={{ color: 'var(--text)' }}>✨ Generating resume improvements...</p>
                  </div>
                </motion.div>
              )}

              {/* ATS Score Card */}
              {atsResult && (
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
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--heading)' }}>
                    <Award className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                    ATS Score Analysis
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Score Circle */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center"
                    >
                      <div
                        className="relative w-32 h-32 rounded-full flex items-center justify-center text-white shadow-lg"
                        style={{
                          background: atsResult.level === 'Strong' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
                            atsResult.level === 'Moderate' ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' :
                            'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        }}
                      >
                        <svg className="absolute w-32 h-32" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="55" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.2" />
                          <motion.circle
                            cx="60"
                            cy="60"
                            r="55"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={`${(atsResult.ats_score / 100) * (2 * Math.PI * 55)} ${2 * Math.PI * 55}`}
                            strokeLinecap="round"
                            transform="rotate(-90 60 60)"
                            initial={{ strokeDasharray: `0 ${2 * Math.PI * 55}` }}
                            animate={{ strokeDasharray: `${(atsResult.ats_score / 100) * (2 * Math.PI * 55)} ${2 * Math.PI * 55}` }}
                            transition={{ duration: 1.5, ease: 'easeInOut' }}
                          />
                        </svg>
                        <div className="text-center z-10">
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-4xl font-bold"
                          >
                            {atsResult.ats_score}
                          </motion.div>
                          <div className="text-sm opacity-90">/100</div>
                        </div>
                      </div>
                      <div className="mt-4 text-sm font-semibold" style={{ color: 'var(--heading)' }}>
                        {atsResult.level}
                      </div>
                    </motion.div>

                    {/* Keyword Density & Issues */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-4"
                    >
                      <div
                        className="p-4 rounded-lg border"
                        style={{
                          backgroundColor: 'rgba(34, 197, 94, 0.1)',
                          borderColor: 'var(--primary)',
                        }}
                      >
                        <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>Keyword Density</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                          {atsResult.keyword_density}%
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text)' }}>Optimal: 1-3%</p>
                      </div>

                      <div className="text-sm" style={{ color: 'var(--text)' }}>
                        <p className="font-semibold mb-2" style={{ color: 'var(--heading)' }}>Quick Summary:</p>
                        <ul className="space-y-1 text-xs">
                          <li>✓ Matched: {atsResult.matched_keywords.length} keywords</li>
                          <li>✗ Missing: {atsResult.missing_keywords.length} keywords</li>
                          <li>⚠ Issues: {atsResult.formatting_issues.length}</li>
                        </ul>
                      </div>
                    </motion.div>

                    {/* Formatting Issues */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-3"
                    >
                      <h4 className="font-semibold" style={{ color: 'var(--heading)' }}>
                        Formatting Issues
                      </h4>
                      <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
                        {atsResult.formatting_issues.map((issue, idx) => (
                          <div key={idx} className="flex gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#EA8500' }} />
                            <p style={{ color: 'var(--text)' }}>{issue}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  {/* Keywords Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Matched Keywords */}
                    {atsResult.matched_keywords.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <h4 className="font-semibold mb-3" style={{ color: 'var(--heading)' }}>
                          Matched Keywords
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {atsResult.matched_keywords.map((kw, idx) => (
                            <motion.span
                              key={idx}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className="px-3 py-1 rounded-full text-sm font-medium"
                              style={{
                                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                color: 'var(--primary)',
                              }}
                            >
                              {kw}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Missing Keywords */}
                    {atsResult.missing_keywords.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <h4 className="font-semibold mb-3" style={{ color: 'var(--heading)' }}>
                          Missing Keywords
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {atsResult.missing_keywords.map((kw, idx) => (
                            <motion.span
                              key={idx}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className="px-3 py-1 rounded-full text-sm font-medium"
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                color: '#ef4444',
                              }}
                            >
                              {kw}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Resume Improvement Engine */}
              {resumeImprovement && (
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
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--heading)' }}>
                    <Zap className="w-6 h-6" style={{ color: '#f59e0b' }} />
                    Resume Improvement Engine
                  </h2>
                  
                  {/* Improvement Score */}
                  <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid #f59e0b' }}>
                    <div className="flex items-center justify-between mb-2">
                      <p style={{ color: 'var(--text)' }} className="font-semibold">Resume Improvement Score</p>
                      <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{resumeImprovement.improvement_score}/100</p>
                    </div>
                    <p style={{ color: 'var(--text)', fontSize: '0.9rem' }} className="mt-2">{resumeImprovement.summary}</p>
                  </div>

                  {/* Improvement Suggestions */}
                  {resumeImprovement.improvements.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--heading)' }}>
                        💡 {resumeImprovement.total_suggestions} Improvement Suggestions
                      </h3>
                      
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {resumeImprovement.improvements.map((imp, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="border rounded-lg p-4"
                            style={{ borderColor: 'var(--border)', backgroundColor: 'rgba(34, 197, 94, 0.05)' }}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="px-3 py-1 rounded text-xs font-bold whitespace-nowrap mt-0.5"
                                style={{
                                  backgroundColor: imp.category === 'Action Verb' ? 'rgba(59, 130, 246, 0.2)' :
                                    imp.category === 'Weak Language' ? 'rgba(239, 68, 68, 0.2)' :
                                    imp.category === 'Missing Metrics' ? 'rgba(245, 158, 11, 0.2)' :
                                    'rgba(34, 197, 94, 0.2)',
                                  color: imp.category === 'Action Verb' ? '#3b82f6' :
                                    imp.category === 'Weak Language' ? '#ef4444' :
                                    imp.category === 'Missing Metrics' ? '#f59e0b' :
                                    '#22c55e'
                                }}
                              >
                                {imp.category}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>
                                  <span className="line-through opacity-60">{imp.original}</span>
                                </p>
                                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--primary)' }}>
                                  ✨ {imp.improved}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text)', opacity: 0.7 }}>
                                  💬 {imp.impact}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Keywords */}
                  {resumeImprovement.missing_keywords.length > 0 && (
                    <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                      <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--heading)' }}>
                        🎯 Missing Job Keywords ({resumeImprovement.missing_keywords.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {resumeImprovement.missing_keywords.map((kw, idx) => (
                          <motion.span
                            key={idx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="px-3 py-1 rounded-full text-sm font-medium"
                            style={{
                              backgroundColor: 'rgba(245, 158, 11, 0.2)',
                              color: '#f59e0b'
                            }}
                          >
                            {kw}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Previous Analyses Section */}
        {previousAnalyses.length > 0 && !selectedAnalysis && !showResults && (
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
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white ml-2"
                      style={{ backgroundColor: 'var(--primary)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        viewPreviousAnalysis(analysis);
                      }}
                    >
                      View
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white ml-2"
                      style={{ backgroundColor: '#EF4444' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(analysis.id);
                      }}
                      disabled={deletingId === analysis.id}
                    >
                      {deletingId === analysis.id ? 'Deleting...' : 'Delete'}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* View Selected Previous Analysis */}
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
                  Delete Analysis?
                </h3>
                <p className="mb-8" style={{ color: 'var(--text)' }}>
                  Are you sure you want to delete this skill analysis? This action cannot be undone.
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
