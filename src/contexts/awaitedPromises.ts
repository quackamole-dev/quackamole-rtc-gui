import {createContext} from "solid-js";

// export const AwaitedPromisesContext = createContext({});

export let socket: {socket: WebSocket | null } = {socket: null};
export const awaitedPromises: Record<string, IAwaitedPromise> = {};
// TODO don't think it's necessary to make this reactive in any way. Move this eventually wherever it makes the most sense
//  (probably as a closure in wherever the incoming Ws messages are handled)


export interface IAwaitedPromise {
  promise: Promise<unknown>;
  resolve: (value: (unknown | PromiseLike<unknown>)) => void;
  reject: (value: (string | PromiseLike<string>)) => void;
}