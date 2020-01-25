/// <reference types="vuex" />
import { ModuleCtor, getModuleAs } from './store'
import { getStates } from './state'
import { getMutations } from './mutation'
import { getActions } from './action'
import { getGetterKeys, getGetters } from './getter'
import { getVuexKeyMap } from './reflect'
import { getGetSets, getGetSetKeys } from './getset'
import { Store } from 'vuex'
import { Accessors } from 'vue/types/options'
import { getModels, getModelKeys } from './model'

export type CpuProperty = { get: () => any; set: (value: any) => void }
export type Cpu = Function | CpuProperty

/** map the given module class constructor to a map of functions for Vue computed properties */
export function mapModule<T>(
    this: import('vue').default,
    ctor: ModuleCtor<T>,
    namespace: string | undefined = undefined
): Record<keyof T, Cpu> {
    const result: Record<string, Cpu> = {}

    const classModule = getModuleAs(ctor, this.$store, namespace)

    const map = getVuexKeyMap(ctor.prototype)

    const mappedGs: Record<string, boolean> = {}

    getGetSets(ctor.prototype).forEach(gs => {
        mappedGs[gs.key] = true
        const key = gs.key as keyof typeof classModule
        result[gs.key] = {
            get: () => classModule[key],
            set: value => (classModule[key] = value),
        }
    })

    Object.keys(map).forEach(keyString => {
        if (mappedGs[keyString]) return
        const key = keyString as keyof typeof classModule
        result[keyString] = () => classModule[key]
        Object.defineProperty(result, key, {
            get: () => classModule[key as keyof typeof classModule],
        })
    })

    return result as Record<keyof T, Function>
}

export type VueComputed = Accessors<{ [key: string]: any }>

export function mapComputed<T>(
    ctor: ModuleCtor<T>,
    namespace: string | undefined = undefined
): VueComputed {
    const result: VueComputed = {}
    const classModule = (store: Store<any>) =>
        getModuleAs(ctor, store, namespace)
    const gsKeys = getGetSetKeys(ctor.prototype)
    const modelKeys = getModelKeys(ctor.prototype)
    const keys = [getStates, getGetterKeys, () => gsKeys, () => modelKeys]
        .map(fn => fn(ctor.prototype))
        .reduce((a, b) => [...a, ...b])
    keys.forEach(key => {
        const get = function(this: Vue) {
            const prop = classModule(this.$store)[key as keyof T]
            // check for getter defined as function
            return typeof prop === 'function' ? prop() : prop
        }
        if (!gsKeys.includes(key) && !modelKeys.includes(key)) {
            result[key] = get
            return
        }

        result[key] = {
            get,
            set: function(this: Vue, value: any) {
                classModule(this.$store)[key as keyof T] = value
            },
        }
    })
    return result
}

export function mapMethods<T>(
    this: import('vue').default,
    ctor: ModuleCtor<T>,
    namespace: string | undefined = undefined
): Record<string, Function> {
    const result: Record<string, Function> = {}
    const classModule = getModuleAs(ctor, this.$store, namespace)

    return result
}
