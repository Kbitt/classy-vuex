/// <reference types="vuex" />
import { ModuleCtor, getModuleAs } from './store'
import { getStates } from './state'
import { getMutations } from './mutation'
import { getActions } from './action'
import { getGetterKeys } from './getter'

export type Cpu = Function | { get: () => any; set: (value: any) => void }

/** map the given module class constructor to a map of functions for Vue computed properties */
export function mapModule<T>(
    this: import('vue').default,
    ctor: ModuleCtor<T>,
    namespace: string | undefined = undefined
): Record<keyof T, Cpu> {
    const result: Record<string, Cpu> = {}

    const classModule = getModuleAs(ctor, this.$store, namespace)

    const keys = [getStates, getMutations, getActions, getGetterKeys]
        .map(fn => [...fn(ctor.prototype)])
        .reduce((a, b) => a.concat(b))

    keys.forEach(key => {
        Object.defineProperty(result, key, {
            get: () => classModule[key],
        })
    })

    return result as Record<keyof T, Function>
}
