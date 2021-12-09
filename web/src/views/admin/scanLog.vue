<template lang="pug">
.m-0(style="height: 100%")
  .flex-grow-1.p-0.text-left(v-if=`logs.length !== 0` style="height: calc(100% - 36px)")
    p-datatable.p-datatable-sm.pt-4.pb-1(
      :value='logs',
      :scrollable="true",
      scrollHeight="100%",
      style="height: 100%;",
      sortField="timestamp",
      :sortOrder="0",
    )
      p-column(
        field='timestamp', header="Timestamp", :sortable="false",
        style="flex-basis: 200px;"
      )
        template(#body="props")
          span
            | {{ new Date(props.data.timestamp).toLocaleDateString() }}
            | {{ new Date(props.data.timestamp).toLocaleTimeString() }}
      p-column(
        field='message', header="Message", :sortable="false",
        style="flex-basis: calc(100% - 280px); overflow-wrap: break-word"
      )
    p-button(@click="loadMore" :disabled="busy" v-if="hasMore") Load More
    p-button(@click="refresh" :disabled="busy") Refresh
  .flex-grow-1.p-0.text-left(v-else style="height: 100%")
    .grid
      .col
      .col.text-center
        p-panel.mt-4
          template(#header) Scan Logs
          p.text-left
            | No log entries found.
          p-button(@click="loadMore" :disabled="busy") Refresh
      .col
</template>

<script>
import {
  computed,
  onMounted,
  inject,
  ref,
} from 'vue';

import {
  find,
} from 'lodash';

import { useToast } from 'primevue/usetoast';

export default {
  name: 'ScanLog',
  components: { },
  setup() {
    const api = inject('api');
    const toast = useToast();
    const busy = ref(false);
    const logs = ref([]);
    const nextKey = ref('');
    const lastKey = ref('');
    const noMore = ref(false);

    const loadLogs = (key, autoload) => {
      busy.value = true;
      api.getLogs(key).then((result) => {
        let foundItem = false;
        result.items.forEach((i) => {
          if (!find(logs.value, i)) {
            logs.value.push(i);
          } else {
            foundItem = true;
          }
        });

        nextKey.value = result.next;
        if (!foundItem && nextKey.value !== '' && autoload) {
          loadLogs(nextKey.value, true);
        } else if (foundItem && autoload) {
          lastKey.value = nextKey.value;
        }

        if (!autoload && nextKey.value === '') {
          noMore.value = true;
        }
        busy.value = false;
      }).catch(() => {
        toast.add({
          severity: 'error',
          summary: 'Error fetching log enteries.',
          life: 5000,
        });
        nextKey.value = '';
        lastKey.value = '';
        noMore.value = false;
        busy.value = false;
      });
    };

    const loadMore = () => {
      loadLogs(nextKey.value);
    };

    const refresh = () => {
      lastKey.value = nextKey.value;
      loadLogs('', true);
    };

    const hasMore = computed(() => {
      if (noMore.value) {
        return false;
      }
      return nextKey.value !== '';
    });

    onMounted(() => {
      loadLogs();
    });

    return {
      busy,
      logs,
      loadLogs,
      loadMore,
      refresh,
      hasMore,
      noMore,
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
