import http from "../http-common";

const scrape = url => {
  return http.get(`/scrape/get/${url}`);
};

const scrapeCheck = url => {
  return http.get(`/scrape/check/${url}`);
};

const scrapingService = {
  scrape,
  scrapeCheck
};

export default scrapingService;
