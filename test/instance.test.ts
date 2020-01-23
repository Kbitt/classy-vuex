import './_init'
import { getset, createStore, getModuleAs, action } from '../src'
import { Store } from 'vuex'

interface TestState {
    value: string
}

class Test implements TestState {
    api: string
    constructor(api: string) {
        this.api = api
    }

    @getset('value')
    value!: string

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
        test = getModuleAs(Test, store)
    })

    it('api property is maintained', () => {
        expect(test.api).toBe(API)
    })

    it('can call an action', () => {
        expect(test.callsAction() instanceof Promise).toBe(true)
    })
})
