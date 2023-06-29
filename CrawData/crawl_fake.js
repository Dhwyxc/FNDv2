const puppeteer = require("puppeteer");
const ObjectsToCsv = require("objects-to-csv");
(async () => { const browser = await puppeteer.launch({
    args: ["--start-maximized"],
    headless: true,
    defaultViewport: null,
  });
  for (let a = 1; a < 6; a++) {
    const page = await browser.newPage();
    await page.goto(`https://tingia.gov.vn/ket-qua-tiep-nhan-va-xu-ly/page/${a}/`);
    const news = await page.evaluate(() => {
      const links = document.querySelectorAll(".posts-items.posts-list-container .post-item .post-details h2>a");
      const rs = [...links].map((e) => "https://tingia.gov.vn/" + e.getAttribute("href"));
      return rs;
    });
    console.log("Links amount: " + news.length);
    const rsContent = [];
    let i = 0;
    for (const newsItem of news) {
      i++;
      await page.goto(newsItem);
      const content = await page.evaluate(() => {
        const ps = document.querySelectorAll(".entry-content.entry.clearfix > p");
        const text = [...ps].map((e) => e.textContent).join(" ");
        return text;
      });
      console.log(i);
      rsContent.push({content,label: "1",});
    }
    (async () => {
      const csv = new ObjectsToCsv(rsContent);
      await csv.toDisk(`./Fake/fake.csv`, { append: true });
    })();
    console.log("Done");
  }
})();