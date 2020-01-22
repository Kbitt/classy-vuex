import { Module, ActionContext } from 'vuex'
import { createProxy, getStoreFromOptionsPrototype } from './reflect'
import { getMutations } from './mutation'
import { getActions } from './action'
import { getGetters } from './getter'
import { getGetSets } from './getset'
import { debounce } from 'lodash-es'

export function defineMutation(target: any, propertyKey: string) {
    const mutationFn = target[propertyKey] as Function
    const targetModule = target as Module<any, any>
    targetModule.mutations = targetModule.mutations || {}
    targetModule.mutations[propertyKey] = (state, payload) => {
        mutationFn.call(state, payload)
    }
}

const createContext = (target: any, context: ActionContext<any, any>) => {
    const getSets = getGetSets(target)
    const proxy = createProxy(
        context.state,
        getSets.map(gs => gs.key)
    )

    getMutations(target).forEach(mut => {
        proxy[mut] = (...args: any[]) => {
            return context.commit(mut, ...args)
        }
    })
    getActions(target).forEach(action => {
        proxy[action] = (...args: any[]) => context.dispatch(action, ...args)
    })
    getGetters(target).forEach(getter => {
        if (getter.isGetter) {
            Object.defineProperty(proxy, getter.name, {
                get: () =>
                    getStoreFromOptionsPrototype(target).getters[getter.name],
            })
        } else {
            proxy[getter.name] = () =>
                getStoreFromOptionsPrototype(target).getters[getter.name]
        }
    })
    getSets.forEach(({ mutationName, key }) => {
        Object.defineProperty(proxy, key, {
            get: () => context.state[key],
            set: value => context.commit(mutationName, value),
        })
    })
    return proxy
}

export type ActionDecoratorOptions = {
    debounce?: number
}

export function defineAction(
    target: any,
    propertyKey: string,
    options: ActionDecoratorOptions = {}
) {
    const actionFn = target[propertyKey] as Function
    const targetModule = target as Module<any, any>
    targetModule.actions = targetModule.actions || {}
    let fn = (context: ActionContext<any, any>, payload: any) =>
        actionFn.call(createContext(target, context), payload)
    if (typeof options.debounce === 'number') {
        fn = debounce(fn, options.debounce)
    }
    targetModule.actions[propertyKey] = fn
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
