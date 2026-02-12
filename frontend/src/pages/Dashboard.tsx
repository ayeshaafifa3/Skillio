import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Code,
  FileText,
  AlertCircle,
  ArrowRight,
  Database,
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
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const stats = [
    { label: 'Skills Analyzed', value: '0', icon: TrendingUp },
    { label: 'Interviews Taken', value: '0', icon: Code },
    { label: 'Resumes Scanned', value: '0', icon: FileText },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderBottomColor: 'var(--primary)' }}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--heading)' }}>
            Welcome Back{user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p style={{ color: 'var(--text)' }}>
            Ready to boost your career with AI-powered insights?
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-2xl p-6 border transition-all"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm mb-1" style={{ color: 'var(--text)' }}>
                      {stat.label}
                    </p>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: 'var(--heading)' }}
                    >
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Main CTA Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skill Analysis Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl p-8 text-white shadow-lg"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Start Skill Analysis
                </h2>
                <p className="opacity-90">
                  Upload your resume and get AI-powered insights on your skills match
                </p>
              </div>
              <TrendingUp className="w-12 h-12 opacity-50" />
            </div>

            <button
              onClick={() => navigate('/skill-analysis')}
              className="text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2 group border border-white border-opacity-30"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Resume Status Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-2xl p-8 border transition-all"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--heading)' }}>
                  Resume Status
                </h2>
                <p style={{ color: 'var(--text)' }}>Track your resume analysis</p>
              </div>
              <FileText className="w-12 h-12 opacity-30" />
            </div>

            <div className="space-y-4">
              <div
                className="flex items-center space-x-3 p-4 border rounded-xl"
                style={{
                  backgroundColor: '#FEF3C7',
                  borderColor: '#FBBF24',
                  color: '#92400E',
                }}
              >
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">No resume uploaded yet</span>
              </div>

              <button
                onClick={() => navigate('/skill-analysis')}
                className="w-full py-3 rounded-xl font-medium transition-all"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--primary)';
                }}
              >
                Upload Resume
              </button>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-2xl p-8 border transition-all"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--heading)' }}>
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Skills Analysis Button */}
            <button
              onClick={() => navigate('/skill-analysis')}
              className="flex items-center space-x-4 p-6 border-2 rounded-xl text-left group transition-all"
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
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3
                  className="font-semibold group-hover:transition-colors"
                  style={{ color: 'var(--heading)' }}
                >
                  Analyze Skills
                </h3>
                <p className="text-sm" style={{ color: 'var(--text)' }}>
                  Match your resume with job requirements
                </p>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-all opacity-50" />
            </button>

            {/* Interview Button */}
            <button
              onClick={() => navigate('/interview')}
              className="flex items-center space-x-4 p-6 border-2 rounded-xl text-left group transition-all"
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
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <Code className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3
                  className="font-semibold group-hover:transition-colors"
                  style={{ color: 'var(--heading)' }}
                >
                  Start Interview
                </h3>
                <p className="text-sm" style={{ color: 'var(--text)' }}>
                  Practice with AI interviewer
                </p>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-all opacity-50" />
            </button>

            {/* Data Management Button */}
            <button
              onClick={() => navigate('/data-management')}
              className="flex items-center space-x-4 p-6 border-2 rounded-xl text-left group transition-all"
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
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <Database className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3
                  className="font-semibold group-hover:transition-colors"
                  style={{ color: 'var(--heading)' }}
                >
                  Document Library
                </h3>
                <p className="text-sm" style={{ color: 'var(--text)' }}>
                  Manage your resumes and job descriptions
                </p>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-all opacity-50" />
            </button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
