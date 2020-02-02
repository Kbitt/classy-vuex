import { recordModule, recordVuexKey, addToMetadataCollection } from './reflect'

const VIRTUAL = Symbol('VIRTUAL')

export type VirtualMetadata = {
    propertyKey: string
    getter: string
    setter: string
}

export function virtual(getter: string, setter: string) {
    return function(target: any, propertyKey: string) {
        recordModule(target)
        recordVuexKey(target, propertyKey)

        const metadata: VirtualMetadata = {
            propertyKey,
            getter,
            setter,
        }

        addToMetadataCollection(VIRTUAL, target, metadata)
    }
}

export function getVirtuals(target: any): VirtualMetadata[] {
    return Reflect.getMetadata(VIRTUAL, target) || []
}

export function getVirtualKeys(target: any): string[] {
    return getVirtuals(target).map(t => t.propertyKey)
}
