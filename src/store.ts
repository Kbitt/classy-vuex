import { Module, StoreOptions, Store, ActionContext, ModuleOptions } from 'vuex'
import {
    setStoreOptionMetadata,
    isNewable,
    getInstanceMetadata,
    ROOT_NS_KEY,
    getStoreFromOptionsPrototype,
    getReverseInstanceMetadata,
    setInstanceMetadata,
    removeInstanceMetadata,
} from './reflect'
import { getGetters } from './getter'
import { getMutations } from './mutation'
import { getActions } from './action'
import { getStates } from './state'
import { getGetSets } from './getset'
import { debounce } from 'lodash-es'
import { getModels } from './model'
import { defineMutation, defineState, defineInstanceMutation } from './define'
import { getVirtuals } from './virtual'
export type ModuleCtor<T> = {
    new (...args: any[]): T
}

const getInstance = (target: any, namespace = ROOT_NS_KEY) => {
    const metadata = getInstanceMetadata(_store).get(namespace)
    if (!metadata)
        throw new Error(
            'Could not retrieve metadata for namespace: ' + namespace
        )
    return getModule(metadata.instance.constructor, namespace)
}

const convertToNamespace = (path?: string[]): string | undefined =>
    path ? path.join('/') : undefined

function transformInstanceActions(options: Module<any, any>, path?: string[]) {
    const namespace = convertToNamespace(path)
    const optionsPrototype = Object.getPrototypeOf(options)
    const actions = getActions(optionsPrototype)
    actions.forEach(({ propertyKey, options: actionOptions }) => {
        const actionFn = (options as any)[propertyKey] as Function
        options.actions = options.actions || {}
        let fn = (ctx: ActionContext<any, any>, payload: any) => {
            const instance = getInstance(optionsPrototype, namespace)
            return actionFn.call(instance, payload)
        }
        if (typeof actionOptions.debounce === 'number') {
            let promise: Promise<any> | null = null
            let resolvePromise: (() => void) | null = null
            const actionFn = fn

            const dbfn = debounce(
                (ctx: ActionContext<any, any>, payload: any) => {
                    Promise.resolve(actionFn(ctx, payload)).then(() => {
                        resolvePromise && resolvePromise()
                        promise = null
                        resolvePromise = null
                    })
                },
                actionOptions.debounce
            )
            fn = (ctx: ActionContext<any, any>, payload: any) => {
                if (!promise) {
                    promise = new Promise(resolve => {
                        resolvePromise = resolve
                    })
                }
                dbfn(ctx, payload)
                return promise
            }
        }
        options.actions[propertyKey] = fn
    })
}

function transformInstanceGetters(options: Module<any, any>, path?: string[]) {
    const namespace = convertToNamespace(path)
    const optionsPrototype = Object.getPrototypeOf(options)
    const getStore = () => getStoreFromOptionsPrototype(optionsPrototype)
    getGetters(optionsPrototype).forEach(getter => {
        const index = (namespace ? namespace + '/' : '') + getter.name
        if (getter.isGetter) {
            Object.defineProperty(optionsPrototype, getter.name, {
                configurable: true,
                get: () => getStore().getters[index],
            })
        } else {
            optionsPrototype[getter.name] = () => {
                return getStore().getters[index]
            }
        }
    })
}

function transformInstanceMutations(
    options: Module<any, any>,
    path?: string[]
) {
    const prototype = Object.getPrototypeOf(options)
    const namespace = path ? path.join('/') : undefined
    getMutations(prototype).forEach(key => {
        defineInstanceMutation(options, key, () =>
            getInstance(prototype, namespace)
        )
    })
}

function transformInstanceGetSets(options: Module<any, any>) {
    const prototype = Object.getPrototypeOf(options)

    getGetSets(prototype).forEach(gs => {
        ;(options as any)[gs.mutationName] = function(this: any, value: any) {
            this[gs.key] = value
        }
        defineMutation(options, gs.mutationName)
        defineState(options, gs.key)
    })
}

function transformInstanceState(options: Module<any, any>) {
    const prototype = Object.getPrototypeOf(options)
    const stateProps = getStates(prototype)
    stateProps.forEach(propertyKey => {
        defineState(options, propertyKey)
    })
}

function transformInstanceModels(options: Module<any, any>) {
    const prototype = Object.getPrototypeOf(options)
    getModels(prototype).forEach(
        ({ key, action, actionName, mutationName }) => {
            ;(options as any)[mutationName] = function(this: any, value: any) {
                this[key] = value
            }
            defineMutation(options, mutationName)
            defineState(options, key)
            if (!options.actions) options.actions = {}
            options.actions[actionName] = (
                { dispatch, commit }: ActionContext<any, any>,
                value: any
            ) => {
                commit(mutationName, value)
                return dispatch(action)
            }
        }
    )
}

function transformInstanceProps(options: Module<any, any>, path?: string[]) {
    transformInstanceState(options)
    transformInstanceGetters(options, path)
    transformInstanceActions(options, path)
    transformInstanceMutations(options, path)
    transformInstanceGetSets(options)
    transformInstanceModels(options)
}

const getOptions = (options: Module<any, any>, path: string[]) => {
    let result = options
    path.forEach(part => {
        if (!result || !result.modules)
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

function transformModuleMethods(options: Module<any, any>, path?: string[]) {
    transformInstanceProps(options, path)
    if (options.modules) {
        Object.entries(options.modules).forEach(([key, value]) => {
            transformModuleMethods(value, [...(path || []), key])
        })
    }
}

export function isRegistered(namespace: string) {
    return getInstanceMetadata(_store).has(namespace)
}

export function unregisterModule(path: string | string[]) {
    if (typeof path === 'string') {
        _store.unregisterModule(path)
    } else {
        _store.unregisterModule(path)
    }
}

export function registerModule(
    path: string | string[],
    module: any,
    options?: ModuleOptions | undefined
) {
    if (typeof path === 'string') {
        _store.registerModule(
            typeof path === 'string' ? path : path,
            module,
            options
        )
    } else {
        _store.registerModule(path, module, options)
    }
}

let _store: Store<any>

export function createStore<S extends {}, T extends S>(
    ctor: T | ModuleCtor<T> | (() => T),
    ...args: any[]
): Store<S> {
    const options = isNewable(ctor) ? new ctor(...args) : ctor
    const storeOptions = createClassModule(options) as StoreOptions<S>
    transformModuleMethods(storeOptions)
    const store = (_store = new Store(storeOptions))
    setStoreOptionMetadata(store, storeOptions)

    const _registerModule = store.registerModule
    store.registerModule = function(
        this: Store<any>,
        path: string | string[],
        module: Module<any, any>,
        options?: ModuleOptions
    ) {
        transformModuleMethods(module, Array.isArray(path) ? path : [path])
        const instancePath = Array.isArray(path) ? path.join('/') : path
        setInstanceMetadata(this, module, instancePath)
        // cast because overloaded method doesn't accept union type
        _registerModule.call(this, path as string[], module, options)
    }.bind(store)
    const _unregisterModule = store.unregisterModule
    store.unregisterModule = function(
        this: Store<any>,
        path: string | string[]
    ) {
        removeInstanceMetadata(
            this,
            typeof path === 'string' ? path : path.join('/')
        )
        _unregisterModule.call(this, path as string[])
    }.bind(store)
    return store
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
    namespace && namespace !== ROOT_NS_KEY ? `${namespace}/${name}` : name

const checkValidNamespace = (parts: string[]) => {
    let childCount = 0
    let parentCount = 0
    let outofStart = false
    parts.forEach(p => {
        let childInc = false
        let parentInc = false
        if (p === '.') {
            childCount++
            childInc = true
        } else if (p === '..') {
            parentCount++
            parentInc = true
        } else outofStart = true

        if (childCount > 1)
            throw new Error(
                `Invalid namespace, only one current path operator (./) allowed`
            )
        if (outofStart && (childInc || parentInc))
            throw new Error(
                'Invalid namespace, current/parent path operators only allowed at beginning of path'
            )
    })
}

const IS_PROCESSED = Symbol('IS_PROCESSED')

function processModule(instance: any) {
    if (instance[IS_PROCESSED]) return instance

    instance[IS_PROCESSED] = true

    const optionsPrototype = Object.getPrototypeOf(instance)
    const _getStore = () =>
        getStoreFromOptionsPrototype(optionsPrototype) ?? _store
    const _getNamespace = () => {
        const ns =
            getReverseInstanceMetadata(_getStore()).get(instance)?.path ??
            undefined
        return ns === ROOT_NS_KEY ? undefined : ns
    }

    const _getState = () => getState(_getStore(), _getNamespace())
    const _getPathedFn = (fn: string) => getPathedFn(fn, _getNamespace())

    const getSets = getGetSets(optionsPrototype)
    getSets.forEach(gs => {
        Object.defineProperty(instance, gs.key, {
            configurable: true,
            get: () => _getState()[gs.key],
            set: value => {
                const type = _getPathedFn(gs.mutationName)
                _getStore().commit(type, value)
            },
        })
    })

    const models = getModels(optionsPrototype)

    models.forEach(m => {
        Object.defineProperty(instance, m.key, {
            configurable: true,
            get: () => _getState()[m.key],
            set: value =>
                _getStore().dispatch(_getPathedFn(m.actionName), value),
        })
    })

    const stateKeys = getStates(optionsPrototype)

    stateKeys.forEach(stateKey => {
        Object.defineProperty(instance, stateKey, {
            configurable: true,
            get: () => _getState()[stateKey],
        })
    })

    const mutations = getMutations(optionsPrototype)

    mutations.forEach(mutation => {
        instance[mutation] = (...args: any[]) =>
            _getStore().commit(_getPathedFn(mutation), ...args)
    })

    const actions = getActions(optionsPrototype)

    actions.forEach(({ propertyKey: action }) => {
        instance[action] = (...args: any[]) => {
            return _getStore().dispatch(_getPathedFn(action), ...args)
        }
    })

    const getters = getGetters(optionsPrototype)

    getters.forEach(getter => {
        const path = _getPathedFn(getter.name)
        if (getter.isGetter) {
            Object.defineProperty(instance, getter.name, {
                configurable: true,
                get: () => _getStore().getters[path],
            })
        } else {
            instance[getter.name] = () => _getStore().getters[path]
        }
    })

    getVirtuals(optionsPrototype).forEach(
        ({ propertyKey, getter: getterName, setter: setterName }) => {
            let getter: () => any
            let setter: (data: any) => void
            const setterPath = _getPathedFn(setterName)
            if (getters.some(gs => gs.name === getterName)) {
                const path = _getPathedFn(getterName)
                getter = () => _getStore().getters[path]
            } else if (
                stateKeys.includes(getterName) ||
                getSets.some(gs => gs.key === getterName) ||
                models.some(m => m.key === getterName)
            ) {
                getter = () => _getState()[getterName]
            } else {
                throw new Error(
                    `@virtual property was configured with getter name: ${getterName} which is not a defined state property or getter`
                )
            }
            if (
                mutations.includes(setterName) ||
                getSets.some(gs => gs.mutationName === setterName) ||
                models.some(m => m.mutationName === setterName)
            ) {
                setter = data => _getStore().commit(setterPath, data)
            } else if (
                actions.some(a => a.propertyKey === setterName) ||
                models.some(m => m.actionName === setterName)
            ) {
                setter = data => _getStore().dispatch(setterPath, data)
            } else {
                throw new Error(
                    `@virtual property was configured with setter name: ${setterName} which is not a defined action or mutation`
                )
            }
            Object.defineProperty(instance, propertyKey, {
                configurable: true,
                get: getter,
                set: setter,
            })
        }
    )

    return instance
}

/** Retrieve the module of the given constructor at either the optional namespace or root.
 * If the namespace provided is a relative path,
 * then a module instance must be provided as the context argument  */
export function getModule<T>(
    ctor: { new (...args: any[]): T },
    namespace?: string | undefined,
    context?: any | undefined
): T {
    const optionsPrototype = ctor.prototype
    const store = getStoreFromOptionsPrototype(optionsPrototype) ?? _store
    if (namespace && namespace.startsWith('.')) {
        if (!context) {
            throw new Error(
                'Given namespace is relative, but no context is provided'
            )
        }

        const rdata = getReverseInstanceMetadata(store).get(context)
        if (!rdata)
            throw new Error('Could not retrieve metadata for the given context')
        const contextNamespace = rdata.path
        const [first, ...parts] = namespace.split('/')
        checkValidNamespace(parts)

        if (first === '.') {
            let ns =
                (contextNamespace ? contextNamespace + '/' : '') +
                parts.join('/')

            if (ns.startsWith(ROOT_NS_KEY + '/'))
                ns = ns.replace(ROOT_NS_KEY + '/', '')
            return getModule(ctor, ns)
        }

        if (!contextNamespace)
            throw new Error(
                'Namespace references parent path, but context is root'
            )

        const contextParts = contextNamespace.split('/')
        contextParts.pop()

        while (parts[0] === '..') {
            parts.shift()
            contextParts.pop()
        }
        const l = contextParts.join('/')
        const r = parts.join('/')
        return getModule(ctor, l && r ? l + '/' + r : l ?? r)
    }

    const metadata = getInstanceMetadata(store).get(namespace || ROOT_NS_KEY)
    if (!metadata)
        throw new Error(
            'Could not retrieve instance metadata for namespace:' + namespace
        )
    const instance = metadata.instance as T
    if (!(instance instanceof ctor))
        throw new Error(
            `The module does not appear to be an instance of ${ctor.name}, the namespace '${namespace}' may not be correct`
        )
    const anyInstance = instance as any

    if (anyInstance.modules && Object.keys(anyInstance.modules)) {
        Object.entries(anyInstance.modules).forEach(([key, value]) => {
            Object.defineProperty(anyInstance.modules, key, {
                configurable: true,
                get: () => processModule(value),
            })
        })
    }

    return processModule(anyInstance)
}

export function createClassModule<T>(
    instanceOrFactory: T | { new (): T } | { (): T }
): T {
    const instance = isNewable(instanceOrFactory)
        ? new instanceOrFactory()
        : instanceOrFactory
    return instance as T
}
