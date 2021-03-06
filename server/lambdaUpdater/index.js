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
const { forEach } = require('lodash');

exports.handler = async (event) => {
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
  return scanAudible(series.name, lookup.audibleUrl)
  .then(async (audibleBooks) => ({
    audibleBooks,
    kindleBooks: [], // await scanKindle(series.name, lookup.kindleUrl),
  }))
  .then(async ({audibleBooks, kindleBooks}) => ({
    audibleBooks,
    kindleBooks,
    goodreadBooks: await scanGoodreads(series.name, lookup.goodreadsUrl),
  }))
  .then((data) => {
    const collections = [
      data.audibleBooks,
      data.kindleBooks,
      data.goodreadBooks
    ];

    return util.log('scan', `Found Audible: ${data.audibleBooks.length}, Kindle: ${data.kindleBooks.length}, Goodreads: ${data.goodreadBooks.length} books for ${lookup.name}`)
      .then(() => collections);
  })
  .then((collections) => {
    const books = [];
    forEach(collections, (collection) => {
      forEach(collection, (newBook) => {
        // Don't merge these book from non-audible sources
        if (
          (series.name === 'Ascend Online' && newBook.urls[0].url.indexOf('audible') === -1)
          || (series.name === 'Wandering Inn' && newBook.urls[0].url.indexOf('audible') === -1)
        ) {
          return;
        }

        // lookup the book from the final list
        let masterBook = null;

        // Check to verify there aren't multipule books with the
        // same number in a collection
        const collestionWithNumber = _.filter(collection, { bookNumber: newBook.bookNumber });
        if (collestionWithNumber.length === 1) {
          // Find the book in the master list if it exists
          const foundBooks = _.filter(books, { bookNumber: newBook.bookNumber });
          if (foundBooks.length === 1) {
            masterBook = foundBooks[0];
            // console.log('F - ', newBook.bookNumber, newBook.title, masterBook ? masterBook.bookNumber : '--', masterBook ? masterBook.title : '--', collestionWithNumber.length);
          } else if (foundBooks.length > 1) {
            masterBook = _.find(foundBooks, { title: newBook.title });
            // console.log('FT - ', newBook.bookNumber, newBook.title, masterBook ? masterBook.bookNumber : '--', masterBook ? masterBook.title : '--', collestionWithNumber.length);
          }
        }

        // more than one book with the number, try
        // finding by title
        else {
          const foundBooks = _.filter(books, { title: newBook.title });
          if (foundBooks.length === 1) {
            masterBook = foundBooks[0];
            // console.log('T - ', newBook.bookNumber, newBook.title, masterBook ? masterBook.bookNumber : '--', masterBook ? masterBook.title : '--', collestionWithNumber.length);
          }
        }

        // not found in the final list, add it
        if (!masterBook) {
          // console.log('A - ', newBook.title, newBook.bookNumber);
          newBook.series = series;
          books.push(newBook);
          masterBook = newBook;
          return;
        }

        // Keep the largest tite or unique
        const foundTitles = _.filter(books, { title: newBook.title });
        if (masterBook.title.length < newBook.title.length && foundTitles.length === 0) {
          masterBook.title = newBook.title;
          masterBook.id = newBook.id;
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
        } else if (newBook.description && newBook.description.toUpperCase().indexOf('NOT INCLUDE HAREM') !== -1) {
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
    console.log(`Finished ${lookup.name}`);
    return util.log('scan', `Finished ${series.name} - ${ms}ms`);
  })
  .catch(err => {
    const endTime = new Date().getTime();
    const ms = (endTime - startTime) / 1000;
    console.log(`Finished ${lookup.name}`);
    return util.log('scan', `Errored ${series.name} - ${ms}ms`)
    .then(() => util.log('scan', `Errored ${series.name} - ${err.message} - ${err.stack}`));
  });
};
