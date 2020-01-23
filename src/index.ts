export { action, getActions } from './action'
export { getter, getGetters, getGetterKeys } from './getter'
export { getset, getGetSets } from './getset'
export { mutation, getMutations } from './mutation'
export { state, getStates } from './state'
import { setStoreConstructor, StoreConstructor } from './store'
export { getModuleAs, classModule, createStore } from './store'
export * from './helpers'

export type ClassyVuexPluginOptions = {
    Store: StoreConstructor<any>
}

export function install(_: any, { Store }: ClassyVuexPluginOptions) {
    setStoreConstructor(Store)
}

export default { install }
