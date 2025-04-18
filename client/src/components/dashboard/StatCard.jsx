const StatCard = ({ stats }) => {
  return (
    <div className="bg-[#1e293b] p-6 rounded-lg shadow border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4">Problem Stats</h2>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Solved</span>
          <span className="text-green-400 font-semibold">{stats.solved}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Unsolved</span>
          <span class="text-red-400 font-semibold">{stats.unsolved}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Solve Later</span>
          <span className="text-yellow-400 font-semibold">{stats.solveLater}</span>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Total</span>
            <span className="text-blue-400 font-bold">
              {stats.solved + stats.unsolved + stats.solveLater}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
