import { Module } from 'vuex'
import { isNewable } from './reflect'
export type VuexClassModule<T, S, R = any> = T & S & Module<S, R>

export function createClassModule<T extends object, S, R = any>(
    instanceOrFactory: T | { new (): T } | { (): T }
): VuexClassModule<T, R, S> {
    const instance = isNewable(instanceOrFactory)
        ? new instanceOrFactory()
        : instanceOrFactory
    return instance as VuexClassModule<T, R, S>
}
