import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { api } from '../services/api';

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return '';
  };

  const validateConfirmPassword = (pwd: string, confirm: string) => {
    if (pwd !== confirm && confirm.length > 0) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const error = validatePassword(value);
    setErrors((prev) => ({ ...prev, password: error }));

    if (confirmPassword) {
      const confirmError = validateConfirmPassword(value, confirmPassword);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    const error = validateConfirmPassword(password, value);
    setErrors((prev) => ({ ...prev, confirmPassword: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!name) newErrors.name = 'Name is required';
    if (!email) newErrors.email = 'Email is required';

    const pwdError = validatePassword(password);
    if (pwdError) newErrors.password = pwdError;

    const confirmError = validateConfirmPassword(password, confirmPassword);
    if (confirmError) newErrors.confirmPassword = confirmError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await api.post('/auth/signup', {
        name,
        email,
        password,
      });

      // After successful signup, automatically login
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      // Don't set Content-Type header - axios will set it automatically with boundary
      const loginResponse = await api.post('/auth/login', formData);

      // Store token
      const token = loginResponse.data.access_token;
      localStorage.setItem('token', token);

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Signup failed. Please try again.';
      setErrors({ submit: errorMessage });
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl text-white shadow-lg"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <UserPlus className="w-8 h-8" />
          </motion.div>
          <h2 className="text-3xl font-bold" style={{ color: 'var(--heading)' }}>
            Create Account
          </h2>
          <p className="mt-2" style={{ color: 'var(--text)' }}>
            Join us and start your journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text)' }}
            >
              Name
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                style={{ color: 'var(--text)' }}
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                }}
                placeholder="John Doe"
              />
            </div>
            {errors.name && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs mt-1"
                style={{ color: '#DC2626' }}
              >
                {errors.name}
              </motion.p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text)' }}
            >
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                style={{ color: 'var(--text)' }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                }}
                placeholder="your@email.com"
              />
            </div>
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs mt-1"
                style={{ color: '#DC2626' }}
              >
                {errors.email}
              </motion.p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text)' }}
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                style={{ color: 'var(--text)' }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                }}
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs mt-1"
                style={{ color: '#DC2626' }}
              >
                {errors.password}
              </motion.p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text)' }}
            >
              Confirm Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                style={{ color: 'var(--text)' }}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                }}
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs mt-1"
                style={{ color: '#DC2626' }}
              >
                {errors.confirmPassword}
              </motion.p>
            )}
          </div>

          {errors.submit && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 border rounded-xl text-sm"
              style={{
                backgroundColor: '#FEE2E2',
                borderColor: '#FCA5A5',
                color: '#DC2626',
              }}
            >
              {errors.submit}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--gradient-primary)' }}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
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
                Creating account...
              </span>
            ) : (
              'Sign Up'
            )}
          </motion.button>
        </form>

        <div className="text-center text-sm" style={{ color: 'var(--text)' }}>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold transition-colors hover:opacity-80"
            style={{ color: 'var(--primary)' }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
