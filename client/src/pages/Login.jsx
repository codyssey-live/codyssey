import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import apiClient from '../utils/apiClient';

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the intended destination from location state, or default to dashboard
  const from = location.state?.from?.pathname || "/dashboard";
  const returnTo = location.state?.returnTo || "/dashboard";

  // Check for success message from signup
  useEffect(() => {
    if (location.state?.signupSuccess) {
      setSuccessMessage(location.state.message);
      // Clean up the location state to prevent message reappearing on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Use apiClient with credentials to allow cookie setting
      const response = await apiClient.post('/auth/login', { 
        email: formData.email, 
        password: formData.password 
      });
      
      // Store user name and ID in localStorage
      if (response.data && response.data.user) {
        if (response.data.user.name) {
          localStorage.setItem('userName', response.data.user.name);
        }
        
        if (response.data.user.id) {
          localStorage.setItem('userId', response.data.user.id);
        }
        
        // Store the token in localStorage for client-side authentication
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
      }
      
      // Clear any existing room info to prevent automatic room creation on login
      localStorage.removeItem('roomInfo');
      
      // Navigate to the intended destination or return path
      const returnPath = location.state?.returnTo || location.state?.from?.pathname || '/dashboard';
      const redirectPath = returnPath !== '/login' && returnPath !== '/signup' && 
                       returnPath !== '/forgot-password' ? returnPath : '/dashboard';
                        
      navigate(redirectPath, { replace: true });
      
    } catch (err) {
      // Extract error message from the response
      const errorMessage = err.response?.data?.message || 'An error occurred during login. Please try again.';
      console.error('Login error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Background gradient like signup page */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#334155] to-[#0f172a]"></div>
      
      {/* Animated background elements */}
      <motion.div 
        className="absolute opacity-5 top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#94C3D2]"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.05, 0.08, 0.05]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 8,
          ease: "easeInOut" 
        }}
      />
      
      <motion.div 
        className="absolute opacity-10 bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-[#94C3D2]"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.15, 0.1]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 10,
          ease: "easeInOut",
          delay: 1
        }}
      />
      
      {/* Logo in the upper-left corner */}
      <div className="absolute top-6 left-6 z-10">
        <motion.img
          src="/logo.svg"
          alt="Codyssey Logo"
          className="h-20"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            filter: "drop-shadow(0 0 8px rgba(148, 195, 210, 0.6))",
          }}
        />
      </div>

      <motion.div 
        className="w-full max-w-md px-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-white/20">
          <div className="px-8 pt-10 pb-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold mb-1 text-center bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Sign in to your account</h2>
              <p className="text-[#94C3D2]/90 mb-6 text-center text-sm">
                Welcome back to Codyssey
              </p>
            </motion.div>
            
            {/* Display success message */}
            {successMessage && (
              <motion.div 
                className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded relative mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="block sm:inline">{successMessage}</span>
              </motion.div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <label htmlFor="email" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100 placeholder-gray-400"
                    placeholder="Email"
                    required
                  />
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-[#94C3D2]">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs text-[#94C3D2] hover:text-[#7EB5C3] hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100 placeholder-gray-400"
                    placeholder="Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </motion.div>
              
              {/* Error display */}
              {error && (
                <motion.div 
                  className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded relative"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="block sm:inline">{error}</span>
                </motion.div>
              )}
              
              <button
                type="submit"
                className="w-full bg-[#94C3D2] hover:bg-[#7EB5C3] transition-all py-3 rounded-lg text-white font-medium shadow-lg mt-2 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                {!loading && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </form>
          </div>
          
          <div className="px-8 pb-8">
            <motion.p 
              className="text-sm font-medium text-white/95 text-center tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}
            >
              New to Codyssey?{" "}
              <Link to="/signup" className="text-[#94C3D2] hover:text-[#7EB5C3] hover:underline font-medium">
                Create an account
              </Link>
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
