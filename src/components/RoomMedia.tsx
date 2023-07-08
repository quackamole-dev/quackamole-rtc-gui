import { Accessor, Component, createEffect, For, Show } from 'solid-js';
import { setVideoSrc } from '../utils/setVideoSource';
import { IUser, UserId } from '../quackamole-rtc/quackamole';
import { GenericMediaStream } from './GenericMediaStream';


export const RoomMedia: Component<RoomMediaProps> = props => {

    return (
        <div id="mediabar" class="bg-stone-800 border rounded border-stone-600 p-[5px]">
            <GenericMediaStream user={props.localUser()} stream={props.localStream()} flipX={true}></GenericMediaStream>
            <For each={Array.from(props.remoteUsers())} fallback={<div>Remote Media streams loading...</div>}>
                {([id, user]) => <GenericMediaStream user={user} stream={props.remoteStreams().get(id)}></GenericMediaStream>}
            </For>
        </div>
    );
};

interface RoomMediaProps {
    localStream: Accessor<MediaStream | null>;
    localUser: Accessor<IUser | null>;
    remoteStreams: Accessor<Map<UserId, MediaStream>>;
    remoteUsers: Accessor<Map<UserId, IUser>>;
}
