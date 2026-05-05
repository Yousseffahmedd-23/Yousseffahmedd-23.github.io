import { useEffect, useState } from 'react';
import API from '../api/axiosConfig';

function Home() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    API.get('/')
      .then((res) => setMessage(res.data.message))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>MERN Stack App</h1>
      <p>API status: <strong>{message || 'Connecting...'}</strong></p>
    </div>
  );
}

export default Home;
