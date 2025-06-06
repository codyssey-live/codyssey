import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import apiClient from '../utils/apiClient';

const ForgotPassword = () => {
  // State variables for the multi-step process
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1: Email entry, 2: Code verification, 3: New password entry
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  
  // Step 1: Request password reset code
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      setStep(2); // Move to code verification step
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Step 2: Verify the reset code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post('/auth/verify-reset-code', { 
        email, 
        code: verificationCode 
      });
      setStep(3); // Move to new password entry step
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Step 3: Reset password with verified code
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Validate password match on frontend
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
      // Validate password complexity
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/~`]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError('Password must be at least 8 characters long and include letters, numbers, and at least one special character');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await apiClient.post('/auth/reset-password', {
        email,
        code: verificationCode,
        newPassword,
        confirmPassword
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to resend verification code
  const handleResend = async () => {
    setResendLoading(true);
    setError(null);
    
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };
  
  // Function to go back to previous step
  const handleBack = () => {
    setStep(step - 1);
    setError(null);
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
          <div className="px-8 pt-10 pb-6">            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold mb-1 text-center bg-gradient-to-r from-white to-[#94C3D2] bg-clip-text text-transparent">
                {step === 1 && "Reset Password"}
                {step === 2 && "Verify Code"}
                {step === 3 && "Create New Password"}
                {success && "Password Reset Complete"}
              </h2>
              <p className="text-[#94C3D2]/90 mb-6 text-center text-sm">
                {step === 1 && "Enter your email to receive a verification code"}
                {step === 2 && "Enter the 6-digit code sent to your email"}
                
                {success && "Your password has been reset successfully"}
              </p>
            </motion.div>
            
            {/* Step 1: Email Entry Form */}
            {step === 1 && (
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
                  <span className="group-hover:translate-x-0.5 transition-transform">{isLoading ? 'Sending...' : 'Send Verification Code'}</span>
                  {!isLoading && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </form>
            )}
            
            {/* Step 2: Code Verification Form */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      id="code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                      maxLength={6}
                      className="w-full px-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100 placeholder-gray-400 text-center tracking-widest text-xl"
                      placeholder="000000"
                      required
                    />
                  </div>
                  
                  {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded relative">
                      <span className="block sm:inline">{error}</span>
                    </div>
                  )}
                  
                  <div className="flex flex-col space-y-3">
                    <button
                      type="submit"
                      className="w-full bg-[#94C3D2] hover:bg-[#7EB5C3] transition-all py-3 rounded-lg text-white font-medium shadow-lg flex items-center justify-center"
                      disabled={isLoading || verificationCode.length !== 6}
                    >
                      {isLoading ? (
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : null}
                      <span>Verify Code</span>
                    </button>
                    
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="text-[#94C3D2] hover:text-[#7EB5C3] text-sm"
                      >
                        Back to Email
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleResend}
                        className="text-[#94C3D2] hover:text-[#7EB5C3] text-sm flex items-center"
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
                        {resendLoading ? 'Sending...' : 'Resend Code'}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
            
            {/* Step 3: New Password Form */}
            {step === 3 && !success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100 placeholder-gray-400"                        placeholder="New password (min. 8 characters)"
                        minLength={8}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#94C3D2] mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#2d3748] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-100 placeholder-gray-400"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                  </div>
                  
                  {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded relative">
                      <span className="block sm:inline">{error}</span>
                    </div>
                  )}
                  
                  <div className="flex flex-col space-y-3">
                    <button
                      type="submit"
                      className="w-full bg-[#94C3D2] hover:bg-[#7EB5C3] transition-all py-3 rounded-lg text-white font-medium shadow-lg flex items-center justify-center"
                      disabled={isLoading || !newPassword || !confirmPassword}
                    >
                      {isLoading ? (
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : null}
                      <span>Reset Password</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
            
            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center py-2"
              >
                <div className="mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-green-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Password Reset Successful</h3>
                <p className="text-gray-300 mb-6">
                  Your password has been successfully reset.
                </p>
                <Link
                  to="/login"
                  className="w-full inline-block bg-[#94C3D2] hover:bg-[#7EB5C3] transition-all py-3 rounded-lg text-white font-medium shadow-lg"
                >
                  Go to Login
                </Link>
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
