import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import apiClient from '../utils/apiClient'; // Import the API client instead of axios

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validate password complexity on client side
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/~`]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must be at least 8 characters long and include letters, numbers, and at least one special character');
      setLoading(false);
      return;
    }
    
    // Validate if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      // API call to register user
      await apiClient.post('/auth/signup', formData);
      
      // Navigate to login page with success message
      navigate('/login', { 
        replace: true,
        state: { 
          signupSuccess: true,
          message: 'Account created successfully! Please login with your credentials.' 
        }
      });
      
    } catch (err) {
      // Extract error message from the response
      const errorMessage = err.response?.data?.message || 'An error occurred during signup. Please try again.';
      
      // Set the error state
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      {/* Background gradient like home page section 3 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#334155] to-[#0f172a]"></div>
      
      {/* Animated background elements */}
      <motion.div 
        className="absolute opacity-5 top-1/4 left-1/4 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-[#94C3D2]"
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
        className="absolute opacity-10 bottom-1/4 right-1/4 w-48 sm:w-72 h-48 sm:h-72 rounded-full bg-[#94C3D2]"
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
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10">
        <Link to="/">
          <motion.img
            src="/logo.svg"
            alt="Codyssey Logo"
            className="h-12 sm:h-16 md:h-20"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              filter: "drop-shadow(0 0 8px rgba(148, 195, 210, 0.6))",
            }}
          />
        </Link>
      </div>      <motion.div 
        className="w-full max-w-md px-4 sm:px-6 mt-10 sm:mt-0"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-white/20">
          <div className="px-4 sm:px-8 pt-6 sm:pt-8 md:pt-10 pb-5 sm:pb-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-1 text-center bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Create your account</h2>
              <p className="text-[#94C3D2]/90 mb-6 text-center text-xs sm:text-sm">
                Join Codyssey to start your coding journey
              </p>
            </motion.div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <label htmlFor="name" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100 placeholder-gray-400"
                    placeholder="Full Name"
                    required
                  />
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
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
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <label htmlFor="password" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100 placeholder-gray-400"                    placeholder="Password (min. 8 characters)"
                    minLength="8"
                    required
                  />
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100 placeholder-gray-400"
                    placeholder="Confirm Password"
                    required
                  />
                </div>
              </motion.div>
              
              {/* Error display remains the same */}
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
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                {!loading && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </form>
          </div>
          
          <div className="px-4 sm:px-8 pb-6 sm:pb-8">
            <motion.p 
              className="text-xs sm:text-sm font-medium text-white/95 text-center tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}
            >
              Already have an account?{" "}
              <Link to="/login" className="text-[#94C3D2] hover:text-[#7EB5C3] hover:underline font-medium">
                Sign in
              </Link>
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
