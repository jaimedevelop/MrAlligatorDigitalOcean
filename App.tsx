import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { InstallPWAPrompt } from './components/InstallPWAPrompt';
import { PrivateRoute } from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/admin/SettingsPage';
import PagesPage from './pages/admin/PagesPage';
import PageEditor from './pages/admin/PageEditor';
import AppointmentsPage from './pages/admin/AppointmentsPage';
import AppointmentSettingsPage from './pages/admin/AppointmentSettingsPage';
import HomePage from './pages/HomePage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import AboutUsPage from './pages/AboutUsPage';
import ContactPage from './pages/ContactPage';
import SchedulePage from './pages/SchedulePage';
import ProjectsManagementPage from './pages/admin/ProjectsManagementPage';

// Import Firebase utilities and admin setup - FIXED IMPORTS
import { app } from './utils/firebase'; // This imports from the index.js file we created
import { initializeAdminUser } from './utils/adminSetup'; // Fixed relative path
import { useInitAuth } from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      onError: (error) => {
        console.error('Query error:', error);
      }
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
      }
    }
  }
});

console.log('App initializing with screen dimensions:', {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
});

function App() {
  // Initialize Firebase Auth state
  useInitAuth();
  
  useEffect(() => {
    console.log('App mounted');
    
    // Initialize admin user when the app starts
    initializeAdminUser()
      .then(result => {
        console.log('Admin initialization result:', result);
      })
      .catch(error => {
        console.error('Admin initialization error:', error);
      });
    
    const handleResize = () => {
      console.log('Window resized:', {
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ErrorBoundary>
          <Router>
            <div className="min-h-screen flex flex-col lg:flex-row">
              <Sidebar />
              <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 w-full">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:id" element={<ProjectDetailsPage />} />
                  <Route path="/about" element={<AboutUsPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/schedule" element={<SchedulePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/admin/settings"
                    element={
                      <PrivateRoute>
                        <SettingsPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/pages"
                    element={
                      <PrivateRoute>
                        <PagesPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/pages/:id"
                    element={
                      <PrivateRoute>
                        <PageEditor />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/appointments"
                    element={
                      <PrivateRoute>
                        <AppointmentsPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/appointment-settings"
                    element={
                      <PrivateRoute>
                        <AppointmentSettingsPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/projects"
                    element={
                      <PrivateRoute>
                        <ProjectsManagementPage />
                      </PrivateRoute>
                    }
                  />
                </Routes>
              </main>
              <InstallPWAPrompt />
            </div>
          </Router>
        </ErrorBoundary>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;