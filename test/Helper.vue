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
    </div>
</template>
<script lang="ts">
import Vue from 'vue'
import { mapComputed } from '../src'
import { Test } from './helpers.types'
export default Vue.extend({
    computed: {
        ...mapComputed(Test),
    },
})
</script>
