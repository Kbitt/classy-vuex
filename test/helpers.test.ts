/// <reference types="./shims-vue" />
import ClassyVuex from '../src'
import { createStore } from '../src'
import Vuex, { Store } from 'vuex'
import { mapComputed, CpuProperty, VueComputed } from '../src/helpers'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Helper from './Helper.vue'
import { TestState, Test } from './helpers.types'

describe('helpers.ts', () => {
    const localVue = createLocalVue()
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

    it('mapComputed', () => {
        const keys = Object.keys(computed)
        expect(keys.length).toBe(5)
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
        expect(typeof (computed.loading as CpuProperty).get).toBe('function')
        expect((computed.loading as CpuProperty).get.call(context)).toBe(false)
        expect(typeof (computed.loading as CpuProperty).set).toBe('function')
    })

    it('test in component', () => {
        const wrapper = shallowMount(Helper, { localVue, store })
        const text = wrapper.text()
        expect(text).toMatch(/init a/)
    })

    it('test get/set', () => {
        const wrapper = shallowMount(Helper, { localVue, store })
        const input = wrapper.find('input')
        const el = input.element as HTMLInputElement
        el.checked = true
        input.trigger('input')
        expect(store.state.loading).toBe(true)
    })
})
