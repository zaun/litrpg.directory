import { reactive } from 'vue';
import _, {
  cloneDeep,
  flatten,
  groupBy,
  keys,
  map,
  uniqBy,
  reduce,
  remove,
  sortBy,
} from 'lodash';

const store = (axios, api) => ({
  debug: false,
  api,

  state: reactive({
    loading: false,
    books: [],
    series: [],
    searchSeries: '',
    searchTitle: '',
    searchPerson: '',
    searchSettings: [],
    searchPlots: [],
    searchEras: [],
    searchYoung: '',
    searchHarem: '',
    searchCompleted: '',

    requests: [],

    authenticated: false,
    token: '',
    groups: [],

    plotOptions: [
      { name: 'Unknown', code: '' },
      { name: 'Adventure', code: 'A' },
      { name: 'Builder', code: 'B' },
      { name: 'Climber', code: 'C' },
      { name: 'Dungeon Core', code: 'D' },
      { name: 'Survival', code: 'S' },
    ],
    settingOptions: [
      { name: 'Unknown', code: '' },
      { name: 'Alternate Reality', code: 'AR' },
      { name: 'Game / Living', code: 'GL' },
      { name: 'Game / Playing', code: 'GP' },
      { name: 'Other World', code: 'OW' },
      { name: 'Post Apocalypse', code: 'PA' },
      { name: 'Post Life', code: 'PL' },
      { name: 'Redo', code: 'R' },
      { name: 'Transported', code: 'T' },
    ],
    eraOptions: [
      { name: 'Unknown', code: '' },
      { name: 'Fantasy', code: 'F' },
      { name: 'Fantasy & Techno', code: 'FT' },
      { name: 'Techno', code: 'T' },
    ],
    ynOptions: [
      { name: 'Unknown', code: '' },
      { name: 'Yes', code: 'Y' },
      { name: 'No', code: 'N' },
    ],

    plotTips: [
      { name: 'Adventure', desc: 'The MC is living life out in the world but can die and come back.' },
      { name: 'Builder', desc: 'The MC is primarily build a town, city, world, etc. the adventure is about building.' },
      { name: 'Climber', desc: 'The MC is living live but must travel thought a tower floors or set of realms to progress.' },
      { name: 'Dungeon Core', desc: 'The MC is the dungeon.' },
      { name: 'Survival', desc: 'The MC is living life out in the world but can not die and come back.' },
    ],
    settingTips: [
      { name: 'Alternate Reality', desc: 'The MC wakes up from a simulation into reality.' },
      { name: 'Game / Living', desc: 'The MC is in a game and living their life there, no back and forth to reality.' },
      { name: 'Game / Playing', desc: 'The MC is in a game and playing it, has back and forth to reality.' },
      { name: 'Other World', desc: 'The MC is from another world or reality.' },
      { name: 'Post Apocalypse', desc: 'The MC’s world is changed quickly and drastically in an apocalyptic event.' },
      { name: 'Post Life', desc: 'The MC dies in his original world and is wakes up in a new world.' },
      { name: 'Redo', desc: 'The MC is sent back in time to relive a life.' },
      { name: 'Transported', desc: 'The MC was taken from their home to a new place.' },
    ],
    eraTips: [
      { name: 'Fantasy', desc: 'The MC is in a primitive setting. Magic is not technological based system.' },
      { name: 'Fantasy & Techno', desc: 'The MC is in a primitive and/or an advanced setting. Magic may be technological based system.' },
      { name: 'Techno', desc: 'The MC is in an advanced setting. Magic is a technological based system.' },
    ],
  }),

  makeSeriesList() {
    const grouped = groupBy(this.state.books, 'series.name');
    const series = keys(grouped);
    return sortBy(
      map(series, (s) => {
        const books = sortBy(grouped[s], 'bookNumber');
        const reviews = reduce(books, (sum, i) => {
          let bookReviews = 0;

          i.ratings.forEach((r) => {
            if (r.reviews !== -1) {
              bookReviews += r.reviews;
            }
          });

          return sum + bookReviews;
        }, 0);
        const rating = reduce(books, (sum, i) => {
          let bookRating = 0;

          i.ratings.forEach((r) => {
            if (r.reviews !== -1) {
              bookRating += r.stars * r.reviews;
            }
          });

          return sum + bookRating;
        }, 0) / reviews;

        let title = s;
        if (_.startsWith(title, 'The ')) {
          title = `${s.slice(4)}, The`;
        }

        return {
          title,
          authors: sortBy(uniqBy(flatten(map(books, (b) => b.authors)), 'name'), 'name'),
          narrators: sortBy(uniqBy(flatten(map(books, (b) => b.narrators)), 'name'), 'name'),
          setting: books[0].series.setting,
          plot: books[0].series.plot,
          era: books[0].series.era,
          harem: books[0].series.harem,
          young: books[0].series.young,
          id: books[0].series.id,
          completed: books[0].series.completed,
          urls: books[0].series.urls,
          lastUpdate: books[0].series.lastUpdate,
          books: sortBy(map(books, (book) => {
            const b = book;
            delete b.series;
            let bookRating = 0;
            let bookReviews = 0;

            b.ratings.forEach((r) => {
              if (r.reviews !== -1) {
                bookReviews += r.reviews;
                bookRating += r.stars * r.reviews;
              }
            });

            if (bookReviews > 0) {
              b.stars = Math.round((bookRating / bookReviews).toFixed(1));
              b.rating = (bookRating / bookReviews).toFixed(1);
              b.reviews = bookReviews;
            } else {
              b.stars = 0;
              b.rating = 0;
              b.reviews = 0;
            }
            return b;
          }), 'seriesNumber'),
          reviews,
          rating: reviews === 0 ? 0 : rating.toFixed(1),
          stars: reviews === 0 ? 0 : Math.round(rating.toFixed(1)),
          publishedCount: books.length,
        };
      }),
      'title',
    );
  },

  updateBooks() {
    return axios.get(`${this.api}/books`)
      .then((response) => {
        this.state.books = response.data;
        this.state.series = this.makeSeriesList();
        this.state.loading = true;
      }).then(() => false).catch(() => true);
  },

  sendRequest(seriesId, field, oldValue, newValue) {
    const data = {
      seriesId,
      field,
      oldValue: oldValue || '',
      newValue,
    };
    return axios.post(`${this.api}/requests`, data);
  },

  updateRequests() {
    const options = { headers: { Authorization: `Bearer ${this.state.token}` } };
    return axios.get(`${this.api}/requests`, options)
      .then((response) => {
        this.state.requests = response.data;
        console.log(this.state.requests);
      }).then(() => false).catch(() => true);
  },

  setSearch(val) {
    if (!val) {
      return;
    }
    this.state.searchSeries = val.series;
    this.state.searchTitle = val.title;
    this.state.searchPerson = val.person;
    this.state.searchSettings = val.setting;
    this.state.searchPlots = val.plot;
    this.state.searchEras = val.era;
    this.state.searchYoung = val.young;
    this.state.searchHarem = val.harem;
    this.state.searchCompleted = val.completed;
  },

  addSeries(name, kindleUrl, audibleUrl, goodreadsUrl) {
    const options = { headers: { Authorization: `Bearer ${this.state.token}` } };
    const data = {
      name,
      kindleUrl,
      audibleUrl,
      goodreadsUrl,
    };
    return axios.post(`${this.api}/series`, data, options);
  },

  acceptRequest(data) {
    const options = { headers: { Authorization: `Bearer ${this.state.token}` } };
    const request = cloneDeep(data);
    const seriesId = data.series.id;
    delete request.series;
    return axios.put(`${this.api}/series/${seriesId}`, request, options)
      .then(() => {
        remove(this.state.requests, data);
      });
  },

  removeRequest(data) {
    const options = { headers: { Authorization: `Bearer ${this.state.token}` } };
    return axios.delete(`${this.api}/requests/${data.series.id}:${data.timestamp}`, null, options)
      .then(() => {
        remove(this.state.requests, data);
      });
  },

  startScan() {
    const options = { headers: { Authorization: `Bearer ${this.state.token}` } };
    return axios.post(`${this.api}/scan`, null, options);
  },

  authenticate(data) {
    return axios.post(`${this.api}/auth`, data)
      .then((request) => {
        this.state.authenticated = true;
        this.state.token = request.data.token;
        this.state.groups = request.data.groups;
        console.log(request.data);
        return 'Authenticated';
      })
      .catch((err) => {
        this.state.authenticated = false;
        this.state.token = '';
        this.state.groups = [];
        return err.response.data.code;
      });
  },
});

export default (app) => {
  const config = app.config.globalProperties;
  config.store = store(config.axios, config.$API);
  app.provide('store', config.store);
};
