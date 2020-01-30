import { Store, Module, StoreOptions } from 'vuex'

export function addToMetadataMap(
    metadataKey: any,
    target: any,
    key: any,
    value: any
) {
    let map = Reflect.getOwnMetadata(metadataKey, target) as Map<any, any>
    if (!map) {
        map = Reflect.hasMetadata(metadataKey, target)
            ? Reflect.getMetadata(metadataKey, target)
            : new Map()
        Reflect.defineMetadata(metadataKey, map, target)
    }

    map.set(key, value)
}

export function addToMetadataCollection(
    metadataKey: any,
    target: any,
    value: any
) {
    // get own fields from the target
    let data = Reflect.getOwnMetadata(metadataKey, target)
    if (!data) {
        // merge with inherited fields, if available.
        data = Reflect.hasMetadata(metadataKey, target)
            ? Reflect.getMetadata(metadataKey, target).slice(0)
            : []

        // define own fields on the target
        Reflect.defineMetadata(metadataKey, data, target)
    }

    // record the property as a mutation
    data.push(value)
}

/** Symbol for key to store options prototype as metadata of store */
const STORE_OPTIONS_PROTO = Symbol('STORE_OPTIONS_PROTO')
/** Symbol for key to store store as metadata of options prototype */
const OPTIONS_PROTO_STORE = Symbol('OPTIONS_PROTO_STORE')
/** Symbol for key to store options as metadata of store */
const STORE_OPTIONS = Symbol('STORE_OPTIONS')
/** Symbol for key to store store as metadata of options */
const OPTIONS_STORE = Symbol('OPTIONS_STORE')

const MODULE = Symbol('MODULE')
const MODULE_KEY = Symbol('MODULE_KEY')

export function recordModule(target: any) {
    target.namespaced = true
    Reflect.defineMetadata(MODULE, true, target)
}

export function recordVuexKey(target: any, key: string) {
    addToMetadataMap(MODULE_KEY, target, key, key)
}

export function getVuexKeyMap(target: any): Map<string, string> {
    return Reflect.getMetadata(MODULE_KEY, target) || new Map<string, string>()
}

export function isModule(target: any) {
    return Reflect.getMetadata(MODULE, target) === true
}

const OPTIONS_NS_TO_INSTANCE = Symbol('OPTIONS_NS_TO_INSTANCE')
const OPTIONS_INSTANCE_TO_NS = Symbol('OPTIONS_INSTANCE_TO_NS')
type InstanceMetadata = { instance: any; path: string | null }

export const ROOT_NS_KEY = '<root>'

export function setInstanceMetadata(
    store: Store<any>,
    options: Module<any, any>,
    namespace = ROOT_NS_KEY
) {
    const metadata: InstanceMetadata = { instance: options, path: namespace }
    addToMetadataMap(OPTIONS_NS_TO_INSTANCE, store, namespace, metadata)
    addToMetadataMap(OPTIONS_INSTANCE_TO_NS, store, options, metadata)
    if (options.modules && Object.keys(options.modules).length) {
        Object.entries(options.modules).forEach(([key, value]) => {
            setInstanceMetadata(
                store,
                value,
                namespace && namespace !== ROOT_NS_KEY
                    ? namespace + '/' + key
                    : key
            )
        })
    }
}

export function getInstanceMetadata(
    store: Store<any>
): Map<string, InstanceMetadata> {
    return (
        Reflect.getMetadata(OPTIONS_NS_TO_INSTANCE, store) ||
        new Map<string, InstanceMetadata>()
    )
}

export function getReverseInstanceMetadata(
    store: Store<any>
): Map<any, InstanceMetadata> {
    return (
        Reflect.getMetadata(OPTIONS_INSTANCE_TO_NS, store) ||
        new Map<any, InstanceMetadata>()
    )
}

function defineStoreMetadata(store: Store<any>, options: Module<any, any>) {
    const optionsPrototype = Object.getPrototypeOf(options)
    Reflect.defineMetadata(OPTIONS_PROTO_STORE, store, optionsPrototype)
    Reflect.defineMetadata(OPTIONS_STORE, store, options)
    if (options.modules) {
        Object.values(options.modules).forEach(m => {
            defineStoreMetadata(store, m)
        })
    }
}

export function setStoreOptionMetadata<S>(
    store: Store<S>,
    options: StoreOptions<S>
) {
    const optionsPrototype = Object.getPrototypeOf(options)
    Reflect.defineMetadata(STORE_OPTIONS_PROTO, optionsPrototype, store)
    Reflect.defineMetadata(STORE_OPTIONS, options, store)
    defineStoreMetadata(store, options)
    setInstanceMetadata(store, options)
}

const mergeMetadata = (key: any, value: any, target: any) => {
    const metadata = Reflect.getMetadata(key, target) || {}
    Object.assign(metadata, value)
    Reflect.defineMetadata(key, metadata, target)
}

export function mergeModuleOptionMetadata<S>(
    store: Store<S>,
    options: Module<S, any>
) {
    const optionsPrototype = Object.getPrototypeOf(options)
    mergeMetadata(STORE_OPTIONS_PROTO, optionsPrototype, store)
    mergeMetadata(STORE_OPTIONS, options, store)
    mergeMetadata(OPTIONS_PROTO_STORE, store, optionsPrototype)
    mergeMetadata(OPTIONS_STORE, store, options)
}

export function getOptionsPrototypeFromStore<S = any>(store: Store<S>): any {
    return Reflect.getMetadata(STORE_OPTIONS_PROTO, store)
}

export function getOptionsFromStore<S = any>(store: Store<S>): Module<S, any> {
    return Reflect.getMetadata(STORE_OPTIONS, store)
}

export function getStoreFromOptionsPrototype<S = any>(options: any): Store<S> {
    return Reflect.getMetadata(OPTIONS_PROTO_STORE, options)
}

export function getStoreFromOptions<S = any>(options: any): Store<S> {
    return Reflect.getMetadata(OPTIONS_STORE, options)
}

function useDescriptor<T>(
    target: any,
    propertyKey: string,
    cb: (prop: PropertyDescriptor) => T
): T {
    const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey)
    if (!descriptor)
        throw new Error(
            `Could not obtain property descriptor for key: ${propertyKey}`
        )
    return cb(descriptor)
}

export function isGetter(target: any, propertyKey: string) {
    return useDescriptor(target, propertyKey, prop => !!prop.get)
}

export function isSetter(target: any, propertyKey: string) {
    return useDescriptor(target, propertyKey, prop => !!prop.set)
}

export const createProxy = <T extends {}>(
    input: T,
    exclude: string[] | undefined = undefined
) => {
    const result: any = {}

    const keys = Object.keys(input) as (keyof T)[]

    keys.forEach(key => {
        if (exclude && exclude.length && exclude.includes(key as string)) return
        Object.defineProperty(result, key, {
            get: () => input[key],
            set: value => (input[key] = value),
        })
    })
    return result as T
}

export function isNewable(
    ctor: { new (...args: any[]): any } | any
): ctor is { new (...args: any[]): any } {
    return typeof ctor === 'function'
}
