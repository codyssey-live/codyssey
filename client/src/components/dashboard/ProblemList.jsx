const ProblemList = ({ problems }) => {
  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link)
      .then(() => alert('Link copied to clipboard!'))
      .catch(err => console.error('Could not copy link: ', err));
  };
  
  const getPlatformBadgeColor = (platform) => {
    switch (platform.toLowerCase()) {
      case 'leetcode': return 'bg-yellow-100 text-yellow-800';
      case 'codeforces': return 'bg-red-100 text-red-800';
      case 'hackerrank': return 'bg-green-100 text-green-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="overflow-x-auto">
      {problems.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No problems found in this category.</p>
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-300 overflow-hidden rounded-xl">
          <thead className="bg-[#dbeafe]">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Platform
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Added
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-[#dbeafe] divide-y divide-gray-200">
            {problems.map((problem) => (
              <tr 
                key={problem.id}
                className="hover:bg-blue-100 transition-colors duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-blue-600">
                    <a 
                      href={problem.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-blue-800 hover:underline transition-colors"
                    >
                      {problem.title}
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlatformBadgeColor(problem.platform)}`}>
                    {problem.platform}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{problem.dateAdded}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => handleCopyLink(problem.link)}
                    className="text-[#4b7bec] mr-3 hover:text-blue-800 hover:scale-110 transform transition-transform"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  </button>
                  <button className="text-gray-500 hover:text-gray-800 hover:scale-110 transform transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProblemList;
