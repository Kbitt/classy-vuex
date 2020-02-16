import './_init'
import { mutation, getMutations } from '../src'
import { Store } from 'vuex'
import { state } from '../src'
import { createStore, getModule } from '../src'

interface TestState {
    value: number
}

class Test implements TestState {
    constructor(
        private options: {
            value: number
        }
    ) {}
    @state
    value = 0

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

    @mutation
    setToValue() {
        this.value = this.options.value
    }
}

const VALUE = 123123
const OPTIONS = { value: VALUE }

describe('mutation.ts', () => {
    let store: Store<TestState>
    let mod: Test
    beforeEach(() => {
        store = createStore(Test, OPTIONS)
        mod = getModule(Test)
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
        const mutations = getMutations(new Test(OPTIONS))
        expect(mutations.length).toBe(4)
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

    it('use instance values', () => {
        mod.setToValue()
        expect(mod.value).toBe(VALUE)
    })
})
