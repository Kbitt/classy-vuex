import { state, getset, getter, mutation, action } from '../../src'
import { model } from '../../src/model'

export interface TestState {
    a: string
    b: number
    loading: boolean
    filter: string
    filterActionCalled: boolean
    fooCalled: number
}

export class SubTest {
    @state
    value = 123

    @getter
    get next() {
        return this.value + 1
    }

    @getset()
    filter = ''

    @action()
    subAction() {
        return Promise.resolve()
    }
}

export class Test implements TestState {
    @state
    a = 'init a'
    @state
    b = 10
    @state
    fooCalled = 0

    @getset()
    loading = false

    @getter
    get fooGet() {
        return this.b + this.fooCalled
    }

    @mutation
    incFoo() {
        const newVal = this.fooCalled + 1
        this.fooCalled = newVal
    }

    @mutation
    setB(b: number) {
        this.b = b
    }

    @action()
    setBAction(b: number) {
        this.setB(b)
    }

    @action()
    fooAction() {
        return new Promise(resolve => {
            setTimeout(() => {
                this.incFoo()
                resolve()
            }, 100)
        })
    }

    @model('filterAction')
    filter = ''

    @getset()
    filterActionCalled = false

    @action()
    filterAction() {
        this.filterActionCalled = true
        return Promise.resolve()
    }

    modules = {
        sub: new SubTest(),
    }
}
