import { isNewable } from './reflect'

export function createClassModule<T>(
    instanceOrFactory: T | { new (): T } | { (): T }
): T {
    const instance = isNewable(instanceOrFactory)
        ? new instanceOrFactory()
        : instanceOrFactory
    return instance as T
}
