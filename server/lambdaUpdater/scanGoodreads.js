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

  console.log(`  Fetching Goodreads: ${goodreadsUrl}`);
  return util.fetch(goodreadsUrl).then((html) => {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const books = [];

    const elsBooks = document.querySelectorAll('.listWithDividers__item');
    elsBooks.forEach((elBook) => {
      const bookNumber = elBook.querySelector('.gr-h3').textContent.trim().split(' ').pop();
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
        const name = elAuthor.textContent.trim();

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

      if (bookNumber.indexOf('-') === -1) {
        let bookNumberParsed = parseFloat(bookNumber);
        if (_.isNaN(bookNumberParsed)) {
          bookNumberParsed = 0;
          console.log(`G - Cant parse book number ${bookNumber} for ${title}`);
        }
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
    return books;
  })
  .then((books) => {
    const waitFor = [];
    books.forEach((book) => {
      if(book.urls.length > 0) {
        waitFor.push(util.fetch(book.urls[0].url).then((html) => {
          const dom = new JSDOM(html);
          const document = dom.window.document;

          const image = document.querySelector('.bookCoverPrimary img');
          if (image) {
            const imgUrl = image.getAttribute('src');
            if (imgUrl) {
              book.imageBookUrl = `https://www.goodreads.com/${imgUrl}`;
            }
          }

          const elDesc = document.querySelector('#description > span:nth-child(2)');
          let lines = [];
          if (elDesc) {
            lines = elDesc.innerHTML.split('<br>');
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
      }
    });
    return Promise.all(waitFor).then(() => books);
  });
};
