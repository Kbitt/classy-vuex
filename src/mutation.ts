import 'reflect-metadata'
import { addToMetadataCollection, recordModule, recordVuexKey } from './reflect'
const MUTATIONS = Symbol('MUTATIONS')

/** decorate a class method as a vuex mutation.
 * The method must only access properties marked with the state decorator or are otherwise not used as vuex functions
 * (i.e. do not use methods marked as action or getter) */
export function mutation(target: any, propertyKey: string) {
    addToMetadataCollection(MUTATIONS, target, propertyKey)
    recordModule(target)
    recordVuexKey(target, propertyKey)
}
export function getMutations(target: any): string[] {
    return Reflect.getMetadata(MUTATIONS, target) || ([] as string[])
}
