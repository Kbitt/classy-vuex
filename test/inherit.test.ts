import './_init'
import { Module, Store, StoreOptions } from 'vuex'
import { mutation, getModuleAs, getter, action } from '../src'
import { state } from '../src/state'

interface BaseModuleState {
    a: string
}

const INIT_A = 'initial a'

class BaseModule implements BaseModuleState {
    namespaced = true
    @state(INIT_A)
    a!: string

    @mutation
    setA(a: string) {
        this.a = a
    }
}

interface SubModuleState extends BaseModuleState {
    b: string
}

const INIT_B = 'initial b'

class SubModule extends BaseModule implements SubModuleState {
    namespaced = true
    @state(INIT_B)
    b!: string

    @mutation
    setB(b: string) {
        this.b = b
    }

    @getter
    foo() {
        return 'foo'
    }
    @action()
    afoo() {
        return new Promise(resolve => {
            setTimeout(() => {
                this.setA(this.foo())
                this.setB(this.foo())
                resolve()
            }, 300)
        })
    }
}

interface RootState {
    base: BaseModuleState
    sub: SubModuleState
}

class Root implements StoreOptions<RootState> {
    strict = true
    modules = {
        base: new BaseModule(),
        sub: new SubModule(),
    }
}

const A_2 = 'set a value'
const B_2 = 'set b value'

describe('', () => {
    let store: Store<RootState>
    beforeEach(() => {
        store = new Store<RootState>(new Root())
    })
    test('test inherited module', () => {
        expect(store.state.base.a).toBe(INIT_A)
        expect(store.state.sub.a).toBe(INIT_A)
        expect(store.state.sub.b).toBe(INIT_B)

        store.commit('base/setA', A_2)
        expect(store.state.base.a).toBe(A_2)

        store.commit('sub/setA', A_2)
        expect(store.state.sub.a).toBe(A_2)

        store.commit('sub/setB', B_2)
        expect(store.state.sub.b).toBe(B_2)
    })

    test('test inherited module with getModuleAs', () => {
        const sub = getModuleAs(SubModule, store, 'sub')
        expect(sub.a).toBe(INIT_A)
        expect(sub.b).toBe(INIT_B)

        sub.setA(A_2)
        expect(sub.a).toBe(A_2)

        sub.setB(B_2)
        expect(sub.b).toBe(B_2)
    })
})
