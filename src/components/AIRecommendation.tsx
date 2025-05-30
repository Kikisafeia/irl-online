import { useState } from 'react';
import { getAIRecommendations } from '../services/azureOpenAIService';

export const AIRecommendation = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const aiResponse = await getAIRecommendations(prompt);
      setResponse(aiResponse);
    } catch (error) {
      console.error(error);
      setResponse('Error getting recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          className="w-full p-2 border rounded"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what recommendations you need..."
          rows={4}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          disabled={isLoading || !prompt.trim()}
        >
          {isLoading ? 'Generating...' : 'Get Recommendations'}
        </button>
      </form>
      
      {response && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3 className="font-bold mb-2">AI Recommendations:</h3>
          <p className="whitespace-pre-line">{response}</p>
        </div>
      )}
    </div>
  );
};
