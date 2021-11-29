<template lang="pug">
.p-2(style="height: 100%;")
  p-toolbar.p-0.mb-1
    template(#start)
      p-selectbutton.mx-1(
        :options="views",
        v-model="selectedView",
        optionLabel="name",
        optionValue="code"
      ) Add Series

  .m-0(v-if="selectedView == 'S'")
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

  .m-0(v-if="selectedView == 'A'")
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
                :disabled="isAddValid || busy",
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

  .m-0(v-if="selectedView == 'R'", style="height: calc(100% - 36px - 0.25rem)")
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
          style="flex-grow: 1; flex-basis: 290px;"
        )
        p-column(
          field='timestamp', header="Timestamp", :sortable="true",
          style="flex-basis: 290px;"
        )
          template(#body="props")
            span {{ formateDate(props.data.timestamp) }}
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
            template(#header) Book Update Request
            p.text-left
              | No requests found.
            p-button(@click="loadRequests", :disabled="busy") Refresh
        .col
</template>

<script>
import { computed, inject, ref } from 'vue';
import { useToast } from 'primevue/usetoast';

export default {
  name: 'App',
  components: {
  },
  setup() {
    const store = inject('store');
    const toast = useToast();

    const busy = ref(false);

    const views = [
      { name: 'Requests', code: 'R' },
      { name: 'Add Series', code: 'A' },
      { name: 'Scan', code: 'S' },
    ];
    const selectedView = ref('R');

    // Requests

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

    // Add Series

    const newForm = ref({
      series: '',
      amazonUrl: '',
      audibleUrl: '',
      goodreadsUrl: '',
    });
    const newSeries = computed(() => store.state.newSeries);

    const isAddValid = computed(() => !newForm.value.series
      || (!newForm.value.amazonUrl && !newForm.value.audibleUrl
          && !newForm.value.goodreadsUrl));

    const formateDate = (ts) => new Date(ts).toLocaleDateString(
      'en-us',
      {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    );

    const addSeries = () => {
      busy.value = true;
      store.addSeries(
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

    // Scan

    const startScan = () => {
      busy.value = true;
      store.startScan().then(() => {
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
      views,
      selectedView,
      newForm,
      isAddValid,
      busy,
      formateDate,
      startScan,
      addSeries,
      acceptRequest,
      removeRequest,
      requests,
      newSeries,
      loadRequests,
    };
  },
};
</script>
