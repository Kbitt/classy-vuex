import './_init'
import { mutation } from '../src/mutation'
import { Store, Module } from 'vuex'
import { action } from '../src/action'
import { getter } from '../src/getter'
import { createStore, getModule, getset } from '../src'
import { state } from '../src/state'
import { wait } from './_init'

export interface TestState {
    value: number
    debouncedCalled: number
    debounceCheck: string
    debounceAwaited: number
}

const randomNumber = Math.floor(Math.random() * 1000)

export class Test implements TestState, Module<TestState, any> {
    state!: TestState
    @state
    value = 0

    @getset()
    debouncedCalled = 0

    @getset()
    debounceAwaited = 0

    @mutation
    incDebounce() {
        this.debounceAwaited++
    }

    @getset()
    debounceCheck = ''

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
        return Promise.resolve()
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
        mod = getModule(Test)
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

    it('all debounced action promises resolve', async () => {
        store.dispatch('debouncedAction').then(() => {
            store.commit('incDebounce')
        })
        await wait(10)
        store.dispatch('debouncedAction').then(() => {
            store.commit('incDebounce')
        })
        await wait(10)
        await store.dispatch('debouncedAction').then(() => {
            store.commit('incDebounce')
        })
        expect(store.state.debounceAwaited).toBe(3)
        expect(store.state.debouncedCalled).toBe(1)
    })

    it('debounced action is debounced w/ class', async () => {
        mod.debouncedAction()
        await wait(10)
        mod.debouncedAction()
        await wait(120)
        expect(mod.debouncedCalled).toBe(1)
    })

    it('all debounced action promises resolve w/ class and repeat', async () => {
        mod.debouncedAction().then(() => {
            mod.incDebounce()
        })
        await wait(10)
        mod.debouncedAction().then(() => {
            mod.incDebounce()
        })
        await wait(10)
        await mod.debouncedAction().then(() => {
            mod.incDebounce()
        })

        expect(mod.debounceAwaited).toBe(3)
        expect(mod.debouncedCalled).toBe(1)
        expect(store.state.debounceAwaited).toBe(3)
        expect(store.state.debouncedCalled).toBe(1)

        mod.debouncedAction().then(() => {
            mod.incDebounce()
        })
        await wait(10)
        mod.debouncedAction().then(() => {
            mod.incDebounce()
        })
        await wait(10)
        await mod.debouncedAction().then(() => {
            mod.incDebounce()
        })

        expect(mod.debounceAwaited).toBe(6)
        expect(mod.debouncedCalled).toBe(2)
        expect(store.state.debounceAwaited).toBe(6)
        expect(store.state.debouncedCalled).toBe(2)
    })
})
