import { state, getset, getter, mutation, action } from '../src'

export interface TestState {
    a: string
    b: number
    loading: boolean
}

export class Test implements TestState {
    @state('init a')
    a!: string
    @state(10)
    b!: number
    @state(0)
    fooCalled!: number

    @getset(false)
    loading!: boolean

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
}
