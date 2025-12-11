
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');

const assert = chai.assert;
chai.use(chaiHttp);

suite('Functional Tests', function () {
  this.timeout(8000);

  let singleStockLikes;

  suite('GET /api/stock-prices => stockData object', function () {
    test('Viewing one stock', function (done) {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: 'GOOG' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.isObject(res.body.stockData);
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.property(res.body.stockData, 'price');
          assert.property(res.body.stockData, 'likes');
          assert.isString(res.body.stockData.price);
          assert.isNumber(res.body.stockData.likes);
          done();
        });
    });

    test('Viewing one stock and liking it', function (done) {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: 'GOOG', like: 'true' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          const data = res.body.stockData;
          assert.equal(data.stock, 'GOOG');
          assert.isNumber(data.likes);
          singleStockLikes = data.likes;
          done();
        });
    });

    test('Viewing the same stock and liking it again (no double count)', function (done) {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: 'GOOG', like: 'true' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          const data = res.body.stockData;
          assert.equal(data.stock, 'GOOG');
          assert.equal(
            data.likes,
            singleStockLikes,
            'likes should not increase when same IP likes again'
          );
          done();
        });
    });

    test('Viewing two stocks', function (done) {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: ['GOOG', 'MSFT'] })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.isArray(res.body.stockData);
          assert.lengthOf(res.body.stockData, 2);

          const [s1, s2] = res.body.stockData;
          assert.property(s1, 'stock');
          assert.property(s1, 'price');
          assert.property(s1, 'rel_likes');
          assert.property(s2, 'stock');
          assert.property(s2, 'price');
          assert.property(s2, 'rel_likes');
          assert.equal(s1.stock, 'GOOG');
          assert.equal(s2.stock, 'MSFT');
          assert.isNumber(s1.rel_likes);
          assert.isNumber(s2.rel_likes);
          assert.equal(s1.rel_likes, -s2.rel_likes, 'rel_likes should be inverse');
          done();
        });
    });

    test('Viewing two stocks and liking them', function (done) {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: ['GOOG', 'MSFT'], like: 'true' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.isArray(res.body.stockData);
          assert.lengthOf(res.body.stockData, 2);

          const [s1, s2] = res.body.stockData;
          assert.equal(s1.stock, 'GOOG');
          assert.equal(s2.stock, 'MSFT');
          assert.property(s1, 'rel_likes');
          assert.property(s2, 'rel_likes');
          assert.isNumber(s1.rel_likes);
          assert.isNumber(s2.rel_likes);
          assert.equal(s1.rel_likes, -s2.rel_likes);
          done();
        });
    });
  });
});
