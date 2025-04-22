import { useState } from 'react';
import Navbar from '../components/Navbar';
import Header from '../components/dashboard/Header';
import StatCard from '../components/dashboard/StatCard';
import DistributionCard from '../components/dashboard/DistributionCard';
import PlatformCard from '../components/dashboard/PlatformCard';
import ProblemList from '../components/dashboard/ProblemList';

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

  const filteredProblems = mockProblems.filter(problem => problem.status === activeTab);

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Navbar />
      <Header userName={userData.name} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Dashboard Title - No Add Problem Button */}
        <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">Your Dashboard</h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard stats={userData.stats} />
          <DistributionCard distribution={userData.distribution} />
          <PlatformCard platforms={userData.platforms} />
        </div>
        
        {/* Problem List Section */}
        <div className="bg-[#1e293b] rounded-lg shadow p-6 border border-gray-700">
          <div className="flex mb-6">
            <button 
              onClick={() => setActiveTab('solved')}
              className={`px-4 py-2 font-medium ${activeTab === 'solved' 
                ? 'text-purple-400 border-b-2 border-purple-400' 
                : 'text-gray-300'}`}
            >
              Solved
            </button>
            <button 
              onClick={() => setActiveTab('unsolved')}
              className={`px-4 py-2 font-medium ${activeTab === 'unsolved' 
                ? 'text-purple-400 border-b-2 border-purple-400' 
                : 'text-gray-300'}`}
            >
              Unsolved
            </button>
            <button 
              onClick={() => setActiveTab('solveLater')}
              className={`px-4 py-2 font-medium ${activeTab === 'solveLater' 
                ? 'text-purple-400 border-b-2 border-purple-400' 
                : 'text-gray-300'}`}
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
