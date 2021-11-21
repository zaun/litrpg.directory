<template lang="pug">
.p-2(style="height: 100%;")
  .grid.m-0(style="height: 200px;")
    .col.p-0.text-left
      Login
</template>

<script>
import Login from '@/components/Login.vue';

export default {
  name: 'App',
  components: {
    Login,
  },
  setup() {
  },
};
</script>
