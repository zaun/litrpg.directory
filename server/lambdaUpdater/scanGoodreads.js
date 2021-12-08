const { JSDOM } = require("jsdom");
const util = require('./util');
const _ = require('lodash');

const GET_IMAGES = false;
const BLACKLIST_GOODREADS = [
];

module.exports = exports = async (seriesName, goodreadsUrl) => {
  if (!goodreadsUrl) {
    return [];
  }

  return util.log('scan', `Fetching Goodreads: ${goodreadsUrl}`)
  .then(() => util.fetch(goodreadsUrl))
  .then(({ html, cookies }) => {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const books = [];

    const elsBooks = document.querySelectorAll('.listWithDividers__item');
    elsBooks.forEach((elBook) => {
      const bookNumberParts = elBook.querySelector('.gr-h3').textContent.trim().split(' ');
      const bookNumber = bookNumberParts[bookNumberParts.length - 1];
      const details = elBook.querySelector('.responsiveBook .u-paddingBottomXSmall');
      const title = util.cleanupName(details.querySelector('.gr-h3').textContent.trim(), seriesName);

      // get a clean URL
      const elTitleLink = details.querySelector('.gr-h3');
      const bookHref = elTitleLink ? elTitleLink.getAttribute('href') : '';
      const bookHrefParts = bookHref.trim().split('?')[0].split('/');
      const bookTag = bookHrefParts.pop();
      const bookId = bookTag.split('-').shift();
      const bookUrl = bookId ? `https://www.goodreads.com/book/show/${bookId}` : '';

      // get authors
      const elsAuthors = details.querySelectorAll('[itemprop="author"] a');
      const authors = [];
      elsAuthors.forEach((elAuthor) => {
        const authorHref = elAuthor.getAttribute('href') || '';
        const authorHrefParts = authorHref.trim().split('?')[0].split('/');
        let authorId = authorHrefParts.pop();
        authorId = authorId.split('.').shift();
        const authorUrl = authorId ? `https://www.goodreads.com/author/show/${authorId}` : '';
        const name = util.cleanupName(elAuthor.textContent.trim());

        if(!BLACKLIST_GOODREADS.includes(authorId) && name.toLowerCase().indexOf('translat') === -1) {
          authors.push({
            id: util.cyrb53(name),
            name,
            urls: [
              { for: 'Goodreads', url: authorUrl }
            ],
          });
        }
      });

      // grab the ratings
      let goodreadsRating = -1;
      let goodreadsRatingReviews = -1;
      const elRating = details.querySelector('.communityRating');
      if (elRating) {
        const ratingParts = elRating ? elRating.textContent.trim().split(' ') : [];
        goodreadsRating = parseFloat(ratingParts[0]);
        goodreadsRatingReviews = parseInt(ratingParts[2].replace(/,/g, ''));
      }

      const bookNumberParsed = parseFloat(bookNumber);
      if (!_.isNaN(bookNumberParsed) && bookNumber.indexOf('-') === -1 && bookNumberParts.length <= 2) {
        const bookData = {
          id: util.cyrb53(`${bookNumberParsed} ${title}`),
          bookNumber: bookNumberParsed,
          title,
          urls: [],
          ratings: [
            { from: 'Goodreads', stars: goodreadsRating, reviews: goodreadsRatingReviews }
          ],
          authors,
          narrators: [],
        };
        if (bookUrl) {
          bookData.urls.push({ for: 'Goodreads', url: bookUrl });
        }
        books.push(bookData);
      }
    });
    return { books, cookies };
  })
  .then(({ books, cookies }) => {
    if (books.length === 0) {
      return util.log('scan', `No Goodread books found for ${goodreadsUrl}`).then(() => []);
    }

    const waitFor = [];
    books.forEach((book) => {
      if(book.urls.length > 0) {
        waitFor.push(util.fetch(book.urls[0].url, cookies, goodreadsUrl).then(({ html }) => {
          const dom = new JSDOM(html);
          const document = dom.window.document;

          const image = document.querySelector('.bookCoverPrimary img');
          if (image) {
            const imgUrl = image.getAttribute('src');
            if (imgUrl) {
              book.imageBookUrl = `https://www.goodreads.com/${imgUrl}`;
            }
          }

          let elDesc = document.querySelector('#description > span:nth-child(2)');
          if (elDesc === null) {
            elDesc = document.querySelector('.BookPageMetadataSection__description .Formatted');
          }
          let lines = [];
          if (elDesc) {
            lines = elDesc.textContent.split('  ');
          }
          let content = '';
          for (var i = 0; i < lines.length; i++) {
            const line = lines[i].replace('\n', '').trim();
            if (line.length > 0 && line !== '') {
              content += line;
              if (i !== lines.length - 1) {
                content += '\n\n';
              }
            }
          }
          book.description = `${content}`;
        }));
      } else {
        waitFor.push(util.log('scan', `Goodreads - No urls found for "${book.title}" from ${goodreadsUrl}`));
      }
    });
    return Promise.all(waitFor).then(() => books);
  });
};
