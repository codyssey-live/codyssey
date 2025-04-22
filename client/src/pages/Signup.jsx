import { useState } from "react";
import { Link } from "react-router-dom";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add signup logic here
    console.log("Signup form submitted:", formData);
  };

  return (
    <div className="min-h-screen bg-[#141b2d] flex items-center justify-center text-white relative">
      {/* Logo in the upper-left corner */}
      <div className="absolute top-6 left-6">
        <img
          src="/logo.svg"
          alt="Codyssey Logo"
          className="h-20"
        />
      </div>
      <div className="bg-[#1e293b] p-8 rounded-lg shadow-lg border border-gray-700 w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Sign Up</h2>
        <p className="text-sm text-gray-400 mb-6 text-center">
          Join Codyssey and start your journey
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#2d3748] border border-[#4a5568] rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
              placeholder="Enter your name"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#2d3748] border border-[#4a5568] rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#2d3748] border border-[#4a5568] rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
              placeholder="Enter your password"
              required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#2d3748] border border-[#4a5568] rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
              placeholder="Confirm your password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors py-2 rounded-lg text-white font-medium"
          >
            Sign Up
          </button>
        </form>
        <p className="text-sm text-gray-400 mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
