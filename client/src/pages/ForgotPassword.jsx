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
    <div className="min-h-screen bg-[#E8F1F7] flex items-center justify-center relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-pattern opacity-[0.03] pointer-events-none"></div>
      
      {/* Gradient overlays */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-white/30 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-white/30 to-transparent pointer-events-none"></div>
      
      {/* Decorative circles */}
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#94C3D2]/10 filter blur-3xl pointer-events-none"></div>
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#94C3D2]/10 filter blur-3xl pointer-events-none"></div>
      
      {/* Logo in the upper-left corner */}
      <div className="absolute top-6 left-6 z-10">
        <motion.img
          src="/logo.svg"
          alt="Codyssey Logo"
          className="h-14"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <motion.div 
        className="w-full max-w-md px-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/40">
          <div className="px-8 pt-10 pb-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-1 text-center">Reset Password</h2>
              <p className="text-gray-500 mb-6 text-center text-sm">
                Enter your email to receive a password reset link
              </p>
            </motion.div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#E8F1F7] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#94C3D2]/50 focus:border-[#94C3D2] text-gray-800 placeholder-gray-400"
                    placeholder="Email"
                    required
                  />
                </div>
              </motion.div>
              
              <motion.button
                type="submit"
                className="w-full bg-[#94C3D2] hover:opacity-90 transition-all py-3 rounded-lg text-white font-medium shadow-lg mt-2 flex items-center justify-center group"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <span className="group-hover:translate-x-0.5 transition-transform">Send Reset Link</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </motion.button>
            </form>
          </div>
          
          <div className="px-8 pb-8">
            <motion.p 
              className="text-sm text-gray-500 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
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
