
import { TbMicrophoneOff, TbVideoOff, TbMicrophone, TbVideo, TbSettings } from 'solid-icons/tb';
import { BsFullscreen } from 'solid-icons/bs';
import { VsExtensions } from 'solid-icons/vs';
import { AiOutlineSend } from 'solid-icons/ai';
import { Component, For, createResource, createSignal } from 'solid-js';
import { QuackamoleRTCClient, QuackamoleHttpClient  } from 'quackamole-rtc-client';
import { Portal } from 'solid-js/web';
import { QuackamoleGrid } from 'quackamole-grid';
import { IUserInfo } from 'quackamole-rtc-client/dist/QuackamoleRTCClient';
import { HiOutlineChatBubbleOvalLeftEllipsis } from 'solid-icons/hi';
import { PluginOverviewCard } from './PluginOverviewCard';


export const RoomActionbar: Component<{ quackamole: QuackamoleRTCClient, userInfo: IUserInfo }> = props => {
  // const navigate = useNavigate();
  const [openSettings, setOpenSettings] = createSignal(false);
  const [openPlugins, setOpenPlugins] = createSignal(false);
  const [openChat, setOpenChat] = createSignal(false);
  const [plugins] = createResource(QuackamoleHttpClient.getPlugins);
  let chatInputRef: HTMLInputElement;

  return (
    <div class="flex justify-center q-card items-center" id="actionbar" ref={el => QuackamoleGrid.registerGridItem(el, 1, 10, 14, 11)}>
      <div class="q-btn-action" onClick={() => setOpenSettings(!openSettings())}><TbSettings /></div>
      <div class="q-btn-action" onClick={() => setOpenPlugins(!openPlugins())}><VsExtensions /></div>
      <div class="q-btn-action" onClick={() => setOpenChat(true)}><HiOutlineChatBubbleOvalLeftEllipsis /></div>
      <span class="m-auto" />
      <div class="q-btn-action-2" onClick={() => props.quackamole.toggleMicrophoneEnabled()}>{props.userInfo.micEnabled ? <TbMicrophone /> : <TbMicrophoneOff />}</div>
      <div class="q-btn-action-2" onClick={() => props.quackamole.toggleCameraEnabled()}>{props.userInfo.camEnabled ? <TbVideo /> : <TbVideoOff />}</div>
      <span class="m-auto" />
      <div class="q-btn-action" onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()}><BsFullscreen /></div>


      <Portal>
        <div id="modal-settings" class={`${openSettings() ? '' : 'hidden'} flex justify-center items-center absolute inset-0 bg-stone-800 bg-opacity-75`} onClick={e => e.target === e.currentTarget && setOpenSettings(false)}>
          <div class='max-w-[100vw] w-[500px] max-h-[100vh] q-card-lighter py-4 px-2'>
            <div class="grid grid-cols-1 gap-4 overflow-x-scroll q-invisible-scroll q-card p-2 max-h-[60vh] scroll-pt-4 snap-y">
              <For each={plugins()} fallback={<div>Plugins loading...</div>}>
                {(item, i) => <div class="h-[70px]">Settings {i()}</div>}
              </For>
            </div>
            <button onClick={() => setOpenSettings(false)} class='q-btn-secondary mt-8 mx-auto !w-[initial]'>Close</button>
          </div>
        </div>
      </Portal>

      <Portal>
        <div id="modal-plugins" class={`${openPlugins() ? '' : 'hidden'} flex justify-center items-center absolute inset-0 bg-stone-800 bg-opacity-75`} onClick={e => e.target === e.currentTarget && setOpenPlugins(false)}>
          <div class='max-w-[100vw] w-[500px] max-h-[100vh] q-card-lighter py-4 px-2'>
            <div class="grid grid-cols-1 gap-4 overflow-x-scroll q-invisible-scroll q-card p-2 max-h-[60vh] scroll-pt-4 snap-y">
              <For each={plugins()} fallback={<div>Plugins loading...</div>}>
                {(item) => <PluginOverviewCard plugin={item} onSelect={() => {props.quackamole.setPlugin(item); setOpenPlugins(false);}} />}
              </For>
            </div>
            <button onClick={() => setOpenPlugins(false)} class='q-btn-secondary mt-8 mx-auto !w-[initial]'>Close</button>
          </div>
        </div>
      </Portal>

      <Portal>
        <div id="modal-chat" class={`${openChat() ? '' : 'hidden'} flex justify-center items-center absolute inset-0 bg-stone-800 bg-opacity-75`} onClick={e => e.target === e.currentTarget && setOpenChat(false)}>
          <div class='max-w-[100vw] w-[500px] max-h-[100vh] q-card-lighter'>
            <div class="flex flex-col overflow-x-scroll q-invisible-scroll q-card p-3 max-h-[60vh] scroll-p-4 h-[600px] m-3">
              <div class="">Andi: Message 01</div>
              <div class="">Derp: Message 02</div>
              <div class="">Derp: Message 02</div>
              <div class="">Derp: Message 02</div>
              <div class="">Derp: Message 02</div>
              <div class="">Derp: Message 02</div>
              <div class="">Derp: Message 02</div>
            </div>
            <div class="flex flex-row items-center p-3">
              <div class="relative w-full">
                <input type="text" class="q-input-text !h-[40px] !pr-10 text-ellipsis" aria-label={'chat input'} ref={el => chatInputRef = el} />
                <div class="cursor-pointer absolute right-0 top-1/2 h-full text-2xl w-10 -translate-y-1/2 flex justify-center items-center" onClick={sendChatMessage(chatInputRef.value)}><AiOutlineSend /></div>
              </div>
            </div>
          </div>
        </div>
      </Portal>
    </div>
  );
};
