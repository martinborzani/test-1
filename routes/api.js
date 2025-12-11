'use strict';

const fetch = require('node-fetch');

module.exports = function (app) {
  // “BD” en memoria para los likes
  const stocksStore = {}; // { SYMBOL: { likes: Number, ips: Set<string> } }

  function anonymizeIP(ip) {
    if (!ip) return null;
    if (ip.includes('::ffff:')) ip = ip.split('::ffff:')[1];
    const parts = ip.split('.');
    if (parts.length === 4) {
      parts[3] = '0';
      return parts.join('.');
    }
    return 'ipv6-0';
  }

  function registerLike(symbol, ip, likeFlag) {
    symbol = symbol.toUpperCase();
    if (!stocksStore[symbol]) {
      stocksStore[symbol] = { likes: 0, ips: new Set() };
    }
    if (likeFlag && ip) {
      const store = stocksStore[symbol];
      if (!store.ips.has(ip)) {
        store.ips.add(ip);
        store.likes += 1;
      }
    }
    return stocksStore[symbol].likes;
  }

  async function fetchStock(symbol) {
    const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error fetching stock');
    const data = await response.json();
    return {
      stock: data.symbol.toUpperCase(),
      price: data.latestPrice   // 👈 número, no string
    };
  }

  app.get('/api/stock-prices', async function (req, res) {
    try {
      let { stock, like } = req.query;
      if (!stock) {
        return res.status(400).json({ error: 'stock query param required' });
      }

      const likeFlag = like === 'true' || like === true;
      const ip = anonymizeIP(
        (req.headers['x-forwarded-for'] || req.ip || '')
          .toString()
          .split(',')[0]
          .trim()
      );

      if (Array.isArray(stock)) {
        const s1Sym = stock[0].toUpperCase();
        const s2Sym = stock[1].toUpperCase();

        const [s1, s2] = await Promise.all([
          fetchStock(s1Sym),
          fetchStock(s2Sym)
        ]);

        const likes1 = registerLike(s1Sym, ip, likeFlag);
        const likes2 = registerLike(s2Sym, ip, likeFlag);

        return res.json({
          stockData: [
            {
              stock: s1.stock,
              price: s1.price,
              rel_likes: likes1 - likes2
            },
            {
              stock: s2.stock,
              price: s2.price,
              rel_likes: likes2 - likes1
            }
          ]
        });
      } else {
        const symbol = stock.toUpperCase();
        const s = await fetchStock(symbol);
        const likes = registerLike(symbol, ip, likeFlag);

        return res.json({
          stockData: {
            stock: s.stock,
            price: s.price,
            likes: likes
          }
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal server error' });
    }
  });
};
