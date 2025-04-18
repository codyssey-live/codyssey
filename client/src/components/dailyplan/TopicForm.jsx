import { useState } from 'react';

const TopicForm = ({ onAddTopic }) => {
  const [topicName, setTopicName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!topicName.trim()) return;
    
    onAddTopic({
      name: topicName,
      description
    });
    
    // Reset form
    setTopicName('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="topicName" className="block text-sm font-medium text-gray-700">Topic Name</label>
        <input
          type="text"
          id="topicName"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g. Sliding Window, Binary Trees"
          value={topicName}
          onChange={(e) => setTopicName(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
        <textarea
          id="description"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          rows="3"
          placeholder="Short description about this topic..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Topic
        </button>
      </div>
    </form>
  );
};

export default TopicForm;
