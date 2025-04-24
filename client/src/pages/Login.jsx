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
    <div className="min-h-screen bg-[#E8F1F7] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800">Login</h1>
          <p className="mt-3 text-gray-600">Sign in to your account to continue</p>
        </div>
        
        <div className="bg-[#dbeafe] rounded-lg shadow-lg p-8 border border-gray-200">
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
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-sm text-[#94C3D2] hover:underline">Forgot password?</Link>
              </div>
              <input 
                id="password"
                type="password" 
                className="w-full px-4 py-2.5 bg-[#E8F1F7] border border-gray-200 rounded-lg focus:ring-[#94C3D2] focus:border-[#94C3D2] text-gray-800"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 text-[#94C3D2] focus:ring-[#94C3D2] border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="ml-2 text-gray-600 text-sm">Remember me</span>
              </label>
            </div>
            
            <button 
              type="submit"
              className="w-full bg-[#94C3D2] text-white py-3 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
            
            <div className="mt-8 text-center">
              <span className="text-gray-600">Don't have an account?</span>
              <Link to="/signup" className="text-[#94C3D2] ml-1 hover:underline">Create one</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
