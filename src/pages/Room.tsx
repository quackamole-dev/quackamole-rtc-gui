import "./Room.css";
import { Accessor, Component, For, Show, createEffect, createSignal, onMount } from 'solid-js';
import { useFetch, useLocalStorage } from 'solidjs-use';
import { LivingRoom } from '../components/LivingRoom';
import { RoomLobby } from '../components/RoomLobby';
import { IBaseRoom, IPlugin, IUser, PeerConnection, QuackamoleRTCClient, UserId } from '../quackamole-rtc/quackamole';
import { RouteDataFunc, useNavigate, useParams, useRouteData } from '@solidjs/router';
import { RoomData } from '../App';
import { GenericMediaStream } from '../components/GenericMediaStream';
import { RoomActionbar } from '../components/RoomActionbar';
import { RoomMedia } from '../components/RoomMedia';
import { QuackamoleGrid } from '../quackamole-grid/QuackamoleGrid';

export const Room: Component = () => {
  const [connections, setConnections] = createSignal<Map<UserId, PeerConnection>>(new Map());
  const [users, setUsers] = createSignal<Map<UserId, IUser>>(new Map());
  const [mediaStreams, setMediaStreams] = createSignal<Map<UserId, MediaStream>>(new Map());
  const [localMediaStream, setLocalMediaStream] = createSignal<MediaStream | null>(null);
  const [socketStatus, setSocketStatus] = createSignal<'none' | 'open' | 'closed' | 'error'>('none');
  const [localUser, setLocalUser] = createSignal<IUser | null>(null);
  const [displayName, setDisplayName] = useLocalStorage('displayName', '');
  const [plugin, setPlugin] = createSignal<IPlugin | null>(null);
  let iframeRef: HTMLIFrameElement | null = null;

  const params = useParams();
  // const navigate = useNavigate();
  const { data, error, abort, statusCode, isFetching, isFinished } = useFetch<IBaseRoom>(`http://localhost:12000/rooms/${params.id}`).get().json();

  onMount(() => {
    const grid = new QuackamoleGrid('grid-container', 'grid-item');
  });

  createEffect(async () => {
    const r = data();
    const u = localUser();
    if (!displayName()) return;
    if (!localUser()?.id && socketStatus() === 'open') await quackamole.loginUser();
    if (!r?.id || !u) return;
    quackamole.joinRoom(r.id);
  });

  const quackamole = new QuackamoleRTCClient('ws://localhost:12000/ws', '#iframe-wrapper');
  quackamole.onconnection = (id, connection): void => {
    setConnections(connections => {
      const newConnections = new Map(connections);
      if (connection) newConnections.set(id, connection);
      else newConnections.delete(id);
      return newConnections;
    });
  };
  quackamole.onremoteuserdata = (id, userData): void => {
    setUsers(users => {
      const newUsers = new Map(users);
      if (userData) newUsers.set(id, userData);
      else newUsers.delete(id);
      return newUsers;
    });
  };
  quackamole.onremotestream = (id, stream): void => {
    setMediaStreams(streams => {
      const newStreams = new Map(streams);
      if (stream) newStreams.set(id, stream);
      else newStreams.delete(id);
      return newStreams;
    });
  };
  quackamole.onlocalstream = stream => { setLocalMediaStream(stream) };
  quackamole.onsocketstatus = status => { setSocketStatus(status) };
  quackamole.onlocaluserdata = user => setLocalUser(user);
  // quackamole.onsetplugin = plugin => iframeRef.src = plugin?.url || '';

  return <div class="flex flex-col h-screen" id='grid-container'>
    <Show when={socketStatus() === 'open' && data()?.id} fallback={'Loading...'}>
      <Show when={displayName()} fallback={<RoomLobby quackamole={quackamole} room={data()!} />}>

        {/* <RoomMedia localStream={localMediaStream()} localUser={localUser()} remoteStreams={mediaStreams()} remoteUsers={users()}></RoomMedia> */}

        {/* <iframe ref={el => iframeRef = el} class="iframe grid-item" id="plugin-iframe" style={{ width: '100%', height: '100%', border: 'none' }} title={'plugin'} /> */}
        <div id="iframe-wrapper" class="iframe grid-item"></div>

        <div id="media-content" class="mediabar grid-item">
          <GenericMediaStream stream={localMediaStream()}></GenericMediaStream>
          <For each={Array.from(users())} fallback={<div>No remote media...</div>}>
            {([id, user]) => <GenericMediaStream user={user} stream={mediaStreams().get(id)}></GenericMediaStream>}
          </For>
        </div>

        <RoomActionbar quackamole={quackamole} />

      </Show>
    </Show>
  </div>;
};


// TODO use grid layout to position everything https://cssgridgarden.com/
