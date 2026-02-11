import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  TrendingUp,
  CheckCircle,
  XCircle,
  Lightbulb,
  AlertCircle,
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

export default function SkillAnalysis() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file);
      setResumeUploaded(false);
      setError('');
      
      // Auto-upload resume when file is selected
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
      // If resume file is selected but not uploaded yet, upload it first
      if (resumeFile && !resumeUploaded) {
        await uploadResume(resumeFile);
      }

      // Run skill gap analysis
      // Send job_description in request body for better handling of long text and special characters
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Skill Analysis
          </h1>
          <p className="text-gray-600">
            Upload your resume and job description to get AI-powered insights
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Job Description
            </h2>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full h-64 p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Upload Resume
            </h2>

            <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />

              {resumeFile ? (
                <div className="text-center">
                  <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-800 font-medium">{resumeFile.name}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Click to change file
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-16 h-16 text-gray-400 group-hover:text-blue-500 mx-auto mb-4 transition-colors" />
                  <p className="text-gray-600 font-medium">
                    Click to upload resume
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    PDF, DOC, or DOCX
                  </p>
                </div>
              )}
            </label>
          </motion.div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl"
          >
            {error}
          </motion.div>
        )}

        {resumeUploaded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 border border-green-200 text-green-600 rounded-xl flex items-center space-x-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Resume uploaded successfully!</span>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center"
        >
          <button
            onClick={handleAnalyze}
            disabled={!jobDescription || (!resumeFile && !resumeUploaded) || analyzing}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
          >
            {analyzing ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                >
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
          </button>
        </motion.div>

        <AnimatePresence>
          {showResults && results && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Fit Level</h3>
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <p className="text-4xl font-bold">{results.summary.fit_level}</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      Confidence Score
                    </h3>
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="flex items-end space-x-2 mb-3">
                    <span className="text-4xl font-bold text-gray-800">
                      {results.summary.confidence_score}
                    </span>
                    <span className="text-2xl text-gray-500 mb-1">%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${results.summary.confidence_score}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {results.skills.matched_skills && results.skills.matched_skills.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-2 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <h3 className="text-xl font-semibold text-gray-800">
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
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-medium"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              {results.skills.missing_skills && results.skills.missing_skills.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-2 mb-4">
                    <XCircle className="w-6 h-6 text-orange-500" />
                    <h3 className="text-xl font-semibold text-gray-800">
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
                        className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full font-medium"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}

              {results.recommendations.recommendations && results.recommendations.recommendations.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <Lightbulb className="w-6 h-6 text-amber-600" />
                    <h3 className="text-xl font-semibold text-gray-800">
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
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{rec}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {results.explanation && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Detailed Explanation
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {results.explanation}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
