import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Header from '../components/dashboard/Header';
import StatCard from '../components/dashboard/StatCard';
import DistributionCard from '../components/dashboard/DistributionCard';
import PlatformCard from '../components/dashboard/PlatformCard';
import ProblemList from '../components/dashboard/ProblemList';
import { fetchCurrentUser } from '../utils/apiClient';

const Dashboard = () => {
  const [userData, setUserData] = useState({
    name: 'User',
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
  });
  
  const [loading, setLoading] = useState(true);

  // Fetch user data from the API
  useEffect(() => {
    const getUserData = async () => {
      try {
        const user = await fetchCurrentUser();
        if (user) {
          setUserData(prevData => ({
            ...prevData,
            name: user.name
          }));
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    getUserData();
  }, []);

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

  // State for active tab
  const [activeTab, setActiveTab] = useState('recent');
  const [problems, setProblems] = useState(mockProblems);

  // Filter problems based on active tab
  useEffect(() => {
    if (activeTab === 'recent') {
      setProblems(mockProblems.slice(0, 5));
    } else if (activeTab === 'solved') {
      setProblems(mockProblems.filter(p => p.status === 'solved'));
    } else if (activeTab === 'unsolved') {
      setProblems(mockProblems.filter(p => p.status === 'unsolved'));
    } else if (activeTab === 'solveLater') {
      setProblems(mockProblems.filter(p => p.status === 'solveLater'));
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#E8F1F7]">
      <Navbar />
      <Header userName={loading ? 'Loading...' : userData.name} />
      
      <div className="container mx-auto px-6 md:px-10">
        <h2 className="text-2xl font-bold text-[#333333] mt-8 mb-6">Your Dashboard</h2>
      </div>
      
      <main className="container mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Problem Status" 
            stats={userData.stats} 
          />
          <DistributionCard 
            title="Difficulty Distribution" 
            distribution={userData.distribution} 
          />
          <PlatformCard 
            title="Platform Breakdown" 
            platforms={userData.platforms} 
          />
        </div>
        
        <div className="mb-6 flex space-x-2">
          <button 
            onClick={() => setActiveTab('recent')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'recent' 
                ? 'bg-[#94C3D2] text-gray-800 shadow' 
                : 'bg-[#dbeafe] bg-opacity-70 text-gray-600 hover:bg-[#dbeafe]'
            }`}
          >
            Recent
          </button>
          <button 
            onClick={() => setActiveTab('solved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'solved' 
                ? 'bg-[#94C3D2] text-gray-800 shadow' 
                : 'bg-[#dbeafe] bg-opacity-70 text-gray-600 hover:bg-[#dbeafe]'
            }`}
          >
            Solved
          </button>
          <button 
            onClick={() => setActiveTab('unsolved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'unsolved' 
                ? 'bg-[#94C3D2] text-gray-800 shadow' 
                : 'bg-[#dbeafe] bg-opacity-70 text-gray-600 hover:bg-[#dbeafe]'
            }`}
          >
            Unsolved
          </button>
          <button 
            onClick={() => setActiveTab('solveLater')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'solveLater' 
                ? 'bg-[#94C3D2] text-gray-800 shadow' 
                : 'bg-[#dbeafe] bg-opacity-70 text-gray-600 hover:bg-[#dbeafe]'
            }`}
          >
            Solve Later
          </button>
        </div>
        
        <ProblemList problems={problems} />
      </main>
      
      {/* Added margin at the bottom */}
      <div className="pb-16"></div>
    </div>
  );
};

export default Dashboard;
