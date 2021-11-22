import { createRouter, createWebHashHistory } from 'vue-router';

import SeriesList from '@/views/SeriesList.vue';
import Admin from '@/views/Admin.vue';
import AdminLogin from '@/views/AdminLogin.vue';

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
      next({ path: '/admin/login' });
    },
  }, {
    name: 'login',
    path: '/admin/login',
    component: AdminLogin,
    beforeEnter: (to, from, next) => {
      const { store } = app.config.globalProperties;
      if (!store.state.authenticated) {
        next();
        return;
      }
      next({ path: '/admin' });
    },
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
