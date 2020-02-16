import './_init'
import {
    getset,
    createStore,
    getModule,
    isRegistered,
    registerModule,
    unregisterModule,
    mergeModule,
} from '../src'
import { Store, Module } from 'vuex'

class Root {
    modules = {
        a: new DynamicTest(),
        b: new DynamicTest(),
        c: mergeModule(new DynamicTest(), {
            modules: {
                abc: new InheritedDynamicTest() as any,
            },
        }),
        d: new InheritedDynamicTest(),
    }
}

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

    it('isRegistered', () => {
        expect(isRegistered('super')).toBe(false)
        store.registerModule('super', new InheritedDynamicTest() as any)
        expect(isRegistered('super')).toBe(true)
        store.unregisterModule('super')
        expect(isRegistered('super')).toBe(false)
    })

    it('isRegistered2', () => {
        expect(isRegistered('super')).toBe(false)
        registerModule('super', new InheritedDynamicTest() as any)
        expect(isRegistered('super')).toBe(true)
        unregisterModule('super')
        expect(isRegistered('super')).toBe(false)
    })

    it('isRegistered nested', () => {
        registerModule('super', new InheritedDynamicTest() as any)
        registerModule(['super', 'super'], new InheritedDynamicTest() as any)

        expect(isRegistered('super/super')).toBe(true)

        const module = getModule(InheritedDynamicTest, 'super/super')
        expect(module.value).toBe('value')
    })

    it('test regular module', async () => {
        type UseValue = { value: string }

        registerModule('special', {
            namespaced: true,
            state: () => ({
                value: '',
            }),
            mutations: {
                setValue: (state, { value }: UseValue) => {
                    state.value = value
                },
            },
            actions: {
                setValue: ({ commit }, { value }: UseValue) => {
                    commit('setValue', { value })
                    return Promise.resolve()
                },
            },
            getters: {
                getValue: () => 'value',
            },
        } as Module<UseValue, any>)

        let anyStore = store as Store<any>

        expect(anyStore.state.special.value).toBe('')
        anyStore.commit('special/setValue', { value: 'abc' })
        expect(anyStore.state.special.value).toBe('abc')
        await anyStore.dispatch('special/setValue', { value: 'xyz' })
        expect(anyStore.state.special.value).toBe('xyz')
        const getValue = anyStore.getters['special/getValue']
        await anyStore.dispatch('special/setValue', { value: getValue })
        expect(anyStore.state.special.value).toBe(getValue)
        unregisterModule('special')
        expect(!anyStore.state.special).toBe(true)
    })

    const STATE = 'SOME_PROP',
        INCREMENT = 'INCREMENT',
        DECREMENT = 'DECREMENT'

    it('use mergeModule', () => {
        registerModule(
            'final',
            mergeModule(new InheritedDynamicTest(), {
                state: () => ({
                    [STATE]: 0,
                }),
                mutations: {
                    [INCREMENT]: state => state[STATE]++,
                    [DECREMENT]: state => state[STATE]--,
                },
            })
        )

        registerModule(
            'final2',
            mergeModule(new InheritedDynamicTest(), {
                state: () => ({
                    [STATE]: 0,
                }),
                mutations: {
                    [INCREMENT]: state => state[STATE]++,
                    [DECREMENT]: state => state[STATE]--,
                },
            })
        )

        expect(store.state.final[STATE]).toBe(0)
        expect(store.state.final2[STATE]).toBe(0)

        expect(isRegistered('final')).toBe(true)
        expect(isRegistered('final2')).toBe(true)

        expect(getModule(InheritedDynamicTest, 'final').value).toBe('value')
        expect(getModule(InheritedDynamicTest, 'final2').value).toBe('value')

        unregisterModule('final')

        expect(isRegistered('final')).toBe(false)
        expect(getModule(InheritedDynamicTest, 'final2').superValue).toBe(
            'superValue'
        )
    })
})
