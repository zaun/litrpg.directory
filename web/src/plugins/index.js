import api from './api';
import axios from './axios';
import gtag from './gtag';
import primevue from './primevue';
import store from './store';

export default (app) => {
  axios(app);
  api(app);
  gtag(app);
  store(app);
  primevue(app);
};
