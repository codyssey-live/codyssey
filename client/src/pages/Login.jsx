import { useState } from "react";
import { Link } from "react-router-dom";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add login logic here
    console.log("Login form submitted:", formData);
  };

  return (
    <div className="min-h-screen bg-[#141b2d] flex items-center justify-center text-white relative">
      {/* Logo in the upper-left corner */}
      <div className="absolute top-6 left-6">
        <img
          src="/images/codyssey-removebg-preview.png"
          alt="Codyssey Logo"
          className="h-20"
        />
      </div>
      <div className="bg-[#1e293b] p-8 rounded-lg shadow-lg border border-gray-700 w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Sign in</h2>
        <p className="text-sm text-gray-400 mb-6 text-center">
          Stay updated on your professional world
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email or Phone
            </label>
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#2d3748] border border-[#4a5568] rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
              placeholder="Enter your email or phone"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#2d3748] border border-[#4a5568] rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-400 hover:text-gray-200"
              >
                {showPassword ? "hide" : "show"}
              </button>
            </div>
          </div>
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-blue-400 hover:underline">
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors py-2 rounded-lg text-white font-medium"
          >
            Sign in
          </button>
        </form>
        {/* Thin line separator */}
        <div className="my-4 flex items-center">
          <div className="flex-grow border-t border-gray-600"></div>
          <span className="mx-2 text-sm text-gray-400">or</span>
          <div className="flex-grow border-t border-gray-600"></div>
        </div>
        <button
          type="button"
          className="w-full flex items-center justify-center border border-gray-600 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="h-5 w-5 mr-2"
          />
          Sign in with Google
        </button>
        <p className="text-sm text-gray-400 mt-4 text-center">
          New to LeetRoom?{" "}
          <Link to="/signup" className="text-blue-400 hover:underline">
            Join now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
