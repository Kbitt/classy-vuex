/// <reference types="vuex" />
import { ModuleCtor, getModule } from './store'
import { getStates } from './state'
import { getMutations } from './mutation'
import { getActionKeys } from './action'
import { getGetterKeys } from './getter'
import { getGetSetKeys } from './getset'
import { Accessors } from 'vue/types/options'
import { getModelKeys } from './model'

export type VueComputed = Accessors<{ [key: string]: any }>

export type MapOptions = {
    exclude?: string[]
    transformKey?: (key: string) => string
}

const resolveOptions = (
    optionsOrNamespace?: string | MapOptions,
    mapOptions?: MapOptions
): Required<MapOptions> => {
    let o: MapOptions
    if (mapOptions) o = mapOptions
    else if (optionsOrNamespace && typeof optionsOrNamespace !== 'string')
        o = optionsOrNamespace
    else o = {}
    return {
        transformKey: o.transformKey ?? defaultKeyTransform,
        exclude: o.exclude ?? [],
    }
}

const resolveNamespace = (
    optionsOrNamespace?: string | MapOptions
): string | undefined => {
    if (typeof optionsOrNamespace === 'string') return optionsOrNamespace
    return undefined
}

const defaultKeyTransform = (key: string) => key

/** Create a map of computed properties for the given module constructor
 *
 */
export function mapComputed<T>(ctor: ModuleCtor<T>): VueComputed
export function mapComputed<T>(
    ctor: ModuleCtor<T>,
    namespace: string
): VueComputed
export function mapComputed<T>(
    ctor: ModuleCtor<T>,
    namespace: string,
    options: MapOptions
): VueComputed
export function mapComputed<T>(
    ctor: ModuleCtor<T>,
    options: MapOptions
): VueComputed
export function mapComputed<T>(
    ctor: ModuleCtor<T>,
    options?: string | MapOptions,
    mapOptions?: MapOptions
): VueComputed {
    const result: VueComputed = {}
    const namespace = resolveNamespace(options)
    const { transformKey, exclude } = resolveOptions(options, mapOptions)
    const classModule = () => getModule(ctor, namespace)
    const gsKeys = getGetSetKeys(ctor.prototype)
    const modelKeys = getModelKeys(ctor.prototype)
    const keys = [getStates, getGetterKeys, () => gsKeys, () => modelKeys]
        .map(fn => fn(ctor.prototype))
        .reduce((a, b) => a.concat(b))
    keys.forEach(key => {
        if (exclude.includes(key)) return
        const get = function(this: Vue) {
            const prop = classModule()[key as keyof T]
            // check for getter defined as function
            return typeof prop === 'function' ? prop() : prop
        }
        if (!gsKeys.includes(key) && !modelKeys.includes(key)) {
            result[transformKey(key)] = get
            return
        }

        result[transformKey(key)] = {
            get,
            set: function(this: Vue, value: any) {
                classModule()[key as keyof T] = value
            },
        }
    })
    return result
}

export function mapMethods<T>(ctor: ModuleCtor<T>): Record<string, Function>
export function mapMethods<T>(
    ctor: ModuleCtor<T>,
    namespace: string
): Record<string, Function>
export function mapMethods<T>(
    ctor: ModuleCtor<T>,
    options: MapOptions
): Record<string, Function>
export function mapMethods<T>(
    ctor: ModuleCtor<T>,
    namespace: string,
    options: MapOptions
): Record<string, Function>
export function mapMethods<T>(
    ctor: ModuleCtor<T>,
    options?: string | MapOptions,
    mapOptions?: MapOptions
): Record<string, Function> {
    const namespace = resolveNamespace(options)
    const { exclude, transformKey } = resolveOptions(options, mapOptions)
    const result: Record<string, Function> = {}
    const classModule = (): any => getModule(ctor, namespace)
    const keys = [getMutations, getActionKeys]
        .map(fn => fn(ctor.prototype))
        .reduce((a, b) => a.concat(...b))
    keys.forEach(key => {
        if (exclude.includes(key)) return
        result[transformKey(key)] = function(this: Vue) {
            const m = classModule()
            return (m[key] as Function)(...arguments)
        }
    })
    return result
}
