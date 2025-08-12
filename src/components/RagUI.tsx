import React, { useState } from 'react';

export default function RagUI() {
  const [content, setContent] = useState('');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [error, setError] = useState('');

  const uploadDocument = async () => {
    setLoadingDoc(true);
    setError('');
    try {
      // TODO: Generate embedding using your model
      const embedding = '[]';
      const res = await fetch('/api/v1/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, embedding }),
      });
      if (!res.ok) throw new Error('Failed to upload document');
      setContent('');
      alert('Document uploaded!');
    } catch {
    } finally {
      setLoadingDoc(false);
    }
  };

  const submitQuery = async () => {
    setLoadingQuery(true);
    setError('');
    setResponse('');
    try {
      // TODO: Generate embedding for query
      const embedding = '[]';
      const res = await fetch('/api/v1/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, embedding }),
      });
      if (!res.ok) throw new Error('Failed to get response');
      const data = await res.json();
      setResponse(data.response);
    } catch  {
    } finally {
      setLoadingQuery(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: '2rem', border: '1px solid #eee', borderRadius: 8, background: '#fafafa' }}>
      <h2 style={{ marginBottom: 16 }}>RAG AI Assistant</h2>
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 500 }}>Upload Document</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={4}
          style={{ width: '100%', marginTop: 8, marginBottom: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          placeholder="Paste document content here..."
        />
        <button
          onClick={uploadDocument}
          disabled={loadingDoc || !content.trim()}
          style={{ padding: '8px 16px', borderRadius: 4, background: '#0070f3', color: '#fff', border: 'none' }}
        >
          {loadingDoc ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 500 }}>Ask a Question</label>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ width: '100%', marginTop: 8, marginBottom: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          placeholder="Type your question..."
        />
        <button
          onClick={submitQuery}
          disabled={loadingQuery || !query.trim()}
          style={{ padding: '8px 16px', borderRadius: 4, background: '#0070f3', color: '#fff', border: 'none' }}
        >
          {loadingQuery ? 'Asking...' : 'Ask'}
        </button>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      {response && (
        <div style={{ background: '#e3f7e3', padding: 12, borderRadius: 4 }}>
          <h3 style={{ margin: 0, marginBottom: 8 }}>Response:</h3>
          <p style={{ margin: 0 }}>{response}</p>
        </div>
      )}
    </div>
  );
}
