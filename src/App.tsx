import type {Component} from 'solid-js';
import {Route, Router, Routes} from '@solidjs/router';
import {RoomLobby} from './components/RoomLobby';
import {Home} from "./pages/Home";
import {Room} from "./pages/Room";

export const App: Component = () => {
  return (
    <Router>
      <Routes>
        {/*<Route path={["/", "/:id"]} component={Home}/>*/}
        <Route path="/" component={Home}/>
        <Route path="/:id" component={Room}/>
      </Routes>
    </Router>
  );
};
