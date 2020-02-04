import './_init'
import { state } from '../dist'
import { Store } from 'vuex'
import { createStore } from '../dist'
const I_VAL = 123
const C_VAL = 0
const T_VAL = 'fooooo!!!!'
interface FooState {
    value: number
    count: number
    text: string
}
class Sub implements FooState {
    @state value = I_VAL + 1
    @state count = C_VAL + 1
    @state text = T_VAL + 1
}
interface FooWithSubState extends FooState {
    sub: FooState
}
class Foo implements FooWithSubState {
    @state value = I_VAL
    @state count = C_VAL
    @state text = T_VAL
    sub!: FooState

    modules = {
        sub: new Sub(),
    }
}

describe('state.ts', () => {
    let store: Store<FooWithSubState>
    beforeEach(() => {
        store = createStore(Foo)
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
