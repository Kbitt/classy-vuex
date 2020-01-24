# Classy Vuex

`classy-vuex` is yet another package providing decorators that allow you to write vuex modules as type-safe classes.

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

The default way of writing vuex modules completely eliminates type safety in their use since `commit` and `dispatch` are called by string name. There are various ways to write helper functions and types that offer some type safety, but these be extremely labrious. Instead, this package allows you to write type-safe classes, where (in the appropriate context) all of the same properties and functions are accessible with no loss of types. Using decorators that transform the class methods and properties into a valid vuex module, the same module can be re-written as follows:

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

A store can then be created as such:

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
