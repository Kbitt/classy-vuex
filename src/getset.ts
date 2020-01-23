import 'reflect-metadata'
import { addToMetadataCollection, recordModule } from './reflect'
import { defineMutation, defineState } from './define'
const GETSETS = Symbol('GETSETS')

const getMutationName = (name: string) => `SET_${name.toLocaleUpperCase()}`
export type GetSetMetadata = {
    initialValue: any
    key: string
    mutationName: string
}
/** Define a property  */
export function getset<T>(
    initialValue: T,
    mutationName: string | undefined = undefined
) {
    return function(target: any, propertyKey: string) {
        recordModule(target)
        const mut = mutationName || getMutationName(propertyKey)
        const data: GetSetMetadata = {
            initialValue,
            key: propertyKey,
            mutationName: mut,
        }
        addToMetadataCollection(GETSETS, target, data)
        target[mut] = function(this: any, value: any) {
            this[propertyKey] = value
        }

        defineMutation(target, mut)
        defineState(initialValue, target, propertyKey)
    }
}

export function getGetSets(target: any): GetSetMetadata[] {
    return Reflect.getMetadata(GETSETS, target) || []
}
