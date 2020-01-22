export * from './action'
export * from './getter'
export * from './getset'
export * from './mutation'
import {
    getModuleAs,
    setStoreConstructor,
    classModule,
    createStore,
    StoreConstructor,
} from './store'
export { getModuleAs, classModule, createStore }
export * from './helpers'
export * from './state'

export type ClassyVuexPluginOptions = {
    Store: StoreConstructor<any>
}

export function install(_: any, { Store }: ClassyVuexPluginOptions) {
    setStoreConstructor(Store)
}

export default { install }
