import { recordModule, recordVuexKey, addToMetadataCollection } from './reflect'

const VIRTUAL = Symbol('VIRTUAL')

export type GetterType = 'state' | 'getter'
export type SetterType = 'action' | 'mutation'
export type VirtualMetadata = {
    propertyKey: string
    getterName: string
    getterType: GetterType
    setterName: string
    setterType: SetterType
}

export function virtual(
    getter: string | [string, GetterType],
    setter: string | [string, SetterType]
) {
    return function(target: any, propertyKey: string) {
        recordModule(target)
        recordVuexKey(target, propertyKey)

        const [getterName, getterType] =
            typeof getter === 'string'
                ? ([getter, 'getter'] as [string, GetterType])
                : getter

        const [setterName, setterType] =
            typeof setter === 'string'
                ? ([setter, 'mutation'] as [string, SetterType])
                : setter

        const metadata: VirtualMetadata = {
            propertyKey,
            getterName,
            getterType,
            setterName,
            setterType,
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
