import './_init'
import { getset, createStore, getModule, action } from '../dist'
import { Store } from 'vuex'

interface TestState {
    value: string
}

class Test implements TestState {
    api: string
    constructor(api: string) {
        this.api = api
    }

    @getset()
    value = 'value'

    @action()
    fooAction() {
        return Promise.resolve()
    }

    callsAction() {
        return this.fooAction()
    }
}

const API = 'localhost:5050/_api'

describe('properties', () => {
    let store: Store<TestState>
    let test: Test
    beforeEach(() => {
        store = createStore(new Test(API))
        test = getModule(Test)
    })

    it('api property is maintained', () => {
        expect(test.api).toBe(API)
    })

    it('can call an action', () => {
        expect(test.callsAction() instanceof Promise).toBe(true)
    })

    it('repeat caching works', () => {
        let works = true
        try {
            test = getModule(Test)
        } catch (_) {
            works = false
        }
        expect(works).toBe(true)
    })
})
