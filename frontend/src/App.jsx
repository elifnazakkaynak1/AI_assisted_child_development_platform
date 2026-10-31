// ekran çizimi ve frontend’in backend’le konuştuğu yer.

import { useState } from 'react';

function App() {
  const [status, setStatus] = useState('Not checked yet');

  const checkBackend = async () => {
    setStatus('Loading...');
    try {
      const response = await fetch('/api/demo/user'); //frontendden backende get isteği gönderiyoruz ve backendden gelen cevabı bekleyip öyle devam ediyrouz
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const user = await response.json(); //backendden gelen cevabı json formatında alıyoruz
      setStatus(`Backend OK. First user in database: ${user.name} (${user.role})`);
    } catch (error) {
      setStatus(`Backend error: ${error.message}`);
    }
  };

  return (
    <main>
      <h1>AI-Assisted Child Development Platform</h1>
      <button onClick={checkBackend}>Check backend</button>
      <p>Status: {status}</p>
    </main>
  );
}

export default App;