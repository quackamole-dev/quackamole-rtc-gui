// export let socket: { socket: WebSocket | null } = {socket: null};
// const awaitedPromises: Record<string, IAwaitedPromise> = {};
// // TODO don't think it's necessary to make this reactive in any way. Move this eventually wherever it makes the most sense
// //  (probably as a closure in wherever the incoming Ws messages are handled)
//
//
// function createJoinRoomMessage(roomId: string): [{ roomId: string, awaitId: string, action: 'join_room' }, Promise<unknown>] {
//   const awaitId = crypto.randomUUID();
//   let resolve: IAwaitedPromise['resolve'];
//   let reject: IAwaitedPromise['reject'];
//   const promise = new Promise((_resolve, _reject) => {
//     resolve = _resolve;
//     reject = _reject;
//   });
//
//   // @ts-ignore - promise executor fn is synchronous, so resolve and reject fns are already assigned.
//   awaitedPromises[awaitId] = {promise, resolve, reject};
//   return [{roomId, awaitId, action: 'join_room'}, promise];
// }
//
// export const openSocket = () => {
//   socket.socket = new WebSocket(`ws://localhost:12000/ws`);
//   socket.socket.onopen = async () => {
//     console.log('socket now open');
//     const [message, promise] = createJoinRoomMessage(); // FIXME yikes
//     socket.socket?.send(JSON.stringify(message));
//     const res = await promise;
//     console.log('joined room successfully', res);
//
//   };
//   socket.socket.onmessage = async evt => {
//     const data: { awaitId: string, error: string } = JSON.parse(evt.data);
//
//     if (data.awaitId) {
//       // all messages with an awaitId are handled wherever they are awaited. Here we just resolve the promise
//       const {resolve, reject} = awaitedPromises[data.awaitId];
//       data.error ? reject(data.error) : resolve(data);
//     }
//   };
// };
//
// export interface IAwaitedPromise {
//   promise: Promise<unknown>;
//   resolve: (value: (unknown | PromiseLike<unknown>)) => void;
//   reject: (value: (string | PromiseLike<string>)) => void;
// }
//
//
// /**
//  * MIT License Copyright (c) 2022 Soorria Saruva
//  *
//  * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//  *
//  * The above copyright notice and this permission notice (including the next paragraph) shall be included in all copies or substantial portions of the Software.
//  *
//  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//  */
//
// import type {Accessor} from 'solid-js';
// import {createSignal} from 'solid-js';
//
// export type UseCopyProps = {
//   copiedTimeout?: number
// }
//
// type CopyFn = (text: string) => Promise<void>
//
// export const useSocket = ({copiedTimeout = 2000}: UseCopyProps = {}): [copy: CopyFn, copied: Accessor<boolean>] => {
//   const [copied, setCopied] = createSignal(false);
//   let timeout: number;
//
//   const copy: CopyFn = async text => {
//     await navigator.clipboard.writeText(text);
//     setCopied(true);
//     if (timeout) clearTimeout(timeout);
//     timeout = setTimeout(() => setCopied(false), copiedTimeout);
//   };
//
//   return [copy, copied];
// };
//
//


import { toAccessor, tryOnCleanup, useIntervalFn } from '@solidjs-use/shared'
import { createEffect, createSignal, on } from 'solid-js'
import { useEventListener } from '../useEventListener'
import type { Accessor } from 'solid-js'
import type { Fn, MaybeAccessor } from '@solidjs-use/shared'

export type WebSocketStatus = 'OPEN' | 'CONNECTING' | 'CLOSED'

const DEFAULT_PING_MESSAGE = 'ping'

export interface UseWebSocketOptions {
  onConnected?: (ws: WebSocket) => void
  onDisconnected?: (ws: WebSocket, event: CloseEvent) => void
  onError?: (ws: WebSocket, event: Event) => void
  onMessage?: (ws: WebSocket, event: MessageEvent) => void

  /**
   * Send heartbeat for every x milliseconds passed
   *
   * @default false
   */
  heartbeat?:
    | boolean
    | {
    /**
     * Message for the heartbeat
     *
     * @default 'ping'
     */
    message?: string | ArrayBuffer | Blob

    /**
     * Interval, in milliseconds
     *
     * @default 1000
     */
    interval?: number

    /**
     * Heartbeat response timeout, in milliseconds
     *
     * @default 1000
     */
    pongTimeout?: number
  }

  /**
   * Enabled auto reconnect
   *
   * @default false
   */
  autoReconnect?:
    | boolean
    | {
    /**
     * Maximum retry times.
     *
     * Or you can pass a predicate function (which returns true if you want to retry).
     *
     * @default -1
     */
    retries?: number | (() => boolean)

    /**
     * Delay for reconnect, in milliseconds
     *
     * @default 1000
     */
    delay?: number

    /**
     * On maximum retry times reached.
     */
    onFailed?: Fn
  }

  /**
   * Automatically open a connection
   *
   * @default true
   */
  immediate?: boolean

  /**
   * Automatically close a connection
   *
   * @default true
   */
  autoClose?: boolean

  /**
   * List of one or more sub-protocol strings
   *
   * @default []
   */
  protocols?: string[]
}

export interface UseWebSocketReturn<T> {
  /**
   * Reference to the latest data received via the websocket,
   * can be watched to respond to incoming messages
   */
  data: Accessor<T | null>

  /**
   * The current websocket status, can be only one of:
   * 'OPEN', 'CONNECTING', 'CLOSED'
   */
  status: Accessor<WebSocketStatus>

  /**
   * Closes the websocket connection gracefully.
   */
  close: WebSocket['close']

  /**
   * Reopen the websocket connection.
   * If there the current one is active, will close it before opening a new one.
   */
  open: Fn

  /**
   * Sends data through the websocket connection.
   *
   * @param data
   * @param useBuffer when the socket is not yet open, store the data into the buffer and sent them one connected. Default to true.
   */
  send: (data: string | ArrayBuffer | Blob, useBuffer?: boolean) => boolean

  /**
   * Reference to the WebSocket instance.
   */
  ws: Accessor<WebSocket | undefined>
}

function resolveNestedOptions<T>(options: T | true): T {
  if (options === true) return {} as T
  return options
}

/**
 * Reactive WebSocket client.
 *
 * @see https://solidjs-use.github.io/solidjs-use/core/useWebSocket
 */
export function useWebSocket<Data = any>(
  url: MaybeAccessor<string | URL | undefined>,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn<Data> {
  const {
    onConnected,
    onDisconnected,
    onError,
    onMessage,
    immediate = true,
    autoClose = true,
    protocols = []
  } = options

  const [data, setData] = createSignal<Data | null>(null)
  const [status, setStatus] = createSignal<WebSocketStatus>('CLOSED')
  const [wsAccessor, setWs] = createSignal<WebSocket | undefined>()
  const urlAccessor = toAccessor(url)

  let heartbeatPause: Fn | undefined
  let heartbeatResume: Fn | undefined

  let explicitlyClosed = false
  let retried = 0

  let bufferedData: Array<string | ArrayBuffer | Blob> = []

  let pongTimeoutWait: ReturnType<typeof setTimeout> | undefined

  // Status code 1000 -> Normal Closure https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code
  const close: WebSocket['close'] = (code = 1000, reason) => {
    const wsRefVal = wsAccessor()
    if (!wsRefVal) return
    explicitlyClosed = true
    heartbeatPause?.()
    wsRefVal.close(code, reason)
  }

  const _sendBuffer = () => {
    const wsRefVal = wsAccessor()
    if (bufferedData.length && wsRefVal && status() === 'OPEN') {
      for (const buffer of bufferedData) wsRefVal.send(buffer)
      bufferedData = []
    }
  }

  const resetHeartbeat = () => {
    clearTimeout(pongTimeoutWait)
    pongTimeoutWait = undefined
  }

  const send = (data: string | ArrayBuffer | Blob, useBuffer = true) => {
    const wsRefVal = wsAccessor()
    if (!wsRefVal || status() !== 'OPEN') {
      if (useBuffer) bufferedData.push(data)
      return false
    }
    _sendBuffer()
    wsRefVal.send(data)
    return true
  }

  const _init = () => {
    const urlValue = urlAccessor()
    if (explicitlyClosed || typeof urlValue === 'undefined') return

    const ws = new WebSocket(urlValue, protocols)
    setWs(ws)
    setStatus('CONNECTING')

    ws.onopen = () => {
      setStatus('OPEN')
      onConnected?.(ws)
      heartbeatResume?.()
      _sendBuffer()
    }

    ws.onclose = ev => {
      setStatus('CLOSED')
      setWs(undefined)
      onDisconnected?.(ws, ev)

      if (!explicitlyClosed && options.autoReconnect) {
        const { retries = -1, delay = 1000, onFailed } = resolveNestedOptions(options.autoReconnect)
        retried += 1

        if (typeof retries === 'number' && (retries < 0 || retried < retries)) setTimeout(_init, delay)
        else if (typeof retries === 'function' && retries()) setTimeout(_init, delay)
        else onFailed?.()
      }
    }

    ws.onerror = e => {
      onError?.(ws, e)
    }

    ws.onmessage = (e: MessageEvent) => {
      if (options.heartbeat) {
        resetHeartbeat()
        const { message = DEFAULT_PING_MESSAGE } = resolveNestedOptions(options.heartbeat)
        if (e.data === message) return
      }

      setData(e.data)
      onMessage?.(ws, e)
    }
  }

  if (options.heartbeat) {
    const {
      message = DEFAULT_PING_MESSAGE,
      interval = 1000,
      pongTimeout = 1000
    } = resolveNestedOptions(options.heartbeat)

    const { pause, resume } = useIntervalFn(
      () => {
        send(message, false)
        if (pongTimeoutWait != null) return
        pongTimeoutWait = setTimeout(() => {
          // auto-reconnect will be trigger with ws.onclose()
          close()
        }, pongTimeout)
      },
      interval,
      { immediate: false }
    )

    heartbeatPause = pause
    heartbeatResume = resume
  }

  if (autoClose) {
    useEventListener(window, 'beforeunload', () => close())
    tryOnCleanup(close)
  }

  const open = () => {
    close()
    explicitlyClosed = false
    retried = 0
    _init()
  }

  if (immediate) {
    createEffect(on(urlAccessor, open))
  }

  return {
    data,
    status,
    close,
    send,
    open,
    ws: wsAccessor
  }
}
