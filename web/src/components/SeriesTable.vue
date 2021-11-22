<template lang="pug">
p-overlaypanel(ref="infoOverlay", :style="{width: '400px'}")
  p-datatable.p-datatable-sm(
    :value='tipData',
  )
    p-column(
      field='name', header="Name"
      style="flex: 0 0 150px;"
    )
    p-column(
      field='desc', header="Description"
      style="flex: 1 0 250px;"
    )

p-overlaypanel(ref="ratingOverlay")
  p-datatable.p-datatable-sm(
    :value='selectedSeries.books',
  )
    p-column(
      field='title', header="Book Name", :sortable="false", :frozen="false",
      style="flex-grow: 1; flex-basis: 290px;"
    )
      template(#body="props")
        .white-space-nowrap.text-overflow-ellipsis.text-xs
          span(
            v-if="props.data.bookNumber > 0"
            style="display: inline-block; width: 2em;"
          ) {{ props.data.bookNumber }}.
          span(
            v-else
            style="display: inline-block; width: 2em;"
          ) &nbsp;
          span.ml-1 {{ props.data.title }}
    p-column(
      field='rating', header="Rating", :sortable="false",
      style="flex: 0 0 175px;"
    )
      template(#body="props")
        p-rating.text-xs(
          :modelValue="props.data.stars", :stars="5" :disabled="true",
          :cancel="false", style="display: inline-block;",
        )
        span.text-xs.ml-1 {{ props.data.rating.toLocaleString() }}
    p-column(
      field='reviews', header="Reviews", :sortable="false",
      style="flex: 0 0 120px;"
    )
      template(#body="props")
        .text-xs(style="text-align: right; width: 100%; padding-right: 10px")
          | {{ props.data.reviews.toLocaleString() }}

SeriesDialog(
  v-if="showInfo",
  :selectedSeries="selectedSeries",
  @close="showInfo = false"
)

p-datatable.p-datatable-sm(
  :value='series',
  :scrollable="true",
  scrollDirection="both"
  scrollHeight="100%",
  style="height: 100%;",
  sortField="title",
  :sortOrder="1",
 )
  p-column(
    field='title', header="Series Name", :sortable="true", :frozen="true",
    style="flex: 1 0 290px;"
  )
    template(#body="props")
      p-button.p-button-text.full-width(@click="showBooks(props.data)")
        .white-space-nowrap.text-overflow-ellipsis {{ props.data.title }}
  p-column(
    field='authors', header="Authors",
    style="flex: 0 0 200px;"
  )
    template(#body="props")
      .person-list
        .person(v-for="person in props.data.authors") {{ person.name }}
  p-column(
    field='narrators', header="Narrators",
    style="flex: 0 0 200px;"
  )
    template(#body="props")
      .person-list
        .person(v-for="person in props.data.narrators") {{ person.name }}
  p-column(
    field='setting', header="Setting", :sortable="true",
    style="flex: 0 0 160px;"
  )
    template(#header)
      .mr-1(@mouseover="showInfoTip($event, 'setting')" @mouseleave="hideInfoTip")
        i.pi.pi-info-circle
    template(#body="props")
      span {{ displaySetting(props.data.setting) }}
  p-column(
    field='plot', header="Plot", :sortable="true",
    style="flex: 0 0 160px;"
  )
    template(#header)
      .mr-1(@mouseover="showInfoTip($event, 'plot')" @mouseleave="hideInfoTip")
        i.pi.pi-info-circle
    template(#body="props")
      span {{ displayPlot(props.data.plot) }}
  p-column(
    field='era', header="Era", :sortable="true",
    style="flex: 0 0 160px;"
  )
    template(#header)
      .mr-1(@mouseover="showInfoTip($event, 'era')" @mouseleave="hideInfoTip")
        i.pi.pi-info-circle
    template(#body="props")
      span {{ displayEra(props.data.era) }}
  p-column(
    field='young', header="Young Readers", :sortable="true",
    style="flex: 0 0 110px;"
  )
    template(#body="props")
      span {{ displayBool(props.data.young) }}
  p-column(
    field='harem', header="Harem", :sortable="true",
    style="flex: 0 0 100px;"
  )
    template(#body="props")
      span {{ displayBool(props.data.harem) }}
  p-column(
    field='completed', header="Completed", :sortable="true",
    style="flex: 0 0 130px;"
  )
    template(#body="props")
      span {{ displayBool(props.data.completed) }}
  p-column(
    field='publishedCount', header="Book Count", :sortable="true",
    style="flex: 0 0 95px;"
  )
  p-column(
    field='rating', header="Rating", :sortable="true",
    style="flex: 0 0 175px;"
  )
    template(#body="props")
      .m-0.p-0(@mouseover="showRatingTip($event, props.data)" @mouseleave="hideRatingTip")
        p-rating(
          :modelValue="props.data.stars", :stars="5" :disabled="true",
          :cancel="false", style="display: inline-block;",
        )
        span.text-xs.ml-1 {{ props.data.rating.toLocaleString() }}
  p-column(
    field='reviews', header="Reviews", :sortable="true",
    style="flex: 0 0 120px;"
  )
    template(#body="props")
      div(style="text-align: right; width: 100%; padding-right: 10px")
        | {{ props.data.reviews.toLocaleString() }}
  p-column(
    header="Links",
    style="flex: 0 0 145px;"
  )
    template(#body='props')
      p-button.mx-1.p-0.p-button-text(
        v-for='link in props.data.urls'
        @click="goto(link.url)"
      )
        img(v-if="link.for == 'Audible'").button-image(src="@/assets/audible.png")
        img(v-if="link.for == 'Kindle'").button-image(src="@/assets/kindle.png")
        img(v-if="link.for == 'Goodreads'").button-image(src="@/assets/goodreads.png")
  p-column(
    field='lastUpdate', header="Last Update", :sortable="true",
    style="flex: 0 0 120px;"
  )
    template(#body="props")
      span
        | {{ new Date(props.data.lastUpdate).toLocaleDateString() }}
        | {{ new Date(props.data.lastUpdate).toLocaleTimeString([], { timeStyle: 'short' }) }}

  p-card.noItemsFound(v-if="!loading && noSearch" style="width: 100%; height: 100%;")
    template(#content)
      .text-center.mt-5.pt-5
        i.pi.pi-book(style="font-size: 6em")
      .text-5xl.text-center.mt-5.pt-5 No Books Found
  p-card.noItemsFound(v-if="loading" style="width: 100%; height: 100%;")
    template(#content)
      .text-center.mt-5.pt-5
        i.pi.pi-spin.pi-spinner(style="font-size: 6em")
      .text-5xl.text-center.mt-5.pt-5 Loading...
</template>

<script>
import {
  computed,
  inject,
  ref,
} from 'vue';

import {
  filter,
  find,
  includes,
} from 'lodash';

import SeriesDialog from '@/components/SeriesDialog.vue';

export default {
  name: 'SeriesTable',
  components: {
    SeriesDialog,
  },
  setup() {
    const store = inject('store');

    const infoOverlay = ref(null);
    const infoTipMode = ref('setting');
    const ratingOverlay = ref(null);
    const showInfo = ref(false);
    const selectedSeries = ref({});

    const loading = ref(true);
    const error = ref(false);

    store.updateBooks().then((err) => {
      if (err) {
        error.value = true;
      }
      loading.value = false;
    });

    const filteredSeries = () => filter(store.state.series, (s) => {
      let ret = true;
      if (store.state.searchSeries
          && !includes(s.title.toLowerCase(), store.state.searchSeries.toLowerCase())) {
        ret = false;
      }
      if (store.state.searchTitle
          && !find(
            s.books,
            (b) => includes(b.title.toLowerCase(), store.state.searchTitle.toLowerCase()),
          )) {
        ret = false;
      }
      if (store.state.searchPerson
          && !find(
            s.authors,
            (p) => includes(p.name.toLowerCase(), store.state.searchPerson.toLowerCase()),
          )
          && !find(
            s.narrators,
            (p) => includes(p.name.toLowerCase(), store.state.searchPerson.toLowerCase()),
          )) {
        ret = false;
      }
      if (store.state.searchSettings.length > 0 && !includes(store.state.searchSettings, s.setting || '')) {
        ret = false;
      }
      if (store.state.searchPlots.length > 0 && !includes(store.state.searchPlots, s.plot || '')) {
        ret = false;
      }
      if (store.state.searchEras.length > 0 && !includes(store.state.searchEras, s.era || '')) {
        ret = false;
      }
      if (!store.state.searchYoung && s.young === 'Y') {
        ret = false;
      }
      if (!store.state.searchHarem && s.harem === 'Y') {
        ret = false;
      }
      if (!store.state.searchCompleted && s.completed === 'N') {
        ret = false;
      }
      return ret;
    });

    const noSearch = computed(() => filteredSeries().length === 0);

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

    const showBooks = (series) => {
      selectedSeries.value = series;
      showInfo.value = true;
    };

    const showRatingTip = (event, series) => {
      selectedSeries.value = series;
      ratingOverlay.value.show(event);
    };

    const hideRatingTip = (event) => {
      ratingOverlay.value.hide(event);
    };

    const showInfoTip = (event, mode) => {
      infoTipMode.value = mode;
      infoOverlay.value.show(event);
    };

    const hideInfoTip = (event) => {
      infoOverlay.value.hide(event);
    };

    const goto = (url) => {
      window.open(url, '_blank');
    };

    const tipData = computed(() => {
      if (infoTipMode.value === 'setting') {
        return store.state.settingTips;
      }
      if (infoTipMode.value === 'plot') {
        return store.state.plotTips;
      }
      if (infoTipMode.value === 'era') {
        return store.state.eraTips;
      }
      return [];
    });

    return {
      loading,
      series: computed(filteredSeries, []),
      noSearch,
      showInfo,
      selectedSeries,
      displayBool,
      displaySetting,
      displayPlot,
      displayEra,
      showBooks,
      showRatingTip,
      hideRatingTip,
      showInfoTip,
      hideInfoTip,
      tipData,
      goto,
      infoOverlay,
      ratingOverlay,
      settingOptions: store.state.settingOptions,
      plotOptions: store.state.plotOptions,
      eraOptions: store.state.eraOptions,
      ynOptions: store.state.ynOptions,
      settingTips: store.state.settingTips,
    };
  },
};
</script>

<style>
.button-image {
  width: 32px;
  height: 32px;
}
.person-list {
  word-break: break-all;
}
.person {
  white-space: nowrap;
}
.col-large {
  flex: 2 1 0 !important;
}
.col-small {
  flex: 1 1 0 !important;
}
.full-width {
  width: 100%;
}

.noItemsFound {
  background-color: rgba(248, 249, 250, 0.8) !important;
}

.p-datatable-thead th,
.p-datatable-tbody td.p-frozen-column {
  background-color: rgba(248, 249, 250, 0.95) !important;
}
.p-datatable-thead {
  z-index: 5 !important;
}
.p-datatable-thead th.p-frozen-column {
  border-right: 1px solid rgba(233, 236, 239, 0.8) !important;
}
.p-datatable-tbody td.p-frozen-column {
  border-right: 1px solid #e9ecef !important;
  z-index: 3;
}
.p-datatable-tbody {
  z-index: 2;
}
.p-datatable-tbody td {
  background-color: rgba(250, 250, 250, 0.85) !important;
}
.p-datatable .p-datatable-tbody > tr {
  background: inherit !important;
}
.p-datatable-loading-overlay {
  background-color: rgba(248, 249, 250, 0.95) !important;
}
.p-datatable-emptymessage td {
  min-width: 100%;
  height: 0px;
  padding: 0px !important;
}
.p-rating.text-xs .p-rating-icon {
  font-size: 1rem !important;
}
.p-dialog-header {
  padding-top: 5px !important;
  padding-bottom: 0px !important;
}
.p-dialog-content {
  padding-top: 0px !important;
  padding-bottom: 0px !important;
}
.p-dialog-content .p-dataview-grid, .p-dataview-content {
  min-width: 100%;
}
.p-datatable-wrapper {
  min-height: 100%;
  background-color: rgba(248, 249, 250, 0.05) !important;
}
</style>
