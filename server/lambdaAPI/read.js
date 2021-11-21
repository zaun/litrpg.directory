const util = require('./util');
const _ = require('lodash');

module.exports = exports = {
  book(bookId) {
    return getBookPeopleById(`${bookId}`).then((peopleToGet) => {
      return _.groupBy(peopleToGet, 'type');
    })
    .then((lookups) => {
      lookups.authors = [];
      const waitFor = _.map(lookups.A || [], (a) => {
        return util.getPersonById(a.personId).then((p) => {
          if (p !== null) {
            lookups.authors.push(p);
          }
        })
      });
      
      return Promise.all(waitFor).then(() => {
        if (lookups.A) {
          delete lookups.A;
        }
        return lookups;
      });
    })
    .then((lookups) => {
      lookups.narrators = [];
      const waitFor = _.map(lookups.N || [], (a) => {
        return util.getPersonById(a.personId).then((p) => {
          if (p !== null) {
            lookups.narrators.push(p);
          }
        })
      });
      
      return Promise.all(waitFor).then(() => {
        if (lookups.N) {
          delete lookups.N;
        }
        return lookups;
      });
    })
    .then((lookups) => {
      return util.getBookById(bookId).then((result) => {
        if (!result) {
          throw Error('BOOK_NOT_FOUND');
        }

        result.authors = lookups.authors;
        result.narrators = lookups.narrators;
        return result
      });
    })
    .then((book) => {
      return getSeriesById(book.seriesId).then((series) => {
        delete book.seriesId;
        book.series = series;
        return book;
      });
    });
  },

  bookList() {
    return util.getAll('Books')
    .then((items) => {
      if (items.length === 0) {
        return items;
      }
      const seriesIds = _.uniq(_.map(items, (i) => `${i.seriesId}`));
      return util.getBatchSeriesById(seriesIds).then((series) => {
        _.forEach(items, (i) => {
          i.series = _.find(series, { id: i.seriesId})
        });
        return items;
      });
    })
    .then((items) => {
      const lookups = _.map(items, (i) => {
        return util.getBookPeopleById(`${i.id}`).then((peopleToGet) => {
          const grouped = _.groupBy(peopleToGet, 'type');
          i.authorLookups = grouped.A;
          i.narratorLookups = grouped.N;
        });
      });
      
      return Promise.all(lookups).then(() => items);
    })
    .then((items) => {
      const lookups = _.flatten(_.map(items, (i) => {
        i.authors = [];
        return _.map(i.authorLookups, (a) => {
          return util.getPersonById(a.personId).then((p) => {
            if (p !== null) {
              i.authors.push(p);
            }
          })
        })
      }));
      
      return Promise.all(lookups).then(() => {
        _.forEach(items, (i) => {
          delete i.authorLookups;
        });
        return items;
      });
    })
    .then((items) => {
      const lookups = _.flatten(_.map(items, (i) => {
        i.narrators = [];
        return _.map(i.narratorLookups, (a) => {
          return util.getPersonById(a.personId).then((p) => {
            if (p !== null) {
              i.narrators.push(p);
            }
          })
        })
      }));
      
      return Promise.all(lookups).then(() => {
        _.forEach(items, (i) => {
          delete i.narratorLookups;
        });
        return items;
      });
    });
  },
};
