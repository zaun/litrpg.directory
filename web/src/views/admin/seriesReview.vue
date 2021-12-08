<template lang="pug">
.m-2(style="height: calc(100% - 36px - 0.25rem)")
  .flex-grow-1.p-0.text-left(v-if=`requests.length !== 0` style="height: 100%")
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
        template(#body="props")
          span {{ formatDate(props.data.timestamp) }}
      p-column(
        field='field', header="Field", :sortable="true",
        style="flex-basis: 100px;"
      )
      p-column(
        field='oldValue', header="Old Value", :sortable="true",
        style="flex-basis: 100px;"
      )
      p-column(
        field='newValue', header="New Vaule", :sortable="true",
        style="flex-basis: 100px;"
      )
      p-column(
        field='curValue', header="Current Vaule", :sortable="true",
        style="flex-basis: 100px;"
      )
        template(#body="props")
          span {{ props.data.series[props.data.field] }}
      p-column(
        header="Actions", :sortable="true",
        style="flex-basis: 110px;"
      )
        template(#body="props")
          p-button(@click="acceptRequest(props.data)" icon="pi pi-check")
          p-button.ml-1(@click="removeRequest(props.data)" icon="pi pi-trash")
  .flex-grow-1.p-0.text-left(v-else style="height: 100%")
    .grid
      .col
      .col.text-center
        p-panel.mt-4
          template(#header) Book Review
          p.text-left
            | No requests found.
          p-button(@click="loadRequests", :disabled="busy") Refresh
      .col
</template>

<script>
import {
  computed,
  inject,
  ref,
} from 'vue';

import { useToast } from 'primevue/usetoast';

export default {
  name: 'SeriesReview',
  components: { },
  setup() {
    const store = inject('store');
    const toast = useToast();
    const busy = ref(false);

    const requests = computed(() => store.state.requests);

    const loadRequests = () => {
      store.updateRequests().then((err) => {
        if (err) {
          console.log(err);
        }
      });
    };
    loadRequests();

    const acceptRequest = (data) => {
      busy.value = true;
      store.acceptRequest(data).then(() => {
        busy.value = false;
        toast.add({
          severity: 'success',
          summary: 'Request had been applied',
          life: 1000,
        });
      }).catch(() => {
        busy.value = false;
        toast.add({
          severity: 'error',
          summary: 'Request not applied',
          life: 1000,
        });
      });
    };

    const removeRequest = (data) => {
      busy.value = true;
      store.removeRequest(data).then(() => {
        busy.value = false;
        toast.add({
          severity: 'success',
          summary: 'Request had been deleted',
          life: 1000,
        });
      }).catch(() => {
        busy.value = false;
        toast.add({
          severity: 'error',
          summary: 'Request not deleted',
          life: 1000,
        });
      });
    };

    const formatDate = (ts) => new Date(ts).toLocaleDateString(
      'en-us',
      {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    );

    return {
      busy,
      requests,
      acceptRequest,
      formatDate,
      loadRequests,
      removeRequest,
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
