import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Add logic to handle password reset
    console.log("Password reset request submitted for:", email);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 2000);
  };

  const handleResend = () => {
    setResendLoading(true);
    // Add logic to handle resending email
    console.log("Resend password reset request for:", email);
    setTimeout(() => {
      setResendLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Background gradient like login/signup pages */}
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
              <h2 className="text-2xl font-bold mb-1 text-center bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">Reset Password</h2>
              <p className="text-[#94C3D2]/90 mb-6 text-center text-sm">
                Enter your email to receive a password reset link
              </p>
            </motion.div>
            
            {!submitted ? (
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100 placeholder-gray-400"
                      placeholder="Email"
                      required
                    />
                  </div>
                </motion.div>
                
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
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : null}
                  <span className="group-hover:translate-x-0.5 transition-transform">{isLoading ? 'Sending...' : 'Send Reset Link'}</span>
                  {!isLoading && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center py-2"
              >
                <div className="mb-4">
                  <svg className="w-16 h-16 text-[#94C3D2] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Check your email</h3>
                <p className="text-gray-300 mb-4">
                  We've sent a password reset link to <span className="text-[#94C3D2] font-medium">{email}</span>
                </p>
                <button
                  onClick={handleResend}
                  className="text-[#94C3D2] hover:text-[#7EB5C3] font-medium flex items-center justify-center mx-auto"
                  disabled={resendLoading}
                >
                  {resendLoading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  {resendLoading ? 'Sending...' : 'Resend email'}
                </button>
              </motion.div>
            )}
          </div>
          
          <div className="px-8 pb-8">
            <motion.p 
              className="text-sm font-medium text-white/95 text-center tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}
            >
              Remembered your password?{" "}
              <Link to="/login" className="text-[#94C3D2] hover:text-[#7EB5C3] hover:underline font-medium">
                Back to Login
              </Link>
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
