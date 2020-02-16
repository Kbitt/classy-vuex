import './_init'
import { Store } from 'vuex'
import {
    getModule,
    createStore,
    registerModule,
    isRegistered,
    unregisterModule,
} from '../src'
import { getter } from '../src'
import { mutation } from '../src'
import { state } from '../src'
import { getset } from '../src'

interface TestState {
    value: number
}
class InnerFoo implements TestState {
    @state
    value = 20202

    @getter
    getSomething() {
        return 'whatever' + this.value
    }
}
class Foo implements TestState {
    @state
    value = 1000

    @getter
    getFromFoo() {
        return this.value
    }

    modules = {
        inner: new InnerFoo(),
    }
}
class Test implements TestState {
    @state
    value = 10

    @mutation
    setValue(value: number) {
        this.value = value
    }

    @getter
    someGetter() {
        return 1
    }

    modules = {
        foo: new Foo(),
    }
}

const INIT_FOO = 'init foo'
interface UnregisteredState {
    foo: string
}

class Unregistered implements UnregisteredState {
    @getset()
    foo = INIT_FOO
}

describe('state.ts', () => {
    let options: Test
    let store: Store<TestState>
    beforeEach(() => {
        options = new Test()
        store = createStore(options)
    })

    test('use store reference', () => {
        const testStore = getModule(Test)
        testStore.setValue(21)

        expect(store.state.value).toBe(21)
    })

    test('namespaced module', () => {
        const foo = getModule(Foo, 'foo')
        expect(!!foo).toBe(true)
        expect(foo.value).toBe(1000)
    })

    test('test unnamespaced getter does not work', () => {
        expect(store.getters['foo/inner/getSomething']).toBe('whatever20202')
    })

    test('dynamic registration', () => {
        store.registerModule('foo2', new Unregistered() as any)
        expect((store.state as any).foo2.foo).toBe(INIT_FOO)
        const foo2 = getModule(Unregistered, 'foo2')
        expect(!foo2).toBe(false)
        expect(foo2.foo).toBe(INIT_FOO)
        const CHANGED_FOO = 'changed foo'
        foo2.foo = CHANGED_FOO
        expect((store.state as any).foo2.foo).toBe(CHANGED_FOO)
        expect(foo2.foo).toBe(CHANGED_FOO)
    })

    test('register with path array', () => {
        const ns = ['foo', 'boo']
        registerModule(ns, new Unregistered())
        expect((store.state as any).foo.boo.foo).toBe(INIT_FOO)
        expect(isRegistered(ns.join('/'))).toBe(true)
    })

    test('isRegistered', () => {
        expect(isRegistered('foo')).toBe(true)
        const ns = 'ABXYZ'
        registerModule(ns, new Unregistered())
        expect(isRegistered(ns)).toBe(true)
    })

    test('unregisterModule', () => {
        const ns = 'ABXYZ'
        registerModule(ns, new Unregistered())
        expect(isRegistered(ns)).toBe(true)
        unregisterModule(ns)
        expect(isRegistered(ns)).toBe(false)
    })

    test('unregisterModule nested module', () => {
        const ns = ['foo', 'boo']
        registerModule(ns, new Unregistered())
        expect((store.state as any).foo.boo.foo).toBe(INIT_FOO)
        expect(isRegistered(ns.join('/'))).toBe(true)
        unregisterModule(ns)
        expect(isRegistered(ns.join('/'))).toBe(false)
    })
})
