import './_init'
import { Store } from 'vuex'
import { getModule, createStore } from '../src/store'
import { getter } from '../src/getter'
import { getStoreFromOptions, getOptionsFromStore } from '../src/reflect'
import { mutation } from '../src/mutation'
import { state } from '../src/state'

interface TestState {
    value: number
}
class InnerFoo implements TestState {
    @state(20202)
    value!: number

    @getter
    getSomething() {
        return 'whatever' + this.value
    }
}
class Foo implements TestState {
    namespaced = true
    @state(1000)
    value!: number

    @getter
    getFromFoo() {
        return this.value
    }

    modules = {
        inner: new InnerFoo(),
    }
}
class Test implements TestState {
    @state(10)
    value!: number

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

describe('state.ts', () => {
    let options: Test
    let store: Store<TestState>
    beforeEach(() => {
        options = new Test()
        store = createStore(options)
    })
    test('get store from metadata', () => {
        const optionsAgain = getOptionsFromStore(store)

        expect(options === optionsAgain).toBe(true)
    })

    test('get options from metadata', () => {
        const storeAgain = getStoreFromOptions(options)

        expect(store === storeAgain).toBe(true)
        expect(storeAgain instanceof Store).toBe(true)
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
})
