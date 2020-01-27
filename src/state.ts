import { addToMetadataCollection, recordModule, recordVuexKey } from './reflect'

const STATES = Symbol('STATES')

export type StateMetadata = {
    initialValue: any
    propertyKey: string
}

/** Mark a class property as a state property. The initial value must be passed to the decorator
 *  An initialization value set on the property directly will be ignored as it is not available to the decorator
 *  The non-null assertion operator can be used in TypeScript (see below) to prevent compiler errors
 * @example
 * class Foo {
 *  @state(123)
 *  value!: number
 * }
 */
export function state<T>(initialValue: T) {
    return function(target: any, propertyKey: string) {
        const metadata: StateMetadata = {
            initialValue,
            propertyKey,
        }
        addToMetadataCollection(STATES, target, metadata)
        recordModule(target)
        recordVuexKey(target, propertyKey)
    }
}

export function getStates(target: any): StateMetadata[] {
    return Reflect.getMetadata(STATES, target) || []
}

export function getStateKeys(target: any): string[] {
    return getStates(target).map(s => s.propertyKey)
}
