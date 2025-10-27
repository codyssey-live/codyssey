const DistributionCard = ({ distribution, cardStyle = {} }) => {
  const total = distribution.easy + distribution.medium + distribution.hard;
  const easyPercentage = Math.round((distribution.easy / total) * 100) || 0;
  const mediumPercentage = Math.round((distribution.medium / total) * 100) || 0;
  const hardPercentage = Math.round((distribution.hard / total) * 100) || 0;
  
  return (
    <div className="bg-[#dbeafe] rounded-2xl p-4 sm:p-6 shadow h-[250px] sm:h-[300px] flex flex-col transition-all duration-300 ease-in-out hover:-translate-y-[5px] hover:shadow-lg" style={cardStyle}>      <h3 className="text-base sm:text-lg font-semibold text-[#333333] mb-3 sm:mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        Difficulty Distribution
      </h3>
      
      <div className="space-y-3 sm:space-y-5 flex-grow">
        <div>          <div className="flex justify-between mb-1">
            <span className="text-xs sm:text-sm font-medium text-[#10b981] flex items-center">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#10b981] mr-1 sm:mr-1.5"></span>
              Easy ({distribution.easy})
            </span>
            <span className="text-xs sm:text-sm font-medium text-[#10b981]">{easyPercentage}%</span>
          </div>
          <div className="w-full bg-[#94a3b8] rounded-full h-2 overflow-hidden">
            <div 
              className="bg-[#10b981] h-2 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${easyPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div>          <div className="flex justify-between mb-1">
            <span className="text-xs sm:text-sm font-medium text-[#f59e0b] flex items-center">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#f59e0b] mr-1 sm:mr-1.5"></span>
              Medium ({distribution.medium})
            </span>
            <span className="text-xs sm:text-sm font-medium text-[#f59e0b]">{mediumPercentage}%</span>
          </div>
          <div className="w-full bg-[#94a3b8] rounded-full h-2 overflow-hidden">
            <div 
              className="bg-[#f59e0b] h-2 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${mediumPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div>          <div className="flex justify-between mb-1">
            <span className="text-xs sm:text-sm font-medium text-[#ef4444] flex items-center">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#ef4444] mr-1 sm:mr-1.5"></span>
              Hard ({distribution.hard})
            </span>
            <span className="text-xs sm:text-sm font-medium text-[#ef4444]">{hardPercentage}%</span>
          </div>
          <div className="w-full bg-[#94a3b8] rounded-full h-2 overflow-hidden">
            <div 
              className="bg-[#ef4444] h-2 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${hardPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
        <div className="mt-3 sm:mt-4 flex justify-between items-center">
        <span className="text-xs sm:text-sm text-[#333333]">Total Problems</span>
        <span className="text-lg sm:text-xl font-semibold text-[#333333]">{total}</span>
      </div>
    </div>
  );
};

export default DistributionCard;
