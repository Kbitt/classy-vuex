import { recordModule, recordVuexKey, addToMetadataCollection } from './reflect'
import { getMutationName } from './getset'

const MODELS = Symbol('MODELS')

const getActionName = (name: string) => `setModel_${name}`

export type ModelMetadata = {
    initialValue: any
    key: string
    mutationName: string
    actionName: string
    action: string
}

/** defines a model property, creating a state property, a mutation,
 * and an action that dispatches the provided action name after setting.
 * Basically just like getset but with an action that fires afterword
 * */
export function model<T>(
    initialValue: T,
    action: string,
    mutationName: string | null | undefined = undefined,
    actioName: string | null | undefined = undefined
) {
    return function(target: any, propertyKey: string) {
        recordModule(target)
        recordVuexKey(target, propertyKey)

        const mut = mutationName || getMutationName(propertyKey)
        const act = actioName || getActionName(propertyKey)

        const metadata: ModelMetadata = {
            initialValue,
            key: propertyKey,
            mutationName: mut,
            actionName: act,
            action,
        }

        addToMetadataCollection(MODELS, target, metadata)
    }
}

/** retrieve an array of model metadata for the given module prototype */
export function getModels(target: any): ModelMetadata[] {
    return Reflect.getMetadata(MODELS, target) || []
}

/** retrieve an array of model keys for the given module prototype */
export function getModelKeys(target: any): string[] {
    return getModels(target).map(m => m.key)
}
