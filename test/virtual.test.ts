import './_init'
import {
    state,
    getset,
    getter,
    mutation,
    createStore,
    getModule,
    virtual,
    action,
    getVirtuals,
} from '../src'
import { Store } from 'vuex'
interface FooState {
    _value: { text: string }
}
/**
 * Test class that uses virtual decorators to allow a module
 * to track paging via skip/take values,
 * but also support page / pageSize virtual properties
 */
class Foo implements FooState {
    @getset()
    skip = 0
    @getset()
    take = 10

    @virtual('_page', 'setPage')
    page!: number

    @virtual('_pageSize', 'setPageSize')
    pageSize!: number

    @getter
    get _page() {
        return this.take > 0 ? 1 + this.skip / this.take : 1
    }

    @mutation
    setPage(page: number) {
        this.skip = (page - 1) * this.take
    }

    @getter
    get _pageSize() {
        return this.take
    }

    @mutation
    setPageSize(pageSize: number) {
        this.take = pageSize
        if (this.skip % pageSize !== 0) {
            this.skip -= this.skip % pageSize
        }
    }

    @getset()
    _value = {
        text: 'value',
    }

    @action()
    setValue(value: { text: string }) {
        this._value = value
    }

    @virtual('_value', 'setValue')
    value!: { text: string }
}

describe('virtual.ts', () => {
    let store: Store<FooState>
    let mod: Foo

    beforeEach(() => {
        store = createStore(Foo)
        mod = getModule(Foo)
    })

    it('test metadata', () => {
        const v = getVirtuals(Foo.prototype)
        expect(v.length).toBe(3)
    })

    it('test virtual props', () => {
        expect(mod.page).toBe(1)
        expect(mod.pageSize).toBe(10)

        mod.page = 3

        expect(mod.skip).toBe(20)

        mod.pageSize = 20
        expect(mod.page).toBe(2)
    })

    it('test state/action', () => {
        expect(mod.value.text).toBe('value')
        const text = 'newValue'
        mod.value = { text }
        expect(store.state._value.text).toBe(text)
    })
})
