import type { Component } from 'solid-js';
import { createMemo, createSignal, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { IAdminRoom } from 'quackamole-shared-types';
import { QuackamoleHttpClient } from 'quackamole-rtc-client';
import QRCodeStyling from 'qr-code-styling';
import coolAvocado from '../assets/cool-avocado-03.png';
import { TextCopyOutput } from '../components/TextCopyOutput';


export const Home: Component = () => {
  const [room, setRoom] = createSignal<IAdminRoom | null>(null);
  const [error, setError] = createSignal('');
  const navigate = useNavigate();
  // const roomGuestUrl = createMemo(() => `${location.origin}/#/${room()?.id}`);
  const roomAdminUrl = createMemo(() => `${location.origin}/#/${room()?.adminId}`);
  let wrapperQRRef: HTMLElement | null = null;


  async function createRoom() {
    const room = await QuackamoleHttpClient.createRoom();
    if (room instanceof Error) return setError(room.message);
    setRoom(room);
    new QRCodeStyling({
      width: 310,
      height: 310,
      type: 'canvas',
      data: roomAdminUrl(),
      image: coolAvocado,
      imageOptions: {hideBackgroundDots: false, imageSize: 1, crossOrigin: 'anonymous', margin: 5},
      dotsOptions: {color: '#4D7C1F', type: 'dots'},
      backgroundOptions: {color: '#d6d3d1', round: 0},
    }).append(wrapperQRRef!);
  }

  return <>
    <div class="flex justify-center items-center flex-col h-full bg-stone-950">
      <div class="flex flex-col justify-center items-center w-[500px] max-w-[100vw] h-full px-3 py-8">
        <Show when={!room()}>
          <div class="q-text-bubble">
            <p class="mb-3">Oh hi there!</p>
            <p class="mb-3">Welcome to Quackamole, one of the videochat platforms of all time.</p>
            <p>Create a room and have a look</p>
            <div class="q-text-bubble-triangle" />
          </div>
          <img src={coolAvocado} class="aspect-square m-auto max-h-[90vw] max-w-[90vw] w-[370px] h-[370px]" alt='a cool avocado' />
          <button onClick={createRoom} class="q-btn-primary">Create Room</button>
          <Show when={error()}>
            <div>{error()}</div>
          </Show>
        
        </Show>

        <Show when={room()}>
          <div class="q-text-bubble">
            <p class="mb-3">Share this QR Code for people to join.</p>
            <p class="mb-3">Alternatively you can also share this link:</p>
            <TextCopyOutput text={roomAdminUrl} />
            <div class="q-text-bubble-triangle" />
          </div>
          <div class="flex justify-center m-auto overflow-hidden q-card" ref={el => wrapperQRRef = el}  />
          <button class="q-btn-primary" onClick={() => navigate(`/${room()?.adminId}`)}>Join as Admin</button>
        </Show>
      </div>
    </div>
  </>;
};
