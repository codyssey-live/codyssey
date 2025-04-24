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
    <div className="min-h-screen bg-[#E8F1F7] flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800">Create Account</h1>
          <p className="mt-3 text-gray-600">Join our coding community today</p>
        </div>
        
        <div className="bg-[#dbeafe] rounded-lg shadow-lg p-8 border border-gray-200">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input 
                  id="firstName"
                  type="text" 
                  className="w-full px-4 py-2.5 bg-[#E8F1F7] border border-gray-200 rounded-lg focus:ring-[#94C3D2] focus:border-[#94C3D2] text-gray-800"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input 
                  id="lastName"
                  type="text" 
                  className="w-full px-4 py-2.5 bg-[#E8F1F7] border border-gray-200 rounded-lg focus:ring-[#94C3D2] focus:border-[#94C3D2] text-gray-800"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                id="password"
                type="password" 
                className="w-full px-4 py-2.5 bg-[#E8F1F7] border border-gray-200 rounded-lg focus:ring-[#94C3D2] focus:border-[#94C3D2] text-gray-800"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="mt-1 text-sm text-gray-500">Must be at least 8 characters with mixed case and numbers</p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input 
                id="confirmPassword"
                type="password" 
                className="w-full px-4 py-2.5 bg-[#E8F1F7] border border-gray-200 rounded-lg focus:ring-[#94C3D2] focus:border-[#94C3D2] text-gray-800"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 text-[#94C3D2] focus:ring-[#94C3D2] border-gray-300 rounded"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  required
                />
                <span className="ml-2 text-gray-600 text-sm">I agree to the <a href="#" className="text-[#94C3D2] hover:underline">Terms of Service</a> and <a href="#" className="text-[#94C3D2] hover:underline">Privacy Policy</a></span>
              </label>
            </div>
            
            <button 
              type="submit"
              className="w-full bg-[#94C3D2] text-white py-3 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
              disabled={isLoading || !agreeToTerms}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
            
            <div className="mt-8 text-center">
              <span className="text-gray-600">Already have an account?</span>
              <Link to="/login" className="text-[#94C3D2] ml-1 hover:underline">Sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
