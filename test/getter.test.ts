import './_init'
import { getter, getGetters } from '../src/getter'
import { Store } from 'vuex'
import { state } from '../src/state'
import { createStore, getModule } from '../src'

interface TestState {
    value: number
}

const randomNumber = Math.floor(Math.random() * 1000)

class Test implements TestState {
    @state
    value = randomNumber

    @getter
    getNext() {
        return this.value + 1
    }

    @getter
    get double() {
        return 2 * this.value
    }

    @getter
    get isDivisibleBy() {
        return (val: number) => this.value % val === 0
    }

    @getter
    get2() {
        return 2
    }

    @getter
    get quadruple() {
        return this.get2() * this.double
    }
}

describe('getter.ts', () => {
    let store: Store<TestState>
    let mod: Test
    beforeEach(() => {
        store = createStore(Test)
        mod = getModule(Test)
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
        expect(getters.length).toBe(5)
        expect(getters[0].name).toBe('getNext')
    })

    test('getter as function', () => {
        expect(mod.isDivisibleBy(2)).toBe(randomNumber % 2 === 0)
    })

    test('call another getter', () => {
        expect(mod.quadruple).toBe(randomNumber * 4)
    })
})
