import axios from './axios';
import primevue from './primevue';
import store from './store';

export default (app) => {
  axios(app);
  primevue(app);
  store(app);
};
