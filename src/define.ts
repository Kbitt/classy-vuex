import { Module } from 'vuex'

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

export function defineGetter(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
) {
    const targetModule = target as Module<any, any>
    targetModule.getters = targetModule.getters || {}
    targetModule.getters[propertyKey] = state => {
        return (descriptor.get ?? (descriptor.value as Function)).call(state)
    }
}

export function defineState<T>(
    initialValue: T,
    target: any,
    propertyKey: string
) {
    // extend the state
    const s = target.state as object | (() => object) | undefined
    if (s) {
        // extend state with initialValue
        target.state = () => ({
            ...(typeof s === 'function' ? s() : s),
            [propertyKey]: initialValue,
        })
    } else {
        // default: create state factory function
        target.state = () => ({ [propertyKey]: initialValue })
    }
}
