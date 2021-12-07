<template lang="pug">
.p-2(style="height: 100%;")
  .grid.mt-0.mx-0.header
    .col.p-0.text-left
      Header
  .grid.m-0.book-list
    .col.p-0.text-left(style="width: 100%; height: 100%;")
      SeriesTable
  .grid.mb-0.mx-0.p-0.footer
    .col.p-0
      Footer
</template>

<script>
import SeriesTable from '@/components/SeriesTable.vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';

export default {
  name: 'App',
  components: {
    SeriesTable,
    Footer,
    Header,
  },
  setup() {
  },
};
</script>

<style scoped>
.header {
  height: 190px;
  margin-bottom: 10px;
}
.book-list{
  height: calc(100% - 200px - 45px);
  width: 100%;
  overflow: hidden;
}
.footer {
  height: 35px;
  margin-top: 10px;
  padding-top: 1px;
}
@media only screen and (max-width: 767px) {
  .header {
    display: none;
  }
}
@media only screen and (max-width: 767px) {
  .book-list {
    height: calc(100% - 45px);
  }
}
</style>
