import './_init'
import { action, createStore, getset, getModule } from '../src'
import { model } from '../src/model'
import { Store } from 'vuex'

class Test {
    @model('read')
    filter = ''

    @getset()
    readCalled = false

    @action()
    read() {
        this.readCalled = true
        return Promise.resolve()
    }
}

describe('model.ts', () => {
    let store: Store<{ filter: string; readCalled: boolean }>
    let test: Test
    const FILTER = 'FILTER'
    const FILTER2 = 'FILTER2'
    beforeEach(() => {
        store = createStore(Test)
        test = getModule(Test)
    })

    it('test store is mapped', async () => {
        expect(store.state.filter).toBe('')
        store.commit('SET_FILTER', FILTER)
        expect(store.state.filter).toBe(FILTER)
        await store.dispatch('setModel_filter', FILTER2)
        expect(store.state.filter).toBe(FILTER2)
        expect(store.state.readCalled).toBe(true)
    })

    it('test instance', () => {
        expect(test.filter).toBe('')
        test.filter = FILTER
        expect(test.filter).toBe(FILTER)
        expect(test.readCalled).toBe(true)
    })
})
