import { createSignal } from "solid-js";

export const usePeerConnections = () => {
    const [connections, setConnections] = createSignal<RTCPeerConnection[]>([]);

    const addConnection = (connection: RTCPeerConnection) => {
        setConnections((prevConnections) => [...prevConnections, connection]);
    };

    const removeConnection = (connection: RTCPeerConnection) => {
        setConnections((prevConnections) => prevConnections.filter((pc) => pc !== connection));
    };

    return [connections, addConnection, removeConnection];
};
