/* eslint-disable solid/reactivity */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Component, Show, createEffect, createResource, createSignal, onCleanup } from 'solid-js';
import { useLocalStorage } from 'solidjs-use';
import { RoomLobby } from '../components/RoomLobby';
import { useParams } from '@solidjs/router';
import { RoomActionbar } from '../components/RoomActionbar';
import { RoomMedia } from '../components/RoomMedia';
import { QuackamoleRTCClient } from 'quackamole-rtc-client';
import { QuackamoleGrid } from 'quackamole-grid';
import { IUserInfo } from 'quackamole-rtc-client/dist/QuackamoleRTCClient';
import { UserId } from 'quackamole-shared-types';

export const Room: Component = () => {
  const [remoteUserInfoMap, setRemoteUserInfoMap] = createSignal<Map<UserId, IUserInfo>>(new Map());
  const [localUserInfo, setLocalUserInfo] = createSignal<IUserInfo>({});
  const [socketStatus, setSocketStatus] = createSignal<'none' | 'open' | 'closed' | 'error'>('none');
  const [displayName] = useLocalStorage('displayName', '');
  const params = useParams();
  const quackamole = new QuackamoleRTCClient(import.meta.env.VITE_BACKEND_API_URL, import.meta.env.VITE_BACKEND_WS_URL, import.meta.env.VITE_BACKEND_SECURE === 'true', '#iframe-wrapper');
  quackamole.onlocaluserdata = info => setLocalUserInfo(info);
  quackamole.onremoteuserdata = (id, info) => setRemoteUserInfoMap(infos => ({ ...infos, [id]: info }));
  quackamole.onsocketstatus = status => setSocketStatus(status);
  const [room] = createResource(() => quackamole.http.getRoom(params.id));

  createEffect(() => {
    console.log('--------effect', localUserInfo());
    const r = room();
    const u = localUserInfo();
    if (!displayName() || !r) return;
    if (!u.user && socketStatus() === 'open' && r) return quackamole.loginUser().then(() => quackamole.joinRoom(r.id));
    quackamole.joinRoom(r.id);
  });

  onCleanup(() => quackamole.stopLocalStream());
  
  return <>
    <Show when={socketStatus() === 'open' && room()?.id} fallback={'Loading...'}>
      <Show when={displayName()} fallback={<RoomLobby quackamole={quackamole} room={room()!} userInfo={localUserInfo()} />}>
        <div ref={el => QuackamoleGrid.init(el, 16, 10, 8)} class="flex flex-col h-screen select-none" id='grid-container'>
          <div ref={el => QuackamoleGrid.registerGridItem(el, 1, 1, 14, 10)} id="iframe-wrapper" class="q-card" />
          <RoomMedia localUserInfo={localUserInfo()} remoteUsers={remoteUserInfoMap()} />
          <RoomActionbar quackamole={quackamole} userInfo={localUserInfo()} />
        </div>
      </Show>
    </Show>
  </>;
};
