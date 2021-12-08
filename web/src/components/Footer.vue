<template lang="pug">
NewSeriesDialog(
  v-if="showAddNew",
  @close="showAddNew = false"
)

p-card.footer
  template(#content)
    .grid.m-0.p-0
      .col.m-0.p-0.text-left
        p-button.p-button-text.p-button-sm.btn(@click="addSeries") Add Missing Series
      .col.m-0.p-0.text-center.quote.hide-sm(:style="{ 'line-height': quote.t2 ? '16px' : '32px' }")
        div {{ quote.t || quote.t1 }}
        div {{ quote.t2 || '' }}
      .col.m-0.p-0.text-right.hide-sm
        p-button.p-button-text.p-button-sm.btn(@click="showResouces") More Resources
        p-overlaypanel(ref="resourceMenu" :dismissable="true")
          p-menu.footer(:model="resources")
</template>

<script>
import {
  inject,
  onBeforeMount,
  onBeforeUnmount,
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

    const quote = ref('');
    const quotes = [{
      t: 'RPG + Books = LitRPG',
    }, {
      t: 'Let\'s enchant some shit!',
    }, {
      t: 'Gnomes Rule!',
    }, {
      t: 'This is not tasty',
    }, {
      t: 'Fecking Pumas',
    }, {
      t: 'Fecking Pumas',
    }, {
      t: 'Does no one read the sign?!',
    }, {
      t1: 'I think we should all go',
      t2: 'full murderhobo in this place!',
    }, {
      t1: 'A man\'s true height only be jugded',
      t2: 'lying down, yer lordship',
    }, {
      t1: 'Well depending on your perspective...',
      t2: 'this is the easy part.',
    }];

    const addSeries = () => {
      showAddNew.value = true;
    };

    const showResouces = (event) => {
      resourceMenu.value.toggle(event);
    };

    const updateQuote = () => {
      const index = Math.floor(Math.random() * quotes.length);
      quote.value = quotes[index];
    };
    updateQuote();

    let quoteTimer = null;
    onBeforeMount(() => {
      quoteTimer = setInterval(updateQuote, 1000 * 90);
    });

    onBeforeUnmount(() => {
      clearInterval(quoteTimer);
    });

    return {
      resourceMenu,
      resources,
      addSeries,
      showAddNew,
      showResouces,
      quote,
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
.footer .quote {
  font-size: 0.8rem;
  flex: 0 0 300px;
  font-style: italic;
}

@media only screen and (max-width: 639px) {
  .footer .quote {
    display: none;
  }
}
</style>
