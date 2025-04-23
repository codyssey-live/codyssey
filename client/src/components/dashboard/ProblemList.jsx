const ProblemList = ({ problems, cardStyle = {} }) => {
  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link)
      .then(() => alert('Link copied to clipboard!'))
      .catch(err => console.error('Could not copy link: ', err));
  };
  
  const handleShare = (problem) => {
    if (navigator.share) {
      navigator.share({
        title: `Coding Problem: ${problem.title}`,
        text: `Check out this coding problem: ${problem.title}`,
        url: problem.link
      })
      .catch(err => console.error('Error sharing: ', err));
    } else {
      handleCopyLink(problem.link);
      alert('Sharing not supported on this browser. Link copied to clipboard instead!');
    }
  };
  
  const getPlatformBadgeColor = (platform) => {
    switch (platform.toLowerCase()) {
      case 'leetcode': return 'bg-[#f5e6af] text-[#a16207]';
      case 'codeforces': return 'bg-[#fecaca] text-[#991b1b]';
      case 'hackerrank': return 'bg-[#dcfce7] text-[#166534]';
      default: return 'bg-[#dbeafe] text-[#1e40af]';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'solved': return 'bg-[#dcfce7] text-[#166534]';
      case 'unsolved': return 'bg-[#fecaca] text-[#991b1b]';
      case 'solveLater': return 'bg-[#f5e6af] text-[#a16207]';
      default: return 'bg-[#dbeafe] text-[#1e40af]';
    }
  };

  return (
    <div className="overflow-x-auto">
      {problems.length === 0 ? (
        <div className="bg-[#dbeafe] rounded-xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#e2e8f0] mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-[#333333] font-medium">No problems found in this category.</p>
          <p className="text-[#555555] text-sm mt-1">Try adding some problems or changing your filter.</p>
        </div>
      ) : (
        <div className="bg-[#dbeafe] rounded-xl overflow-hidden shadow-sm">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#333333] uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#333333] uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#333333] uppercase tracking-wider">
                  Date Added
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#333333] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#333333] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {problems.map((problem) => (
                <tr 
                  key={problem.id} 
                  className="bg-[#dbeafe] mb-2 transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:bg-[#bfdbfe]"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#333333]">
                    <a 
                      href={problem.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 hover:underline transition-colors"
                    >
                      {problem.title}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlatformBadgeColor(problem.platform)}`}>
                      {problem.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#555555]">
                    {problem.dateAdded}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(problem.status)}`}>
                      {problem.status === 'solveLater' ? 'Solve Later' : problem.status.charAt(0).toUpperCase() + problem.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleCopyLink(problem.link)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Copy Link"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleShare(problem)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        title="Share"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProblemList;
