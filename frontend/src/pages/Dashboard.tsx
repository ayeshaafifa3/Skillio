import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Code,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { api } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        // If token is invalid, redirect to login
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const colorMap: Record<string, string> = {
    blue: 'from-blue-400 to-blue-500',
    cyan: 'from-cyan-400 to-cyan-500',
    teal: 'from-teal-400 to-teal-500',
  };

  const stats = [
    { label: 'Skills Analyzed', value: '0', icon: TrendingUp, color: 'blue' },
    { label: 'Interviews Taken', value: '0', icon: Code, color: 'cyan' },
    { label: 'Resumes Scanned', value: '0', icon: FileText, color: 'teal' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome Back{user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p className="text-gray-600">
            Ready to boost your career with AI-powered insights?
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[stat.color]} flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-8 text-white shadow-xl"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Start Skill Analysis
                </h2>
                <p className="text-blue-100">
                  Upload your resume and get AI-powered insights on your skills
                  match
                </p>
              </div>
              <TrendingUp className="w-12 h-12 opacity-50" />
            </div>

            <button
              onClick={() => navigate('/skill-analysis')}
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2 group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Resume Status
                </h2>
                <p className="text-gray-600">Track your resume analysis</p>
              </div>
              <FileText className="w-12 h-12 text-gray-300" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <span className="text-orange-700 font-medium">
                  No resume uploaded yet
                </span>
              </div>

              <button
                onClick={() => navigate('/skill-analysis')}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Upload Resume
              </button>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/skill-analysis')}
              className="flex items-center space-x-4 p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                  Analyze Skills
                </h3>
                <p className="text-sm text-gray-600">
                  Match your resume with job requirements
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate('/interview')}
              className="flex items-center space-x-4 p-6 border-2 border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all text-left group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-xl flex items-center justify-center">
                <Code className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 group-hover:text-teal-600 transition-colors">
                  Start Interview
                </h3>
                <p className="text-sm text-gray-600">
                  Practice coding with AI interviewer
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
