import { onMount, type Component } from 'solid-js';
import { Route, Router, Routes } from '@solidjs/router';
import { Home } from './pages/Home';
import { Room } from './pages/Room';
import { QuackamoleHttpClient } from 'quackamole-rtc-client';


export const App: Component = () => {
  onMount(() => {
    const secure = import.meta.env.VITE_BACKEND_SECURE === 'true';
    QuackamoleHttpClient.baseUrl = `${secure ? 'https' : 'http'}://${import.meta.env.VITE_BACKEND_URL}`;
  });
  return (
    <Router>
      <Routes>
        <Route path="/" component={Home} />
        <Route path="/:id" component={Room} />
      </Routes>
    </Router>
  );
};
