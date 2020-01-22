import { getStore, TestState, Test } from './_init'
import { Store } from 'vuex'
import { getModuleAs } from '../src'

describe('getset.ts', () => {
    let store: Store<TestState>
    let mod: Test
    beforeEach(() => {
        store = getStore()
        mod = getModuleAs(Test, store)
    })
    it('state and mutations are mapped', () => {
        expect(store.state.myString).toBe('')
        const newValue = 'newValue'
        store.commit('SET_MYSTRING', newValue)
        expect(store.state.myString).toBe(newValue)
    })
    it('module state/mutation are mapped', () => {
        expect(mod.myString).toBe('')
        const newValue = 'newValue'
        mod.myString = newValue
        expect(mod.myString).toBe(newValue)
    })
    it('action can access getset properties', async () => {
        const VAL = 'some val'
        await store.dispatch('fooUseGetSet', VAL)
        expect(store.state.myString).toBe(VAL)
    })
    it('module action can access getset properties', async () => {
        const VAL = 'some val'
        await mod.fooUseGetSet(VAL)
        expect(mod.myString).toBe(VAL)
    })
})
