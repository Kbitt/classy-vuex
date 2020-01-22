import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { state, mutation, action, createStore, getset } from '../src'

Vue.use(Vuex)

export interface TestState {
    value: number

    myString: string
}

export class Test implements TestState {
    strict = true
    @state(0)
    value!: number

    @getset('')
    myString!: string

    @mutation
    setValue(payload: { value: number }) {
        this.value = payload.value
    }

    @action()
    fooUseGetSet(str: string) {
        return new Promise(resolve => {
            setTimeout(() => {
                this.myString = str
                resolve()
            }, 100)
        })
    }
}

export const getStore = () => createStore<TestState, Test>(Store, Test)

export function wait(time: number) {
    return new Promise(resolve => {
        setTimeout(resolve, time)
    })
}
