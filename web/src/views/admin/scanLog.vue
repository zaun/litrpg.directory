<template lang="pug">
.m-2(style="height: calc(100% - 36px - 0.25rem)")
  .flex-grow-1.p-0.text-left(v-if=`logs.length !== 0` style="height: 100%")
    p-datatable.p-datatable-sm(
      :value='requests',
      :scrollable="true",
      scrollDirection="both",
      scrollHeight="100%",
      style="height: 100%;",
      sortField="title",
      :sortOrder="1",
    )
      p-column(
        field='series.name', header="Series Name", :sortable="true",
        style="flex-grow: 1; flex-basis: 200px;"
      )
      p-column(
        field='timestamp', header="Timestamp", :sortable="true",
        style="flex-basis: 280px;"
      )
  .flex-grow-1.p-0.text-left(v-else style="height: 100%")
    .grid
      .col
      .col.text-center
        p-panel.mt-4
          template(#header) Scan Logs
          p.text-left
            | No log entries found.
          p-button(@click="loadLogs", :disabled="busy") Refresh
      .col
</template>

<script>
import {
  ref,
} from 'vue';

import { useToast } from 'primevue/usetoast';

export default {
  name: 'ScanLog',
  components: { },
  setup() {
    const toast = useToast();
    const busy = ref(false);
    const logs = ref([]);

    const loadLogs = () => {
      toast.add({
        severity: 'info',
        summary: 'Log view not supported at this time.',
        life: 5000,
      });
    };

    return {
      busy,
      logs,
      loadLogs,
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
