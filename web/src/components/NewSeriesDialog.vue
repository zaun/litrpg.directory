<template lang="pug">
p-dialog.add-new-dialog(
  :visible="true",
  modal,
  dismissableMask,
  :draggable="false"
  :closable="true"
  :closeOnEscape="true"
  @update:visible="close()"
)
  template(#header)
    .text-xl.title Add Series
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
      p-inputtext(v-model="newForm.kindleUrl", :disabled="busy")
      i.pi.pi-times(
        v-show="newForm.kindleUrl.length > 0",
        @click="newForm.kindleUrl = ''"
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
  template(#footer)
    .grid
      .col.text-right
        p-button.mt-2(
          @click="sendUpdate"
          :disabled="busy"
        ) Send Request
</template>

<script>
import {
  inject,
  ref,
} from 'vue';

import { useToast } from 'primevue/usetoast';

export default {
  name: 'NewSeriesDialog',
  components: { },
  setup(props, { emit }) {
    const api = inject('api');
    const toast = useToast();

    const busy = ref(false);
    const newForm = ref({
      series: '',
      kindleUrl: '',
      audibleUrl: '',
      goodreadsUrl: '',
    });

    const sendUpdate = () => {
      busy.value = true;
      const urls = [];
      if (newForm.value.kindleUrl) {
        urls.push(newForm.value.kindleUrl);
      }
      if (newForm.value.audibleUrl) {
        urls.push(newForm.value.audibleUrl);
      }
      if (newForm.value.goodreadsUrl) {
        urls.push(newForm.value.goodreadsUrl);
      }
      api.postRequestSeries(
        newForm.value.series,
        urls,
      ).then(() => {
        busy.value = false;
        emit('close');
        toast.add({
          severity: 'success',
          summary: 'Request Sent',
          detail: 'New series request has been sent.',
          life: 5000,
        });
      });
    };

    const close = () => {
      emit('close');
    };

    return {
      busy,
      newForm,
      sendUpdate,
      close,
    };
  },
};
</script>

<style>
.add-new-dialog {
  max-width: 500px;
  width: 500px;
}
.add-new-dialog.p-dialog .p-dialog-header {
  border: 1px solid #dee2e6;
  padding: 1rem !important;
  background: #f8f9fa;
  color: #495057;
  border-top-right-radius: 3px;
  border-top-left-radius: 3px;
  align-items: flex-start;
}
.add-new-dialog.p-dialog .p-dialog-content {
  border: 1px solid #dee2e6;
  padding-top: 1rem !important;
  padding-bottom: 1rem !important;
}
.add-new-dialog.p-dialog .p-dialog-footer {
  border: 1px solid #dee2e6;
  padding: 0rem 1rem !important;
}
</style>
