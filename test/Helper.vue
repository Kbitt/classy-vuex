<template>
    <div>
        <div>{{ a }}</div>
        <input
            :value="loading"
            @input="e => (loading = e.target.checked)"
            type="checkbox"
        />
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
