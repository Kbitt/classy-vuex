export { action, getActions, getActionKeys } from './action'
export { getter, getGetters, getGetterKeys } from './getter'
export { getset, getGetSets, getGetSetKeys } from './getset'
export { mutation, getMutations } from './mutation'
export * from './virtual'
export { state, getStates } from './state'
export * from './model'
import { ModuleCtor, getModule } from './store'
export {
    getModule,
    createStore,
    registerModule,
    unregisterModule,
    isRegistered,
} from './store'
export * from './helpers'

declare module 'vue/types/vue' {
    interface Vue {
        $getModule: <T>(ctor: ModuleCtor<T>, namespace?: string) => T
    }
}

export function install(Vue: any) {
    Vue.prototype.$getModule = function<T>(
        this: Vue,
        ctor: ModuleCtor<T>,
        namespace?: string
    ): T {
        return getModule(ctor, namespace || undefined)
    }
}

export default { install }
