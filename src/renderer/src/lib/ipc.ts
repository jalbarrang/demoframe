import type {
  IpcChannel,
  IpcEventChannel,
  IpcInvokeChannel,
  IpcRequest,
  IpcResponse
} from '../../../shared/ipc-channels'

export const ipc = {
  invoke<C extends IpcInvokeChannel>(
    channel: C,
    ...args: IpcRequest<C> extends void ? [] : [IpcRequest<C>]
  ): Promise<IpcResponse<C>> {
    return window.api.invoke(channel, ...args)
  },

  send<C extends IpcChannel>(
    channel: C,
    ...args: IpcRequest<C> extends void ? [] : [IpcRequest<C>]
  ): void {
    window.api.send(channel, ...args)
  },

  on<C extends IpcEventChannel>(
    channel: C,
    callback: (data: IpcResponse<C>) => void
  ): () => void {
    return window.api.on(channel, callback)
  },

  once<C extends IpcEventChannel>(
    channel: C,
    callback: (data: IpcResponse<C>) => void
  ): void {
    window.api.once(channel, callback)
  }
}
