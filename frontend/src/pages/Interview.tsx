import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Code, MessageSquare, ArrowRight } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

export default function Interview() {
  const navigate = useNavigate();

  const interviewTypes = [
    {
      title: 'Programming Interview',
      description:
        'Practice data structures, algorithms, and problem-solving with our AI interviewer',
      icon: Code,
      path: '/interview/programming',
      available: true,
    },
    {
      title: 'HR / Behavioral',
      description:
        'Prepare for behavioral questions and improve your communication skills',
      icon: MessageSquare,
      path: '/interview/behavioral',
      available: true,
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--heading)' }}>
            Interview Practice
          </h1>
          <p style={{ color: 'var(--text)' }}>
            Choose an interview type to start practicing with AI
          </p>
        </motion.div>

        {/* Interview Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {interviewTypes.map((type, index) => {
            const Icon = type.icon;

            return (
              <motion.div
                key={type.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative ${!type.available ? 'opacity-60' : ''}`}
              >
                <button
                  onClick={() => type.available && navigate(type.path)}
                  disabled={!type.available}
                  className="w-full rounded-2xl p-8 border text-left transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  onMouseEnter={(e) => {
                    if (type.available) {
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (type.available) {
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    <Icon className="w-8 h-8" />
                  </div>

                  <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--heading)' }}>
                    {type.title}
                  </h2>
                  <p className="mb-6" style={{ color: 'var(--text)' }}>
                    {type.description}
                  </p>

                  {type.available ? (
                    <div
                      className="flex items-center font-semibold group"
                      style={{ color: 'var(--primary)' }}
                    >
                      <span>Start Practice</span>
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  ) : (
                    <div
                      className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium"
                      style={{
                        backgroundColor: 'var(--page-bg)',
                        color: 'var(--text)',
                      }}
                    >
                      Coming Soon
                    </div>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-8 border"
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.05)',
            borderColor: 'var(--primary)',
          }}
        >
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--heading)' }}>
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Choose Interview Type',
                description: 'Select programming or behavioral interview based on your needs',
              },
              {
                step: '2',
                title: 'Answer Questions',
                description: 'Respond to AI-generated questions tailored to your level',
              },
              {
                step: '3',
                title: 'Get Feedback',
                description: 'Receive instant AI feedback to improve your performance',
              },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div
                  className="w-12 h-12 rounded-full text-white flex items-center justify-center font-bold text-lg mb-3"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--heading)' }}>
                  {item.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--text)' }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
