import { Module } from 'vuex'
import { getGetters, getGetterMap } from './getter'

export function defineMutation(target: any, propertyKey: string) {
    const mutationFn = target[propertyKey] as Function
    const targetModule = target as Module<any, any>
    targetModule.mutations = targetModule.mutations || {}
    targetModule.mutations[propertyKey] = (state, payload) => {
        mutationFn.call(state, payload)
    }
}

export type ActionDecoratorOptions = {
    debounce?: number
}

const mergeGetterArgs = (target: any, ...objects: any[]) => {
    const gmap = getGetterMap(target)
    const result = {} as Record<string, any>
    objects.forEach(obj => {
        Object.keys(obj).forEach(key => {
            Object.defineProperty(result, key, {
                get: () => {
                    if (!gmap.has(key)) return obj[key]
                    const data = gmap.get(key)!
                    return data.isGetter ? obj[key] : () => obj[key]
                },
                set: value => (obj[key] = value),
            })
        })
    })
    return result
}

export function defineGetter(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
) {
    const targetModule = target as Module<any, any>
    targetModule.getters = targetModule.getters || {}
    targetModule.getters[propertyKey] = (state, getters) => {
        return (descriptor.get ?? (descriptor.value as Function)).call(
            mergeGetterArgs(target, state, getters)
        )
    }
}

export function defineState(target: any, propertyKey: string) {
    // extend the state
    const s = target.state as object | (() => object) | undefined
    if (s) {
        // extend state with initialValue
        target.state = () => ({
            ...(typeof s === 'function' ? s() : s),
            [propertyKey]: target[propertyKey],
        })
    } else {
        // default: create state factory function
        target.state = () => ({ [propertyKey]: target[propertyKey] })
    }
}
