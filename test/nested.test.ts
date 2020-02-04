import './_init'
import { getset, createStore, getModule } from '../dist'
import { Store } from 'vuex'

interface AState {
    a: string
    b: BState
}

class A implements AState {
    @getset()
    a = 'a'

    b!: BState

    modules = {
        b: new B(),
    }
}

interface BState {
    b: string
}

class B implements BState {
    @getset()
    b = 'b'
    modules = {
        c: new C(),
    }
}

interface CState {
    c: string
}

class C implements CState {
    @getset()
    c = 'c'
}

describe('test nested namespaced modules', () => {
    let store: Store<AState>
    beforeEach(() => {
        store = createStore(A)
    })

    it('check first nested namespace', () => {
        const b = getModule(B, 'b')
        expect(b.b).toBe('b')
        const newVal = 'newVal'
        b.b = newVal
        expect(b.b).toBe(newVal)
    })

    it('check second nested namespace', () => {
        const c = getModule(C, 'b/c')
        expect(c.c).toBe('c')
        const newVal = 'newVal'
        c.c = newVal
        expect(c.c).toBe(newVal)
    })

    it('test access parent', () => {
        const c = getModule(C, 'b/c')
        const b = getModule(B, '..', c)
        expect(b.b).toBe('b')
    })

    it('test access root', () => {
        const c = getModule(C, 'b/c')
        const a = getModule(A, '../..', c)
        expect(a.a).toBe('a')
    })

    it('test root access child', () => {
        const a = getModule(A)
        const b = getModule(B, './b', a)
        expect(b.b).toBe('b')
    })

    it('test root access grandchild', () => {
        const a = getModule(A)
        const c = getModule(C, './b/c', a)
        expect(c.c).toBe('c')
    })

    it('test nested access child', () => {
        const b = getModule(B, 'b')
        const c = getModule(C, './c', b)
        expect(c.c).toBe('c')
    })

    it('access submodule state directly', () => {
        const a = getModule(A)
        expect(a.modules.b.b).toBe('b')
    })

    it('access submodule methods directly', () => {
        const a = getModule(A)
        const val = 'NOT THE DEFAULT B VALUE'
        a.modules.b.b = val
        expect(a.modules.b.b).toBe(val)
        expect(store.state.b.b).toBe(val)
    })
})
