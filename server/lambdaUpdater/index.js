/*
 * This function is called from lambdaSQSHandler once for
 * each record. Each record is a book series to be updated.
 */

const scanAudible = require('./scanAudible');
const scanKindle = require('./scanKindle');
const update = require('./update');
const util = require('./util');
const _ = require('lodash');
const { getBookById } = require('./util');

exports.handler = (event, context, callback) => {
  let series = event;
  if (_.isString(event)) {
    try {
      series = JSON.parse(event);
    } catch (err) {
      console.log(`Error parsing JSON - ${err}`);
      console.log(event);
      return;
    }
  }
  const startTime = new Date().getTime();
  console.log(`Starting ${series.name}`);

  let audibleUrl = series.audibleUrl;
  let kindleUrl = series.kindleUrl;
  if (!audibleUrl) {
    const found = _.find(series.urls, { for: 'Audible' });
    if (found) {
      audibleUrl = found.url;
    }
  }
  if (!kindleUrl) {
    const found = _.find(series.urls, { for: 'Kindle' });
    if (found) {
      kindleUrl = found.url;
    }
  }

  scanAudible(series.name, audibleUrl)
  .then((audibleBooks) => {
    return scanKindle(series.name, kindleUrl)
      .then((kindleBooks) => ({ audibleBooks, kindleBooks }));
  })
  .then((data) => {
    let books = data.audibleBooks;
    let extras = [data.kindleBooks];
    if (data.kindleBooks.length > data.audibleBooks.length) {
      books = data.kindleBooks;
      extras = [data.audibleBooks];
    }

    books.forEach((book) => {
      book.series = {
        id: util.cyrb53(series.name.toLowerCase().trim()),
        name: series.name.trim(),
        urls: series.urls || [],
      };

      if (series.kindleUrl) {
        book.series.urls.push({ for: 'Kindle', url: series.kindleUrl});
      }
      if (series.audibleUrl) {
        book.series.urls.push({ for: 'Audible', url: series.audibleUrl});
      }
      if (series.goodreadsUrl) {
        book.series.urls.push({ for: 'Goodreads', url: series.goodreadsUrl});
      }

      if (book.description && book.description.toUpperCase().indexOf('NO HAREM') !== -1) {
        book.series.harem = 'N';
      } else if (book.description && book.description.toUpperCase().indexOf('HAREM') !== -1) {
        book.series.harem = 'Y';
        book.series.young = 'N';
      }

      extras.forEach((extra) => {
        const eb = _.find(extra, { id: book.id });
        if (eb) {
          book.imageAudioUrl = book.imageAudioUrl || eb.imageAudioUrl || '';
          book.imageBookUrl = book.imageBookUrl || eb.imageBookUrl || '';
          book.urls = _.flatten(_.uniq(_.concat(book.urls, eb.urls)));
          book.ratings = _.flatten(_.uniq(_.concat(book.ratings, eb.ratings)));

          if (eb.description && book.description
              && eb.description.length > book.description.length) {
            book.description = eb.description;
          } else if (eb.description && !book.description) {
            book.description = eb.description;
          }

          if (eb.description && eb.description.toUpperCase().indexOf('NO HAREM') !== -1) {
            book.series.harem = 'N';
          } else if (eb.description && eb.description.toUpperCase().indexOf('HAREM') !== -1) {
            book.series.harem = 'Y';
            book.series.young = 'N';
          }

          book.authors = book.authors || [];
          book.authors.forEach((ba) => {
            const ea = eb.authors.find((sa) => sa.id == ba.id);
            if (ea) {
              ba.urls = _.flatten(_.uniq(_.concat(ba.urls, ea.urls)));
            }
          });
          eb.authors.forEach((ea) => {
            const ba = book.authors.find((sa) => sa.id == ea.id);
            if (!ba) {
              book.authors.push(ea);
            }
          });

          book.narrators = book.narrators || [];
          book.narrators.forEach((bn) => {
            const en = eb.narrators.find((sn) => sn.id == bn.id);
            if (en) {
              bn.urls = _.flatten(_.uniq(_.concat(bn.urls, en.urls)));
            }
          });
          eb.narrators.forEach((en) => {
            const bn = book.narrators.find((sn) => sn.id == en.id);
            if (!bn) {
              book.narrators.push(en);
            }
          });
        } else {
          console.log(book.title, _.map(extra, e => e.title));
        }
      });
    });

    const waitFor = _.map(books, (b) => update.book(b));
    return Promise.all(waitFor).then(() => books);
  })
  .then((books) => {
    return util.getBooksBySeriesId(books[0].series.id)
    .then((currentBooks) => {
      const deleteMe = [];

      currentBooks.forEach((b) => {
        const found = _.find(books, { id: b.id });
        if (!found) {
          deleteMe.push(b);
        }
      });
      

      return Promise.all(_.map(deleteMe, (b) => {
        return util.delBook(b.id);
      }));
    });
  })
  .then(() => {
    const endTime = new Date().getTime();
    const ms = (endTime - startTime) / 1000;
    console.log(`Finished ${series.name} - ${ms}`);
  })
  .catch(err => {
    const endTime = new Date().getTime();
    const ms = (endTime - startTime) / 1000;
    console.log(`Error ${series.name} - ${ms}`);
    console.log(err);
  });

  return {};
};
