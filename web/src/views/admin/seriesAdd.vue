<template lang="pug">
.m-0(style="height: 100%")
  .grid
    .col
    .col(style="flex-basis: 400px")
      p-panel.mt-4
        template(#header) Add Series
        .p-field
          label.text-sm Series Name
          .p-inputwrapper.p-input-icon-right
            p-inputtext(v-model="newForm.series", :disabled="busy")
            i.pi.pi-times(
              v-show="newForm.series.length > 0",
              @click="newForm.series = ''"
            )
        .p-field.mt-2
          label.text-sm Kindle URL
          .p-inputwrapper.p-input-icon-right
            p-inputtext(v-model="newForm.amazonUrl", :disabled="busy")
            i.pi.pi-times(
              v-show="newForm.amazonUrl.length > 0",
              @click="newForm.amazonUrl = ''"
            )
        .p-field.mt-2
          label.text-sm Audible URL
          .p-inputwrapper.p-input-icon-right
            p-inputtext(v-model="newForm.audibleUrl", :disabled="busy")
            i.pi.pi-times(
              v-show="newForm.audibleUrl.length > 0",
              @click="newForm.audibleUrl = ''"
            )
        .p-field.mt-2
          label.text-sm Goodreads URL
          .p-inputwrapper.p-input-icon-right
            p-inputtext(v-model="newForm.goodreadsUrl", :disabled="busy")
            i.pi.pi-times(
              v-show="newForm.goodreadsUrl.length > 0",
              @click="newForm.goodreadsUrl = ''"
            )
        p-divider
        .grid
          .col.pb-0.text-right
            p-button(
              @click="addSeries",
              :disabled="isValid || busy",
            ) Add
    .col
  .grid
    .col
    .col
      p-datatable.p-datatable-sm(
        :value='newSeries',
        :scrollable="true",
        scrollDirection="both",
        scrollHeight="100%",
        style="height: 100%;",
        sortField="title",
        :sortOrder="1",
      )
        p-column(
          field='seriesName', header="New Series Name", :sortable="true",
          style="flex-grow: 1; flex-basis: 290px;"
        )
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
  name: 'SeriesAdd',
  components: { },
  setup() {
    const store = inject('store');
    const api = inject('api');
    const toast = useToast();
    const busy = ref(false);

    const newForm = ref({
      series: '',
      amazonUrl: '',
      audibleUrl: '',
      goodreadsUrl: '',
    });
    const newSeries = computed(() => store.state.newSeries);

    const isValid = computed(() => !newForm.value.series
      || (!newForm.value.amazonUrl && !newForm.value.audibleUrl
          && !newForm.value.goodreadsUrl));

    const addSeries = () => {
      busy.value = true;
      api.postSeries(
        newForm.value.series,
        newForm.value.amazonUrl,
        newForm.value.audibleUrl,
        newForm.value.goodreadsUrl,
      ).then(() => {
        busy.value = false;
        newForm.value.series = '';
        newForm.value.amazonUrl = '';
        newForm.value.audibleUrl = '';
        newForm.value.goodreadsUrl = '';
        toast.add({
          severity: 'success',
          summary: 'Added new series',
          life: 5000,
        });
      }).catch(() => {
        busy.value = false;
      });
    };

    busy.value = true;
    store.updateRequests().then(() => {
      busy.value = false;
    });

    return {
      busy,
      isValid,
      newForm,
      newSeries,
      addSeries,
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
