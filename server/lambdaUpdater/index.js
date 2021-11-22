/*
 * This function is called from lambdaSQSHandler once for
 * each record. Each record is a book series to be updated.
 */

const scanAudible = require('./scanAudible');
const scanGoodreads = require('./scanGoodreads');
const scanKindle = require('./scanKindle');
const update = require('./update');
const util = require('./util');
const _ = require('lodash');
const { getBookById } = require('./util');
const { forEach } = require('lodash');

exports.handler = (event, context, callback) => {
  let lookup = event;
  if (_.isString(event)) {
    try {
      lookup = JSON.parse(event);
    } catch (err) {
      console.log(`Error parsing JSON - ${err}`);
      console.log(event);
      return;
    }
  }
  const startTime = new Date().getTime();
  console.log(`Starting ${lookup.name}`);

  // create the series object that will
  // be attached to each book.
  const series = {
    id: util.cyrb53(lookup.name.toLowerCase().trim()),
    name: lookup.name,
    urls: lookup.urls || [],
  };

  // Update the series URLs is event was new urls or
  // get the lookp urls is the even was a series
  if (lookup.audibleUrl) {
    const found = _.find(series.urls, { for: 'Audible' });
    if (found) {
      found = lookup.audibleUrl;
    } else {
      series.urls.push({ for: 'Audible', url: lookup.audibleUrl });
    }
  } else {
    const found = _.find(series.urls, { for: 'Audible' });
    if (found) {
      lookup.audibleUrl = found.url;
    }
  }

  if (lookup.kindleUrl) {
    const found = _.find(series.urls, { for: 'Kindle' });
    if (found) {
      found = lookup.kindleUrl;
    } else {
      series.urls.push({ for: 'Kindle', url: lookup.kindleUrl });
    }
  } else {
    const found = _.find(series.urls, { for: 'Kindle' });
    if (found) {
      lookup.kindleUrl = found.url;
    }
  }

  if (lookup.goodreadsUrl) {
    const found = _.find(series.urls, { for: 'Goodreads' });
    if (found) {
      found = lookup.goodreadsUrl;
    } else {
      series.urls.push({ for: 'Goodreads', url: lookup.goodreadsUrl });
    }
  } else {
    const found = _.find(series.urls, { for: 'Goodreads' });
    if (found) {
      lookup.goodreadsUrl = found.url;
    }
  }

  // Lookup book information from the external sites
  scanAudible(series.name, lookup.audibleUrl)
  .then((audibleBooks) => ({
    audibleBooks,
    kindleBooks: [], // await scanKindle(series.name, lookup.kindleUrl),
  }))
  .then(async ({audibleBooks, kindleBooks}) => ({
    audibleBooks,
    kindleBooks,
    goodreadBooks: await scanGoodreads(series.name, lookup.goodreadsUrl),
  }))
  .then((data) => {
    const books = [];
    const collections = [
      data.audibleBooks,
      data.kindleBooks,
      data.goodreadBooks
    ];

    forEach(collections, (collection) => {
      forEach(collection, (newBook) => {
        // lookup the book from the final list
        let masterBook = _.find(books, { id: newBook.id });

        // not found in the final list, add it
        if (!masterBook) {
          newBook.series = series;
          books.push(newBook);
          masterBook = newBook;
          return;
        }

        // found, update the master list with additional info

        // merge urls, ratings and images
        masterBook.urls = _.flatten(_.uniq(_.concat(masterBook.urls, newBook.urls)));
        masterBook.ratings = _.flatten(_.uniq(_.concat(masterBook.ratings, newBook.ratings)));
        masterBook.imageAudioUrl = masterBook.imageAudioUrl || newBook.imageAudioUrl || '';
        masterBook.imageBookUrl = masterBook.imageBookUrl || newBook.imageBookUrl || '';

        // Check if the books description says its harem or not
        if (newBook.description && newBook.description.toUpperCase().indexOf('NO HAREM') !== -1) {
          masterBook.series.harem = 'N';
        } else if (newBook.description && newBook.description.toUpperCase().indexOf('HAREM') !== -1) {
          masterBook.series.harem = 'Y';
          masterBook.series.young = 'N';
        }

        // Keep the longer description
        if (newBook.description && masterBook.description
          && newBook.description.length > masterBook.description.length) {
          masterBook.description = newBook.description;
        } else if (newBook.description && !masterBook.description) {
          masterBook.description = newBook.description;
        }

        // Update author list
        masterBook.authors = masterBook.authors || [];
        forEach(masterBook.authors, (ba) => {
          const ea = newBook.authors.find((sa) => sa.id == ba.id);
          if (ea) {
            ba.urls = _.flatten(_.uniq(_.concat(ba.urls, ea.urls)));
          }
        });
        forEach(newBook.authors, (ea) => {
          const ba = masterBook.authors.find((sa) => sa.id == ea.id);
          if (!ba) {
            masterBook.authors.push(ea);
          }
        });

        // Update narrator list
        masterBook.narrators = masterBook.narrators || [];
        forEach(masterBook.narrators, (ba) => {
          const ea = newBook.narrators.find((sa) => sa.id == ba.id);
          if (ea) {
            ba.urls = _.flatten(_.uniq(_.concat(ba.urls, ea.urls)));
          }
        });
        forEach(newBook.narrators, (ea) => {
          const ba = masterBook.narrators.find((sa) => sa.id == ea.id);
          if (!ba) {
            masterBook.narrators.push(ea);
          }
        });
        
      });
    });

    const waitFor = _.map(books, (b) => update.book(b));
    return Promise.all(waitFor).then(() => books);
  })
  .then((books) => {
    return util.getBooksBySeriesId(series.id)
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