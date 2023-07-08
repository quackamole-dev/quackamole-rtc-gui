import { Component, createEffect, For, Show } from 'solid-js';
import { setVideoSrc } from '../utils/setVideoSource';
import { IUser, UserId } from '../quackamole-rtc/quackamole';
import { GenericMediaStream } from './GenericMediaStream';


export const RoomMedia: Component<RoomMediaProps> = props => {

    return (
        <div>
            <GenericMediaStream user={props.localUser} stream={props.localStream}></GenericMediaStream>
            <For each={Array.from(props.remoteUsers)} fallback={<div>Remote Media streams loading...</div>}>
                {([id, user]) => <GenericMediaStream user={user} stream={props.remoteStreams.get(id)}></GenericMediaStream>}
            </For>
        </div>
    );
};

interface RoomMediaProps {
    localStream: MediaStream | null;
    localUser: IUser | null;
    remoteStreams: Map<UserId, MediaStream>;
    remoteUsers: Map<UserId, IUser>;
}
