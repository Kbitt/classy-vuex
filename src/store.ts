import { Module, StoreOptions, Store, ActionContext } from 'vuex'
import {
    setStoreOptionMetadata,
    isNewable,
    getInstanceMetadata,
    ROOT_NS_KEY,
    getStoreFromOptionsPrototype,
    getReverseInstanceMetadata,
} from './reflect'
import { getGetters } from './getter'
import { getMutations } from './mutation'
import { getActions } from './action'
import { getStates } from './state'
import { getGetSets } from './getset'
import { debounce } from 'lodash-es'
import { getModels } from './model'
import { defineMutation, defineState } from './define'
export type ModuleCtor<T> = {
    new (...args: any[]): T
}

const getInstance = (target: any, namespace = ROOT_NS_KEY) => {
    const store = getStoreFromOptionsPrototype(target)
    const metadata = getInstanceMetadata(store).get(namespace)
    if (!metadata)
        throw new Error(
            'Could not retrieve metadata for namespace: ' + namespace
        )
    return getModule(metadata.instance.constructor, namespace)
}

function transformInstanceActions(
    options: Module<any, any>,
    namespace: string | undefined = undefined
) {
    const targetOptions = namespace
        ? getOptions(options, namespace.split('/'))
        : options
    const optionsPrototype = Object.getPrototypeOf(targetOptions)
    const actions = getActions(optionsPrototype)
    actions.forEach(({ propertyKey, options }) => {
        const actionFn = (targetOptions as any)[propertyKey] as Function
        targetOptions.actions = targetOptions.actions || {}
        let fn = (_: ActionContext<any, any>, payload: any) =>
            actionFn.call(getInstance(optionsPrototype, namespace), payload)
        if (typeof options.debounce === 'number') {
            fn = debounce(fn, options.debounce)
        }
        targetOptions.actions[propertyKey] = fn
    })
}

function transformInstancesGetters(
    options: Module<any, any>,
    namespace: string | undefined = undefined
) {
    const targetOptions = namespace
        ? getOptions(options, namespace.split('/'))
        : options
    const optionsPrototype = Object.getPrototypeOf(targetOptions)
    const getStore = () => getStoreFromOptionsPrototype(optionsPrototype)
    getGetters(optionsPrototype).forEach(getter => {
        const index = (namespace ? namespace + '/' : '') + getter.name
        if (getter.isGetter) {
            Object.defineProperty(optionsPrototype, getter.name, {
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
    rootOptions: Module<any, any>,
    namespace: string | undefined = undefined
) {
    const targetOptions = namespace
        ? getOptions(rootOptions, namespace.split('/'))
        : rootOptions
    const prototype = Object.getPrototypeOf(targetOptions)
    getMutations(prototype).forEach(key => {
        defineMutation(targetOptions, key)
    })
}

function transformInstanceGetSets(
    rootOptions: Module<any, any>,
    namespace: string | undefined = undefined
) {
    const options = namespace
        ? getOptions(rootOptions, namespace.split('/'))
        : rootOptions
    const prototype = Object.getPrototypeOf(options)

    getGetSets(prototype).forEach(gs => {
        ;(options as any)[gs.mutationName] = function(this: any, value: any) {
            this[gs.key] = value
        }
        defineMutation(options, gs.mutationName)
        defineState(options, gs.key)
    })
}

function transformInstanceState(
    rootOptions: Module<any, any>,
    namespace: string | undefined = undefined
) {
    const options = namespace
        ? getOptions(rootOptions, namespace.split('/'))
        : rootOptions
    const prototype = Object.getPrototypeOf(options)
    const stateProps = getStates(prototype)
    stateProps.forEach(propertyKey => {
        defineState(options, propertyKey)
    })
}

function transformInstanceModels(
    rootOptions: Module<any, any>,
    namespace: string | undefined = undefined
) {
    const options = namespace
        ? getOptions(rootOptions, namespace.split('/'))
        : rootOptions
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

function transformInstanceProps(
    options: Module<any, any>,
    namespace: string | undefined = undefined
) {
    transformInstanceState(options, namespace)
    transformInstancesGetters(options, namespace)
    transformInstanceActions(options, namespace)
    transformInstanceMutations(options, namespace)
    transformInstanceGetSets(options, namespace)
    transformInstanceModels(options, namespace)
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

function transformModuleMethods(
    options: Module<any, any>,
    path: string[] | null
) {
    if (!path) {
        if (options.modules) {
            Object.keys(options.modules).forEach(key => {
                transformModuleMethods(options, [key])
            })
        }

        return
    }

    const targetOptions = getOptions(options, path)
    const ns = path.join('/')
    transformInstanceProps(options, ns)

    if (targetOptions.modules) {
        Object.keys(targetOptions.modules).forEach(key => {
            transformModuleMethods(options, [...path, key])
        })
    }
}

function transformInstanceMethods(options: Module<any, any>) {
    transformInstanceProps(options)
    transformModuleMethods(options, null)
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
        }
    }
}

let _store: Store<any>

export function createStore<S extends {}, T extends S>(
    ctor: T | ModuleCtor<T> | (() => T),
    ...args: any[]
): Store<S> {
    const superClass = classModule(Store)
    const options = isNewable(ctor) ? new ctor(...args) : ctor
    const storeOptions = createClassModule(() => options) as StoreOptions<S>
    transformInstanceMethods(storeOptions)
    return (_store = new superClass(storeOptions))
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

const STORE_KEY = Symbol('STORE_KEY')
const STATE_KEY = Symbol('STATE_KEY')
const NS_KEY = Symbol('NAMESPACE_KEY')

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

/** Retrieve the module of the given constructor at either the optional namespace or root.
 * If the namespace provided is a relative path,
 * then a module instance must be provided as the context argument  */
export function getModule<T>(
    ctor: { new (...args: any[]): T },
    namespace?: string | undefined,
    context?: any | undefined
): T {
    const optionsPrototype = ctor.prototype
    const store = getStoreFromOptionsPrototype(optionsPrototype)
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

    if (anyInstance[STORE_KEY]) return instance as T

    anyInstance[NS_KEY] = namespace

    anyInstance[STORE_KEY] = store

    Object.defineProperty(anyInstance, STATE_KEY, {
        get: () => getState(anyInstance[STORE_KEY], anyInstance[NS_KEY]),
    })

    getGetSets(optionsPrototype).forEach(gs => {
        Object.defineProperty(anyInstance, gs.key, {
            get: () => anyInstance[STATE_KEY][gs.key],
            set: value => {
                const type = getPathedFn(gs.mutationName, anyInstance[NS_KEY])
                anyInstance[STORE_KEY].commit(type, value)
            },
        })
    })

    getModels(optionsPrototype).forEach(m => {
        Object.defineProperty(anyInstance, m.key, {
            get: () => anyInstance[STATE_KEY][m.key],
            set: value =>
                anyInstance[STORE_KEY].dispatch(
                    getPathedFn(m.actionName, anyInstance[NS_KEY]),
                    value
                ),
        })
    })

    getStates(optionsPrototype).forEach(stateKey => {
        Object.defineProperty(anyInstance, stateKey, {
            get: () => anyInstance[STATE_KEY][stateKey],
        })
    })

    getMutations(optionsPrototype).forEach(mut => {
        const mutation = getPathedFn(mut, anyInstance[NS_KEY])
        anyInstance[mut] = (...args: any[]) =>
            anyInstance[STORE_KEY].commit(mutation, ...args)
    })

    getActions(optionsPrototype).forEach(({ propertyKey: action }) => {
        anyInstance[action] = (...args: any[]) => {
            const actionPath = getPathedFn(action, anyInstance[NS_KEY])
            return anyInstance[STORE_KEY].dispatch(actionPath, ...args)
        }
    })

    getGetters(optionsPrototype).forEach(getter => {
        const path = getPathedFn(getter.name, anyInstance[NS_KEY])
        if (getter.isGetter) {
            Object.defineProperty(anyInstance, getter.name, {
                get: () => anyInstance[STORE_KEY].getters[path],
            })
        } else {
            anyInstance[getter.name] = () =>
                anyInstance[STORE_KEY].getters[path]
        }
    })

    return instance as T
}

export function createClassModule<T>(
    instanceOrFactory: T | { new (): T } | { (): T }
): T {
    const instance = isNewable(instanceOrFactory)
        ? new instanceOrFactory()
        : instanceOrFactory
    return instance as T
}
