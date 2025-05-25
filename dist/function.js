"use strict";
const axios = require("axios");
const puppeteer = require("puppeteer");
const IP = "http://127.0.0.1:3000";

async function postJson(url, data) {
    try {
        const res = await axios.post(url, data);
        return res.data;
    } catch (e) {
        if (e.response && e.response.data) {
            return { error: e.response.data };
        } else {
            return { error: "請求失敗: " + e.message };
        }
    }
}

async function CandlestickImage(symbol, period, interval) {
  const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  const page = await browser.newPage();
  const content = `
  <!DOCTYPE html>
  <html lang="zh-TW">
  <head>
    <meta charset="UTF-8" />
    <title>股價蠟燭圖視覺化</title>
    <script src="https://cdn.plot.ly/plotly-2.25.2.min.js"></script>
  </head>
  <body>
    <div id="chart" style="width: 1200px; height: 600px;"></div>
    <script>
      async function fetchQuotes() {
        const res = await fetch('http://127.0.0.1:3000/stock_history', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ symbol: "${symbol}", period: "${period}", interval: "${interval}" })
        });
        return res.json();
      }

      (async () => {
        const quotes = await fetchQuotes();
        
        if (!Array.isArray(quotes)) {
          console.error("資料格式錯誤", quotes);
          return;
        }

        const timestamp = quotes.map(q => q.timestamp);
        const opens = quotes.map(q => q.open);
        const highs = quotes.map(q => q.high);
        const lows = quotes.map(q => q.low);
        const closes = quotes.map(q => q.close);
        const dates = timestamp.map(ts => new Date(ts * 1000).toLocaleString("en-US", { hour12: false }));

        const trace = {
          x: dates,
          open: opens,
          high: highs,
          low: lows,
          close: closes,
          type: 'candlestick'
        };

        const layout = {
          title: '${symbol} CandleStick',
          xaxis: { title: '日期', type: 'category' },
          yaxis: { title: '價格 (USD)' }
        };

        await Plotly.newPlot('chart', [trace], layout);
        window.chartReady = true;
      })();
    </script>
  </body>
  </html>
  `;

  await page.setContent(content, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.chartReady === true, { timeout: 15000 });
  const chart = await page.$('#chart');
  const imageBuffer = await chart.screenshot({ type: 'png' });
  await browser.close();
  return imageBuffer;
}

module.exports = {IP, postJson, CandlestickImage};