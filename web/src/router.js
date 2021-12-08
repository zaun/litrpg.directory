import { createRouter, createWebHashHistory } from 'vue-router';

import Admin from '@/views/admin/admin.vue';
import AdminLogin from '@/views/admin/login.vue';
import AdminSeriesAdd from '@/views/admin/seriesAdd.vue';
import AdminSeriesReview from '@/views/admin/seriesReview.vue';
import AdminScan from '@/views/admin/scan.vue';
import AdminScanLog from '@/views/admin/scanLog.vue';
import SeriesList from '@/views/seriesList.vue';

export default (app) => {
  const routes = [{
    name: 'home',
    path: '/',
    component: SeriesList,
  }, {
    name: 'admin',
    path: '/admin',
    component: Admin,
    beforeEnter: (to, from, next) => {
      const { store } = app.config.globalProperties;
      if (store.state.authenticated) {
        next();
        return;
      }
      if (to.path !== '/admin/login') {
        next({ path: '/admin/login' });
        return;
      }
      next();
    },
    children: [{
      path: 'login',
      component: AdminLogin,
    }, {
      path: 'series/add',
      component: AdminSeriesAdd,
    }, {
      path: 'series/review',
      component: AdminSeriesReview,
    }, {
      path: 'scan',
      component: AdminScan,
    }, {
      path: 'scan/log',
      component: AdminScanLog,
    }],
  }, {
    path: '/:catchAll(.*)',
    redirect: { name: 'home' },
  }];

  const router = createRouter({
    history: createWebHashHistory(),
    routes,
  });

  app.use(router);
};
