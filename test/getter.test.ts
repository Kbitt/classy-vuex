import './_init'
import { getter, getGetters } from '../src/getter'
import { Store } from 'vuex'
import { state } from '../src/state'
import { createStore, getModuleAs } from '../src'

interface TestState {
    value: number
}

const randomNumber = Math.floor(Math.random() * 1000)

class Test implements TestState {
    @state(randomNumber)
    value!: number

    @getter
    getNext() {
        return this.value + 1
    }

    @getter
    get double() {
        return 2 * this.value
    }
}

describe('getter.ts', () => {
    let store: Store<TestState>
    let mod: Test
    beforeEach(() => {
        store = createStore(Test)
        mod = getModuleAs(Test, store)
    })

    test('test getter decorator', () => {
        expect(store.state.value).toBe(randomNumber)
        expect(store.getters.getNext).toBe(randomNumber + 1)
        expect(store.getters.double).toBe(randomNumber * 2)
    })

    test('test getter decorator w/ class', () => {
        expect(mod.value).toBe(randomNumber)
        expect(mod.getNext()).toBe(randomNumber + 1)
        expect(mod.double).toBe(randomNumber * 2)
    })

    test('getters get recorded', () => {
        const getters = getGetters(new Test())
        expect(getters.length).toBe(2)
        expect(getters[0].name).toBe('getNext')
    })
})
