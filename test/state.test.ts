import './_init'
import { state } from '../src/state'
import { Store } from 'vuex'
import { createStore } from '../src'
const I_VAL = 123
const C_VAL = 0
const T_VAL = 'fooooo!!!!'
interface FooState {
    value: number
    count: number
    text: string
}
class Sub implements FooState {
    namespaced = true
    @state(I_VAL + 1) value!: number
    @state(C_VAL + 1) count!: number
    @state(T_VAL + 1) text!: string
}
interface FooWithSubState extends FooState {
    sub: FooState
}
class Foo implements FooWithSubState {
    @state(I_VAL) value!: number
    @state(C_VAL) count!: number
    @state(T_VAL) text!: string
    sub!: FooState

    modules = {
        sub: new Sub(),
    }
}

describe('state.ts', () => {
    let store: Store<FooWithSubState>
    beforeEach(() => {
        store = createStore<FooWithSubState, Foo>(Foo)
    })
    test('test class to module mapping', () => {
        expect(store.state.value).toBe(I_VAL)
        expect(store.state.count).toBe(C_VAL)
        expect(store.state.text).toBe(T_VAL)
    })

    test('test class to module mapping in namespace', () => {
        expect(store.state.sub.value).toBe(I_VAL + 1)
        expect(store.state.sub.count).toBe(C_VAL + 1)
        expect(store.state.sub.text).toBe(T_VAL + 1)
    })
})
