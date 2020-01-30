import './_init'
import { Store, StoreOptions } from 'vuex'
import { mutation, getModule, getter, action, createStore } from '../src'
import { state } from '../src/state'

interface BaseModuleState {
    a: string
}

const INIT_A = 'initial a'
const BASE_MSG = 'set by base class'

class BaseModule implements BaseModuleState {
    @state
    a = INIT_A

    @mutation
    setA(a: string) {
        this.a = a
    }

    @action()
    baseFoo() {
        this.setA(BASE_MSG)
        return Promise.resolve()
    }

    @action()
    replaceFoo() {
        this.setA(BASE_MSG)
        return Promise.resolve()
    }
}

interface SubModuleState extends BaseModuleState {
    b: string
}

const INIT_B = 'initial b'

const SUPER_B = 'msg by super class'

class SubModule extends BaseModule implements SubModuleState {
    @state
    b = INIT_B

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

    @action()
    async baseFoo() {
        await super.baseFoo()
        this.setB(SUPER_B)
    }

    @action()
    replaceFoo() {
        this.setA(SUPER_B)
        return Promise.resolve()
    }
}

const anotherA = (msg: string) => msg + ' | ' + msg

class AnotherSubModule extends BaseModule {
    @mutation
    setA(message: string) {
        this.a = anotherA(message)
    }
}

interface RootState {
    base: BaseModuleState
    sub: SubModuleState
    another: BaseModuleState
}

class Root {
    strict = true
    base!: BaseModule
    sub!: SubModule
    another!: BaseModuleState
    modules = {
        base: new BaseModule(),
        sub: new SubModule(),
        another: new AnotherSubModule(),
    }
}

const A_2 = 'set a value'
const B_2 = 'set b value'

describe('test module inheritance', () => {
    let store: Store<RootState>
    beforeEach(() => {
        store = createStore(Root)
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

    test('ASDFJASDJF test inherited module with getModule', () => {
        const sub = getModule(SubModule, 'sub')
        expect(sub.a).toBe(INIT_A)
        expect(sub.b).toBe(INIT_B)

        sub.setA(A_2)
        expect(sub.a).toBe(A_2)

        sub.setB(B_2)
        expect(sub.b).toBe(B_2)
    })

    test('test method override w/ super call', async () => {
        const sub = getModule(SubModule, 'sub')
        await sub.baseFoo()
        expect(store.state.sub.a).toBe(BASE_MSG)
        expect(sub.a).toBe(BASE_MSG)
        expect(store.state.sub.b).toBe(SUPER_B)
        expect(sub.b).toBe(SUPER_B)
    })

    test('test method override as replace', async () => {
        const sub = getModule(SubModule, 'sub')
        await sub.replaceFoo()
        expect(store.state.sub.a).toBe(SUPER_B)
        expect(sub.a).toBe(SUPER_B)
    })

    test('test override mutation', () => {
        const a = getModule(AnotherSubModule, 'another')

        const msg = 'abc'

        a.setA(msg)
        expect(a.a).toBe(anotherA(msg))
        expect(store.state.another.a).toBe(anotherA(msg))
    })

    test('test using super class', () => {
        const mod = getModule(BaseModule, 'sub')
        const val = 'a test value'
        mod.setA(val)

        const sub = getModule(SubModule, 'sub')
        expect(sub.a).toBe(val)
        expect(store.state.sub.a).toBe(val)
    })

    test('test using Object', () => {
        const obj = getModule(Object, 'sub')
        expect(obj instanceof SubModule).toBe(true)
    })
})
