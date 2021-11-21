<template lang="pug">
.p-2(style="height: 100%;")
  .grid.mt-0.mx-0.header
    .col.p-0.text-left
      Header
  .grid.m-0.book-list
    .col.p-0.text-left(style="width: 100%; height: 100%;")
      BookTable
</template>

<script>
import BookTable from '@/components/BookTable.vue';
import Header from '@/components/Header.vue';

export default {
  name: 'App',
  components: {
    BookTable,
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
  height: calc(100% - 200px);
  width: 100%;
  overflow: hidden;
}
.footer {
  text-align: center;
  background: rgba(248, 249, 250, 0.9);
  padding: 2px;
  border-radius: 2px;
  height: 20px;
  line-height: 1.1;
  font-size: 0.9rem;
}
@media only screen and (max-width: 767px) {
  .header {
    display: none;
  }
}
@media only screen and (max-width: 767px) {
  .book-list {
    height: 100%;
  }
}
</style>
