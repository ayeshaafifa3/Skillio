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
      color: 'from-blue-500 to-cyan-500',
      path: '/interview/programming',
      available: true,
    },
    {
      title: 'HR / Behavioral',
      description:
        'Prepare for behavioral questions and improve your communication skills',
      icon: MessageSquare,
      color: 'from-teal-500 to-green-500',
      path: '/interview/behavioral',
      available: true,
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Interview Practice
          </h1>
          <p className="text-gray-600">
            Choose an interview type to start practicing with AI
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {interviewTypes.map((type, index) => {
            const Icon = type.icon;

            return (
              <motion.div
                key={type.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative ${
                  !type.available ? 'opacity-60' : ''
                }`}
              >
                <div
                  className={`bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all ${
                    type.available ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                  onClick={() => type.available && navigate(type.path)}
                >
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-6`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    {type.title}
                  </h2>
                  <p className="text-gray-600 mb-6">{type.description}</p>

                  {type.available ? (
                    <div className="flex items-center text-blue-600 font-semibold group">
                      <span>Start Practice</span>
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  ) : (
                    <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium">
                      Coming Soon
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg mb-3">
                1
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Choose Interview Type
              </h3>
              <p className="text-sm text-gray-600">
                Select programming or behavioral interview based on your needs
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-lg mb-3">
                2
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Answer Questions
              </h3>
              <p className="text-sm text-gray-600">
                Respond to AI-generated questions tailored to your level
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-lg mb-3">
                3
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Get Feedback
              </h3>
              <p className="text-sm text-gray-600">
                Receive instant AI feedback to improve your performance
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
