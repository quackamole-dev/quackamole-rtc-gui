import { Component, For, createMemo } from 'solid-js';
import { GenericMediaStream } from './GenericMediaStream';
import { QuackamoleGrid } from '../quackamole-grid/QuackamoleGrid';
import { IUser, UserId } from 'quackamole-shared-types';


export const RoomMedia: Component<RoomMediaProps> = props => {
  const validUsers = createMemo(() => Object.values(props.remoteUsers).filter(u => Boolean(u)));

  return (
    <div id="mediabar" class="bg-stone-800 border rounded border-stone-600 p-[5px] select-none" ref={el => QuackamoleGrid.registerGridItem(el, 14, 1, 17, 11)}>
      <GenericMediaStream user={props.localUser} flipX={true} mute={true}></GenericMediaStream>
      <For each={validUsers()}>{user => <GenericMediaStream user={user} mute={false}></GenericMediaStream>}</For>
    </div>
  );
};

interface RoomMediaProps {
  localUser: IUser | null;
  remoteUsers: Record<UserId, IUser | null>;
}
