<template>
    <div>
        <div>{{ a }}</div>
        <input
            id="input1"
            :value="loading"
            @input="e => (loading = e.target.checked)"
            type="checkbox"
        />
        <input id="input2" :value="filter" @input="e => (filter = e.target.value)" type="text" />
        <button type="button" id="btn1" @click="filterAction">Click me</button>
        <button type="button" id="btn2" @click="incFoo">No click me</button>
        <button type="button" id="btn3" @click="localFoo">No click me</button>
    </div>
</template>
<script lang="ts">
import Vue from 'vue'
import { mapComputed, mapMethods } from '../../dist'
import { Test } from './helpers.types'
export default Vue.extend({
    computed: mapComputed(Test),
    methods: {
        ...mapMethods(Test),
        localFoo() {
            const test = this.$getModule(Test)
            test.filterAction()
        },
    },
})
</script>
