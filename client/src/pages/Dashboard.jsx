import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Header from '../components/dashboard/Header';
import StatCard from '../components/dashboard/StatCard';
import DistributionCard from '../components/dashboard/DistributionCard';
import PlatformCard from '../components/dashboard/PlatformCard';
import ProblemList from '../components/dashboard/ProblemList';
// Import the dashboard-specific styles
import '../components/dashboard/styles.css';

const Dashboard = () => {
  // Mock data for the user
  const userData = {
    name: 'John Doe',
    stats: {
      solved: 78,
      unsolved: 45,
      solveLater: 23
    },
    distribution: {
      easy: 42,
      medium: 29,
      hard: 7
    },
    platforms: {
      leetcode: 58,
      codeforces: 12,
      hackerrank: 8
    }
  };

  // Mock data for problems
  const mockProblems = [
    { 
      id: 1, 
      title: 'Two Sum', 
      link: 'https://leetcode.com/problems/two-sum/',
      platform: 'LeetCode',
      dateAdded: '2023-10-15',
      status: 'solved' 
    },
    { 
      id: 2, 
      title: 'Valid Parentheses', 
      link: 'https://leetcode.com/problems/valid-parentheses/',
      platform: 'LeetCode',
      dateAdded: '2023-10-18',
      status: 'solved' 
    },
    { 
      id: 3, 
      title: 'Merge Two Sorted Lists', 
      link: 'https://leetcode.com/problems/merge-two-sorted-lists/',
      platform: 'LeetCode',
      dateAdded: '2023-10-20',
      status: 'unsolved' 
    },
    { 
      id: 4, 
      title: 'Maximum Subarray', 
      link: 'https://leetcode.com/problems/maximum-subarray/',
      platform: 'LeetCode',
      dateAdded: '2023-10-22',
      status: 'solveLater' 
    },
    { 
      id: 5, 
      title: 'Watermelon', 
      link: 'https://codeforces.com/problemset/problem/4/A',
      platform: 'Codeforces',
      dateAdded: '2023-10-25',
      status: 'unsolved' 
    },
  ];

  const [activeTab, setActiveTab] = useState('solved');
  const [isLoaded, setIsLoaded] = useState(false);

  // Add a loading effect
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const filteredProblems = mockProblems.filter(problem => problem.status === activeTab);

  return (
    <div className="min-h-screen bg-[#94C3D2]">
      <Navbar />
      <Header userName={userData.name} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Dashboard Title with animation */}
        <div className={`mb-6 transform transition-all duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h2 className="text-2xl font-bold text-gray-800">Your Dashboard</h2>
        </div>

        {/* Stats Grid with stagger animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className={`transform transition-all duration-700 delay-100 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <StatCard stats={userData.stats} />
          </div>
          <div className={`transform transition-all duration-700 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <DistributionCard distribution={userData.distribution} />
          </div>
          <div className={`transform transition-all duration-700 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <PlatformCard platforms={userData.platforms} />
          </div>
        </div>
        
        {/* Problem List Section with animation */}
        <div 
          className={`bg-[#dbeafe] rounded-2xl shadow-md p-6 border border-gray-200 transform transition-all duration-700 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} hover:shadow-lg`}
        >
          <div className="flex mb-6">
            <button 
              onClick={() => setActiveTab('solved')}
              className={`px-4 py-2 font-medium rounded-full transition-all duration-300 ${activeTab === 'solved' 
                ? 'bg-[#94C3D2] text-gray-800 shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Solved
            </button>
            <button 
              onClick={() => setActiveTab('unsolved')}
              className={`px-4 py-2 font-medium rounded-full transition-all duration-300 ${activeTab === 'unsolved' 
                ? 'bg-[#94C3D2] text-gray-800 shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Unsolved
            </button>
            <button 
              onClick={() => setActiveTab('solveLater')}
              className={`px-4 py-2 font-medium rounded-full transition-all duration-300 ${activeTab === 'solveLater' 
                ? 'bg-[#94C3D2] text-gray-800 shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Solve Later
            </button>
          </div>
          
          <ProblemList problems={filteredProblems} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
