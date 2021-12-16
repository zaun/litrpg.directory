const { JSDOM } = require("jsdom");
const util = require('./util');
const _ = require('lodash');

const GET_IMAGES = false;
const BLACKLIST_AUDIBLE = [
  'B0728D51H1', // LitRPG Freaks
  'B096G8Z644', // TheFirstDefier
  'B07BHNPCXK', // Portal Books
];

module.exports = exports = async (seriesName, audibleUrl) => {
  if (!audibleUrl) {
    return [];
  }

  return util.log('scan', `Fetching Audible: ${audibleUrl}`)
  .then(() => util.fetch(audibleUrl))
  .then(({ html }) => {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const books = [];
    const logs = [];

    const elsBooks = document.querySelectorAll('.productListItem');
    elsBooks.forEach((elBook) => {
      let bookNumber = elBook.querySelector('.bc-heading').textContent.trim().split(' ').pop();
      const details = elBook.querySelector('.bc-col-7 ul.bc-list');
      const title = util.cleanupName(details.querySelector('.bc-heading').textContent.trim(), seriesName);

      let bookNumberTest = parseFloat(bookNumber);
      if (_.isNaN(bookNumberTest)) {
        bookNumber = details.querySelector('.bc-list-item.subtitle').textContent.trim().split(',').pop().split(' ').pop();
      }

      // get a clean URL
      const elTitleLink = details.querySelector('.bc-heading a');
      const bookHref = elTitleLink ? elTitleLink.getAttribute('href') : '';
      const bookHrefParts = bookHref.trim().split('?')[0].split('/');
      const bookId = bookHrefParts.pop();
      bookHrefParts.pop();
      const bookUrl = bookId ? `https://www.audible.com${bookHrefParts.join('/')}/${bookId}` : '';

      // get authors
      const elsAuthors = details.querySelectorAll('.authorLabel a');
      const authors = [];
      elsAuthors.forEach((elAuthor) => {
        const authorHref = elAuthor.getAttribute('href') || '';
        const authorHrefParts = authorHref.trim().split('?')[0].split('/');
        let authorId = authorHrefParts.pop();
        if (authorId.toLowerCase() === 'search') {
          authorId = '';
        }
        authorHrefParts.pop();
        const authorUrl = authorId ? `https://www.audible.com${authorHrefParts.join('/')}/${authorId}` : '';
        const name = util.cleanupName(elAuthor.textContent.trim());

        if(!BLACKLIST_AUDIBLE.includes(authorId) && name.toLowerCase().indexOf('translat') === -1) {
          authors.push({
            id: util.cyrb53(name),
            name,
            urls: [
              { for: 'Audible', url: authorUrl }
            ],
          });
        }
      });

      // get narrators
      const elsNarrators = details.querySelectorAll('.narratorLabel a');
      const narrators = [];
      elsNarrators.forEach((elNarrator) => {
        const narratorHref = elNarrator.getAttribute('href') || '';
        const narratorHrefParts = narratorHref.trim().split('?')[0].split('/');
        let audibleId = narratorHrefParts.pop();
        if (audibleId.toLowerCase() === 'search') {
          audibleId = '';
        }
        narratorHrefParts.pop();
        const audibleUrl = audibleId ? `https://www.audible.com${narratorHrefParts.join('/')}/${audibleId}` : '';
        const name = util.cleanupName(elNarrator.textContent.replace('Soundbooth Theater', '').trim());

        if(name.toLowerCase().indexOf('translat') === -1) {
          narrators.push({
            id: util.cyrb53(name),
            name,
            urls: [
              { for: 'Audible', url: audibleUrl }
            ],
          });
        }
      });

      // grab the ratings
      let audibleRating = -1;
      let audibleRatingReviews = -1;
      const elRating = details.querySelector('.ratingsLabel > span:nth-child(2)');
      if (elRating) {
        const ratingParts = elRating ? elRating.textContent.trim().split(' ') : [];
        let ratingA = -1;
        let ratingB = -1;
        ratingParts.forEach((part) => {
          const n = parseFloat(part);
          if (ratingA === -1 && !isNaN(n)) {
            ratingA = n;
          } else if (ratingB === -1 && !isNaN(n)) {
            ratingB = n;
          }
        });
        audibleRating = ratingA;
        if (ratingA > ratingB) {
          audibleRating = ratingB;
        }
        const elReview = details.querySelector('.ratingsLabel > span:nth-child(3)');
        const reviewParts = elReview ? elReview.textContent.trim().split(' ') : [];
        audibleRatingReviews = -1;
        reviewParts.forEach((part) => {
          const n = parseFloat(part.replace(/,/g, ''));
          if (audibleRatingReviews === -1 && !isNaN(n)) {
            audibleRatingReviews = n;
          }
        });
      }

      if (bookNumber.indexOf('-') === -1) {
        let bookNumberParsed = parseFloat(bookNumber);
        if (_.isNaN(bookNumberParsed)) {
          bookNumberParsed = 0;
          logs.push(util.log('scan', `Audible - Cant parse book number "${bookNumber}" for "${title}" from ${audibleUrl}`));
        }
        const bookData = {
          id: util.cyrb53(`${bookNumberParsed} ${title}`),
          bookNumber: bookNumberParsed,
          title,
          urls: [],
          ratings: [
            { from: 'Audible', stars: parseFloat(audibleRating), reviews: parseFloat(audibleRatingReviews) }
          ],
          authors,
          narrators,
        };
        if (bookUrl) {
          bookData.urls.push({ for: 'Audible', url: bookUrl });
        }
        books.push(bookData);
      }
    });
    
    return Promise.all(logs).then(() => books);
  })
  .then((books) => {
    if (books.length === 0) {
      return util.log('scan', `No Audible books found for ${audibleUrl}`).then(() => []);
    }

    const waitFor = [];
    books.forEach((book) => {
      if(book.urls.length > 0) {
        waitFor.push(util.fetch(book.urls[0].url).then(({ html }) => {
          const dom = new JSDOM(html);
          const document = dom.window.document;

          const image = document.querySelector('.hero-content img');
          const imgUrl = image.getAttribute('src');
          if (imgUrl) {
            const imgParts = imgUrl.split('/');
            const fileParts = imgParts.pop().split('.');
            const type = fileParts.pop();
            const file = `${fileParts.shift()}.${type}`;
            imgParts.push(file)
            book.imageAudioUrl = imgParts.join('/');
          }

          const description = document.querySelector('.productPublisherSummary .bc-section .bc-box .bc-text');
          let content = '';
          for (var i = 0; i < description.childNodes.length; i++) {
            const line = description.childNodes[i].textContent.replace('\n', '').trim();
            if (line.length > 0) {
              content += line;
              if (i !== description.childNodes.length - 1 && description.childNodes[i].tagName !== 'B') {
                content += '\n\n';
              }
            }
          }
          book.description = `${content}`;
        }));
      } else {
        waitFor.push(util.log('scan', `Audible - No urls found for "${book.title}" from ${audibleUrl}`));
      }
    });
    return Promise.all(waitFor).then(() => books);
  })
  .then((books) => {
    const waitFor = [];
    books.forEach((book) => {
      if (book.imageAudioUrl && GET_IMAGES) {
        const parts = book.imageAudioUrl.split('.');
        const type = parts.pop();
        waitFor.push(util.fetch(book.imageAudioUrl).then((data) => {
          book.imageAudio = `data:image/${type};base64,${data.toString('base64')}`;
        }));
      }
    });
    return Promise.all(waitFor).then(() => books);
  })
  .catch((e) => {
    console.log(222, e);
    return [];
  });
};
