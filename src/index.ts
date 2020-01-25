export { action, getActions, getActionKeys } from './action'
export { getter, getGetters, getGetterKeys } from './getter'
export { getset, getGetSets, getGetSetKeys } from './getset'
export { mutation, getMutations } from './mutation'
export { state, getStates } from './state'
export * from './model'
import {
    setStoreConstructor,
    StoreConstructor,
    ModuleCtor,
    getModule,
} from './store'
export { getModule, classModule, createStore } from './store'
export * from './helpers'

declare module 'vue/types/vue' {
    interface Vue {
        $getModule: <T>(ctor: ModuleCtor<T>, namespace?: string) => T
    }
}

export type ClassyVuexPluginOptions = {
    Store: StoreConstructor<any>
}

export function install(Vue: any, { Store }: ClassyVuexPluginOptions) {
    Vue.prototype.$getModule = function<T>(
        this: Vue,
        ctor: ModuleCtor<T>,
        namespace?: string
    ): T {
        return getModule(ctor, namespace || undefined)
    }
    setStoreConstructor(Store)
}

export default { install }
