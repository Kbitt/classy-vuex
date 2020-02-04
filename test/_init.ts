import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import ClassyVuex, {
    state,
    mutation,
    action,
    createStore,
    getset,
} from '../dist'
Vue.config.productionTip = false
Vue.config.devtools = false
Vue.use(Vuex)
Vue.use(ClassyVuex)

export interface TestState {
    value: number

    myString: string
}

export class Test implements TestState {
    strict = true
    @state
    value = 0

    @getset()
    myString = ''

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
