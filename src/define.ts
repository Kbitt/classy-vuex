import { Module, Store } from 'vuex'
import { getGetters, getGetterMap } from './getter'
import {
    getInstanceMetadata,
    ROOT_NS_KEY,
    getVuexKeyMap,
    getVuexKeyList,
} from './reflect'
import { getStates } from './state'

function _defineMutation(
    target: any,
    propertyKey: string,
    getContext: (state: any) => any
) {
    const mutationFn = target[propertyKey] as Function
    const targetModule = target as Module<any, any>
    targetModule.mutations = targetModule.mutations || {}
    targetModule.mutations[propertyKey] = (state, payload) => {
        mutationFn.call(getContext(state), payload)
    }
}

export function defineMutation(target: any, propertyKey: string) {
    _defineMutation(target, propertyKey, state => state)
}

export function defineInstanceMutation(
    target: any,
    propertyKey: string,
    getInstance: () => any
) {
    _defineMutation(target, propertyKey, state => {
        const instance = getInstance()
        if (!(instance instanceof target.constructor)) {
            throw new Error(
                'Tried to define instance mutation, ' +
                    'but the instance does not appear to be an instance of the target. ' +
                    'This is probably a mistake.' +
                    ` Instance name = ${instance.constructor.name}, target name = ${target.constructor.name}`
            )
        }
        const stateKeys = Object.keys(state)
        const list = getVuexKeyList(target)
        const result: Record<string, any> = {}
        Object.keys(instance)
            .concat(Object.getOwnPropertyNames(target))
            .forEach(key => {
                if (key in result) return
                if (key === 'constructor') return
                const isState = stateKeys.includes(key)
                if (list.includes(key) && !isState) return
                if (isState) {
                    Object.defineProperty(result, key, {
                        get: () => state[key],
                        set: value => (state[key] = value),
                    })
                } else {
                    Object.defineProperty(result, key, {
                        get: () => instance[key],
                    })
                }
            })

        return result
    })
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
