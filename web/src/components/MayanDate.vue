<template lang="pug">
.date
  .date-section
    div
      img.glpyh(:src="glyphs[`num${longCount[0]}`]")
      img.glpyh(src="@/assets/mesoamerican/long0.png")
      //- img.glpyh(:src="glyphs.long0")
    .date-title {{ longCount[0] }} baktun
  .date-section
    div
      img.glpyh(:src="glyphs[`num${longCount[1]}`]")
      img.glpyh(src="@/assets/mesoamerican/long1.png")
    .date-title {{ longCount[1] }} katun
  .date-section
    div
      img.glpyh(:src="glyphs[`num${longCount[2]}`]")
      img.glpyh(src="@/assets/mesoamerican/long2.png")
    .date-title {{ longCount[2] }} tun
  .date-section
    div
      img.glpyh(:src="glyphs[`num${longCount[3]}`]")
      img.glpyh(src="@/assets/mesoamerican/long3.png")
    .date-title {{ longCount[3] }} uinal
  .date-section
    div
      img.glpyh(:src="glyphs[`num${longCount[4]}`]")
      img.glpyh(src="@/assets/mesoamerican/long4.png")
    .date-title {{ longCount[4] }} k'in
</template>

<script>
import { computed } from 'vue';
import num0 from '@/assets/mesoamerican/0.png';
import num1 from '@/assets/mesoamerican/1.png';
import num2 from '@/assets/mesoamerican/2.png';
import num3 from '@/assets/mesoamerican/3.png';
import num4 from '@/assets/mesoamerican/4.png';
import num5 from '@/assets/mesoamerican/5.png';
import num6 from '@/assets/mesoamerican/6.png';
import num7 from '@/assets/mesoamerican/7.png';
import num8 from '@/assets/mesoamerican/8.png';
import num9 from '@/assets/mesoamerican/9.png';
import num10 from '@/assets/mesoamerican/10.png';
import num11 from '@/assets/mesoamerican/11.png';
import num12 from '@/assets/mesoamerican/12.png';
import num13 from '@/assets/mesoamerican/13.png';
import num14 from '@/assets/mesoamerican/14.png';
import num15 from '@/assets/mesoamerican/15.png';
import num16 from '@/assets/mesoamerican/16.png';
import num17 from '@/assets/mesoamerican/17.png';
import num18 from '@/assets/mesoamerican/18.png';
import num19 from '@/assets/mesoamerican/19.png';
import num20 from '@/assets/mesoamerican/20.png';
// import long0 from '@/assets/mesoamerican/long0.svg';

export default {
  name: 'MayanDate',
  setup() {
    const globalJDC = 584282.5;
    const glyphs = {
      // long0,
      num0,
      num1,
      num2,
      num3,
      num4,
      num5,
      num6,
      num7,
      num8,
      num9,
      num10,
      num11,
      num12,
      num13,
      num14,
      num15,
      num16,
      num17,
      num18,
      num19,
      num20,
    };

    const DateToJulianDayNumber = (date) => {
      // https://stackoverflow.com/questions/11759992/calculating-jdayjulian-day-in-javascript
      date.setHours(0, 0, 0, 0);
      const time = date.getTime();
      return (time / 86400000) + 2440587.5;
    };

    const JulianDayNumberToLongCount = (jdn) => {
      const longCountArray = new Array(5);
      let longCount = Math.round(jdn - globalJDC);
      // JDN is days after 4713 BC, so we add 584282days or 1599.67 yrs

      longCountArray[0] = Math.floor(longCount / 144000);
      longCount %= 144000;
      longCountArray[1] = Math.floor(longCount / 7200);
      longCount %= 7200;
      longCountArray[2] = Math.floor(longCount / 360);
      longCount %= 360;
      longCountArray[3] = Math.floor(longCount / 20);
      longCountArray[4] = Math.floor(longCount % 20);

      return longCountArray;
    };

    const getLongCount = () => {
      const today = new Date();
      const jdn = DateToJulianDayNumber(today);
      const lc = JulianDayNumberToLongCount(jdn);

      return lc;
    };

    const getLordOfTheNight = () => {
      const lc = getLongCount();
      return ((20 * lc[3] + lc[4] + 8) % 9) + 1;
    };

    const longCount = computed(getLongCount);
    const night = computed(getLordOfTheNight);

    return {
      longCount,
      glyphs,
      night,
    };
  },
};
</script>

<style scoped>
.date {
  display: block;
}
.date-section {
  display: inline-block;
}
.date-title {
  text-align: center;
  color: black;
  font-size: 1rem;
}
.glpyh {
  height: 55px;
  margin: 0;
  padding: 0;
}
@media only screen and (max-width: 1200px) {
  .glpyh {
    height: 45px;
  }
  .date-title {
    font-size: 0.8rem;
  }
}
@media only screen and (max-width: 1090px) {
  .glpyh {
    height: 35px;
  }
  .date-title {
    font-size: 0.7rem;
  }
}
@media only screen and (max-width: 1020px) {
  .glpyh {
    height: 29px;
  }
  .date-title {
    font-size: 0.6rem;
  }
}
@media only screen and (max-width: 985px) {
  .glpyh {
    display: none;
  }
  .date-title {
    display: none;
  }
}
</style>
