import TopicCard from './TopicCard';

const TopicList = ({ 
  topics, 
  onUpdateTopic, 
  onDeleteTopic,
  onAddProblem,
  onAddVideo,
  onUpdateNotes,
  onRemoveProblem,
  onRemoveVideo,
  onToggleProblemCompletion,
  onToggleVideoWatched
}) => {
  if (topics.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-10 text-center">
        <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900">No topics added yet</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding your first learning topic above</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Your Topics</h2>
        <div className="text-sm text-gray-500">{topics.length} {topics.length === 1 ? 'topic' : 'topics'} in your plan</div>
      </div>
      
      <div className="space-y-8">
        {topics.map(topic => (
          <TopicCard 
            key={topic.id}
            topic={topic}
            onUpdateTopic={onUpdateTopic}
            onDeleteTopic={onDeleteTopic}
            onAddProblem={onAddProblem}
            onAddVideo={onAddVideo}
            onUpdateNotes={onUpdateNotes}
            onRemoveProblem={onRemoveProblem}
            onRemoveVideo={onRemoveVideo}
            onToggleProblemCompletion={onToggleProblemCompletion}
            onToggleVideoWatched={onToggleVideoWatched}
          />
        ))}
      </div>
    </div>
  );
};

export default TopicList;
