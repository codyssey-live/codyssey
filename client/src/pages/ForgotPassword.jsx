import { useState } from "react";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add logic to handle password reset
    console.log("Password reset request submitted for:", email);
  };

  return (
    <div className="min-h-screen bg-[#141b2d] flex items-center justify-center text-white relative">
      {/* Logo in the upper-left corner */}
      <div className="absolute top-6 left-6">
        <img
          src="/images/codyssey-removebg-preview.png"
          alt="Codyssey Logo"
          className="h-10"
        />
      </div>
      <div className="bg-[#1e293b] p-8 rounded-lg shadow-lg border border-gray-700 w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Forgot Password</h2>
        <p className="text-sm text-gray-400 mb-6 text-center">
          Enter your email to reset your password
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-[#2d3748] border border-[#4a5568] rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
              placeholder="Enter your email"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors py-2 rounded-lg text-white font-medium"
          >
            Send Reset Link
          </button>
        </form>
        <p className="text-sm text-gray-400 mt-4 text-center">
          Remembered your password?{" "}
          <Link to="/login" className="text-blue-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
