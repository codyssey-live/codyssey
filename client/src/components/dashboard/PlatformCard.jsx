const PlatformCard = ({ platforms }) => {
  const platformColors = {
    leetcode: 'bg-yellow-500',
    codeforces: 'bg-red-500',
    hackerrank: 'bg-green-500',
  };
  
  const total = Object.values(platforms).reduce((sum, count) => sum + count, 0);
  
  return (
    <div className="bg-[#1e293b] p-6 rounded-lg shadow border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4">Problems by Platform</h2>
      
      <div className="space-y-4">
        {Object.entries(platforms).map(([platform, count]) => {
          const percentage = Math.round((count / total) * 100) || 0;
          
          return (
            <div key={platform}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium capitalize text-gray-300">{platform} ({count})</span>
                <span className="text-sm font-medium text-gray-300">{percentage}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className={`${platformColors[platform] || 'bg-blue-500'} h-2.5 rounded-full`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
        
        <div className="mt-2 pt-2 border-t border-gray-700 text-center">
          <p className="text-sm text-gray-400">Total: {total} problems</p>
        </div>
      </div>
    </div>
  );
};

export default PlatformCard;
