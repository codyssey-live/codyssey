import { useState } from "react";
import { Link } from "react-router-dom";

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
    <div className="min-h-screen bg-[#E8F1F7] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800">Forgot Password</h1>
          <p className="mt-3 text-gray-600">Enter your email to reset your password</p>
        </div>
        
        <div className="bg-[#dbeafe] rounded-lg shadow-lg p-8 border border-gray-200">
          {!submitted ? (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
              
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  id="email"
                  type="email" 
                  className="w-full px-4 py-2.5 bg-[#E8F1F7] border border-gray-200 rounded-lg focus:ring-[#94C3D2] focus:border-[#94C3D2] text-gray-800"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <button 
                type="submit"
                className="w-full bg-[#94C3D2] text-white py-3 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 mb-6">
                <p>We've sent a password reset link to</p>
                <p className="font-semibold">{email}</p>
              </div>
              <p className="text-gray-600 mb-6">If you don't see the email, check other places it might be, like your junk, spam, or other folders.</p>
              <button 
                onClick={handleResend}
                className="w-full bg-[#94C3D2] text-white py-3 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
                disabled={resendLoading}
              >
                {resendLoading ? 'Sending...' : 'Resend Email'}
              </button>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <Link to="/login" className="text-[#94C3D2] hover:underline">Back to Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
