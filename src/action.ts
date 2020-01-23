import { addToMetadataCollection, recordModule } from './reflect'
import { defineAction, ActionDecoratorOptions } from './define'

const ACTIONS = Symbol('ACTIONS')

/**  */
export function action(options: ActionDecoratorOptions = {}) {
    return function(target: any, propertyKey: string) {
        recordModule(target)
        addToMetadataCollection(ACTIONS, target, propertyKey)
        defineAction(target, propertyKey, options)
    }
}

export function getActions(target: any): string[] {
    return Reflect.getMetadata(ACTIONS, target) || []
}
