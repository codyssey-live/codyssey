const StatCard = ({ title, stats, cardStyle }) => {
  const total = stats.solved + stats.unsolved + stats.solveLater;
  
  return (
    <div className={`bg-[#dbeafe] rounded-2xl p-4 sm:p-6 shadow h-[250px] sm:h-[300px] flex flex-col transition-all duration-300 ease-in-out hover:-translate-y-[5px] hover:shadow-lg ${cardStyle}`}>
      <h2 className="text-base sm:text-lg font-semibold text-[#333333] mb-3 sm:mb-4">Problem Solving Stats</h2>
      
      <div className="space-y-3 sm:space-y-4 flex-grow">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs sm:text-sm text-[#10b981] flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-[#10b981]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Solved
            </span>
            <span className="text-xs sm:text-sm text-[#10b981]">{stats.solved}</span>
          </div>
          <div className="w-full bg-[#94a3b8] rounded-full h-2 overflow-hidden">
            <div 
              className="bg-[#10b981] h-2 rounded-full transition-all duration-500 ease-in-out"
              style={{ 
                width: `${(stats.solved / total) * 100}%`
              }}
            ></div>
          </div>
        </div>
          <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs sm:text-sm text-[#ef4444] flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-[#ef4444]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Unsolved
            </span>
            <span className="text-xs sm:text-sm text-[#ef4444]">{stats.unsolved}</span>
          </div>
          <div className="w-full bg-[#94a3b8] rounded-full h-2 overflow-hidden">
            <div 
              className="bg-[#ef4444] h-2 rounded-full transition-all duration-500 ease-in-out"
              style={{ 
                width: `${(stats.unsolved / total) * 100}%`
              }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs sm:text-sm text-[#f59e0b] flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-[#f59e0b]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Solve Later
            </span>
            <span className="text-xs sm:text-sm text-[#f59e0b]">{stats.solveLater}</span>
          </div>
          <div className="w-full bg-[#94a3b8] rounded-full h-2 overflow-hidden">
            <div 
              className="bg-[#f59e0b] h-2 rounded-full transition-all duration-500 ease-in-out"
              style={{ 
                width: `${(stats.solveLater / total) * 100}%`
              }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="mt-3 sm:mt-4 flex justify-between items-center">
        <span className="text-xs sm:text-sm text-[#333333]">Total</span>
        <span className="text-lg sm:text-xl font-semibold text-[#333333]">{total}</span>
      </div>
    </div>
  );
};

export default StatCard;
