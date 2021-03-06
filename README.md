# Classy Vuex

`classy-vuex` is yet another package providing decorators that allow you to write vuex modules as type-safe classes.

**This is an experimental library. There are variety of unit tests which validate that it works, and it has been tested in fairly complex applications, but some things may not work, such as the vue devtools browser plugin.**

## Setup

`npm install --save classy-vuex` or `yarn add classy-vuex`

```typescript
import Vue from 'vue'
import Vuex from 'vuex'
import ClassyVuex from 'classy-vuex'

Vue.use(Vuex)
Vue.use(ClassyVuex)
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

The default way of writing vuex modules completely eliminates type safety in their use since `commit` and `dispatch` are called by string name. There are various ways to write helper functions and types that offer some type safety, but these can be extremely laborious. Instead, this package allows you to write type-safe classes, where (in the appropriate context) all of the same properties and functions are accessible with no loss of typing. Using decorators that transform the class methods and properties into a valid vuex module, the same module can be re-written as follows:

```typescript
export default class Todos {
    @state
    todos: Todo[] = []

    @getset('SET_LOADING') // shortcut creating a state property and setter mutation
    loading = false

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

A store can then be created with the `createStore` function. This creates a new instance of `Vuex.Store` and setups up the required metadata. **NOTE: DO NOT CALL `new Store(...)` directly, decorated modules will not work correctly.**

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

Or by accessing the sub module directly

```typescript
class Foo {
    @action()
    fooAction() {
        // use the bar submodule
        this.modules.bar.barAction()
    }
    modules = {
        bar: new Bar(),
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

Register modules dynamically. Note: **DO NOT CALL store.registerModule or store.unregisterModule directly,** for decorated module class instances, as the required metadata will not be setup or torn down correctly.

```typescript
import { registerModule } from 'classy-vuex'

registerModule('myModule', new MyModule()) // accepts any for input module

// works
const mymodule = getModule(MyModule, 'myModule')
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

Syntax: `@state foo = <expr | value>`

All state properties must be marked with the `state` decorator. Whatever the value is for the instance passed to `createStore` will be used as the initial value.

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

Syntax: `@getset<T>(mutationName?: string) foo = <value>`

Mark properties with the `getset` decorator to generate both a state property and accompanying mutation. Properties marked with `getset` support both getting and setting of values directly to the property. Under the hood setting values invoke the generated mutation. This is a decorator factory, allowing optionally passing a mutation name to set for the generated mutation, otherwise a mutation name will be generated according to the pattern `SET_<KEY_NAME_TO_UPPER>`.

### `@model`

Syntax: `@model(action: string, mutationName?: string, actionName?: string)`

Mark properties with the `model` decorator to generate a state property and setter mutation, just like `getset`, with an accompanying action that invokes a follow-up action after calling the mutation. Unlike `getset`, instead of immediately invoking the setter mutation when the property is set to a value, a generated action is invoked. This generated action invokes the method, and then invokes the action which name matches argument `action`, (this action must be defined separately). This is useful in situations where an action call always follows a mutation, for example when a property is bound to the value of a search box, and the search results should be retrieved whenever the value changes.

### `@virtual`

Syntax: `@virtual(getter: string, setter: string)`

Mark properties with the `virtual` decorator to create simulated/computed properties that can get and set their values from/to various sources in the module. This does not create anything new in the vuex module, but instead creates a property on module class instance that allows for complex get and set behavior from a simple property interface. This is much like the `model` decorator, but without any internal mutation/action generation and with much more control.

`virtual` is a decorator factory, and takes 2 arguments: the name of a state property or a vuex getter, and the name of an action or mutation. These can be any valid names, either those explicitly marked with the appropriate decorator or generated by decorators `getset` or `model`. In the case of name collisions, the choice of using a state property or getter is determined in the following order: from getters marked with the `getter` decorator first, then any state property defined with teh `state`, `getset` or `model` decorators. For the setter, the precedences is first for mutations defined with the `mutation`, `getset` or `model` decorators, and then actions defined with `action` or `model` decorators.

It's recommended to define virtual properties with non-null assertions, like: `@virtual(/***/) foo!: number`. There is no type assertions to verify that types are kept consistent for example using `virtual` with a getter that returns a number and a mutation that accepts an object will lead to unexpected behavior. It's best to keep the getter return types and setter argument types consistent, or utilize union types on the virtual property appropriately.

## Utility Functions

### `getModule`

Syntax: `getModule<T>(constructor: { new (...args: any[]): T }, namespace?: string, context?: any): T`

`getModule` retrieves the instance of the module at the given namespace, or root if it is omitted. The resolved instance is validated with `instanceof` against the provided constructor and will throw an error if false, as this is a sign that the wrong namespace was supplied. The namespace may be a relative path, looking through parent or child modules. If the namespace is relative, a context module instance must be supplied (usually inside of a module action method, you would pass `this` as the context).

### `mapComputed`

Syntax: `mapComputed(constructor: { new (...args: any[]): T }, namespace?: string)`

`mapComputed` takes a module constructor and optional namespace, and maps the resolved module to map of functions for the Vue `computed` options object. All of the instances of `state` and `getter` decorators result in computed getter functions. All of the uses of `getset` and `model` result in getter/setter computed properties (suitable for `v-model`).

### `mapMethods`

Syntax: `mapMethods(constructor: { new (...args: any[]): T }, namespace?: string)`

Similar to `mapComputed` but for uses of the `action` and `mutation` decorators. This map should be used for the Vue `methods` option object.

## Notes

-   Classes defined with `classy-vuex` decorators do not allow vuex patterns to break. Mutation and getter functions are called with only the state object as the `this` argument. As such actions and other mutations/getters are undefined when these methods run. Only the action methods run with a true `this` argument of the class instance.
-   Namespaced modules are required (except for root), and as such all modules created with `classy-vuex` decorators set `namespace: true` on all modules. Otherwise it's difficult to consistently determine state/function location and maintain a single module class instance per module.
-   Inheritance and reuse of module classes is supported.
-   Constructor arguments and instance properties and methods are supported inside actions. Module instances are maintained for the lifetime of the store. However it is not recommended to make significant use of instance properties or methods not marked with `classy-vuex` decorators.
-   While mutations/getters do not run with a true `this` argument of the class instance, they can still access static class properties/methods (accessed by name, not by `this`) or other non-class variables or functions.
-   Vuex is intended to be used with singleton stores and multiple modules to segment functionality, and `classy-vuex` relies on this fact. When `createStore` is called, the store instance that is returned is cached and stored in metadata for internal use.
-   **Why not subclass Store?** Earlier iterations of `classy-vuex` experimented with subclassing `Vuex.Store` in order to maintain the same syntax of creating a store as `vuex`. However, subclassing `Store` introduces some issues at runtime that cannot be caught by unit tests. The `vuex` support of the vue devtools browser extension completely breaks if `Store` is subclassed. The `registerModule` and `unregisterStore` methods also do not work correctly if they are overrided or otherwise replaced. Instead the exported functions `createStore`, `registerModule` and `unregisterModule` allow for the `Store` to be created and modified withtout extending the `Store` class.

## Change log

-   **1.8.5** - Remove replacement of `store.registerModule` and `store.unregisterModule` as these did not work correctly in real applications. Use the exported functions instead.
-   **1.8.3** - The build system was altered. Formerly, the typescript declarations may have exposed some objects that may not have actually been available in javascript. Now the output javascript and typescript are consistent.
-   **1.8.2** - Add `mergeModule` function, for merging module options together. Added better handling of dynamic registration/unregistration of plain modules.
-   **1.8.1** - Added support for methods decorated with `@mutation` to access instance properties and undecorated methods (but no actions/getters)
