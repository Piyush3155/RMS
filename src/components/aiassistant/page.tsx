"use client"
import React, { useState } from 'react';
import { Bot, Send, Loader2, X } from 'lucide-react';

interface AIResponse {
  message: string;
  data: Record<string, unknown>[];
}

const AIAssistantPage = ({ onClose }: { onClose?: () => void }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/v1/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'An error occurred.');
      }

      setResponse(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderTable = (data: Record<string, unknown>[]) => {
    if (!data || data.length === 0) {
      return <p className="text-gray-500">No data to display.</p>;
    }

    const headers = Object.keys(data[0]);

    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header) => (
                <th key={header} className="p-3 font-semibold text-gray-600 capitalize">
                  {header.replace(/([A-Z])/g, ' $1').trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {headers.map((header) => (
                  <td key={`${rowIndex}-${header}`} className="p-3 text-sm text-gray-700 whitespace-nowrap">
                    {typeof row[header] === 'boolean'
                      ? row[header] ? 'Yes' : 'No'
                      : row[header] === null || row[header] === undefined
                      ? 'N/A'
                      : String(row[header])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm max-w-4xl mx-auto relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Bot className="text-amber-500" size={28} />
          <h2 className="text-2xl font-bold text-gray-800">AI Assistant</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 absolute top-4 right-4"
          >
            <X size={20} />
          </button>
        )}
      </div>
      <p className="text-gray-600 mb-6">
        Ask me anything about your restaurant data. For example: &quot;Show me all staff details&quot;, &quot;List all menu items&quot;, or &quot;Get recent orders&quot;.
      </p>

      <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-8">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., I want details of staffs"
          className="flex-grow p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-amber-500 text-white px-4 py-3 rounded-xl hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          disabled={isLoading || !prompt.trim()}
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          <span>{isLoading ? 'Thinking...' : 'Ask'}</span>
        </button>
      </form>

      <div className="min-h-[200px]">
        {isLoading && (
          <div className="flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="animate-spin text-amber-500 mb-2" size={32} />
            <p>Fetching data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {response && (
          <div className="space-y-4">
            <p className="text-green-700 bg-green-50 p-3 rounded-lg">{response.message}</p>
            {renderTable(response.data)}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistantPage;
