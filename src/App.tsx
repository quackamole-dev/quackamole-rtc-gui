import {createResource, type Component, lazy} from 'solid-js';
import {Route, RouteDataFuncArgs, Router, Routes} from '@solidjs/router';
import {Home} from "./pages/Home";
// import {Room} from "./pages/Room";
import { QuackamoleRTCClient } from './quackamole-rtc/quackamole';
import { Room } from './pages/Room';

// @ts-ignore
// const Room = lazy(() => import("./pages/Room"));

export const App: Component = () => {
  return (
    <Router>
      <Routes>
        {/*<Route path={["/", "/:id"]} component={Home}/>*/}
        <Route path="/" component={Home}/>
        {/* <Route path="/:id" component={Room} data={RoomData} /> */}
        <Route path="/:id" component={Room} />
      </Routes>
    </Router>
  );
};

export function RoomData({params, location, navigate, data}: RouteDataFuncArgs) {
  const [user] = createResource(() => params.id, QuackamoleRTCClient.getRoom); // 👈 Pass the id parameter to the fetchUser function
  return user;
}