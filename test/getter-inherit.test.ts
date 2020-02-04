import { Test, TestState } from './getter.test'
import { getset, getter, createStore, getModule } from '../dist'
import { Store } from 'vuex'

interface InheritedTestState extends TestState {
    inheritedValue: string
}

class InheritedTest extends Test implements InheritedTestState {
    @getset()
    inheritedValue = 'inherited'

    @getter
    get iv() {
        console.log('get iv, ctor name = ' + (this as any).constructor.name)
        return this.inheritedValue
    }
}

describe('getter inheritance', () => {
    let store: Store<InheritedTestState>
    let ih: InheritedTest
    beforeEach(() => {
        store = createStore(InheritedTest)
        ih = getModule(InheritedTest)
    })

    it('it works w/ store', () => {
        expect(store.getters['iv']).toBe(store.state.inheritedValue)
    })

    it('it works w/ module', () => {
        expect(ih.iv).toBe(ih.inheritedValue)
    })
})
