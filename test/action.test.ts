import './_init'
import { mutation } from '../src/mutation'
import { Store, Module } from 'vuex'
import { action } from '../src/action'
import { getter } from '../src/getter'
import { createStore, getModule, getset } from '../src'
import { state } from '../src/state'
import { wait } from './_init'

interface TestState {
    value: number
    debouncedCalled: number
    debounceCheck: string
}

const randomNumber = Math.floor(Math.random() * 1000)

class Test implements TestState, Module<TestState, any> {
    state!: TestState
    @state(0)
    value!: number

    @getset(0)
    debouncedCalled!: number

    @getset('')
    debounceCheck!: string

    @action()
    foo() {
        return new Promise(resolve => {
            setTimeout(() => {
                this.setValue({ value: 10 })
                resolve()
            }, 250)
        })
    }

    @action()
    callsOtherAction() {
        return this.foo()
    }

    @action({ debounce: 100 })
    debouncedAction() {
        this.debouncedCalled++
    }

    @mutation
    setValue(payload: { value: number }) {
        this.value = payload.value
    }

    @mutation
    log() {}

    @action()
    randomFoo() {
        return new Promise(resolve => {
            setTimeout(() => {
                this.setValue({ value: this.getRandom() })
                resolve()
            }, 250)
        })
    }

    @getter
    getRandom() {
        return randomNumber
    }
}

describe('action.ts', () => {
    let store: Store<TestState>
    let mod: Test

    beforeEach(() => {
        store = createStore(Test)
        mod = getModule(Test, store)
    })

    test('action-1 action works', async () => {
        await store.dispatch('foo')
        expect(store.state.value).toBe(10)
    })

    test('action works w/ class', async () => {
        await mod.foo()
        expect(store.state.value).toBe(10)
        expect(mod.value).toBe(10)
    })

    test('action uses getter', async () => {
        await store.dispatch('randomFoo')
        expect(store.state.value).toBe(randomNumber)
    })

    test('action uses getter w/ class', async () => {
        await mod.randomFoo()
        expect(store.state.value).toBe(randomNumber)
        expect(mod.value).toBe(randomNumber)
    })

    test('action calling another action works', async () => {
        await store.dispatch('callsOtherAction')
        expect(store.state.value).toBe(10)
    })

    test('action calling another action works w/ class', async () => {
        await mod.callsOtherAction()
        expect(store.state.value).toBe(10)
        expect(mod.value).toBe(10)
    })

    it('debounced action is debounced', async () => {
        store.dispatch('debouncedAction')
        await wait(10)
        store.dispatch('debouncedAction')
        await wait(120)
        expect(store.state.debouncedCalled).toBe(1)
    })

    it('debounced action is debounced w/ class', async () => {
        mod.debouncedAction()
        await wait(10)
        mod.debouncedAction()
        await wait(120)
        expect(mod.debouncedCalled).toBe(1)
    })
})
