const DistributionCard = ({ distribution }) => {
  const total = distribution.easy + distribution.medium + distribution.hard;
  const easyPercentage = Math.round((distribution.easy / total) * 100) || 0;
  const mediumPercentage = Math.round((distribution.medium / total) * 100) || 0;
  const hardPercentage = Math.round((distribution.hard / total) * 100) || 0;

  return (
    <div className="bg-[#dbeafe] rounded-2xl shadow-md border border-gray-200 p-6 h-[300px] flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Difficulty Distribution</h3>
      
      <div className="space-y-5 flex-grow">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-green-600">Easy ({distribution.easy})</span>
            <span className="text-sm font-medium text-green-600">{easyPercentage}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2.5">
            <div 
              className="bg-green-500 h-2.5 rounded-full" 
              style={{ width: `${easyPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-yellow-600">Medium ({distribution.medium})</span>
            <span className="text-sm font-medium text-yellow-600">{mediumPercentage}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2.5">
            <div 
              className="bg-yellow-500 h-2.5 rounded-full" 
              style={{ width: `${mediumPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-red-600">Hard ({distribution.hard})</span>
            <span className="text-sm font-medium text-red-600">{hardPercentage}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2.5">
            <div 
              className="bg-red-500 h-2.5 rounded-full" 
              style={{ width: `${hardPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Total */}
      <div className="pt-3 mt-auto border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Problems</span>
          <span className="font-bold text-lg text-gray-800">{total}</span>
        </div>
      </div>
    </div>
  );
};

export default DistributionCard;
