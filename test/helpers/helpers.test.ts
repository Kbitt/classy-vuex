/// <reference types="../shims-vue" />
import ClassyVuex, {
    createStore,
    mapComputed,
    VueComputed,
    mapMethods,
    mergeModule,
} from '../../dist'
import Vuex, { Store } from 'vuex'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Helper from './Helper.vue'
import { TestState, Test, SubTest } from './helpers.types'

describe('helpers.ts', () => {
    const localVue = createLocalVue()
    localVue.config.productionTip = false
    localVue.config.devtools = false
    localVue.use(Vuex)
    localVue.use(ClassyVuex, { Store })
    let store: Store<TestState>
    let computed: VueComputed
    let context: { $store: Store<any> }

    beforeEach(() => {
        store = createStore(Test)
        context = { $store: store }
        computed = mapComputed(Test)
    })

    it('test transformKeys w/ mapComputed', () => {
        const prefix = 'test_'
        const testComputed = mapComputed(Test, {
            transformKey: key => prefix + key,
        })

        expect(Object.keys(testComputed).some(k => !k.startsWith(prefix))).toBe(
            false
        )
    })

    it('test transformKeys w/ namespaced mapComputed', () => {
        const prefix = 'test_'
        const testComputed = mapComputed(SubTest, 'sub', {
            transformKey: key => prefix + key,
        })

        expect(Object.keys(testComputed).some(k => !k.startsWith(prefix))).toBe(
            false
        )
    })

    it('test transformKeys w/ mapMethods', () => {
        const prefix = 'test_'
        const testMethods = mapMethods(Test, {
            transformKey: key => prefix + key,
        })

        expect(Object.keys(testMethods).some(k => !k.startsWith(prefix))).toBe(
            false
        )
    })

    it('test exclude w/ mapComputed', () => {
        const testComputed = mapComputed(Test, {
            exclude: ['filter', 'fooGet'],
        })

        expect(
            Object.keys(testComputed).some(
                k => k === 'filter' || k === 'fooGet'
            )
        ).toBe(false)
    })

    it('test exclude w/ namespaced mapComputed', () => {
        const testComputed = mapComputed(SubTest, {
            exclude: ['value', 'next'],
        })

        expect(
            Object.keys(testComputed).some(k => k === 'value' || k === 'next')
        ).toBe(false)

        expect(Object.keys(testComputed)).toContain('filter')
    })

    it('test exclude w/ mapMethods', () => {
        const testComputed = mapMethods(Test, {
            exclude: ['incFoo', 'setBAction'],
        })

        expect(
            Object.keys(testComputed).some(
                k => k === 'incFoo' || k === 'setBAction'
            )
        ).toBe(false)
    })

    it('mapComputed', () => {
        const keys = Object.keys(computed)
        expect(keys.length).toBe(7)
        expect(keys).toContain('a')
        expect(keys).toContain('b')
        expect(keys).toContain('fooCalled')
        expect(keys).toContain('loading')
        expect(keys).toContain('fooGet')
    })

    it('mapComputed types', () => {
        expect(typeof computed.a).toBe('function')
        expect((computed.a as Function).call(context)).toBe('init a')
        expect(typeof computed.b).toBe('function')
        expect((computed.b as Function).call(context)).toBe(10)
        expect(typeof computed.fooCalled).toBe('function')
        expect((computed.fooCalled as Function).call(context)).toBe(0)
        expect(typeof computed.loading).toBe('object')
        expect(typeof (computed.loading as VueComputed).get).toBe('function')
        expect(
            ((computed.loading as VueComputed).get as Function).call(context)
        ).toBe(false)
        expect(typeof (computed.loading as VueComputed).set).toBe('function')
    })

    it('test in component', () => {
        const wrapper = shallowMount(Helper, { localVue, store })
        const text = wrapper.text()
        expect(text).toMatch(/init a/)
    })

    it('test get/set', () => {
        const wrapper = shallowMount(Helper, { localVue, store })
        const input = wrapper.find('#input1')
        const el = input.element as HTMLInputElement
        el.checked = true
        input.trigger('input')
        expect(store.state.loading).toBe(true)
    })

    it('test mapped model', () => {
        const wrapper = shallowMount(Helper, { localVue, store })
        const input = wrapper.find('#input2')
        const el = input.element as HTMLInputElement
        el.value = 'abc'
        input.trigger('input')
        expect(store.state.filterActionCalled).toBe(true)
    })

    it('test mapped methods action', () => {
        expect(store.state.filterActionCalled).toBe(false)
        const wrapper = shallowMount(Helper, { localVue, store })
        const btn = wrapper.find('#btn1')
        btn.trigger('click')
        expect(store.state.filterActionCalled).toBe(true)
    })

    it('test mapped methods mutation', () => {
        expect(store.state.fooCalled).toBe(0)
        const wrapper = shallowMount(Helper, { localVue, store })
        const btn = wrapper.find('#btn2')
        btn.trigger('click')
        expect(store.state.fooCalled).toBe(1)
        btn.trigger('click')
        expect(store.state.fooCalled).toBe(2)
        btn.trigger('click')
        expect(store.state.fooCalled).toBe(3)
    })

    it('test using $getModule vm function', () => {
        expect(store.state.filterActionCalled).toBe(false)
        const wrapper = shallowMount(Helper, { localVue, store })
        const btn = wrapper.find('#btn3')
        btn.trigger('click')
        expect(store.state.filterActionCalled).toBe(true)
    })

    it('mergeModule', async () => {
        const merged = mergeModule(new SubTest(), {
            state: {
                count: 0,
            },
            mutations: {
                inc: state => state.count++,
                setCount: (state, { count }: { count: number }) => {
                    state.count = count
                },
            },
            actions: {
                foo: ({ commit }) => {
                    commit('inc')
                    return Promise.resolve()
                },
                toOne: ({ commit, getters }) => {
                    commit('setCount', { count: getters.getOne })
                    return Promise.resolve()
                },
            },
            getters: {
                getOne: () => 1,
            },
        })
        store.registerModule('merged', merged)

        expect((store.state as any).merged.count).toBe(0)
        store.commit('merged/inc')
        expect((store.state as any).merged.count).toBe(1)
        await store.dispatch('merged/foo')
        expect((store.state as any).merged.count).toBe(2)
        store.commit('merged/setCount', { count: 21 })
        expect((store.state as any).merged.count).toBe(21)
        await store.dispatch('merged/toOne')
        expect((store.state as any).merged.count).toBe(1)

        store.unregisterModule('merged')
        expect(!(store.state as any).merged).toBe(true)
    })
})
