import 'reflect-metadata'
import { addToMetadataCollection, recordModule, recordVuexKey } from './reflect'
import { defineGetter } from './define'
const GETTERS = Symbol('GETTERS')

/** decorate a class method as a vuex getter. A regular method or getter method are both supported.
 * Methods marked as getter should only access properties marked with the state decorator. Using methods marked
 * with the action, mutation or others marked with getter will not work.
 * @example
 * class Foo {
 *   @state('a string')
 *   myString!: string
 *   @getter
 *   get someValue() {
 *      return this.myString.length
 *   }
 *   @getter
 *   someOtherValue() {
 *      return this.myString.length
 *   }
 *
 * }
 */
export function getter(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
) {
    const metadata: GetterMetadata = {
        name: propertyKey,
        isGetter: !!descriptor.get,
    }
    recordModule(target)
    recordVuexKey(target, propertyKey)
    addToMetadataCollection(GETTERS, target, metadata)
    defineGetter(target, propertyKey, descriptor)
}

export type GetterMetadata = {
    name: string
    isGetter: boolean
}

export function getGetters(target: any): GetterMetadata[] {
    return Reflect.getMetadata(GETTERS, target) || []
}

export function getGetterKeys(target: any): string[] {
    return getGetters(target).map(g => g.name)
}
