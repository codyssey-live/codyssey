const DistributionCard = ({ distribution }) => {
  const total = distribution.easy + distribution.medium + distribution.hard;
  const easyPercentage = Math.round((distribution.easy / total) * 100) || 0;
  const mediumPercentage = Math.round((distribution.medium / total) * 100) || 0;
  const hardPercentage = Math.round((distribution.hard / total) * 100) || 0;
  
  return (
    <div className="bg-[#1e293b] p-6 rounded-lg shadow border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4">Problem Distribution</h2>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-green-400">Easy ({distribution.easy})</span>
            <span className="text-sm font-medium text-green-400">{easyPercentage}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${easyPercentage}%` }}></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-yellow-400">Medium ({distribution.medium})</span>
            <span className="text-sm font-medium text-yellow-400">{mediumPercentage}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${mediumPercentage}%` }}></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-red-400">Hard ({distribution.hard})</span>
            <span className="text-sm font-medium text-red-400">{hardPercentage}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${hardPercentage}%` }}></div>
          </div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-700 text-center">
          <p className="text-sm text-gray-400">Total: {total} problems</p>
        </div>
      </div>
    </div>
  );
};

export default DistributionCard;
