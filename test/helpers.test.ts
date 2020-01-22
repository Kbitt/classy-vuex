import './_init'
import { state } from '../src/state'
import { createStore, mutation, action } from '../src'
import { Store } from 'vuex'
import { mapModule, Cpu } from '../src/helpers'

interface TestState {
    a: string
    b: number
}

class Test implements TestState {
    @state('init a')
    a!: string
    @state(10)
    b!: number
    @state(0)
    fooCalled!: number

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
    let mapped: Record<keyof Test, Cpu>

    beforeEach(() => {
        store = createStore<TestState, Test>(Store, Test)
        const context = ({
            $store: store,
            mapModule,
        } as any) as import('vue').default & { mapModule: typeof mapModule }
        mapped = context.mapModule(Test)
    })

    it('test mapped helper', async () => {
        expect(typeof mapped.a).toBe('string')
        expect(mapped.a).toBe('init a')
        expect(typeof mapped.b).toBe('number')
        expect(mapped.b).toBe(10)
        expect(typeof mapped.fooCalled).toBe('number')
        expect(mapped.fooCalled).toBe(0)
        expect(typeof mapped.incFoo).toBe('function')
        expect(typeof mapped.fooAction).toBe('function')
        const fooPromise = (mapped.fooAction as Function)() as Promise<any>
        await fooPromise
        expect(mapped.fooCalled).toBe(1)
    })
})
