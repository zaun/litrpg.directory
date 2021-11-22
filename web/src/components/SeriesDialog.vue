<template lang="pug">
p-dialog(
  :visible="true",
  modal,
  dismissableMask,
  style="max-width: 900px; width: 900px"
  :draggable="false"
  :closable="false"
  :closeOnEscape="true"
)
  template(#header)
    .grid(style="margin-left: 0; margin-right: 0; flex-basis: 100%;")
      .col-12
        .grid
          p-divider.pb-0.mb-0
            .font-medium.text-xl {{ selectedSeries.title }}
      .col-12
        .grid
          .col-2
            .font-medium.text-base Setting
          .col-4
            .text-base(v-if="!editMode") {{ displaySetting(selectedSeries.setting) }}
            p-dropdown.text-base(
              v-if="editMode"
              v-model="editForm.setting",
              :options="settingOptions",
              optionLabel="name",
              optionValue="code",
              :disabled="saving"
            )
          .col-2
            .font-medium.text-base Plot
          .col-4
            .text-base(v-if="!editMode") {{ displayPlot(selectedSeries.plot) }}
            p-dropdown.text-base(
              v-if="editMode"
              v-model="editForm.plot",
              :options="plotOptions",
              optionLabel="name",
              optionValue="code",
              :disabled="saving"
            )
          .col-2
            .font-medium.text-base Era
          .col-4
            .text-base(v-if="!editMode") {{ displayEra(selectedSeries.era) }}
            p-dropdown.text-base(
              v-if="editMode"
              v-model="editForm.era",
              :options="eraOptions",
              optionLabel="name",
              optionValue="code",
              :disabled="saving"
            )
          .col-2
            .font-medium.text-base Harem
          .col-4
            .text-base(v-if="!editMode") {{ displayBool(selectedSeries.harem) }}
            p-dropdown.text-base(
              v-if="editMode"
              v-model="editForm.harem",
              :options="ynOptions",
              optionLabel="name",
              optionValue="code",
              :disabled="saving"
            )
          .col-2
            .font-medium.text-base Completed
          .col-4
            .text-base(v-if="!editMode") {{ displayBool(selectedSeries.completed) }}
            p-dropdown.text-base(
              v-if="editMode"
              v-model="editForm.completed",
              :options="ynOptions",
              optionLabel="name",
              optionValue="code",
              :disabled="saving"
            )
          .col-2
            .font-medium.text-base Young Readers
          .col-4
            .text-base(v-if="!editMode") {{ displayBool(selectedSeries.young) }}
            p-dropdown.text-base(
              v-if="editMode"
              v-model="editForm.young",
              :options="ynOptions",
              optionLabel="name",
              optionValue="code",
              :disabled="saving"
            )
      .col-12(v-if="!editMode")
        .grid
          p-divider.py-0.my-0
  .grid.pt-1(v-if="!editMode")
    p-dataview(:value="selectedSeries.books", layout="grid")
      template(#grid="props")
        .col-6.p-2
          p-card
            template(#content)
              .grid.mb-2
                .col-7.text-left.py-0
                  .text-lg.font-medium.pt-2(v-if="props.data.bookNumber > 0")
                    span {{ props.data.bookNumber }}.
                    span.ml-1 {{ props.data.title }}
                  .text-lg.font-medium.pt-2(v-else)
                    span {{ props.data.title }}
                .col-5.text-right.py-0
                  p-button.mx-1.p-0.p-button-text(
                    v-for='link in props.data.urls'
                    @click="goto(link.url)"
                  )
                    img(v-if="link.for == 'Audible'").button-image(src="@/assets/audible.png")
                    img(v-else-if="link.for == 'Kindle'").button-image(src="@/assets/kindle.png")
                    img(
                      v-else-if="link.for == 'Goodreads'"
                    ).button-image(src="@/assets/goodreads.png")
                    img(v-else).button-image(src="@/assets/audible.png")
              .grid
                .col
                  p-rating(
                    style="display: inline-block;",
                    :modelValue="props.data.stars",
                    :stars="5",
                    :disabled="true",
                    :cancel="false",
                  )
                  span.text-xs.ml-1 {{ props.data.rating.toLocaleString() }}
                .col.text-right
                  .text-sm {{ props.data.reviews.toLocaleString() }} Reviews
              .grid
                .col(v-if="props.data.authors.length > 0")
                  .text-sm.font-medium Author(s)
                  .text-sm(v-for="a in props.data.authors") {{ a.name }}
                .col.text-right(v-if="props.data.narrators.length > 0")
                  .text-sm.font-medium Narrator(s)
                  .text-sm(v-for="n in props.data.narrators") {{ n.name }}
              .text-sm.mt-2(style="white-space: pre-wrap;") {{ props.data.description }}
  template(#footer)
    p-divider.mt-3.mb-0
    .grid
      .col.text-left
        p-button.p-button-secondary.mt-2(
          v-if="!editMode"
          @click="showEditMode"
          :disabled="saving"
        ) Update Info
        p-button.p-button-warning.mt-2(
          v-if="editMode"
          @click="editMode = false"
          :disabled="saving"
        ) Cancel Update
      .col
        p-button.mt-2(
          v-if="!editMode"
          @click="close"
          :disabled="saving"
        ) Close
        p-button.mt-2(
          v-if="editMode"
          @click="sendUpdate"
          :disabled="saving"
        ) Send Update
</template>

<script>
import {
  inject,
  ref,
} from 'vue';

import {
  find,
  isUndefined,
} from 'lodash';

import { useToast } from 'primevue/usetoast';

export default {
  name: 'SeriesDialog',
  components: { },
  props: {
    selectedSeries: Object,
  },
  setup(props, { emit }) {
    const store = inject('store');
    const toast = useToast();

    const editMode = ref(false);
    const saving = ref(false);
    const editForm = ref({
      setting: '',
      plot: '',
      era: '',
      young: '',
      harem: '',
      completed: '',
    });

    const displayBool = (val) => {
      if (!val) {
        return '--';
      }
      const ret = find(store.state.ynOptions, { code: val.toUpperCase() });
      return ret ? ret.name : '--';
    };

    const displaySetting = (val) => {
      if (!val) {
        return '--';
      }
      const setting = find(store.state.settingOptions, { code: val.toUpperCase() });
      return setting ? setting.name : '--';
    };

    const displayPlot = (val) => {
      if (!val) {
        return '--';
      }
      const setting = find(store.state.plotOptions, { code: val.toUpperCase() });
      return setting ? setting.name : '--';
    };

    const displayEra = (val) => {
      if (!val) {
        return '--';
      }
      const setting = find(store.state.eraOptions, { code: val.toUpperCase() });
      return setting ? setting.name : '--';
    };

    const showEditMode = () => {
      editMode.value = true;
      editForm.value = {
        setting: props.selectedSeries.setting || '',
        plot: props.selectedSeries.plot || '',
        era: props.selectedSeries.era || '',
        harem: props.selectedSeries.harem || '',
        completed: props.selectedSeries.completed || '',
        young: props.selectedSeries.young || '',
      };
    };

    const sendUpdate = () => {
      saving.value = true;
      const updates = [];
      if (editForm.value.setting !== props.selectedSeries.setting
        && !(editForm.value.setting === '' && isUndefined(props.selectedSeries.setting))) {
        updates.push(store.sendRequest(
          props.selectedSeries.id,
          'setting',
          props.selectedSeries.setting,
          editForm.value.setting,
        ));
      }
      if (editForm.value.plot !== props.selectedSeries.plot
        && !(editForm.value.plot === '' && isUndefined(props.selectedSeries.plot))) {
        updates.push(store.sendRequest(
          props.selectedSeries.id,
          'plot',
          props.selectedSeries.plot,
          editForm.value.plot,
        ));
      }
      if (editForm.value.era !== props.selectedSeries.era
        && !(editForm.value.era === '' && isUndefined(props.selectedSeries.era))) {
        updates.push(store.sendRequest(
          props.selectedSeries.id,
          'era',
          props.selectedSeries.era,
          editForm.value.era,
        ));
      }
      if (editForm.value.harem !== props.selectedSeries.harem
        && !(editForm.value.harem === '' && isUndefined(props.selectedSeries.harem))) {
        updates.push(store.sendRequest(
          props.selectedSeries.id,
          'harem',
          props.selectedSeries.harem,
          editForm.value.harem,
        ));
      }
      if (editForm.value.completed !== props.selectedSeries.completed
        && !(editForm.value.completed === '' && isUndefined(props.selectedSeries.completed))) {
        updates.push(store.sendRequest(
          props.selectedSeries.id,
          'completed',
          props.selectedSeries.completed,
          editForm.value.completed,
        ));
      }
      if (editForm.value.young !== props.selectedSeries.young
        && !(editForm.value.young === '' && isUndefined(props.selectedSeries.young))) {
        updates.push(store.sendRequest(
          props.selectedSeries.id,
          'young',
          props.selectedSeries.young,
          editForm.value.young,
        ));
      }
      Promise.all(updates).then(() => {
        saving.value = false;
        editMode.value = false;
        toast.add({
          severity: 'success',
          summary: 'Update Request Sent',
          detail: `Update to series ${props.selectedSeries.title} has been sent for review.`,
          life: 5000,
        });
      });
    };

    const close = () => {
      emit('close');
    };

    return {
      editMode,
      saving,
      editForm,
      displayBool,
      displaySetting,
      displayPlot,
      displayEra,
      showEditMode,
      sendUpdate,
      close,
      settingOptions: store.state.settingOptions,
      plotOptions: store.state.plotOptions,
      eraOptions: store.state.eraOptions,
      ynOptions: store.state.ynOptions,
    };
  },
};
</script>

<style>
</style>
