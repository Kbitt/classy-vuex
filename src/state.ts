import { addToMetadataCollection, recordModule, recordVuexKey } from './reflect'

const STATES = Symbol('STATES')

/** Mark a class property as a state property. The initial value must be passed to the decorator
 *  An initialization value set on the property directly will be ignored as it is not available to the decorator
 *  The non-null assertion operator can be used in TypeScript (see below) to prevent compiler errors
 * @example
 * class Foo {
 *  @state
 *  value = 123
 * }
 */
export function state(target: any, propertyKey: string) {
    addToMetadataCollection(STATES, target, propertyKey)
    recordModule(target)
    recordVuexKey(target, propertyKey)
}

export function getStates(target: any): string[] {
    return Reflect.getMetadata(STATES, target) || []
}
