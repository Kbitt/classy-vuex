import './_init'
import { mutation, getMutations } from '../src/mutation'
import { Store } from 'vuex'
import { state } from '../src/state'
import { createStore, getModuleAs } from '../src'

interface TestState {
    value: number
}

class Test implements TestState {
    @state(0)
    value!: number

    @mutation
    setValue(payload: { value: number }) {
        this.value = payload.value
    }

    @mutation
    badMutation(value: number) {
        this.setValue({ value })
    }

    @mutation
    log() {}
}

describe('mutation.ts', () => {
    let store: Store<TestState>
    let mod: Test
    beforeEach(() => {
        store = createStore(Test)
        mod = getModuleAs(Test, store)
    })

    test('decorated mutations work', () => {
        expect(store.state.value).toBe(0)
        store.commit('setValue', { value: 5 })
        expect(store.state.value).toBe(5)
    })

    test('decorated mutations work w/ class', () => {
        expect(mod.value).toBe(0)
        mod.setValue({ value: 5 })
        expect(mod.value).toBe(5)
    })

    test('mutations get recorded', () => {
        const mutations = getMutations(new Test())
        expect(mutations.length).toBe(3)
    })

    test('accessing another mutation from a mutation fails', () => {
        let succeeded: boolean
        try {
            mod.badMutation(123)
            succeeded = true
        } catch (_) {
            succeeded = false
        }
        expect(succeeded).toBe(false)
    })
})
