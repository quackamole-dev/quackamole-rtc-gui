/* eslint-disable solid/reactivity */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Component, Show, createEffect, createMemo, createResource, createSignal } from 'solid-js';
import { useLocalStorage } from 'solidjs-use';
import { RoomLobby } from '../components/RoomLobby';
import { useParams } from '@solidjs/router';
import { RoomActionbar } from '../components/RoomActionbar';
import { RoomMedia } from '../components/RoomMedia';
import { IUser, UserId } from 'quackamole-shared-types';
import { QuackamoleRTCClient } from 'quackamole-rtc-client';
import { QuackamoleGrid } from 'quackamole-grid';


export const Room: Component = () => {
  const [users, setUsers] = createSignal<Record<UserId, IUser | null>>({});
  const [localUser, setLocalUser] = createSignal<IUser | null>(null);
  const [socketStatus, setSocketStatus] = createSignal<'none' | 'open' | 'closed' | 'error'>('none');
  const [displayName] = useLocalStorage('displayName', '');

  const quackamole = createMemo(() => new QuackamoleRTCClient(import.meta.env.VITE_BACKEND_API_URL, import.meta.env.VITE_BACKEND_WS_URL, import.meta.env.VITE_BACKEND_SECURE === 'true', '#iframe-wrapper'));
  quackamole().onsocketstatus = status => { setSocketStatus(status); };
  quackamole().onlocaluserdata = user => setLocalUser({ ...user });
  quackamole().onremoteuserdata = (id, userData) => setUsers(users => ({ ...users, [id]: userData }));

  const params = useParams();
  const [room] = createResource(() => quackamole().http.getRoom(params.id));

  createEffect(() => {
    const r = room();
    const u = localUser();
    if (!displayName() || !r) return;
    if (!u && socketStatus() === 'open' && r) return quackamole().loginUser().then(() => quackamole().joinRoom(r.id));
    quackamole().joinRoom(r.id);
  });

  return <>
    <Show when={socketStatus() === 'open' && room()?.id} fallback={'Loading...'}>
      <Show when={displayName()} fallback={<RoomLobby quackamole={quackamole()} room={room()!} />}>
        <div ref={el => QuackamoleGrid.init(el, 16, 10, 8)} class="flex flex-col h-screen select-none" id='grid-container'>
          <div ref={el => QuackamoleGrid.registerGridItem(el, 1, 1, 14, 10)} id="iframe-wrapper" class="border bg-stone-800 rounded border-stone-600 select-none" />
          <RoomMedia localUser={localUser()} remoteUsers={users()} />
          <RoomActionbar quackamole={quackamole()} />
        </div>
      </Show>
    </Show>
  </>;
};
