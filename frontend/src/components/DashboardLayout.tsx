import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  TrendingUp,
  Code,
  LogOut,
  Menu,
  X,
  Database,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/skill-analysis', icon: TrendingUp, label: 'Skill Analysis' },
  { path: '/interview', icon: Code, label: 'Interview Practice' },
  { path: '/data-management', icon: Database, label: 'Document Library' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ backgroundColor: 'var(--page-bg)', minHeight: '100vh' }}>
      {/* Top Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 h-16 z-30 backdrop-blur-sm"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg transition-all"
              style={{ color: 'var(--text)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--page-bg)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {sidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            <div className="flex items-center space-x-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                style={{ background: 'var(--gradient-primary)' }}
              >
                ✓
              </div>
              <span
                className="font-bold text-xl hidden sm:inline"
                style={{ color: 'var(--heading)' }}
              >
                Hiremate
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                {localStorage.getItem('token') ? 'U' : '?'}
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--text)' }}
              >
                {localStorage.getItem('token') ? 'User' : 'Guest'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 transition-transform duration-300 z-20 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderRight: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="flex flex-col h-full p-4">
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all`}
                    style={{
                      backgroundColor: isActive ? 'var(--sidebar-active)' : 'transparent',
                      color: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
                      borderRadius: 'var(--radius-lg)',
                      fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all w-full"
            style={{
              color: 'rgba(255,255,255,0.7)',
              borderRadius: 'var(--radius-lg)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = '#EF4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
            }}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        className="lg:ml-64 mt-16 p-6"
        style={{ minHeight: 'calc(100vh - 64px)' }}
      >
        {children}
      </main>
    </div>
  );
}
