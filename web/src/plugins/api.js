const api = (axios, baseApi) => ({
  debug: false,
  baseApi,
  token: '',

  setToken(token) {
    this.token = token;
  },

  getBooks() {
    return axios.get(`${this.baseApi}/books`).then((response) => response.data);
  },

  getRequests() {
    const options = { headers: { Authorization: `Bearer ${this.token}` } };
    return axios.get(`${this.baseApi}/requests`, options).then((response) => response.data);
  },

  getLogs(key) {
    const options = { headers: { Authorization: `Bearer ${this.token}` } };
    let url = `${this.baseApi}/log`;
    if (key) {
      url += `?next=${key}`;
    }
    return axios.get(url, options).then((response) => response.data);
  },

  postRequest(seriesId, field, oldValue, newValue) {
    const data = {
      seriesId,
      field,
      oldValue: oldValue || '',
      newValue: newValue || '',
    };
    return axios.post(`${this.baseApi}/requests`, data);
  },

  postSeries(name, kindleUrl, audibleUrl, goodreadsUrl) {
    const options = { headers: { Authorization: `Bearer ${this.token}` } };
    const data = {
      name,
      kindleUrl,
      audibleUrl,
      goodreadsUrl,
    };
    return axios.post(`${this.baseApi}/series`, data, options);
  },

  postRequestSeries(seriesName, urls) {
    const data = {
      seriesName,
      urls: urls || [],
    };
    return axios.post(`${this.baseApi}/requests`, data);
  },

  acceptRequest(seriesId, data) {
    const options = { headers: { Authorization: `Bearer ${this.token}` } };
    return axios.put(`${this.baseApi}/series/${seriesId}`, data, options);
  },

  removeRequest(seriesId, timestamp) {
    const options = { headers: { Authorization: `Bearer ${this.token}` } };
    return axios.delete(`${this.baseApi}/requests/${seriesId}:${timestamp}`, options);
  },

  startScan() {
    const options = { headers: { Authorization: `Bearer ${this.token}` } };
    return axios.post(`${this.baseApi}/scan`, null, options);
  },

  authenticate(data) {
    return axios.post(`${this.baseApi}/auth`, data)
      .then((request) => ({ code: 'Authenticated', data: request.data }))
      .catch((err) => ({ code: err.response.data.code }));
  },
});

export default (app) => {
  const config = app.config.globalProperties;
  config.api = api(config.axios, config.$BASE_API);
  app.provide('api', config.api);
};
