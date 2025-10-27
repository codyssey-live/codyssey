const PlatformCard = ({ platforms, cardStyle = {} }) => {
  const total = platforms.leetcode + platforms.codeforces + platforms.hackerrank;
  const leetcodePercentage = Math.round((platforms.leetcode / total) * 100) || 0;
  const codeforcesPercentage = Math.round((platforms.codeforces / total) * 100) || 0;
  const hackerrankPercentage = Math.round((platforms.hackerrank / total) * 100) || 0;

  return (
    <div className="bg-[#dbeafe] rounded-2xl p-4 sm:p-6 shadow h-[250px] sm:h-[300px] flex flex-col transition-all duration-300 ease-in-out hover:-translate-y-[5px] hover:shadow-lg" style={cardStyle}>      <h3 className="text-base sm:text-lg font-semibold text-[#333333] mb-3 sm:mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        Platform Distribution
      </h3>
        <div className="space-y-3 sm:space-y-5 flex-grow">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs sm:text-sm font-medium text-[#f59e0b] flex items-center">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#f59e0b] mr-1 sm:mr-1.5"></span>
              LeetCode ({platforms.leetcode})
            </span>
            <span className="text-xs sm:text-sm font-medium text-[#f59e0b]">{leetcodePercentage}%</span>
          </div>
          <div className="w-full bg-[#94a3b8] rounded-full h-2 overflow-hidden">
            <div 
              className="bg-[#f59e0b] h-2 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${leetcodePercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">            <span className="text-xs sm:text-sm font-medium text-[#ef4444] flex items-center">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#ef4444] mr-1 sm:mr-1.5"></span>
              Codeforces ({platforms.codeforces})
            </span>
            <span className="text-xs sm:text-sm font-medium text-[#ef4444]">{codeforcesPercentage}%</span>
          </div>
          <div className="w-full bg-[#94a3b8] rounded-full h-2 overflow-hidden">
            <div 
              className="bg-[#ef4444] h-2 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${codeforcesPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">            <span className="text-xs sm:text-sm font-medium text-[#10b981] flex items-center">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#10b981] mr-1 sm:mr-1.5"></span>
              HackerRank ({platforms.hackerrank})
            </span>
            <span className="text-xs sm:text-sm font-medium text-[#10b981]">{hackerrankPercentage}%</span>
          </div>
          <div className="w-full bg-[#94a3b8] rounded-full h-2 overflow-hidden">
            <div 
              className="bg-[#10b981] h-2 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${hackerrankPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
        <div className="mt-3 sm:mt-4 flex justify-between items-center">
        <span className="text-xs sm:text-sm text-[#333333]">Total Submissions</span>
        <span className="text-lg sm:text-xl font-semibold text-[#333333]">{total}</span>
      </div>
    </div>
  );
};

export default PlatformCard;
