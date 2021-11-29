<template lang="pug">
p-overlaypanel(ref="ratingOverlay", :style="{width: '400px'}")
  p-datatable.p-datatable-sm(
    :value='selectedBook.ratings',
  )
    p-column(
      field='from', header="Site"
      style="flex: 0 0 150px;"
    )
    p-column(
      field='stars', header="Stars"
      style="flex: 1 0 250px;"
    )
      template(#body="props")
        p-rating.text-xs(
          :modelValue="props.data.stars", :stars="5" :disabled="true",
          :cancel="false", style="display: inline-block;",
        )
        span.text-xs.ml-1 {{ props.data.stars.toFixed(1).toLocaleString() }}
    p-column(
      field='reviews', header="Reviews", :sortable="false",
      style="flex: 0 0 120px;"
    )
      template(#body="props")
        .text-xs(style="text-align: right; width: 100%; padding-right: 10px")
          | {{ props.data.reviews.toLocaleString() }}

p-dialog.series-dialog(
  :visible="true",
  modal,
  dismissableMask,
  :draggable="false"
  :closable="true"
  :closeOnEscape="true"
  @update:visible="close()"
)
  template(#header)
    .grid.m-0(style="flex-basis: 100%;")
      .col-12.px-0.pt-0
        .text-xl.title {{ selectedSeries.title }}
      .col-12.p-0
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
  .grid.pt-2(v-if="!editMode")
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
              .grid(@mouseover="showRatingTip($event, props.data)" @mouseleave="hideRatingTip")
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
    .grid
      .col.text-left
        p-button.p-button-warning.mt-2(
          v-if="editMode"
          @click="editMode = false"
          :disabled="saving"
        ) Cancel Update
      .col
        p-button.p-button-secondary.mt-2(
          v-if="!editMode"
          @click="showEditMode"
          :disabled="saving"
        ) Update Info
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
    const api = inject('api');
    const toast = useToast();

    const ratingOverlay = ref(null);
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
    const selectedBook = ref({});

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
        updates.push(api.postRequest(
          props.selectedSeries.id,
          'setting',
          props.selectedSeries.setting,
          editForm.value.setting,
        ));
      }
      if (editForm.value.plot !== props.selectedSeries.plot
        && !(editForm.value.plot === '' && isUndefined(props.selectedSeries.plot))) {
        updates.push(api.postRequest(
          props.selectedSeries.id,
          'plot',
          props.selectedSeries.plot,
          editForm.value.plot,
        ));
      }
      if (editForm.value.era !== props.selectedSeries.era
        && !(editForm.value.era === '' && isUndefined(props.selectedSeries.era))) {
        updates.push(api.postRequest(
          props.selectedSeries.id,
          'era',
          props.selectedSeries.era,
          editForm.value.era,
        ));
      }
      if (editForm.value.harem !== props.selectedSeries.harem
        && !(editForm.value.harem === '' && isUndefined(props.selectedSeries.harem))) {
        updates.push(api.postRequest(
          props.selectedSeries.id,
          'harem',
          props.selectedSeries.harem,
          editForm.value.harem,
        ));
      }
      if (editForm.value.completed !== props.selectedSeries.completed
        && !(editForm.value.completed === '' && isUndefined(props.selectedSeries.completed))) {
        updates.push(api.postRequest(
          props.selectedSeries.id,
          'completed',
          props.selectedSeries.completed,
          editForm.value.completed,
        ));
      }
      if (editForm.value.young !== props.selectedSeries.young
        && !(editForm.value.young === '' && isUndefined(props.selectedSeries.young))) {
        updates.push(api.postRequest(
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
          life: 2000,
        });
      });
    };

    const close = () => {
      emit('close');
    };

    const showRatingTip = (event, book) => {
      selectedBook.value = book;
      ratingOverlay.value.show(event);
    };

    const hideRatingTip = (event) => {
      ratingOverlay.value.hide(event);
    };

    const goto = (url) => {
      window.open(url, '_blank');
    };

    return {
      ratingOverlay,
      editMode,
      saving,
      editForm,
      selectedBook,
      displayBool,
      displaySetting,
      displayPlot,
      displayEra,
      showEditMode,
      sendUpdate,
      close,
      showRatingTip,
      hideRatingTip,
      goto,
      settingOptions: store.state.settingOptions,
      plotOptions: store.state.plotOptions,
      eraOptions: store.state.eraOptions,
      ynOptions: store.state.ynOptions,
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
