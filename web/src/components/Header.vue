<template lang="pug">
p-card.header
  template(#content)
    .grid.m-0
      .col.flex-none.text-left.hide-small
        .text-3xl.font-medium.pr-1 LitRPG Directory
        MayanDate(style="cursor: pointer;", @click="gotoDateInfo").pt-3.px-1
        .mt-3.text-center {{ counts.series }} Series / {{ counts.books }} Books
      .col.m-0.p-0
      .col.ml-2(style="flex-basis: 250px; flex-grow: 0")
        .p-field
          label.text-sm Series Name
          .p-inputwrapper.p-input-icon-left.p-input-icon-right
            i.pi.pi-book
            p-inputtext(v-model="searchForm.series")
            i.pi.pi-times(v-show="searchForm.series.length > 0", @click="searchForm.series = ''")
        .p-field.mt-1
          label.text-sm Book Title
          .p-inputwrapper.p-input-icon-left.p-input-icon-right
            i.pi.pi-book
            p-inputtext(v-model="searchForm.title")
            i.pi.pi-times(v-show="searchForm.title.length > 0", @click="searchForm.title = ''")
        .p-field.mt-1
          label.text-sm Author / Narrator
          .p-inputwrapper.p-input-icon-left.p-input-icon-right
            i.pi.pi-user
            p-inputtext(v-model="searchForm.person")
            i.pi.pi-times(v-show="searchForm.person.length > 0", @click="searchForm.person = ''")
      .col.ml-2(style="flex-basis: 300px; flex-grow: 0; max-width: 300px")
        .p-field
          label.text-sm Setting
          p-multiselect(
            v-model="searchForm.setting",
            :options="settingOptions",
            optionLabel="name",
            optionValue="code",
          )
        .p-field.mt-1
          label.text-sm Plot
          p-multiselect(
            v-model="searchForm.plot",
            :options="plotOptions",
            optionLabel="name",
            optionValue="code",
          )
        .p-field.mt-1
          label.text-sm Era
          p-multiselect(
            v-model="searchForm.era",
            :options="eraOptions",
            optionLabel="name",
            optionValue="code",
          )
      .col.ml-2(style="flex-basis: 150px; flex-grow: 0")
        .p-field
          label.text-sm Young Readers
          p-togglebutton(
            v-model="searchForm.young",
            onLabel="Include",
            offLabel="Exclude",
            onIcon="pi pi-check",
            offIcon="pi pi-times",
            style="z-index:100;"
          )
        .p-field.mt-1
          label.text-sm Harem
          p-togglebutton(
            v-model="searchForm.harem",
            onLabel="Include",
            offLabel="Exclude",
            onIcon="pi pi-check",
            offIcon="pi pi-times",
          )
        .p-field.mt-1
          label.text-sm Incomplete Series
          p-togglebutton(
            v-model="searchForm.completed",
            onLabel="Include",
            offLabel="Exclude",
            onIcon="pi pi-check",
            offIcon="pi pi-times",
          )
      .col.m-0.p-0
</template>

<script>
import {
  computed,
  inject,
  ref,
  watch,
} from 'vue';
import MayanDate from '@/components/MayanDate.vue';

export default {
  name: 'Header',
  components: {
    MayanDate,
  },
  setup() {
    const store = inject('store');

    const searchForm = ref({
      series: '',
      title: '',
      person: '',
      harem: true,
      completed: true,
      young: true,
      setting: ['AR', 'GL', 'GP', 'OW', 'PA', 'PL', 'R', 'T', ''],
      plot: ['A', 'B', 'C', 'D', 'S', ''],
      era: ['F', 'FT', 'T', ''],
    });

    watch(searchForm, () => {
      store.setSearch(searchForm.value);
    }, { deep: true });
    store.setSearch(searchForm.value);

    const counts = computed(() => ({
      books: store.state.books.length,
      series: store.state.series.length,
    }));

    const gotoDateInfo = () => {
      window.open('https://maya.nmai.si.edu/calendar/maya-calendar-converter', '_blank');
    };

    return {
      gotoDateInfo,
      counts,
      searchForm,
      plotOptions: store.state.plotOptions,
      settingOptions: store.state.settingOptions,
      eraOptions: store.state.eraOptions,
    };
  },
};
</script>

<style>
.header {
  background-color: rgba(255, 255, 255, 0.7);
  height: calc(100% - 10px);
}
.header .p-input-icon-left > i:first-of-type {
  z-index: 1;
}
.header .p-card-content {
  padding: 0 0 !important;
  height: 100%;
}
.header .p-card-body {
  padding: 0 0 !important;
  height: 100%;
}
.title {
  display: block;
  height: 35px;
  font-size: 30px;
  line-height: 35px;
  color: black;
}
.p-field .p-component, .p-inputwrapper, input {
  width: 100%;
}
.p-field label {
  display: block;
  margin-bottom: 2px !important;
}
.p-field .p-inputnumber-button {
  width: 2em;
}

@media only screen and (max-width: 985px) {
  .hide-small {
    display: none;
  }
}
</style>
