export { action, getActions } from './action'
export { getter, getGetters, getGetterKeys } from './getter'
export { getset, getGetSets } from './getset'
export { mutation, getMutations } from './mutation'
export { state, getStates } from './state'
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
        return getModule(ctor, this.$store, namespace || undefined)
    }
    setStoreConstructor(Store)
}

export default { install }
