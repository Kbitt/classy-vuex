import { Store, Module } from 'vuex'

export function addToMetadataCollection(key: any, target: any, value: any) {
    // get own fields from the target
    let mutations = Reflect.getOwnMetadata(key, target)
    if (!mutations) {
        // merge with inherited fields, if available.
        mutations = Reflect.hasMetadata(key, target)
            ? Reflect.getMetadata(key, target).slice(0)
            : []

        // define own fields on the target
        Reflect.defineMetadata(key, mutations, target)
    }

    // record the property as a mutation
    mutations.push(value)
}

/** Symbol for key to store options prototype as metadata of store */
const STORE_OPTIONS_PROTO = Symbol('STORE_OPTIONS_PROTO')
/** Symbol for key to store store as metadata of options prototype */
const OPTIONS_PROTO_STORE = Symbol('OPTIONS_PROTO_STORE')
/** Symbol for key to store options as metadata of store */
const STORE_OPTIONS = Symbol('STORE_OPTIONS')
/** Symbol for key to store store as metadata of options */
const OPTIONS_STORE = Symbol('OPTIONS_STORE')

export function setStoreOptionMetadata<S>(
    store: Store<S>,
    options: Module<S, any>
) {
    const optionsPrototype = (options as any).constructor.prototype
    Reflect.defineMetadata(STORE_OPTIONS_PROTO, optionsPrototype, store)
    Reflect.defineMetadata(STORE_OPTIONS, options, store)
    Reflect.defineMetadata(OPTIONS_PROTO_STORE, store, optionsPrototype)
    Reflect.defineMetadata(OPTIONS_STORE, store, options)
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
    const optionsPrototype = (options as any).constructor.prototype
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
