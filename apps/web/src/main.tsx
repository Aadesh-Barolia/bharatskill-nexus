import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './redesign.css';
import { MotionLayer } from './Motion';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MotionLayer />
    <App />
  </React.StrictMode>,
);

import './learning.css';
