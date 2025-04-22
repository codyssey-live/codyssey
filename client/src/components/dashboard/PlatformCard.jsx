const PlatformCard = ({ platforms }) => {
  const total = platforms.leetcode + platforms.codeforces + platforms.hackerrank;
  const leetcodePercentage = Math.round((platforms.leetcode / total) * 100) || 0;
  const codeforcesPercentage = Math.round((platforms.codeforces / total) * 100) || 0;
  const hackerrankPercentage = Math.round((platforms.hackerrank / total) * 100) || 0;

  return (
    <div className="bg-[#dbeafe] rounded-2xl shadow-md border border-gray-200 p-6 h-[300px] flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Platform Distribution</h3>
      
      <div className="space-y-5 flex-grow">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-yellow-600">LeetCode ({platforms.leetcode})</span>
            <span className="text-sm font-medium text-yellow-600">{leetcodePercentage}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2.5">
            <div 
              className="bg-yellow-500 h-2.5 rounded-full" 
              style={{ width: `${leetcodePercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-red-600">CodeForces ({platforms.codeforces})</span>
            <span className="text-sm font-medium text-red-600">{codeforcesPercentage}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2.5">
            <div 
              className="bg-red-500 h-2.5 rounded-full" 
              style={{ width: `${codeforcesPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-green-600">HackerRank ({platforms.hackerrank})</span>
            <span className="text-sm font-medium text-green-600">{hackerrankPercentage}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2.5">
            <div 
              className="bg-green-500 h-2.5 rounded-full" 
              style={{ width: `${hackerrankPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Total */}
      <div className="pt-3 mt-auto border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Submissions</span>
          <span className="font-bold text-lg text-gray-800">{total}</span>
        </div>
      </div>
    </div>
  );
};

export default PlatformCard;
