const StatCard = ({ stats }) => {
  const total = stats.solved + stats.unsolved + stats.solveLater;
  
  return (
    <div className="bg-[#dbeafe] rounded-2xl shadow-md border border-gray-200 p-6 h-[300px] flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Problem Solving Stats</h3>
      
      <div className="space-y-5 flex-grow">
        {/* Solved */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-green-600">Solved</span>
            <span className="text-sm font-medium text-green-600">{stats.solved}</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2.5">
            <div 
              className="bg-green-500 h-2.5 rounded-full" 
              style={{ width: `${Math.round((stats.solved / total) * 100)}%` }}
            ></div>
          </div>
        </div>
        
        {/* Unsolved */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-red-600">Unsolved</span>
            <span className="text-sm font-medium text-red-600">{stats.unsolved}</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2.5">
            <div 
              className="bg-red-500 h-2.5 rounded-full" 
              style={{ width: `${Math.round((stats.unsolved / total) * 100)}%` }}
            ></div>
          </div>
        </div>
        
        {/* Solve Later */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-purple-600">Solve Later</span>
            <span className="text-sm font-medium text-purple-600">{stats.solveLater}</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2.5">
            <div 
              className="bg-purple-500 h-2.5 rounded-full" 
              style={{ width: `${Math.round((stats.solveLater / total) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Total */}
      <div className="pt-3 mt-auto border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total</span>
          <span className="font-bold text-lg text-gray-800">{total}</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
