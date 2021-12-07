<template lang="pug">
NewSeriesDialog(
  v-if="showAddNew",
  @close="showAddNew = false"
)

p-card.footer
  template(#content)
    .grid.m-0.p-0
      .col-6.m-0.p-0
        p-button.p-button-text.p-button-sm.btn(@click="addSeries") Add Missing Series
      .col-6.m-0.p-0.text-right
        p-button.p-button-text.p-button-sm.btn(@click="showResouces") More Resources
        p-overlaypanel(ref="resourceMenu" :dismissable="true")
          p-menu.footer(:model="resources")
</template>

<script>
import {
  inject,
  ref,
} from 'vue';

import NewSeriesDialog from '@/components/NewSeriesDialog.vue';

export default {
  name: 'Footer',
  components: {
    NewSeriesDialog,
  },
  setup() {
    const track = inject('track');
    const showAddNew = ref(false);
    const resourceMenu = ref(null);

    const openWindow = (url) => {
      resourceMenu.value.hide();
      window.open(url, '_blank');
      track('openWindow', { type: 'resource', url });
    };

    const resources = [{
      label: 'GameLit Society',
      icon: 'pi pi-facebook',
      command: () => openWindow('https://www.facebook.com/groups/LitRPGsociety'),
    }, {
      label: 'LitRPG',
      icon: 'pi pi-facebook',
      command: () => openWindow('https://www.facebook.com/groups/LitRPGGroup'),
    }, {
      label: 'LitRPG Adventures',
      icon: 'pi pi-facebook',
      command: () => openWindow('https://www.facebook.com/groups/LitRPGAdventures'),
    }, {
      label: 'LitRPG Books',
      icon: 'pi pi-facebook',
      command: () => openWindow('https://www.facebook.com/groups/LitRPG.books'),
    }, {
      label: 'LitRPG Forum',
      icon: 'pi pi-facebook',
      command: () => openWindow('https://www.facebook.com/groups/litrpgforum'),
    }, {
      label: '/r/GameLit',
      icon: 'pi pi-reddit',
      command: () => openWindow('https://reddit.com/r/gamelit'),
    }, {
      label: '/r/litrpg',
      icon: 'pi pi-reddit',
      command: () => openWindow('https://reddit.com/r/litrpg'),
    }, {
      label: '/r/ProgressionFantasy',
      icon: 'pi pi-reddit',
      command: () => openWindow('https://reddit.com/r/progressionfantasy'),
    }, {
      label: 'Litrpg',
      icon: 'pi pi-globe',
      command: () => openWindow('https://www.goodreads.com/genres/litrpg'),
    }];

    const addSeries = () => {
      showAddNew.value = true;
    };

    const showResouces = (event) => {
      resourceMenu.value.toggle(event);
    };

    return {
      resourceMenu,
      resources,
      addSeries,
      showAddNew,
      showResouces,
    };
  },
};
</script>

<style>
.footer.p-card {
  margin: 0 0 !important;
  height: 100%;
  padding: 1px;
}
.footer {
  background-color: rgba(255, 255, 255, 0.7);
  height: calc(100% - 10px);
}
.footer .p-card-content {
  padding: 0 0 !important;
  height: 100%;
}
.footer .p-card-body {
  padding: 0 0 !important;
  height: 100%;
}
.footer .btn {
  width: 155px;
  justify-content: center;
}
.footer.p-menu {
  width: 14rem !important;
}
</style>
