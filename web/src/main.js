import { createApp } from 'vue';
import plugins from './plugins';
import router from './router';
import App from './App.vue';

const app = createApp(App);

app.config.globalProperties.$API = process.env.VUE_APP_API;
app.provide('PRIMEVUE_VERSION', process.env.VUE_APP_PRIMEVUE_VERSION);
app.provide('VUE_VERSION', process.env.VUE_APP_VUE_VERSION);

router(app);
plugins(app);

app.mount('#app');
