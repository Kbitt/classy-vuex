import { addToMetadataCollection } from './reflect'
import { defineState } from './define'

const STATES = Symbol('STATES')

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
    return function getter(target: any, propertyKey: string) {
        addToMetadataCollection(STATES, target, propertyKey)
        defineState(initialValue, target, propertyKey)
    }
}

export function getStates(target: any): string[] {
    return Reflect.getMetadata(STATES, target) || []
}
