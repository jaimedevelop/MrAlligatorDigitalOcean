import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Wrench, Phone, Users, Settings, FileText, LogIn, LogOut, Calendar, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 min-h-screen bg-blue-900 text-white
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 overflow-y-auto
        `}
      >
        <div className="sticky top-0 p-4">
          <div className="flex items-center gap-2 mb-8">
            <Wrench className="w-8 h-8" />
            <h1 className="text-xl font-bold">Mr. Alligator</h1>
          </div>
          
          <nav className="space-y-2">
            <NavLink
              to="/"
              className={({ isActive }) => 
                `flex items-center gap-2 p-2 rounded hover:bg-blue-800 ${isActive ? 'bg-blue-800' : ''}`
              }
              onClick={closeMobileMenu}
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </NavLink>
            
            <NavLink
              to="/projects"
              className={({ isActive }) => 
                `flex items-center gap-2 p-2 rounded hover:bg-blue-800 ${isActive ? 'bg-blue-800' : ''}`
              }
              onClick={closeMobileMenu}
            >
              <Wrench className="w-5 h-5" />
              <span>Projects</span>
            </NavLink>
            
            <NavLink
              to="/about"
              className={({ isActive }) => 
                `flex items-center gap-2 p-2 rounded hover:bg-blue-800 ${isActive ? 'bg-blue-800' : ''}`
              }
              onClick={closeMobileMenu}
            >
              <Users className="w-5 h-5" />
              <span>About Us</span>
            </NavLink>
            
            <NavLink
              to="/contact"
              className={({ isActive }) => 
                `flex items-center gap-2 p-2 rounded hover:bg-blue-800 ${isActive ? 'bg-blue-800' : ''}`
              }
              onClick={closeMobileMenu}
            >
              <Phone className="w-5 h-5" />
              <span>Contact</span>
            </NavLink>

            <NavLink
              to="/schedule"
              className={({ isActive }) => 
                `flex items-center gap-2 p-2 rounded hover:bg-blue-800 ${isActive ? 'bg-blue-800' : ''}`
              }
              onClick={closeMobileMenu}
            >
              <Calendar className="w-5 h-5" />
              <span>Schedule Service</span>
            </NavLink>

            {user?.isAuthenticated ? (
              <>
                <div className="border-t border-blue-800 my-4"></div>
                <NavLink
                  to="/admin/pages"
                  className={({ isActive }) => 
                    `flex items-center gap-2 p-2 rounded hover:bg-blue-800 ${isActive ? 'bg-blue-800' : ''}`
                  }
                  onClick={closeMobileMenu}
                >
                  <FileText className="w-5 h-5" />
                  <span>Pages</span>
                </NavLink>
                <NavLink
                  to="/admin/projects"
                  className={({ isActive }) => 
                    `flex items-center gap-2 p-2 rounded hover:bg-blue-800 ${isActive ? 'bg-blue-800' : ''}`
                  }
                  onClick={closeMobileMenu}
                >
                  <Wrench className="w-5 h-5" />
                  <span>Projects</span>
                </NavLink>
                <NavLink
                  to="/admin/appointments"
                  className={({ isActive }) => 
                    `flex items-center gap-2 p-2 rounded hover:bg-blue-800 ${isActive ? 'bg-blue-800' : ''}`
                  }
                  onClick={closeMobileMenu}
                >
                  <Calendar className="w-5 h-5" />
                  <span>Appointments</span>
                </NavLink>
                <NavLink
                  to="/admin/appointment-settings"
                  className={({ isActive }) => 
                    `flex items-center gap-2 p-2 rounded hover:bg-blue-800 ${isActive ? 'bg-blue-800' : ''}`
                  }
                  onClick={closeMobileMenu}
                >
                  <Settings className="w-5 h-5" />
                  <span>Scheduling Settings</span>
                </NavLink>
                <NavLink
                  to="/admin/settings"
                  className={({ isActive }) => 
                    `flex items-center gap-2 p-2 rounded hover:bg-blue-800 ${isActive ? 'bg-blue-800' : ''}`
                  }
                  onClick={closeMobileMenu}
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 p-2 rounded hover:bg-blue-800 w-full text-left text-red-300 hover:text-red-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) => 
                  `flex items-center gap-2 p-2 rounded hover:bg-blue-800 ${isActive ? 'bg-blue-800' : ''} mt-4 text-blue-300 hover:text-blue-200`
                }
                onClick={closeMobileMenu}
              >
                <LogIn className="w-5 h-5" />
                <span>Login</span>
              </NavLink>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
}