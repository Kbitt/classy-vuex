import { Module, StoreOptions, Store } from 'vuex'
import { setStoreOptionMetadata, isNewable } from './reflect'
import { getGetters } from './getter'
import { getMutations } from './mutation'
import { getActions } from './action'
import { getStates } from './state'
import { createClassModule, VuexClassModule } from './base'
import { getGetSets } from './getset'
export type ModuleCtor<T> = {
    new (...args: any[]): T
}

function transformSingleGetterMethods(
    store: Store<any>,
    options: Module<any, any>,
    namespace: string | undefined = undefined
) {
    const optionsPrototype = (options as any).constructor.prototype
    getGetters(optionsPrototype).forEach(getter => {
        const index = (namespace ? namespace + '/' : '') + getter.name
        if (getter.isGetter) {
            Object.defineProperty(optionsPrototype, getter.name, {
                get: () => store.getters[index],
            })
        } else {
            optionsPrototype[getter.name] = () => {
                return store.getters[index]
            }
        }
    })
}

const getOptions = (options: Module<any, any>, path: string[]) => {
    let result: Module<any, any> = options
    path.forEach(part => {
        if (!result.modules)
            throw new Error(
                `Tried to retrieve module with path: ${path.join(
                    '/'
                )} but a module was missing as ${part}`
            )
        result = result.modules[part]
    })
    return result
}

const getNamespaceParent = (
    rootOptions: Module<any, any>,
    childPath: string[]
): [Module<any, any>, string | undefined] => {
    if (!childPath.length) return [rootOptions, undefined]
    const childModule = getOptions(rootOptions, childPath)
    if (childModule.namespaced) return [childModule, childPath.join('/')]
    const parentPath = childPath.slice(0, childPath.length - 1)
    while (parentPath.length) {
        const mod = getOptions(rootOptions, parentPath)
        if (mod.namespaced) return [mod, parentPath.join('/')]
        parentPath.pop()
    }
    return [rootOptions, undefined]
}

function transformGetterMethods(store: Store<any>, options: Module<any, any>) {
    const transformModuleGetterMethods = (
        store: Store<any>,
        options: Module<any, any>,
        path: string[] | null
    ) => {
        if (!path) {
            if (options.modules) {
                Object.keys(options.modules).forEach(key => {
                    transformModuleGetterMethods(store, options, [key])
                })
            }

            return
        }

        const targetOptions = getOptions(options, path)
        if (targetOptions.namespaced) {
            transformSingleGetterMethods(store, options, path.join('/'))
        } else {
            const [parentOptions, parentNamespace] = getNamespaceParent(
                options,
                path
            )
            transformSingleGetterMethods(store, parentOptions, parentNamespace)
        }

        if (targetOptions.modules) {
            Object.keys(targetOptions.modules).forEach(key => {
                transformModuleGetterMethods(store, options, [...path, key])
            })
        }
    }

    transformSingleGetterMethods(store, options)
    transformModuleGetterMethods(store, options, null)
}

export function classModule<S extends {} = any>(ctor: {
    new (options: StoreOptions<S>): Store<S>
}) {
    return class extends ctor {
        constructor(options: StoreOptions<S>) {
            super(options)
            const anyOptions = options as any
            if (
                !anyOptions.constructor ||
                typeof anyOptions.constructor !== 'function' ||
                !anyOptions.constructor.prototype
            ) {
                throw new Error('The options supplied to classModule ')
            }
            setStoreOptionMetadata(this, options)
            transformGetterMethods(this, options)
        }
    }
}

export function createStore<S extends {}, T extends S>(
    storeCtor: { new (options: StoreOptions<S>): Store<S> },
    ctor: T | ModuleCtor<T> | (() => T),
    ...args: any[]
): Store<S> {
    const superClass = classModule(storeCtor)
    const options = isNewable(ctor) ? new ctor(...args) : ctor
    return new superClass(createClassModule(() => options))
}

const getState = <S>(
    store: Store<S>,
    namespace: string | undefined = undefined
) => {
    if (!namespace) return store.state
    let state: any = store.state
    const paths = namespace.split('/')
    while (paths.length) {
        state = state[paths.shift() as string]
    }
    return state
}

const getPathedFn = (name: string, namespace: string | undefined = undefined) =>
    namespace ? `${namespace}/${name}` : name

export function getModuleAs<T, S, R = any>(
    ctor: { new (): T },
    store: Store<S>,
    namespace: string | undefined = undefined
): VuexClassModule<T, S, R> {
    const optionsPrototype = ctor.prototype
    const instance = new ctor()
    const anyInstance = instance as any
    const state = getState(store, namespace)

    const getSets = getGetSets(optionsPrototype)
    getSets.forEach(gs => {
        Object.defineProperty(anyInstance, gs.key, {
            get: () => state[gs.key],
            set: value =>
                store.commit(getPathedFn(gs.mutationName, namespace), value),
        })
    })

    getStates(optionsPrototype).forEach(stateKey => {
        if (getSets.some(gs => gs.key === stateKey)) return
        Object.defineProperty(anyInstance, stateKey, {
            get: () => state[stateKey],
        })
    })
    getMutations(optionsPrototype).forEach(mut => {
        const mutation = getPathedFn(mut, namespace)
        anyInstance[mut] = (...args: any[]) => store.commit(mutation, ...args)
    })

    getActions(optionsPrototype).forEach(action => {
        anyInstance[action] = (...args: any[]) => {
            const actionPath = getPathedFn(action, namespace)
            return store.dispatch(actionPath, ...args)
        }
    })

    getGetters(optionsPrototype).forEach(getter => {
        const path = getPathedFn(getter.name, namespace)
        if (getter.isGetter) {
            Object.defineProperty(anyInstance, getter.name, {
                get: () => store.getters[path],
            })
        } else {
            anyInstance[getter.name] = () => store.getters[path]
        }
    })

    return instance as VuexClassModule<T, S, R>
}
