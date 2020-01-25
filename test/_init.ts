import Vue from 'vue'
import Vuex, { Store, Module, StoreOptions } from 'vuex'
import ClassyVuex from '../src'
import { state, mutation, action, createStore, getset } from '../src'
Vue.config.productionTip = false
Vue.config.devtools = false
Vue.use(Vuex)
Vue.use(ClassyVuex, { Store })

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

export const getStore = (): Store<TestState> => createStore(Test)

export function wait(time: number) {
    return new Promise(resolve => {
        setTimeout(resolve, time)
    })
}
