import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import SkillAnalysis from './pages/SkillAnalysis';
import Interview from './pages/Interview';
import ProgrammingInterview from './pages/ProgrammingInterview';
import HRInterview from './pages/HRInterview';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/skill-analysis"
          element={
            <ProtectedRoute>
              <SkillAnalysis />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview"
          element={
            <ProtectedRoute>
              <Interview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview/programming"
          element={
            <ProtectedRoute>
              <ProgrammingInterview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview/behavioral"
          element={
            <ProtectedRoute>
              <HRInterview />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
