import http from "../http-common";

const scrape = (url, checkDB) => {
  return http.post(`/scrape/detail/`, { url: url, checkDB: checkDB });
};

const scrapeCheck = url => {
  return http.post(`/scrape/check/`, { url: url });
};

const scrapingService = {
  scrape,
  scrapeCheck
};

export default scrapingService;
