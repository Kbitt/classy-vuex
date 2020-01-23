import './_init'
import { getset, createStore, getModuleAs } from '../src'
import { Module, Store } from 'vuex'
import { getInstanceMetadata } from '../src/reflect'

interface AState {
    a: string
}

class A implements AState, Module<AState, any> {
    @getset('a')
    a!: string

    modules = {
        b: new B(),
    }
}

interface BState {
    b: string
}

class B implements BState, Module<BState, any> {
    namespaced = true
    @getset('b')
    b!: string
    modules = {
        c: new C(),
    }
}

interface CState {
    c: string
}

class C implements CState, Module<CState, any> {
    namespaced = true
    @getset('c')
    c!: string
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
        const b = getModuleAs(B, store, 'b')
        expect(b.b).toBe('b')
        const newVal = 'newVal'
        b.b = newVal
        expect(b.b).toBe(newVal)
    })

    it('check second nested namespace', () => {
        const c = getModuleAs(C, store, 'b/c')
        expect(c.c).toBe('c')
        const newVal = 'newVal'
        c.c = newVal
        expect(c.c).toBe(newVal)
    })
})
