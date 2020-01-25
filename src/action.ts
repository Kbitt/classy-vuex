import { addToMetadataCollection, recordModule, recordVuexKey } from './reflect'
import { ActionDecoratorOptions } from './define'
import { Module } from 'vuex'

const ACTIONS = Symbol('ACTIONS')

export type ActionMetadata = {
    propertyKey: string
    options: ActionDecoratorOptions
}

/**  */
export function action(options: ActionDecoratorOptions = {}) {
    return function(target: any, propertyKey: string) {
        recordModule(target)
        recordVuexKey(target, propertyKey)
        const data: ActionMetadata = { propertyKey, options }
        addToMetadataCollection(ACTIONS, target, data)
    }
}

export function getActions(target: any): ActionMetadata[] {
    return Reflect.getMetadata(ACTIONS, target) || []
}

export function getActionKeys(target: any): string[] {
    return getActions(target).map(a => a.propertyKey)
}
