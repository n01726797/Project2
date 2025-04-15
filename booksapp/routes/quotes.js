router.get('/quotes', async (req, res, next) => {
    try {
      // You could pull a popular author’s books and extract quotes
      const url = `https://www.googleapis.com/books/v1/volumes?q=subject:Classic&maxResults=20`;
      const { items = [] } = await (await fetch(url)).json();
      const quotes = items
        .map(v => v.volumeInfo.description)
        .filter(d => d)
        .flatMap(d => d.split(/[\r\n]+/))
        .slice(0, 30); // take first 30 lines as “quotes”
      res.render('quotes', { title: 'Quotes', quotes });
    } catch (err) {
      next(err);
    }
  });
  