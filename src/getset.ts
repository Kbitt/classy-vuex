import 'reflect-metadata'
import { addToMetadataCollection, recordModule, recordVuexKey } from './reflect'
const GETSETS = Symbol('GETSETS')

export const getMutationName = (name: string) =>
    `SET_${name.toLocaleUpperCase()}`
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
        recordVuexKey(target, propertyKey)

        const mut = mutationName || getMutationName(propertyKey)
        const data: GetSetMetadata = {
            initialValue,
            key: propertyKey,
            mutationName: mut,
        }
        addToMetadataCollection(GETSETS, target, data)
    }
}

export function getGetSets(target: any): GetSetMetadata[] {
    return Reflect.getMetadata(GETSETS, target) || []
}

export function getGetSetKeys(target: any): string[] {
    return getGetSets(target).map(gs => gs.key)
}
