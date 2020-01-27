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
        const keys = Object.keys(metadata)
        expect(keys.includes('b')).toBe(true)
        expect(keys.includes('b/c')).toBe(true)
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
})
