import { Test, TestState } from './action.test'
import { getset, action, createStore, getModule } from '../dist'
import { Store } from 'vuex'

interface InheritedTestState extends TestState {
    inheritedValue: string
}

class InheritedTest extends Test implements InheritedTestState {
    @getset()
    inheritedValue = 'inherited'

    @action()
    async superClassAction() {
        this.inheritedValue = 'super'
    }
}

describe('', () => {
    let store: Store<InheritedTestState>
    let instance: InheritedTest
    beforeEach(() => {
        store = createStore(InheritedTest)
        instance = getModule(InheritedTest)
    })
    it('it works w/ store', async () => {
        expect(store.state.inheritedValue).toBe('inherited')
        await store.dispatch('superClassAction')
        expect(store.state.inheritedValue).toBe('super')
    })

    it('it works w/ module instance', async () => {
        expect(instance.inheritedValue).toBe('inherited')
        await instance.superClassAction()
        expect(instance.inheritedValue).toBe('super')
    })
})
