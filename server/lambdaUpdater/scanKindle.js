const { JSDOM } = require("jsdom");
const util = require('./util');
const _ = require('lodash');

const GET_IMAGES = false;
const BLACKLIST_KINDLE = [
  'B0728D51H1', // LitRPG Freaks
  'B096G8Z644', // TheFirstDefier
];

module.exports = exports = async (seriesName, kindleUrl) => {
  if (!kindleUrl) {
    return [];
  }

  console.log(`  Fetching Kindle: ${kindleUrl}`);
  return util.fetch(kindleUrl).then(({ html }) => {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    const books = [];

    const elsBooks = document.querySelectorAll('#series-childAsin-list .series-childAsin-item');
    if (elsBooks.length === 0) {
      console.log('No Kindle books found');
      console.log(html);
      return [];
    }
    elsBooks.forEach((elBook) => {
      const bookNumber = elBook.querySelector('.itemPositionLabel').textContent.trim();
      const title = util.cleanupName(elBook.querySelector('.itemBookTitle').textContent.trim(), seriesName);
      const href = (elBook.querySelector('.itemBookTitle').getAttribute('href') || '').split('?')[0];
      const kindleUrl = `https://www.amazon.com${href}`;

      // get authors
      const elsAuthors = elBook.querySelectorAll('a.series-childAsin-item-details-contributor');
      const authors = [];
      elsAuthors.forEach((elAuthor) => {
        const authorHref = (elAuthor.getAttribute('href') || '').split('?')[0];
        const authorId = authorHref.split('/').pop();
        let authorUrl = `https://www.amazon.com${authorHref}`
        if (authorUrl.indexOf('ref=') !== -1) {
          authorUrl = '';
        }
  
        const originalName = elAuthor.textContent.replace(/,/g, '').trim();
        let name = originalName;
        if (name.indexOf(' (') !== -1) {
          const authorParts = elAuthor.textContent.replace(/,/g, '').trim().split(' ');
          authorParts.pop();
          name = authorParts.join(' ');
        }

        if (
          !BLACKLIST_KINDLE.includes(authorId)
          && originalName.toLowerCase().indexOf('translat') === -1
          && originalName.toLowerCase().indexOf('(editor') === -1
        ) {
          authors.push({
            id: util.cyrb53(name),
            name,
            urls: [
              { for: 'Kindle', url: authorUrl }
            ],
          });
        }
      });
      
      // grab the ratings
      const elRating = elBook.querySelector('.a-size-base .a-icon');
      let kindleRating = -1;
      let kindleRatingReviews = -1;
      if (elRating) {
        const ratingParts = elRating.textContent.trim().split(' ');
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
        kindleRating = ratingA;
        if (ratingA > ratingB) {
          kindleRating = ratingB;
        }
        const reviewParts = elBook.querySelector('.a-size-base .a-size-base').textContent.trim().split(' ');
        kindleRatingReviews = -1;
        reviewParts.forEach((part) => {
          const n = parseFloat(part.replace(/[,()]/g, ''));
          if (kindleRatingReviews === -1 && !isNaN(n)) {
            kindleRatingReviews = n;
          }
        });
      }

      if (bookNumber.indexOf('-') === -1) {
        let bookNumberParsed = parseFloat(bookNumber);
        if (_.isNaN(bookNumberParsed)) {
          bookNumberParsed = 0;
          console.log(`K - Cant parse book number ${bookNumber} for ${title}`);
        }
        books.push({
          id: util.cyrb53(`${bookNumberParsed} ${title}`),
          bookNumber: bookNumberParsed,
          title,
          urls: [
            { for: 'Kindle', url: kindleUrl },
          ],
          ratings: [
            { from: 'Kindle', stars: parseFloat(kindleRating), reviews: parseFloat(kindleRatingReviews) }
          ],
          authors,
          narrators: [],
        });
      }
    });
    return books;
  })
  .then((books) => {
    const waitFor = [];
    books.forEach((book) => {
      waitFor.push(util.fetch(book.urls[0].url).then(({ html }) => {
        const dom = new JSDOM(html);
        const document = dom.window.document;

        const image = document.querySelector('#ebooks-img-canvas #ebooksImgBlkFront');
        if (image) {
          const imgUrl = image.getAttribute('src');
          if (imgUrl) {
            const imgParts = imgUrl.split('/');
            const fileParts = imgParts.pop().split('.');
            const type = fileParts.pop();
            const file = `${fileParts.shift()}.${type}`;
            imgParts.push(file)
            book.imageBookUrl = imgParts.join('/');
          }
        }

        const description = document.querySelector('#bookDescription_feature_div .a-expander-content');
        let content = '';
        let last = '';
        if (description) {
          for (var i = 0; i < description.childNodes.length; i++) {
            const line = description.childNodes[i].textContent.replace('\n', '').trim();
            if (line.length > 0) {
              // console.log(111, description.childNodes[i].tagName, line);
              content += line;
              if (i !== description.childNodes.length - 1 && !(description.childNodes[i].tagName === 'B' && last === 'B')) {
                content += '\n\n';
              }
              last = description.childNodes[i].tagName;
            }
          }
        }
        book.description = `${content}`;
      }));
    });
    return Promise.all(waitFor).then(() => books);
  })
  .then((books) => {
    const waitFor = [];
    books.forEach((book) => {
      if (book.imageBookUrl && GET_IMAGES) {
        const parts = book.imageBookUrl.split('.');
        const type = parts.pop();
        waitFor.push(util.fetch(book.imageBookUrl).then((data) => {
          book.imageBook = `data:image/${type};base64,${data.toString('base64')}`;
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
