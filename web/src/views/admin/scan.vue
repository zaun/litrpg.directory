<template lang="pug">
.m-0
  .grid
    .col
    .col.text-center
      p-panel.mt-4
        template(#header) Full Scan
        p.text-left
          | This will add all existing Series to the queue to be re-scanned.
          | The process will run in the background once its started.
        p-button(@click="startScan", :disabled="busy") Start
    .col
</template>

<script>
import {
  inject,
  ref,
} from 'vue';

import { useToast } from 'primevue/usetoast';

export default {
  name: 'Scan',
  components: { },
  setup() {
    const api = inject('api');
    const toast = useToast();
    const busy = ref(false);

    const startScan = () => {
      busy.value = true;
      api.startScan().then(() => {
        // this happens fast. Prevent dbl-clicks.
        setTimeout(() => {
          busy.value = false;
          toast.add({
            severity: 'success',
            summary: 'Scan started.',
            life: 5000,
          });
        }, 1000);
      }).catch(() => {
        busy.value = false;
      });
    };

    return {
      busy,
      startScan,
    };
  },
};
</script>

<style>
.series-dialog {
  max-width: 900px;
  width: 900px;
}
.series-dialog.p-dialog .p-dialog-header {
  border: 1px solid #dee2e6;
  padding: 1rem !important;
  background: #f8f9fa;
  color: #495057;
  border-top-right-radius: 3px;
  border-top-left-radius: 3px;
  align-items: flex-start;
}
.series-dialog.p-dialog .p-dialog-content {
  border: 1px solid #dee2e6;
  padding-top: 1rem !important;
  padding-bottom: 1rem !important;
}
.series-dialog.p-dialog .p-dialog-footer {
  border: 1px solid #dee2e6;
  padding: 0rem 1rem !important;
}
</style>
