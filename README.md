# Classy Vuex

`classy-vuex` is yet another package providing decorators that allow you to write vuex modules as type-safe classes.

## Setup

`npm install --save classy-vuex` or `yarn add classy-vuex`

`classy-vuex` does not depend directly on vuex (although typescript declarations reference several `vuex` types), so it necessary to pass in the `vuex` store constructor as below. It is also still necessary to initialize Vuex separately.

```typescript
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import ClassyVuex from 'classy-vuex'

Vue.use(Vuex)
Vue.use(ClassyVuex, { Store })
```

## Examples

Here's an example of a todo module defined as normal:

```typescript
interface Todo {
    done: boolean
    text: string
}
export default {
    state: {
        todos: [],
        loading: false,
    },
    mutations: {
        ADD_TODO: (state, todo: Todo) => {
            state.todos.push(todo)
        },
        REMOVE_TODO: (state, index: number) => {
            state.todos.splice(index, 1)
        },
        SET_TODOS: (state, todos: Todo[]) => {
            state.todos = todos
        },
        SET_LOADING: (state, loading: boolean) => {
            state.loading = loading
        },
    },
    actions: {
        load: ({ commit }) => {
            commit('SET_LOADING', true)
            return api.load().then(todos => {
                commit('SET_TODOS', todos)
                commit('SET_LOADING', false)
            })
        },
        save: ({ state, commit }) => {
            commit('SET_LOADING', true)
            return api.save(state.todos).then(() => {
                commit('SET_LOADING', false)
            })
        },
    },
    getters: {
        done: state => state.todos.filter(todo => todo.done),
        notDone: state => state.todos.filter(todo => !todo.done),
    },
}
```

The default way of writing vuex modules completely eliminates type safety in their use since `commit` and `dispatch` are called by string name. There are various ways to write helper functions and types that offer some type safety, but these can be extremely laborious. Instead, this package allows you to write type-safe classes, where (in the appropriate context) all of the same properties and functions are accessible with no loss of types. Using decorators that transform the class methods and properties into a valid vuex module, the same module can be re-written as follows:

```typescript
export default class Todos {
    @state([])
    todos!: Todo[]

    @getset(false, 'SET_LOADING') // shortcut creating a state property and setter mutation
    loading!: boolean

    @mutation
    addTodo(todo: Todo) {
        this.todos.push(todo)
    }

    @mutation
    removeTodo(index: number) {
        this.todos.splice(index, 1)
    }

    @mutation
    setTodos(todos: Todo[]) {
        this.todos = todos
    }

    @action()
    load() {
        this.loading = true
        return api.load().then(todos => {
            this.todos = todos
            this.loading = false
        })
    }

    @action({ debounce: 500 }) // optionally set a time to debounce an action
    save() {
        this.loading = true
        return api.save(state.todos).then(() => {
            this.loading = false
        })
    },

    @getter
    get done() {
        return this.todos.filter(todo => todo.done)
    }

    @getter
    get notDone() {
        return this.todos.filter(todo => !todo.done)
    }
}
```

A store can then be created as such (required for modules to work correctly):

```typescript
export const store = createStore(Todos)
```

Or as a submodule:

```typescript
export default class Root {
    modules = {
        todos: new Todos(),
    }
}
```

Access the modules anywhere (requires store instance):

```typescript
const moduleInstance = getModule(Todos, 'todos' /* namespace */)
```

Access another module from a module action

```typescript
class Data {
    @action()
    foo() {
        const todos = getModule(Todos, 'todos')
        // use the Todos module instance
    }
}
```

Access modules inside Vue component methods:

```typescript
export default {
    methods: {
        foo() {
            const todos = this.$getModule(Todos, 'todos')
            // use the Todos module instance
        },
    },
}
```

Easily map an entire module to a Vue component:

```typescript
export default {
    computed: {
        ...mapComputed(Todos, 'todos'),
    },
    methods: {
        ...mapMethods(Todos, 'todos'),
    },
}
```

## Decorator List

### `@state`

Syntax: `state<T>(initialValue: T) foo!: T`

All state properties must be marked with the `state` decorator. This is a decorator factory that must be called with the initial value of the state property. It may be convenient to mark state properties with the non-null assertion operator (`!`, see examples), to avoid having to add otherwise trivial initialization (since the values with be initiated by the decorators)

### `@mutation`

Syntax: `@mutation foo(){ }`

Mark methods as mutations with the `mutation` decorator. This is simply a decorator, and not a decorator factory. The name of the method will be used as the name of the mutation in the store.

### `@action`

Syntax: `@action(options?: { debounce?: number }) foo(){ }`

Mark methods as actions with the `action` decorator. This is a decorator factory that must be called, optionally with arguments. Passing in options with a debounce value causes the action to be debounced (i.e. lodash debounce). With a debounce value set, repeat calls within the time limit will result in a single call (for example, to prevent repeated, undesirable api calls).

### `@getter`

Syntax: `@getter get foo(){ return /* */ }` or `@getter foo(){ return /* */ }`

Mark methods as getters with the `getter` decorator. This is not a decorator factory and does not need to be called or otherwise accept arguments. Getter methods can either be defined with the `get` keyword or as normal methods.

### `@getset`

Syntax: `@getset<T>(initialValue: T, mutationName?: string) foo!: T

Mark properties with the `getset` decorator to generate both a state property and accompanying mutation. Properties marked with `getset` support both getting and setting of values directly to the property. Under the hood setting values invoke the generated mutation. This is a decorator factory, and passing an initial value is required just like with the state decorator. Optionally a mutation name can be passed to choose the name of the generated mutation, otherwise a mutation name will be generated according to the pattern `SET_<KEY_NAME_TO_UPPER>`.

### `@model`

Syntax: `@model<T>(initialValue: T, action: string, mutationName?: string, actionName?: string)`

Mark properties with the `model` decorator to generate a state property and setter mutation, just like `getset`, with an accompanying action that invokes a follow-up action after calling the mutation. Unlike `getset`, instead of immediately invoking the setter mutation when the property is set to a value, a generated action is invoked. This generated action invokes the method, and then invokes the action which name matches argument `action`, (this action must be defined separately). This is useful in situations where an action call always follows a mutation, for example when a property is bound to the value of a search box, and the search results should be retrieved whenever the value changes.

###

## Notes

-   Classes defined with `classy-vuex` decorators do not allow vuex patterns to break. Mutation and getter functions are called with only the state object as the `this` argument. As such actions and other mutations/getters are undefined when these methods run. Only the action methods run with a true `this` argument of the class instance.
-   Namespaced modules are required (except for root), and as such all modules created with `classy-vuex` decorators set `namespace: true` on all modules. Otherwise it's difficult to consistently determine state/function location and maintain a single module class instance per module.
-   Inheritance and reuse of module classes is supported.
-   Constructor arguments and instance properties and methods are supported inside actions. Module instances are maintained for the lifetime of the store. However it is not recommended to make significant use of instance properties or methods not marked with `classy-vuex` decorators.
-   While mutations/getters do not run with a true `this` argument of the class instance, they can still access static class properties/methods (accessed by name, not by `this`) or other non-class variables or functions.
-   Vuex is intended to be used with singleton stores and multiple modules to segment functionality, and `classy-vuex` relies on this fact. When `createStore` is called, the store instance that is returned is cached and stored in metadata for use later.
