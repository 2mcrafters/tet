import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// import './index.css'; // décommenté si tu as besoin de styles globaux
import App from './App'; // ou './App.jsx' selon le nom de ton fichier
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import {store} from './Redux/Store/store';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

createRoot(document.getElementById('root')).render(
    <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
      
    </Provider>
);
