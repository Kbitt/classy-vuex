export { action } from './action'
export { getter } from './getter'
export { getset } from './getset'
export { mutation } from './mutation'
import { setStoreConstructor, StoreConstructor } from './store'
export { getModuleAs, classModule, createStore } from './store'
export * from './helpers'
export { state } from './state'

export type ClassyVuexPluginOptions = {
    Store: StoreConstructor<any>
}

export function install(_: any, { Store }: ClassyVuexPluginOptions) {
    setStoreConstructor(Store)
}

export default { install }
