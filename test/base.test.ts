import './_init'
import { getset, createStore, action, getModule } from '../src'
import { ClassyVuexBase } from '../src/store'
import { Store } from 'vuex'

class B extends ClassyVuexBase {
    @getset('b')
    b!: string

    @action()
    bAction() {
        return new Promise(resolve => {
            const a = this.getModule(A, 'a')
            this.b = a.a
            resolve()
        })
    }
}

class A {
    @getset('a')
    a!: string

    b!: { b: string }

    modules = {
        b: new B(),
    }
}

class Root {
    @getset('r')
    r!: string

    a!: { a: string; b: { b: string } }

    modules = {
        a: new A(),
    }
}

describe('base.ts', () => {
    let store: Store<{ r: string; a: { a: string; b: { b: string } } }>

    beforeEach(() => {
        store = createStore(Root)
    })

    it('can access another module', async () => {
        const b = getModule(B, store, 'a/b')
        await b.bAction()
        expect(b.b).toBe('a')
        expect(store.state.a.b.b).toBe('a')
    })
})
