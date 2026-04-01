import { contextBridge, ipcRenderer } from 'electron'
import type { IpcChannel, IpcRequest, IpcResponse, IpcEventChannel } from '../shared/ipc-channels'

const api = {
  invoke<C extends IpcChannel>(channel: C, ...args: IpcRequest<C> extends void ? [] : [IpcRequest<C>]): Promise<IpcResponse<C>> {
    return ipcRenderer.invoke(channel, ...args)
  },

  send<C extends IpcChannel>(channel: C, ...args: IpcRequest<C> extends void ? [] : [IpcRequest<C>]): void {
    ipcRenderer.send(channel, ...args)
  },

  on<C extends IpcEventChannel>(channel: C, callback: (data: IpcResponse<C>) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, data: IpcResponse<C>): void => callback(data)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  },

  once<C extends IpcEventChannel>(channel: C, callback: (data: IpcResponse<C>) => void): void {
    ipcRenderer.once(channel, (_event, data) => callback(data))
  }
}

export type DrekiAPI = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore global augmentation
  window.api = api
}
