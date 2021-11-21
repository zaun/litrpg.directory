<template lang="pug">
.beta
p-toast
.p-0(style="height: 100%;")
  .banner-image(:style="banner")
  router-view
</template>

<script>
import { computed } from 'vue';

import Banner0 from '@/assets/banner0.jpg';
import Banner1 from '@/assets/banner1.jpg';
import Banner2 from '@/assets/banner2.jpg';
import Banner3 from '@/assets/banner3.jpg';
import Banner4 from '@/assets/banner4.jpg';
import Banner5 from '@/assets/banner5.jpg';
import Banner6 from '@/assets/banner6.jpg';
import Banner7 from '@/assets/banner7.jpg';

export default {
  name: 'App',
  components: {},
  setup() {
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    const banner = computed(() => {
      const banners = [
        Banner0,
        Banner1,
        Banner2,
        Banner3,
        Banner4,
        Banner5,
        Banner6,
        Banner7,
      ];
      return {
        'background-image': `url(${banners[randInt(0, banners.length - 1)]})`,
      };
    });

    return {
      banner,
    };
  },
};
</script>

<style>
html {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: black;
}
#app {
  height: 100%;
  margin: 0;
  padding: 0;
}
* {
  position: relative;
}
.banner-image {
  position: absolute;
  width: 100%;
  height: 600px;
  background-size: cover;
  background-position: center;
}
.banner-image::after {
  content: "";
  display: inline-block;
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(rgba(0, 0, 0, 0.0) 75%, rgba(0, 0, 0, 1.0) 100%);
}
.beta {
  position: absolute;
  background-image: url('~@/assets/beta.png');
  background-size: cover;
  top: 0;
  right: 0;
  width: 75px;
  height: 75px;
  z-index: 99;
}
</style>
