<template lang="pug">
.m-0(style="height: 100%")
  .grid(style="height: 100%; overflow-y: scroll")
    .col
    .col-8
      .grid.mt-4.mx-0.p-0
        .col.m-0.p-0
          p-panel.box.m-1
            template(#header)
              .flex-grow-1.text-center Series
            .text-center.text-6xl {{ seriesCount.toLocaleString() }}
        .col.m-0.p-0
          p-panel.box.m-1
            template(#header)
              .flex-grow-1.text-center Books
            .text-center.text-6xl {{ bookCount.toLocaleString() }}
        .col.m-0.p-0
          p-panel.box.m-1
            template(#header)
              .flex-grow-1.text-center Reviews
            .text-center.text-4xl.mt-2 {{ reviewCount.toLocaleString() }}
      .grid.m-0.p-0
        .col.m-0.p-0
          p-panel.box.m-1
            template(#header)
              .flex-grow-1.text-center Authors
            .text-center.text-6xl {{ authorCount.toLocaleString() }}
        .col.m-0.p-0
          p-panel.box.m-1
            template(#header)
              .flex-grow-1.text-center Narrators
            .text-center.text-6xl {{ narratorCount.toLocaleString() }}
      .grid.m-0.p-0
        .col.m-0.p-0
          p-panel.box.m-1
            template(#header)
              .flex-grow-1.text-center
                i.pi.pi-exclamation-triangle.mr-2
                | Books
            .text-center.text-6xl {{ badBookLinks.length.toLocaleString() }}
        .col.m-0.p-0
          p-panel.box.m-1
            template(#header)
              .flex-grow-1.text-center
                i.pi.pi-exclamation-triangle.mr-2
                | Authors
            .text-center.text-6xl {{ badAuthorLinks.length.toLocaleString() }}
        .col.m-0.p-0
          p-panel.box.m-1
            template(#header)
              .flex-grow-1.text-center
                i.pi.pi-exclamation-triangle.mr-2
                | Narrators
            .text-center.text-6xl {{ badNarratorLinks.length.toLocaleString() }}
      .text-center.mt-2
        p-button(@click="refresh", :disabled="busy") Refresh
    .col
</template>

<script>
import {
  computed,
  inject,
  onMounted,
  ref,
} from 'vue';

import {
  groupBy,
  includes,
  keys,
  reduce,
} from 'lodash';

export default {
  name: 'Scan',
  components: { },
  setup() {
    const store = inject('store');
    const busy = ref(false);

    const refresh = () => {
      busy.value = true;
      store.updateBooks().then(() => {
        busy.value = false;
      });
    };

    const seriesCount = computed(() => store.state.series.length);
    const bookCount = computed(() => store.state.books.length);
    const reviewCount = computed(() => reduce(store.state.books, (current, b) => {
      let sum = current;
      b.ratings.forEach((r) => {
        if (r.reviews > 0) {
          sum += r.reviews;
        }
      });
      return sum;
    }, 0));
    const authorCount = computed(() => reduce(store.state.books, (current, b) => {
      b.authors.forEach((a) => {
        if (!includes(current, a.id)) {
          current.push(a.id);
        }
      });
      return current;
    }, []).length);
    const narratorCount = computed(() => reduce(store.state.books, (current, b) => {
      b.narrators.forEach((a) => {
        if (!includes(current, a.id)) {
          current.push(a.id);
        }
      });
      return current;
    }, []).length);
    const badBookLinks = computed(() => reduce(store.state.books, (current, b) => {
      const urlsFrom = groupBy(b.urls, 'for');
      keys(urlsFrom).forEach((k) => {
        if (urlsFrom[k].length > 1) {
          if (!includes(current, { id: b.id })) {
            current.push(b);
          }
        }
      });
      b.urls.forEach((u) => {
        if (!u.url) {
          if (!includes(current, { id: b.id })) {
            current.push(b);
          }
        }
      });
      if (b.urls.length === 0) {
        if (!includes(current, { id: b.id })) {
          current.push(b);
        }
      }
      return current;
    }, []));
    const badAuthorLinks = computed(() => reduce(store.state.books, (current, b) => {
      b.authors.forEach((a) => {
        const urlsFrom = groupBy(a.urls, 'for');
        keys(urlsFrom).forEach((k) => {
          if (urlsFrom[k].length > 1) {
            if (!includes(current, { id: b.id })) {
              current.push(b);
            }
          }
        });
        a.urls.forEach((u) => {
          if (!u.url) {
            if (!includes(current, { id: b.id })) {
              current.push(b);
            }
          }
        });
        if (a.urls.length === 0) {
          if (!includes(current, { id: b.id })) {
            current.push(b);
          }
        }
      });
      return current;
    }, []));
    const badNarratorLinks = computed(() => reduce(store.state.books, (current, b) => {
      b.narrators.forEach((n) => {
        const urlsFrom = groupBy(n.urls, 'for');
        keys(urlsFrom).forEach((k) => {
          if (urlsFrom[k].length > 1) {
            if (!includes(current, { id: b.id })) {
              current.push(b);
            }
          }
        });
        n.urls.forEach((u) => {
          if (!u.url) {
            if (!includes(current, { id: b.id })) {
              current.push(b);
            }
          }
        });
        if (n.urls.length === 0) {
          if (!includes(current, { id: b.id })) {
            current.push(b);
          }
        }
      });
      return current;
    }, []));

    onMounted(() => refresh());

    return {
      busy,
      authorCount,
      badBookLinks,
      badAuthorLinks,
      badNarratorLinks,
      bookCount,
      narratorCount,
      reviewCount,
      seriesCount,
      refresh,
    };
  },
};
</script>

<style>
.p-panel.box .p-panel-content {
  height: 100px;
}
</style>
