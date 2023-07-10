import { Component, Show, createEffect, createMemo, createResource, createSignal } from 'solid-js';
import { useLocalStorage } from 'solidjs-use';
import { RoomLobby } from '../components/RoomLobby';
import { IUser, QuackamoleRTCClient, UserId } from '../quackamole-rtc/quackamole';
import { useParams } from '@solidjs/router';
import { RoomActionbar } from '../components/RoomActionbar';
import { RoomMedia } from '../components/RoomMedia';
import { QuackamoleGrid } from '../quackamole-grid/QuackamoleGrid';
import { QuackamoleHttpClient } from '../quackamole-rtc/QuackamoleHttp';


export const Room: Component = () => {
  const [users, setUsers] = createSignal<Record<UserId, IUser | null>>({});
  const [localUser, setLocalUser] = createSignal<IUser | null>(null);
  const [socketStatus, setSocketStatus] = createSignal<'none' | 'open' | 'closed' | 'error'>('none');
  const [displayName, _] = useLocalStorage('displayName', '');

  const params = useParams();
  const [room] = createResource(() => QuackamoleHttpClient.getRoom(params.id));

  createEffect(async () => {
    const r = room();
    const u = localUser();
    if (!displayName() || !r) return;
    if (!u && socketStatus() === 'open' && r) await quackamole().loginUser();
    quackamole().joinRoom(r.id);
  });

  const quackamole = createMemo(() => new QuackamoleRTCClient('ws://localhost:12000/ws', '#iframe-wrapper'));
  quackamole().onsocketstatus = status => { setSocketStatus(status) };
  quackamole().onlocaluserdata = user => setLocalUser({ ...user });
  quackamole().onremoteuserdata = (id, userData) => setUsers(users => ({ ...users, [id]: userData }));

  return <>
    <Show when={socketStatus() === 'open' && room()?.id} fallback={'Loading...'}>
      <Show when={displayName()} fallback={<RoomLobby quackamole={quackamole()} room={room()!} />}>
        <div ref={el => QuackamoleGrid.init(el, 16, 10, 8)} class="flex flex-col h-screen select-none" id='grid-container'>
          <div ref={el => QuackamoleGrid.registerGridItem(el, 1, 1, 14, 10)} id="iframe-wrapper" class="border bg-stone-800 rounded border-stone-600 select-none"></div>
          <RoomMedia localUser={localUser()} remoteUsers={users()}></RoomMedia>
          <RoomActionbar quackamole={quackamole()} />
        </div>
      </Show>
    </Show>
  </>;
};
