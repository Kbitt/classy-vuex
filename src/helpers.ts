/// <reference types="vuex" />
import { ModuleCtor, getModule } from './store'
import { getStates, getStateKeys } from './state'
import { getMutations } from './mutation'
import { getActionKeys } from './action'
import { getGetterKeys } from './getter'
import { getGetSetKeys } from './getset'
import { Accessors } from 'vue/types/options'
import { getModelKeys } from './model'

export type VueComputed = Accessors<{ [key: string]: any }>

/** Create a map of computed properties for the given module constructor
 *
 */
export function mapComputed<T>(
    ctor: ModuleCtor<T>,
    namespace: string | undefined = undefined
): VueComputed {
    const result: VueComputed = {}
    const classModule = () => getModule(ctor, namespace)
    const gsKeys = getGetSetKeys(ctor.prototype)
    const modelKeys = getModelKeys(ctor.prototype)
    const keys = [getStateKeys, getGetterKeys, () => gsKeys, () => modelKeys]
        .map(fn => fn(ctor.prototype))
        .reduce((a, b) => a.concat(b))
    keys.forEach(key => {
        const get = function(this: Vue) {
            const prop = classModule()[key as keyof T]
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
                classModule()[key as keyof T] = value
            },
        }
    })
    return result
}

export function mapMethods<T>(
    ctor: ModuleCtor<T>,
    namespace: string | undefined = undefined
): Record<string, Function> {
    const result: Record<string, Function> = {}
    const classModule = (): any => getModule(ctor, namespace)
    const keys = [getMutations, getActionKeys]
        .map(fn => fn(ctor.prototype))
        .reduce((a, b) => a.concat(...b))
    keys.forEach(key => {
        result[key] = function(this: Vue) {
            const m = classModule()
            return (m[key] as Function)(...arguments)
        }
    })
    return result
}
