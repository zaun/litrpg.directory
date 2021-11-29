import api from './api';
import axios from './axios';
import primevue from './primevue';
import store from './store';

export default (app) => {
  axios(app);
  api(app);
  store(app);
  primevue(app);
};
