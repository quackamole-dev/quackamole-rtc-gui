import type { Component } from 'solid-js';
import { createMemo, createSignal, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { TextCopyOutput } from './TextCopyOutput';
import { IAdminRoom } from 'quackamole-shared-types';
import { QuackamoleHttpClient } from 'quackamole-rtc-client';

export const RoomCreator: Component = () => {
  const [room, setRoom] = createSignal<IAdminRoom | null>(null);
  const [error, setError] = createSignal('');

  const roomGuestUrl = createMemo(() => `${location.origin}/${room()?.id}`);
  const roomAdminUrl = createMemo(() => `${location.origin}/${room()?.adminId}`);

  async function createRoom() {
    const room = await QuackamoleHttpClient.createRoom();
    room instanceof Error ? setError(room.message) : setRoom(room);
  }

  return <>
    <div class="flex justify-center items-center flex-col h-full bg-stone-950">
      <div class="flex flex-col max-w-[600px] min-w-[400px] p-10 rounded border-stone-600 border bg-stone-800">
        <Show when={!room()}>
          <h1 class="m-auto">Quackamole</h1>
          <button onClick={createRoom} class="mt-3 flex w-full justify-center rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Create Room</button>
          <Show when={error()}>
            <div>{error()}</div>
          </Show>
        </Show>
        <Show when={room()}>
          <div class="text-2xl m-auto mb-6">Created</div>
          <div>Share this link with Guests:</div>
          <TextCopyOutput text={roomGuestUrl} />

          <div>Share this link with Admins:</div>
          <TextCopyOutput text={roomAdminUrl} />
          <A href={`/${room()?.adminId}`} class="mt-3 flex w-full justify-center rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Join as Moderator</A>
        </Show>
      </div>
    </div>
  </>;
};
