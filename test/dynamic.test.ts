import './_init'
import { getset, createStore, getModule } from '../dist'
import { Store } from 'vuex'

class Root {}

interface DynamicTestState {
    value: string
}

class DynamicTest implements DynamicTestState {
    @getset()
    value = 'value'
}

interface InheritedDyanamicTestState extends DynamicTestState {
    superValue: string
}

class InheritedDynamicTest extends DynamicTest
    implements InheritedDyanamicTestState {
    @getset()
    superValue = 'superValue'
}

describe('the test', () => {
    let store: Store<any>
    beforeEach(() => {
        store = createStore(Root)
    })

    it('test basic', () => {
        store.registerModule('dyn', new DynamicTest() as any)
        expect(store.state.dyn.value).toBe('value')
    })

    it('test basic w/ module', () => {
        store.registerModule('dyn', new DynamicTest() as any)
        const dyn = getModule(DynamicTest, 'dyn')
        expect(dyn.value).toBe('value')
    })

    it('test super', () => {
        store.registerModule('super', new InheritedDynamicTest() as any)
        expect(store.state.super.value).toBe('value')
        expect(store.state.super.superValue).toBe('superValue')
    })

    it('test super w/ module', () => {
        store.registerModule('super', new InheritedDynamicTest() as any)
        const sup = getModule(InheritedDynamicTest, 'super')
        expect(sup.value).toBe('value')
        expect(sup.superValue).toBe('superValue')
    })

    it('test both', () => {
        store.registerModule('dyn', new DynamicTest() as any)
        expect(store.state.dyn.value).toBe('value')

        store.registerModule('super', new InheritedDynamicTest() as any)
        expect(store.state.super.value).toBe('value')
        expect(store.state.super.superValue).toBe('superValue')
    })

    it('test both w/ modules', () => {
        store.registerModule('dyn', new DynamicTest() as any)
        store.registerModule('super', new InheritedDynamicTest() as any)

        const dyn = getModule(DynamicTest, 'dyn')
        expect(dyn.value).toBe('value')

        const sup = getModule(InheritedDynamicTest, 'super')
        expect(sup.value).toBe('value')
        expect(sup.superValue).toBe('superValue')
    })

    it('test using base class w/ dynamic registered module', () => {
        store.registerModule('super', new InheritedDynamicTest() as any)

        const dyn = getModule(DynamicTest, 'super')
        expect(dyn.value).toBe('value')
        expect((dyn as InheritedDynamicTest).superValue).toBe('superValue')
    })

    it('test using same class multiple times', () => {
        store.registerModule('super', new InheritedDynamicTest() as any)
        store.registerModule('super2', new InheritedDynamicTest() as any)

        const TEST_VALUE = 'xxx'
        const sup = getModule(Object, 'super') as InheritedDynamicTest
        expect(sup.value).toBe('value')
        expect(sup.superValue).toBe('superValue')
        sup.value = TEST_VALUE
        sup.superValue = TEST_VALUE

        const sup2 = getModule(Object, 'super2') as InheritedDynamicTest
        expect(sup2.value).toBe('value')
        expect(sup2.superValue).toBe('superValue')
    })
})
