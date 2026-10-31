import { useState } from 'react';

function App() {
  const [status, setStatus] = useState('Not checked yet');

  return (
    <main>
      <h1>AI-Assisted Child Development Platform</h1>
      <button
        onClick={() => setStatus('Backend connection will be added in the next task')}
      >
        Check backend
      </button>
      <p>Status: {status}</p>
    </main>
  );
}

export default App;