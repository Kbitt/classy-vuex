import './_init'
import { getset, createStore, getModule } from '../src'
import { Module, Store } from 'vuex'
import { getInstanceMetadata } from '../src/reflect'

interface AState {
    a: string
}

class A implements AState {
    @getset()
    a = 'a'

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

    it('check metadata', () => {
        const metadata = getInstanceMetadata(store)
        const keys = [...metadata.keys()]
        expect(keys).toContain('b')
        expect(keys).toContain('b/c')
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
})
