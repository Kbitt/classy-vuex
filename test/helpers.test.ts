import './_init'
import { state } from '../src/state'
import { createStore, mutation, action, getset } from '../src'
import { Store } from 'vuex'
import { mapModule, Cpu, mapComputed } from '../src/helpers'

interface TestState {
    a: string
    b: number
    loading: boolean
}

class Test implements TestState {
    @state('init a')
    a!: string
    @state(10)
    b!: number
    @state(0)
    fooCalled!: number

    @getset(false)
    loading!: boolean

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
}

describe('helpers.ts', () => {
    let store: Store<TestState>
    let computed: Record<keyof Test, Cpu>

    beforeEach(() => {
        store = createStore(Test)

        const context = ({
            $store: store,
            mapComputed,
        } as any) as import('vue').default & { mapComputed: typeof mapComputed }
        computed = context.mapComputed(Test)
    })

    it('mapComputed', () => {})
})
