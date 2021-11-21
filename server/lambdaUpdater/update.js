const util = require('./util');
const _ = require('lodash');

module.exports = exports = {
  book(book) {
    const saveData = _.omit(book, ['authors', 'narrators', 'series']);
    saveData.seriesId = book.series.id;
    saveData.lastUpdate = new Date().getTime();

    let state = 1;
    return util.putBook(saveData)
    .then(() => {
      state = 2;
      return util.getSeriesById(book.series.id);
    })
    .then((result) => {
      const currentSeries = result || {};
      state = 3;
      book.series.setting = currentSeries.setting || book.series.setting || '';
      book.series.plot = currentSeries.plot || book.series.plot || '';
      book.series.young = currentSeries.young || book.series.young || '';
      book.series.completed = currentSeries.completed || book.series.completed || '';
      book.series.era = currentSeries.era || book.series.era || '';
      book.series.harem = currentSeries.harem || book.series.harem || '';
      return util.putSeries(book.series);
    })
    .then(() => {
      state = 4;
      return util.getBookPeopleById(book.id)
    })
    .then((results) => {
      state = 5;
      const currentPeople = results || [];
      const waitFor = [];
      if (book.authors) {
        book.authors.forEach((p) => {
          const pbId = `${book.id}-${p.id}-A`;
          if (_.find(currentPeople, { id: pbId })) {
            _.remove(currentPeople, { id: pbId });
          }
          waitFor.push(util.putPerson(p));
          waitFor.push(util.putBookPerson(book.id, p.id, 'A'));
      });
      }
      if (book.narrators) {
        book.narrators.forEach((p) => {
          const pbId = `${book.id}-${p.id}-N`;
          if (_.find(currentPeople, { id: pbId })) {
            _.remove(currentPeople, { id: pbId });
          }
          waitFor.push(util.putPerson(p));
          waitFor.push(util.putBookPerson(book.id, p.id, 'N'));
        });
      }
  
      currentPeople.forEach((cp) => {
        waitFor.push(util.delBookPerson(cp.bookId, cp.id));
      });
  
      return Promise.all(waitFor);
    })
    .catch((err) => {
      console.log('Error saving book');
      console.log(err);
      console.log(JSON.stringify(book, null, 2));
      console.log(state);
    });
  },
}
