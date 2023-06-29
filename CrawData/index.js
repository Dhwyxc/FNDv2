const puppeteer = require("puppeteer");
const ObjectsToCsv = require("objects-to-csv");
(async () => {
  const browser = await puppeteer.launch({args: ["--start-maximized"],headless: true,defaultViewport: null,});
  let url = [
    ["https://baochinhphu.vn/chinh-tri.htm", "chinhtri.csv"],["https://baochinhphu.vn/van-hoa/du-lich.htm", "dulich.csv"],["https://baochinhphu.vn/khoa-giao/giao-duc.htm", "giaoduc.csv"],["https://baochinhphu.vn/khoa-giao/khoa-hoc-cong-nghe.htm", "khoahoc.csv"],
    ["https://baochinhphu.vn/kinh-te.htm", "kinhte.csv"],["https://baochinhphu.vn/xa-hoi/phap-luat.htm", "phapluat.csv"],["https://baochinhphu.vn/van-hoa/the-thao.htm", "thethao.csv"],  ["https://baochinhphu.vn/xa-hoi/y-te.htm", "yte.csv"],
  ];
  for(let a = 0 ; a < url.length ; a++) {
    console.log(url[a][0]);
    const page = await browser.newPage();
    await page.goto(url[a][0]);
    await autoScroll(page);
    const news = await page.evaluate(() => {
      const links = document.querySelectorAll(".box-stream-item h2>a");
      const rs = [...links].map((e) => "https://baochinhphu.vn" + e.getAttribute("href"));
      return rs;
    });
    console.log("Links amount: "+news.length);
    const rsContent = [];
    let i = 0;
    for (const newsItem of news) {
      i++;
      await page.goto(newsItem);
      const content = await page.evaluate(() => {
        const ps = document.querySelectorAll(".detail-content > p");
        const text = [...ps].map((e) => e.textContent).join(" ");
        return text;
      });
      console.log(i);
      rsContent.push({content,label: "0",});}
      const uniqueRsContent = [...new Set(rsContent.map((item) => JSON.stringify(item))),].map((item) => JSON.parse(item));
      (async () => {
        const csv = new ObjectsToCsv(uniqueRsContent);
        console.log(uniqueRsContent.length);
        await csv.toDisk(`./BaoCP/${url[a][1]}`, { append: true });
      })();}
      console.log("Finish");
})();

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight - window.innerHeight) {
          const seeMore = document.querySelector(".loadmore .list__center.list__viewmore .btn");
          if (seeMore) {
            seeMore.click();}
        }
        const check = document.querySelectorAll(".box-stream-item h2>a").length;
        console.log({ check });
        if (check > 150) {
          clearInterval(timer);
          resolve();}
      }, 100);
    });
  });
}
