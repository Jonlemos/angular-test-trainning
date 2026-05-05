// apps/react-login-remote/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import Login from './components/Login';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Login
      onLoginSuccess={(token, user) => {
        console.log('✅ Login Success:', { token, user });
        alert(`Bem-vindo, ${user.name}!`);
      }}
      onLoginError={(error) => {
        console.error('❌ Login Error:', error);
      }}
    />
  </React.StrictMode>
);