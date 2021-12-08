<template lang="pug">
.p-0.m-0(style="height: 100%;")
  p-menubar.admin(v-if="authenticated" :model="menuItems")
    template(#start)
      i.pi.pi-book
  .p-1
    router-view
</template>

<script>
import {
  computed,
  inject,
  ref,
} from 'vue';

export default {
  name: 'App',
  components: {
  },
  setup() {
    const store = inject('store');
    const authenticated = computed(() => store.state.authenticated);
    const menuItems = ref([{
      label: 'Series',
      items: [{
        label: 'Add New',
        icon: 'pi pi-plus',
        to: { path: '/admin/series/add' },
      }, {
        label: 'Review',
        icon: 'pi pi-replay',
        to: { path: '/admin/series/review' },
      }],
    }, {
      label: 'Scan',
      items: [{
        label: 'Full Scan',
        icon: 'pi pi-database',
        to: { path: '/admin/scan' },
      }, {
        label: 'Review Log',
        icon: 'pi pi-align-left',
        to: { path: '/admin/scan/log' },
      }],
    }]);

    return {
      authenticated,
      menuItems,
    };
  },
};
</script>

<style>
.admin.p-menubar {
  z-index: 50;
}
</style>
