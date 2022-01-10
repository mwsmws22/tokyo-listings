const cheerio = require('cheerio');
const cloneDeep = require('clone-deep');
const util = require('../utils/util');

const StringUtils = require('../utils/StringUtils')
StringUtils.initialize()

// for writing out html to file
// const fs = require('fs');
// fs.writeFileSync('test.html', html, {'encoding': 'utf-8'});

const dataStruct = {
  property: {
    prefecture: "",
    municipality: "",
    town: "",
    district: "",
    block: "",
    house_number: "",
    property_type: "",
    interest: ""
  },
  listing: {
    url: "",
    monthly_rent: "",
    reikin: "",
    security_deposit: "",
    square_m: "",
    closest_station: "",
    walking_time: "",
    availability: ""
  }
};

const scrape = (url, cb) => {



  var pass;
  var useHeaders = ['www.renov-depart.jp', 'www.chintai.net', 'house.goo.ne.jp', 'www.aeras-group.jp', 'www.hatomarksite.com', 'house.ocn.ne.jp'];
  const { protocol, hostname, pathname, search } = new URL(url);
  const adapter = protocol === "https:" ? require("https") : require("http")

  if (useHeaders.includes(hostname)) {
    pass = {
      hostname: hostname,
      path: pathname,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36' }
    };
  } else {
    pass = url;
  }

  adapter.get(pass, (res) => {
    let html = '';
    var { statusCode } = res;

    if (statusCode !== 200) {
      cb("bad link");
    } else {
      res.setEncoding('utf8');

      res.on('data', chunk => {
        html += chunk;
      });

      res.on('end', async () => {
        const parser = new Parser(url);
        try {
          const output = await parser.parse(html, hostname);
          cb(output);
        }
        catch (err) {
          cb("bad link");
          // console.log(err);
        }
      });
    }
  });
};

class Parser {
  constructor(url) {
    this.url = url;
  }

  parse(html, hostname) {

    switch(hostname) {
      case 'www.athome.co.jp':
        return this.parseAtHome(html);
      case 'suumo.jp':
        return this.parseSuumo(html);
      case 'realestate.yahoo.co.jp':
        return this.parseYahoo(html);
      case 'www.realtokyoestate.co.jp':
        return this.parseRealTokyoEstate(html);
      case 'tokyo-style.cc':
        return this.parseTokyoStyle(html);
      case 'www.aeras-group.jp':
        return this.parseAerasGroup(html);
      case 'www.rehouse.co.jp':
        return this.parseRehouse(html);
      case 'www.renov-depart.jp':
        return this.parseRenovDepart(html);
      case 'www.chintai.net':
        return this.parseChintai(html);
      case 'www.omusubi-estate.com':
        return this.parseOmusubiEstate(html);
      case 'www.r-store.jp':
        return this.parseRStore(html);
      case 'www.tatodesign.jp':
        return this.parseTatoDesign(html);
      case 'www.goodrooms.jp':
        return this.parseGoodroom(html);
      case 'www.homes.co.jp':
        return this.parseLifullHomes(html);
      case 'joylifestyle.jp':
        return this.parseJoylifestyle(html);
      case 'www.diyp.jp':
        return this.parseDiyp(html);
      case 'www.pethomeweb.com':
        return this.parsePetHomeWeb(html);
      case 'xn--ihqxo86hrls96efnv.com':
        return this.parseBunkyoku(html);
      case 'tomigaya.jp':
        return this.parseTomigaya(html);
      case 'tokyo-designers.com':
        return this.parseTomigaya(html);
      case 'east-and-west.jp':
        return this.parseTomigaya(html);
      case 'www.sousaku-kukan.com':
        return this.parseTomigaya(html);
      case 'aoyama-fudousan.com':
        return this.parseTomigaya(html);
      case 'kagurazaka-fudousan.com':
        return this.parseTomigaya(html);
      case 'www.jkhome.com':
        return this.parseJKHome(html);
      case 'kodate.chintaistyle.jp':
        return this.parseKodateChintai(html);
      case 'house.asocio.co.jp':
        return this.parseHouseAsocio(html);
      case 'house.goo.ne.jp':
        return this.parseHouseGoo(html);
      case 'spacelist.jp':
        return this.parseSpacelist(html);
      case 'housestokyo.jp':
        return this.parseHousesTokyo(html);
      case 'sumaity.com':
        return this.parseSumaity(html);
      case 'www.kencorp.co.jp':
        return this.parseKenCorp(html);
      case 'www.bestexnet.co.jp':
        return this.parseBestex(html);
      case 'smocca.jp':
        return this.parseSmocca(html);
      case 'www.axel-home.com':
        return this.parseAxelHome(html);
      case 'chintai-ex.jp':
        return this.parseChintaiEx(html);
      case 'www.hatomarksite.com':
        return this.parseHatomarkSite(html);
      case 'www.century21.jp':
        return this.parseCentury21(html);
      case 'house.ocn.ne.jp':
        return this.parseHouseOCN(html);
      case 'www.oasis-estate.jp':
        return this.parseOasisEstate(html);
      default:
        return null;
    }
  }

  async parseAtHome(html) {
    const $ = cheerio.load(html);

    const output = cloneDeep(dataStruct);
    output.listing.url = this.url;
    output.listing.monthly_rent = $(".num", ".data.payments").text().replace("万円", "");

    let reikin = $('th:contains("礼金") + td', '.mainItemInfo.bukkenOverviewInfo').text().replace("ヶ月", "");
    if (reikin === "なし") {
      output.listing.reikin = "0";
    } else if (reikin.includes("万円")) {
      output.listing.reikin = Number((parseFloat(reikin.replace("万円","")) / parseFloat(output.listing.monthly_rent)).toFixed(1)).toString();
    } else {
      output.listing.reikin = reikin;
    }

    let security_deposit = $('th:contains("敷金") + td', '.mainItemInfo.bukkenOverviewInfo').text().replace("ヶ月", "");
    if (security_deposit === "なし") {
      output.listing.security_deposit = "0";
    } else if (security_deposit.includes("万円")) {
      output.listing.security_deposit = Number((parseFloat(security_deposit.replace("万円","")) / parseFloat(output.listing.monthly_rent)).toFixed(1)).toString();
    } else {
      output.listing.security_deposit = security_deposit;
    }

    output.listing.square_m = $('th:contains("面積") + td', '.mainItemInfo.bukkenOverviewInfo').html().replace("m²", "");

    let address = $('.text-with-button', '.mainItemInfo.bukkenOverviewInfo').html();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stations = $('th:contains("交通") + td p', '.mainItemInfo.bukkenOverviewInfo');

    stations.each(function (i, elem) {
      const text = $(elem).text();

      if (text.indexOf("バス") === -1) {
        const tempStation = text.match(/\s\/\s(.*?)駅/)[1] + "駅";
        const tempWalkTime = text.match(/徒歩(.*?)分/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    });

    output.listing.availability = "募集中";

    let property_type = $('th:contains("種目") + td', '.mainItemInfo.bukkenOverviewInfo').html();

    if (property_type === "賃貸一戸建て" || property_type === "賃貸テラスハウス") {
      output.property.property_type = "一戸建て";
    } else if (property_type === "賃貸マンション" || property_type === "賃貸アパート") {
      output.property.property_type = "アパート";
    }

    return output;
  }

  async parseSuumo(html) {
    const $ = cheerio.load(html);

    const output = cloneDeep(dataStruct);
    output.listing.url = this.url;
    output.listing.monthly_rent = $(".property_view_note-emphasis").text().replace("万円", "");

    let reikin = $('span:contains("礼金")', '.property_view_note-list').text().replace("礼金: ", "").replace("万円", "");
    if (reikin === "-") {
      output.listing.reikin = "0";
    } else {
      output.listing.reikin = Number((parseFloat(reikin) / parseFloat(output.listing.monthly_rent)).toFixed(1)).toString();
    }

    let security_deposit = $('span:contains("敷金")', '.property_view_note-list').text().replace("敷金: ", "").replace("万円", "");
    if (security_deposit === "-") {
      output.listing.security_deposit = "0";
    } else {
      output.listing.security_deposit =  Number((parseFloat(security_deposit) / parseFloat(output.listing.monthly_rent)).toFixed(1)).toString();
    }

    output.listing.square_m = $('th:contains("専有面積") + td').text().replace("m2", "");

    let address = $('th:contains("所在地") + td').text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stations = $('.property_view_table-read', 'th:contains("駅徒歩") + td');

    stations.each(function (i, elem) {
      const text = $(elem).text();

      if (text.indexOf("バス") === -1 && text.indexOf("車") === -1) {
        const tempStation = text.match(/\/(.*?)駅/i)[1] + "駅";
        const tempWalkTime = text.match(/歩(.*?)分/i)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    });

    output.listing.availability = "募集中";

    let property_type = $('th:contains("建物種別") + td').text();

    if (property_type === "マンション") {
      output.property.property_type = "アパート";
    } else if (property_type === "テラス・タウンハウス") {
      output.property.property_type = "一戸建て";
    } else {
      output.property.property_type = property_type;
    }

    return output;
  }

  async parseYahoo(html) {
    const $ = cheerio.load(html);

    const output = cloneDeep(dataStruct);
    output.listing.url = this.url;
    output.listing.monthly_rent = $(".DetailSummary__price__rent").text().replace("万円", "");

    let reikin = $('dt:contains("礼金：") + dd').text().replace("万円", "").replace(" ※", "");
    if (reikin === "なし") {
      output.listing.reikin = "0";
    } else if (reikin.includes("ヶ月")) {
      output.listing.reikin = reikin.replace("ヶ月", "");
    } else {Number((6.688689).toFixed(1))
      output.listing.reikin = Number((parseFloat(reikin) / parseFloat(output.listing.monthly_rent)).toFixed(1)).toString();
    }

    let security_deposit = $('dt:contains("敷金：") + dd').text().replace("万円", "").replace(" ※", "");
    if (security_deposit === "なし") {
      output.listing.security_deposit = "0";
    } else if (security_deposit.includes("ヶ月")) {
      output.listing.security_deposit = security_deposit.replace("ヶ月", "");
    } else {
      output.listing.security_deposit = Number((parseFloat(security_deposit) / parseFloat(output.listing.monthly_rent)).toFixed(1)).toString();
    }

    output.listing.square_m = $('th:contains("専有面積") + td').text().replace("m2", "");

    let address = $('th:contains("所在地") + td').text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stations = $('ul', 'th:contains("交通") + td').eq(0).children();

    stations.each(function (i, elem) {
      const text = $(elem).text();

      if (text.indexOf("バス") === -1) {
        let tempStation = text.match(/(.*?)駅/i)[1].noSpace() + "駅";
        let tempWalkTime = text.match(/徒歩(.*?)分/i)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    });

    output.listing.availability = "募集中";

    let property_type = $('.brandTagType').text();

    if (property_type === "マンション") {
      output.property.property_type = "アパート";
    } else if (property_type === "テラスハウス" || property_type === "タウンハウス") {
      output.property.property_type = "一戸建て";
    } else {
      output.property.property_type = property_type;
    }

    return output;
  }

  async parseRealTokyoEstate(html) {
    const $ = cheerio.load(html);

    const output = cloneDeep(dataStruct);
    output.listing.url = this.url;
    let tempRent = $(".description_price_val").text();
    let man = tempRent.match(/(.*)万/)[1];
    let sen = tempRent.match(/万(.*)円/)[1];

    if (sen !== "") {
      sen = sen.replace(",", "");
      let senTemp = parseInt(sen) / 10000;
      let manTemp = parseInt(man);
      output.listing.monthly_rent = (manTemp + senTemp).toString();
    } else {
      output.listing.monthly_rent = man;
    }

    let reikin = $('span', '#estate_info_fee_value').text();
    if (reikin.includes("円")) {
      output.listing.reikin = parseInt(reikin.replace(",", "").replace("円")) / 10000 / output.listing.monthly_rent;
    } else if (reikin === "なし") {
      output.listing.reikin = "0";
    } else {
      output.listing.reikin = reikin.replace("ヶ月", "");
    }

    let security_deposit = $('span', '#estate_info_deposite_value').text().replace("ヶ月", "");
    if (security_deposit.includes("円")) {
      output.listing.security_deposit = parseInt(security_deposit.replace(",", "").replace("円")) / 10000 / output.listing.monthly_rent;
    } else if (security_deposit === "なし") {
      output.listing.security_deposit = "0";
    } else {
      output.listing.security_deposit = security_deposit
    }

    output.listing.square_m = $('.description_area_val').text().replace("㎡", "");

    let address = $('td:contains("所在地：") + td').text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stationMatches = $('td:contains("交通：") + td').text().matchAll(/「(.*?)分/g);

    for (const match of stationMatches) {
      if (match[1].indexOf("バス") === -1) {
        let tempStation = match[1].match(/(.*?)」/)[1]  + "駅";
        let tempWalkTime = match[1].match(/徒歩(.*)/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    }

    output.listing.availability = "募集中";

    return output;
  }

  async parseTokyoStyle(html) {
    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    if ($(".cat-name").text().includes("Finished")) {
      throw "no longer available";
    }

    output.listing.url = this.url;

    let boxText = $(".c_box.intitle.glay_box").text();
    let shikikin_reikin_line = boxText.match(/\n.*礼金.*\n/)[0];

    //because it can be 礼金1カ月/敷金1カ月 or 敷金 1ヶ月／礼金1ヶ月
    if (shikikin_reikin_line.indexOf("礼金") < shikikin_reikin_line.indexOf("敷金")) {
      output.listing.reikin = shikikin_reikin_line.match(/.*(\d+).*(\d+)/)[1];
      output.listing.security_deposit = shikikin_reikin_line.match(/.*(\d+).*(\d+)/)[2];
    } else {
      output.listing.security_deposit = shikikin_reikin_line.match(/.*(\d+).*(\d+)/)[1];
      output.listing.reikin = shikikin_reikin_line.match(/.*(\d+).*(\d+)/)[2];
    }
    let monthly_rent = boxText.match(/賃料(.*)円/)[1].replace(/\s/g, "").replace(",", "");
    output.listing.monthly_rent = (parseInt(monthly_rent) / 10000).toString();
    output.listing.square_m = boxText.match(/面積.*?(\d+(?:\.\d+)?)(?:平米|㎡|\?)/)[1];

    let address = boxText.match(/物件所在：(.*)/)[1];
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    output.listing.walking_time = boxText.match(/(?:線|ライナー).*?(\d+)/)[1];
    output.listing.closest_station = boxText.match(/(?:線|ライナー)\s(.*?)[\s,駅,歩,徒]/)[1] + "駅";

    output.listing.availability = "募集中";

    return output;
  }

  async parseAerasGroup(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = $(".price", ".room").text().replace("万円", "");
    output.listing.reikin = $('dt:contains("敷金/礼金/保証金：") + dd').text().match(/(\d+)/g)[1];
    output.listing.security_deposit = $('dt:contains("敷金/礼金/保証金：") + dd').text().match(/(\d+)/g)[0];
    output.listing.square_m = $('dt:contains("専有面積：") + dd').text().replace("m²", "");

    let property_type = $('dt:contains("種別/構造：") + dd').text().match(/賃貸(.*?)\//)[1];

    if (property_type === "マンション") {
      output.property.property_type = "アパート";
    } else {
      output.property.property_type = property_type;
    }

    let address = $('dt:contains("所在地：") + dd').text().replace("ー","-");
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stations = $('dt:contains("交通：") + dd');

    stations.each(function (i, elem) {
      const text = $(elem).text();

      if (text.indexOf("バス") === -1) {
        let tempStation = text.match(/「(.*?)」/)[1] + "駅";
        let tempWalkTime = text.match(/徒歩(.*?)分/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    });

    return output;
  }

  async parseRehouse(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = $(".mrh-table-article__price").first().text().replace("万円", "").noSpace();
    output.listing.reikin = $('th:contains("敷金／礼金／保証金") + td').text().match(/(\d+)/g)[1];
    output.listing.security_deposit = $('th:contains("敷金／礼金／保証金") + td').text().match(/(\d+)/g)[0];
    output.listing.square_m = $('th:contains("建物面積") + td').first().text().replace("㎡", "").noSpace();
    output.property.property_type = $('.mrh-label-article').text().match(/賃貸(.*?)$/)[1];

    let address = $('th:contains("所在地") + td').text().replace("周辺地図", "");
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stationMatches = $('th:contains("最寄り駅") + td').text().matchAll(/「(.*?)分/g);

    for (const match of stationMatches) {
      if (match[1].indexOf("バス") === -1 && match[1].indexOf("停") === -1) {
        let tempStation = match[1].match(/(.*?)」/)[1]  + "駅";
        let tempWalkTime = match[1].match(/徒歩(.*)/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    }

    return output;
  }

  async parseRenovDepart(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = parseInt($('th:contains("家賃") + td').eq(0).text().replace("￥", "").replace(",", "")) / 10000;
    output.listing.security_deposit = $('th:contains("敷/礼") + td').eq(0).text().match(/^(.*?)\//)[1].replace("ヶ月", "").replace("-", "0");
    output.listing.reikin = $('th:contains("敷/礼") + td').eq(0).text().match(/\/(.*?)$/)[1].replace("ヶ月", "").replace("-", "0");
    output.listing.square_m = $('th:contains("間取り") + td').eq(0).text().match(/（(.*?)㎡/)[1];

    let address = $('th:contains("住所") + td').eq(0).text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    const stations = $("p", 'th:contains("交通") + td');

    stations.each(function (i, elem) {
      const text = $(elem).text();

      if (text.indexOf("バス") === -1) {
        let tempStation = text.match(/「(.*?)」/)[1] + "駅";
        let tempWalkTime = text.match(/徒歩(.*?)分/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    });

    return output;
  }

  async parseChintai(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = parseFloat($('span.rent', 'table').first().text().replace("万円", ""));
    output.listing.square_m = $('th:contains("専有面積") + td').text().match(/(.*?)m²/)[1];

    let security_deposit = $('th:contains("敷金") + td').text().match(/(.*?)\//)[1].replace(/\s/g, "");
    let reikin = $('th:contains("礼金") + td').text().match(/(.*?)\//)[1].replace(/\s/g, "");

    if (security_deposit.includes("ヶ月")) {
      output.listing.security_deposit = security_deposit.replace("ヶ月", "");
    } else if (security_deposit.includes("--") || security_deposit.includes("なし")) {
      output.listing.security_deposit = "0";
    } else if (security_deposit.includes("万円")) {
      output.listing.security_deposit = parseFloat(security_deposit.replace("万円", "")) / output.listing.monthly_rent;
    }

    if (reikin.includes("ヶ月")) {
      output.listing.reikin = reikin.replace("ヶ月", "");
    } else if (reikin.includes("--") || reikin.includes("なし")) {
      output.listing.reikin = "0";
    } else if (reikin.includes("万円")) {
      output.listing.reikin = parseFloat(reikin.replace("万円", "")) / output.listing.monthly_rent;
    }

    let address = $('th:contains("住所") + td').text().replace("地図で物件の周辺環境をチェック！", "");
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stations = $('dl', 'th:contains("交通") + td');

    stations.each(function (i, elem) {
      const text = $(elem).text();

      if (text.indexOf("バス") === -1) {
        let tempStation = text.match(/\/(.*?)駅/)[1] + "駅";
        let tempWalkTime = text.match(/徒歩(.*?)分/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    });

    let property_type = $('th:contains("建物種別") + td').text();

    if (property_type === "貸家" || property_type === 'テラスハウス') {
      output.property.property_type = "一戸建て";
    } else if (property_type === "マンション") {
      output.property.property_type = "アパート";
    } else {
      output.property.property_type = property_type;
    }

    return output;
  }

  async parseOmusubiEstate(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";

    let monthly_rent = $('dt:contains("賃料") + dd').text().replace("万円", "");

    if (monthly_rent === "") {
      output.listing.monthly_rent = $('dt:contains("価格") + dd').text().replace("万円", "");
    } else {
      output.listing.monthly_rent = monthly_rent;
    }

    if (output.listing.monthly_rent === "ご成約済") {
      throw "no longer available";
    }

    output.listing.security_deposit = $('dt:contains("敷金礼金") + dd').text().match(/(\d+)/g)[0];
    output.listing.reikin = $('dt:contains("敷金礼金") + dd').text().match(/(\d+)/g)[1];
    output.listing.square_m = $('dt:contains("専有面積") + dd').text().replace("m²", "");

    let address = $('dt:contains("所在地") + dd').text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stationMatches = $('dt:contains("交通") + dd').text().matchAll(/線(.*?)分/g);

    for (const match of stationMatches) {
      if (match[1].indexOf("バス") === -1 && match[1].indexOf("停") === -1) {
        let tempMatch = match[1].replace(/[「」『』\s]/g, '');
        let tempStation = tempMatch.match(/(.*?)徒歩/)[1];
        let tempWalkTime = tempMatch.match(/徒歩(.*)/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    }

    return output;
  }

  async parseRStore(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = parseInt($('h3:contains("賃料") + p', 'li').first().text().replace("円", "").replace(",", "").noSpace()) / 10000;
    output.listing.square_m = $('h3:contains("面積") + p', 'li').text().replace("㎡", "");
    output.listing.security_deposit = $('h3:contains("敷金 / 保証金") + p', 'li').text().replace("ヶ月分", "").noSpace().replace("-", "0");
    output.listing.reikin = $('h3:contains("礼金") + p', 'li').first().text().replace("ヶ月分", "").noSpace().replace("-", "0");

    let address = $('h3:contains("所在地") + p', 'li').text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stationMatches = $('h3:contains("最寄り駅") + p', 'li').text().matchAll(/「(.*?)分/g);

    for (const match of stationMatches) {
      if (match[1].indexOf("バス") === -1 && match[1].indexOf("停") === -1) {
        let tempStation = match[1].match(/(.*?)」/)[1] + "駅";
        let tempWalkTime = match[1].match(/徒歩(.*)/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    }

    if (isNaN(output.listing.monthly_rent)) {
      throw "missing rent";
    }

    return output;
  }

  async parseTatoDesign(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = parseInt($('dt:contains("賃料") + dd').text().replace("円", "").replace(",", "").noSpace()) / 10000;
    output.listing.square_m = $('dt:contains("面積") + dd').text().replace("㎡", "").noSpace();
    output.listing.security_deposit = $('dt:contains("敷金／礼金") + dd').text().match(/(.*?)\s／/)[1].replace("ヶ月", "").replace("なし", "0").noSpace();
    output.listing.reikin =　$('dt:contains("敷金／礼金") + dd').text().match(/／\s(.*?)$/m)[1].replace("ヶ月", "").replace("なし", "0");

    let address = $('dt:contains("住所") + dd').text().noSpaces();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stations = $('p', 'dt:contains("交通") + dd');

    stations.each(function (i, elem) {
      const text = $(elem).text();

      if (text.indexOf("バス") === -1) {
        let tempStation = text.match(/「(.*?)」/)[1];
        let tempWalkTime = text.match(/徒歩(.*?)分/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    });

    return output;
  }

  async parseGoodroom(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = parseInt($('th:contains("家賃") + td').text().replace("円", "").replace(",", "")) / 10000;

    if (!output.listing.monthly_rent) {
      return null;
    }

    output.listing.square_m = $('th:contains("広さ") + td').text().replace("㎡", "").replace(/\n/g, "");
    output.listing.security_deposit = $('th:contains("敷金／礼金") + td').text().replace(/\n/g, "").match(/^(.*?)\s\//)[1].replace("ヶ月", "").replace("なし", "0");
    output.listing.reikin =　$('th:contains("敷金／礼金") + td').text().replace(/\n/g, "").match(/\/\s(.*?)$/)[1].replace("ヶ月", "").replace("なし", "0");

    if (output.listing.security_deposit.includes("万円")) {
      output.listing.security_deposit = (parseFloat(output.listing.security_deposit) / parseFloat(output.listing.monthly_rent)).toFixed(1);
    }

    if (output.listing.reikin.includes("万円")) {
      output.listing.reikin = (parseFloat(output.listing.reikin) / parseFloat(output.listing.monthly_rent)).toFixed(1);
    }

    let address = $('.address').text().replace(/\n/g, "").replace(/ー/g, "-");
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stations = $('li', '.traffic');

    stations.each(function (i, elem) {
      const text = $(elem).text();

      if (text.indexOf("バス") === -1) {
        let tempStation = text.match(/\s(.*?)駅/)[1] + "駅";
        let tempWalkTime = text.match(/徒歩(.*?)分/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    });

    return output;
  }

  async parseLifullHomes(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = $('#chk-bkc-moneyroom').text().match(/(.*?)万円/)[1];
    output.listing.square_m = $('#chk-bkc-housearea').text().replace("m²", "").noSpace();

    let security_deposit = $('#chk-bkc-moneyshikirei').text().match(/(.*?)\s\//)[1];
    let reikin = $('#chk-bkc-moneyshikirei').text().match(/\/\s(.*?)$/m)[1];

    if (security_deposit.includes("ヶ月")) {
      output.listing.security_deposit = security_deposit.replace("ヶ月", "");
    } else if (security_deposit.includes("-") || security_deposit.includes("無")) {
      output.listing.security_deposit = "0";
    } else if (security_deposit.includes("万円")) {
      output.listing.security_deposit = parseFloat(security_deposit.replace("万円", "")) / output.listing.monthly_rent;
    }

    if (reikin.includes("ヶ月")) {
      output.listing.reikin = reikin.replace("ヶ月", "");
    } else if (reikin.includes("-") || reikin.includes("無")) {
      output.listing.reikin = "0";
    } else if (reikin.includes("万円")) {
      output.listing.reikin = parseFloat(reikin.replace("万円", "")) / output.listing.monthly_rent;
    }

    let address = $('#chk-bkc-fulladdress').contents().first().text().replace(/[\s|\n]/gm, "");
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stations = $('p', '#chk-bkc-fulltraffic');

    stations.each(function (i, elem) {
      const text = $(elem).text();

      if (text.indexOf("バス") === -1 && text.indexOf("他に") === -1 && text.indexOf("通勤") === -1 && text.indexOf("km") === -1) {
        // because of outlier: "京成電鉄金町線 柴又 徒歩29分"
        // another outlier: "つくばエクスプレス 浅草駅 徒歩10分"
        // another outlier: "東京メトロ東西線落合駅徒歩５分"
        // another outlier: "ＪＲ総武線 平井駅 3.1km"
        let tempStation = text.match(/(?:\s|線)(.*?)徒歩/)[1].noSpace().replace("駅", "") + "駅";
        let tempWalkTime = text.match(/徒歩(.*?)分/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    });

    let property_type = $('#chk-bkh-type').text().replace("賃貸", "");

    if (property_type === "マンション") {
      output.property.property_type = "アパート";
    } else if (property_type === "テラスハウス") {
      output.property.property_type = "一戸建て";
    } else {
      output.property.property_type = property_type;
    }

    return output;
  }

  async parseJoylifestyle(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    if ($('.entry-title').text().includes("終了")) {
      throw "no longer available";
    }

    // output.listing.url = this.url.replace(/&shu=(.*?)$/,'');
    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = parseInt($('.dpoint4').text().match(/(.*?)円/)[1]) / 10000;
    output.listing.square_m = $('th:contains("面積") + td').text().replace("m²", "");

    var security_deposit = $('dt:contains("敷金") + dd').text();
    var reikin =　$('dt:contains("礼金") + dd').text();

    if (security_deposit.includes("ヶ月")) {
      output.listing.security_deposit = security_deposit.replace("ヶ月", "");
    } else if (security_deposit.includes("円")) {
      output.listing.security_deposit = Number((parseFloat(security_deposit.replace("円", "")) / 10000 / parseFloat(output.listing.monthly_rent)).toFixed(2)).toString();
    } else if (security_deposit === '') {
      output.listing.security_deposit = '0';
    }

    if (reikin.includes("ヶ月")) {
      output.listing.reikin = reikin.replace("ヶ月", "");
    } else if (reikin.includes("円")) {
      output.listing.reikin = Number((parseFloat(reikin.replace("円", "")) / 10000 / parseFloat(output.listing.monthly_rent)).toFixed(2)).toString();
    } else if (reikin === '') {
      output.listing.reikin = '0';
    }

    let address = $('th:contains("所在地") + td').text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stationMatches = $('th:contains("交通") + td').text().matchAll(/線(.*?)分/g);

    for (const match of stationMatches) {
      if (match[1].indexOf("バス") === -1) {
        let tempStation = match[1].match(/(.*?)駅/)[1] + "駅"
        let tempWalkTime = match[1].match(/徒歩(.*?)$/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    }

    let property_type = $('dt:contains("賃料") + dd + dd').text();

    if (property_type === "マンション") {
      output.property.property_type = "アパート";
    } else if (property_type === "テラスハウス") {
      output.property.property_type = "一戸建て";
    } else {
      output.property.property_type = property_type;
    }

    return output;
  }

  async parseDiyp(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    if ($("li.contact_area").text().includes("募集は終了しております")) {
      throw "no longer available";
    }

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = parseInt($('dt:contains("賃料：") + dd').text().replace("¥", "").replace(",", "")) / 10000;
    output.listing.square_m = $('dt:contains("面積：") + dd').text().replace("㎡", "");

    let security_deposit_reikin = $('p:contains("敷金：")').text().noSpace().replace(/\([^()]*\)/g, '').replace(/（[^（）]*）/, '');

    output.listing.security_deposit = security_deposit_reikin.match(/敷金：(.*?)礼金：/)[1].replace("ヶ月", "").replace("なし", "0").replace("-", "0");
    output.listing.reikin =　security_deposit_reikin.match(/礼金：(.*?)償却：/)[1].replace("ヶ月", "").replace("なし", "0").replace("-", "0");

    let address = $('dt:contains("所在地：") + dd').text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stationMatches = $('dt:contains("最寄駅：") + dd').text().matchAll(/「(.*?)分/g);

    for (const match of stationMatches) {
      if (match[1].indexOf("バス") === -1) {
        let tempStation = match[1].match(/(.*?)」/)[1] + "駅"
        let tempWalkTime = match[1].match(/徒歩(.*?)$/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    }

    return output;
  }

  async parsePetHomeWeb(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = $('.price-number').text();
    output.listing.square_m = $('th:contains("専有面積") + td').text().replace("㎡", "").noSpace();
    output.listing.closest_station = $('th:contains("交通") + td').text().match(/線(.*?)徒歩/)[1];
    output.listing.walking_time = $('th:contains("交通") + td').text().match(/徒歩(.*?)分/)[1];

    var security_deposit = $('th:contains("敷金/保証金") + td').text().replace(/(\r\n|\n|\r)/gm, "").noSpace().match(/(.*?)\//)[1];
    var reikin =　$('th:contains("礼金") + td').text().match(/(.*?)(\/|$)/)[1].replace("※税込", "");

    if (security_deposit.includes("ヶ月")) {
      output.listing.security_deposit = security_deposit.replace("ヶ月", "");
    } else if (security_deposit.includes("なし")) {
      output.listing.security_deposit = "0";
    } else if (security_deposit.includes("万円")) {
      output.listing.security_deposit = parseFloat(security_deposit.replace("万円", "")) / output.listing.monthly_rent;
    }

    if (reikin.includes("ヶ月")) {
      output.listing.reikin = reikin.replace("ヶ月", "");
    } else if (reikin.includes("なし")) {
      output.listing.reikin = "0";
    } else if (reikin.includes("万円")) {
      output.listing.reikin = parseFloat(reikin.replace("万円", "")) / output.listing.monthly_rent;
    }

    let property_type = $('th:contains("物件種目") + td').text().replace("賃貸", "");

    if (property_type === "戸建") {
      output.property.property_type = "一戸建て";
    } else if (property_type === "マンション" || property_type === "アパート") {
      output.property.property_type = "アパート";
    }

    let address = $('th:contains("所在地") + td').text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    return output;
  }

  async parseBunkyoku(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = $('span.num._color-main').text().replace("万円", "").noSpace();

    if (output.listing.monthly_rent.includes("要問い合わせ")) {
      throw "no longer available";
    }

    output.listing.square_m = $('th:contains("面積") + td').text().replace("㎡", "");
    output.listing.security_deposit = $('th:contains("敷金") + td').text().replace("ヶ月", "");
    output.listing.reikin = $('th:contains("礼金") + td').text().replace("ヶ月", "");

    let stationMatches = $('th:contains("交通") + td').text().matchAll(/線(.*?)分/g);

    for (const match of stationMatches) {
      if (match[1].indexOf("バス") === -1) {
        let tempStation = match[1].match(/-\s(.*?)駅/)[1] + "駅";
        let tempWalkTime = match[1].match(/徒.*?(\d+).*$/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    }

    let property_type = $('th:contains("物件種別") + td').text();

    if (property_type === "マンション") {
      output.property.property_type = "アパート";
    }

    let address = $('th:contains("所在地") + td').text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    return output;
  }

  async parseTomigaya(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    let monthly_rent = $('th:contains("賃料") + td').text();

    if ($('.attention').text() !== "") {
      throw "no longer available";
    } else if (monthly_rent == "契約済み") {
      throw "no longer available";
    }

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = parseInt(monthly_rent.replace("円", "").replace(",", "")) / 10000;
    output.listing.square_m = $('th:contains("専有面積") + td').text().replace("m²", "").noSpace();
    output.listing.security_deposit = $('th:contains("敷金") + td').text().replace("ヶ月", "").replace("なし", "0");
    output.listing.reikin = $('th:contains("礼金") + td').text().replace("ヶ月", "").replace("なし", "0");

    let property_type = $('th:contains("物件タイプ") + td').text();

    if (property_type === "マンション") {
      output.property.property_type = "アパート";
    } else if (property_type === "戸建/テラスハウス") {
      output.property.property_type = "一戸建て";
    }

    let address = $('th:contains("所在地") + td').text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stationMatches = $('th:contains("最寄り駅") + td').text().matchAll(/線(.*?)分/g);

    for (const match of stationMatches) {
      if (match[1].indexOf("バス") === -1) {
        let tempStation = match[1].match(/\s(.*?)\s/)[1] + "駅"
        let tempWalkTime = match[1].match(/\s(.*?)$/)[1].match(/\s(.*?)$/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    }

    return output;
  }

  async parseJKHome(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = parseInt($('th:contains("賃料・価格") + td').text().match(/:(.*?)円/)[1].replace(",", "").replace("税込", "")) / 10000;
    output.listing.square_m = $('th:contains("間取り") + td').text().match(/（(.*?)\)/)[1].replace("㎡", "");
    output.listing.security_deposit = $('th:contains("諸費用") + td').text().replace("なし", "0").replace("無し", "0").convertHalfWidth().match(/(\d)/g)[0];
    output.listing.reikin = $('th:contains("諸費用") + td').text().replace("なし", "0").replace("無し", "0").convertHalfWidth().match(/(\d)/g)[1];

    let property_type = $('p.address').text().match(/\[(.*?)\]/)[1].replace("賃貸", "");

    if (property_type === "マンション") {
      output.property.property_type = "アパート";
    } else if (property_type === "戸建て") {
      output.property.property_type = "一戸建て";
    }

    let address = $('th:contains("住 所") + td').text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stationMatches = $('th:contains("アクセス") + td').text().matchAll(/[【｢『「\s](.*?)分/g);

    for (const match of stationMatches) {
      if (match[1].indexOf("バス") === -1) {
        let tempStation = match[1].match(/(.*?)[】」』｣\s]/)[1].replace("駅", "") + "駅";
        let tempWalkTime = match[1].convertHalfWidth().match(/[」】』]*(\d+)/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    }

    return output;
  }

  async parseKodateChintai(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = $('.EstateDetail-Sec1-RentFee').text().noSpace().match(/(.*?)万円/)[1];
    output.listing.square_m = $('dd:contains("広さ")').text().match(/広さ：(.*?)㎡/)[1];
    output.listing.security_deposit = $('p:contains("敷")').text().replace("敷", "").replace("ヶ月", "").replace("無", "0").replace("--", "0");
    output.listing.reikin = $('p:contains("礼")').text().replace("礼", "").replace("ヶ月", "").replace("無", "0").replace("--", "0");

    let property_type = $('dt:contains("種別") + dd').text();

    if (property_type === "一戸建") {
      output.property.property_type = "一戸建て";
    }

    let address = $('dt:contains("住所") + dd').text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    output.listing.closest_station = $('dt:contains("交通機関") + dd').text().match(/線\s(.*?)(?:\s|\/)/)[1].replace("駅", "") + "駅";
    output.listing.walking_time = $('dt:contains("交通機関") + dd').text().match(/徒歩(.*?)分/)[1];

    return output;
  }

  async parseHouseAsocio(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    let title_text = $('.entry-title').text();

    if (title_text.includes("ご成約済")) {
      throw "no longer available";
    }

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.property.property_type = "一戸建て";
    output.listing.monthly_rent = title_text.match(/】(.*?)万円/)[1];
    output.listing.square_m = $('td:contains("専有面積") + td').text().replace("平米", "");
    output.listing.security_deposit = $('td:contains("敷金/礼金") + td').text().match(/(.*?)\//)[1].replace("ヶ月", "");
    output.listing.reikin = $('td:contains("敷金/礼金") + td').text().match(/\/(.*?)$/)[1].replace("ヶ月", "");

    let address = title_text.match(/【(.*?)】/)[1].replace("戸建", "");
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    output.listing.closest_station = title_text.match(/^(.*?)の/)[1];
    output.listing.walking_time = $('p:contains("' + output.listing.closest_station + '"):contains("徒歩")').text().match(/徒歩(.*?)分/)[1];

    return output;
  }

  async parseHouseGoo(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = $('th:contains("賃料") + td').text().match(/^(.*?)万円/)[1];
    output.listing.square_m = $('th:contains("面積") + td').first().text().replace("m2", "");
    output.listing.security_deposit = $('th:contains("礼金・敷金") + td').text().match(/^(.*?)\s\//)[1].replace("ヶ月", "").replace("なし", "0");
    output.listing.reikin = $('th:contains("礼金・敷金") + td').text().match(/\/\s(.*?)$/)[1].replace("ヶ月", "").replace("なし", "0");

    let property_type = $('.h1_title_box-type').text().replace("賃貸", "");

    if (property_type === "マンション") {
      output.property.property_type = "アパート";
    }

    let address = $('th:contains("所在地") + td').first().text().match(/^(.*?)周辺地図/m)[1];
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stations = $('.access-list', '.detail_outline-data-sep2').children();

    stations.each(function (i, elem) {
      const text = $(elem).text();

      if (text.indexOf("バス") === -1) {
        let tempStation = text.match(/\s(.*?)\s徒歩/)[1];
        let tempWalkTime = text.match(/徒歩(.*?)分/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    });

    return output;
  }

  async parseSpacelist(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = parseInt($('.fsL').eq(0).text().replace("¥", "").replace(",", "")) / 10000;
    output.listing.square_m = $('.fsL').eq(2).text().replace("m2", "");
    output.listing.security_deposit = $('li:contains("敷金")').text().match(/：(.*?)ヶ月/)[1];
    output.listing.reikin = $('li:contains("礼金")').text().match(/：(.*?)ヶ月/)[1];

    let property_type = $('li:contains("建物種類")').text().match(/：(.*?)$/)[1];

    if (property_type === "マンション") {
      output.property.property_type = "アパート";
    } else {
      output.property.property_type = property_type;
    }

    let address = $('dt:contains("所在地：") + dd').text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stationMatches = $('dt:contains("最寄駅：") + dd').text().matchAll(/「(.*?)分/g);

    for (const match of stationMatches) {
      if (match[1].indexOf("バス") === -1) {
        let tempStation = match[1].match(/^(.*?)」/)[1] + "駅";
        let tempWalkTime = match[1].match(/徒歩(.*?)$/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    }

    return output;
  }

  async parseSumaity(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = $('th:contains("賃料") + td').eq(0).text().match(/^(.*?)万円/)[1];
    output.listing.square_m = $('th:contains("専有面積") + td').eq(0).text().replace("m2", "");

    let security_deposit = $('th:contains("敷金/礼金") + td').text().match(/^(.*?)\//)[1];
    let reikin = $('th:contains("敷金/礼金") + td').text().match(/\/(.*?)$/)[1];

    if (security_deposit.includes("ヶ月")) {
      output.listing.security_deposit = security_deposit.replace("ヶ月", "");
    } else if (security_deposit.includes("-")) {
      output.listing.security_deposit = "0";
    } else if (security_deposit.includes("万円")) {
      output.listing.security_deposit = parseFloat(security_deposit.replace("万円", "")) / output.listing.monthly_rent;
    }

    if (reikin.includes("ヶ月")) {
      output.listing.reikin = reikin.replace("ヶ月", "");
    } else if (reikin.includes("-")) {
      output.listing.reikin = "0";
    } else if (reikin.includes("万円")) {
      output.listing.reikin = parseFloat(reikin.replace("万円", "")) / output.listing.monthly_rent;
    }

    let property_type = $('th:contains("種別") + td').text();

    if (property_type === "マンション") {
      output.property.property_type = "アパート";
    } else if (property_type.includes('一戸建て')){
      output.property.property_type = "一戸建て";
    } else {
      output.property.property_type = property_type;
    }

    let address = $('th:contains("所在地") + td').eq(0).text().replace("地図・周辺情報", "").noSpace();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stations = $('th:contains("交通") + td').eq(0).children();

    stations.each(function (i, elem) {
      if ($(elem).text().indexOf("バス") === -1) {
        let tempStation = $(elem).children().eq(1).text();
        let tempWalkTime = $(elem).children().eq(2).text().match(/徒歩(.*?)分/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    });

    return output;
  }

  async parseKenCorp(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = parseInt($('th:contains("賃料/管理費") + td').text().match(/^(.*?)円/)[1].replace(",", "")) / 10000;
    output.listing.square_m = $('th:contains("専有面積") + td').text().match(/^(.*?)㎡/)[1];
    output.listing.security_deposit = $('th:contains("敷金/礼金") + td').text().match(/^(.*?)\s\//)[1].replace("ヶ月", "").replace("無", "0");
    output.listing.reikin = $('th:contains("敷金/礼金") + td').text().match(/\/\s(.*?)$/)[1].replace("ヶ月", "").replace("無", "0");
    output.property.property_type = "アパート";

    let address = $('th:contains("住所") + td').text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stationMatches = $('th:contains("最寄駅") + td').text().matchAll(/線(.*?)分/g);

    for (const match of stationMatches) {
      if (match[1].indexOf("バス") === -1) {
        let tempStation = match[1].match(/^\s(.*?)\s/)[1];
        let tempWalkTime = match[1].match(/徒歩(.*?)$/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    }

    return output;
  }

  async parseBestex(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = parseInt($('th:contains("賃料") + td').first().text().match(/^(.*?)円/)[1].replace(",", "")) / 10000;
    output.listing.square_m = $('th:contains("面積") + td').first().text().match(/^(.*?)㎡/)[1];
    output.listing.security_deposit = $('th:contains("敷金") + td').text().match(/(\d+).*/)[1];
    output.listing.reikin = $('th:contains("礼金") + td').text().replace("ヶ月", "");
    output.property.property_type = "アパート";

    let address = $('th:contains("住所") + td').text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stationMatches = $('th:contains("最寄駅") + td').text().matchAll(/線(.*?)分/g);

    for (const match of stationMatches) {
      if (match[1].indexOf("バス") === -1) {
        let tempStation = match[1].match(/^\s(.*?)\s/)[1];
        let tempWalkTime = match[1].match(/徒歩(.*?)$/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    }

    return output;
  }

  async parseSmocca(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = $('.typo_color_orange_a', 'th:contains("賃料/管理費等") + td').text().replace("万円", "");
    output.listing.square_m = $('th:contains("面積") + td').eq(0).text().replace("m²", "");
    output.listing.security_deposit = parseFloat($('th:contains("敷金") + td').text().replace("万円", "").replace("無料", "0")) / output.listing.monthly_rent;
    output.listing.reikin = parseFloat($('th:contains("礼金") + td').text().replace("万円", "").replace("無料", "0")) / output.listing.monthly_rent;

    let property_type = $('th:contains("種別/構造") + td').text().match(/^(.*?)\//)[1];

    if (property_type.includes('マンション') || property_type.includes('アパート')) {
      output.property.property_type = "アパート";
    } else if (property_type.includes('一戸建')) {
      output.property.property_type = "一戸建て";
    }

    let address = $('div', 'th:contains("所在地") + td').first().text().noSpace();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stationMatches = $('th:contains("主要交通機関") + td').text().matchAll(/\/(.*?)分/g);

    for (const match of stationMatches) {
      if (match[1].indexOf("バス") === -1) {
        let tempStation = match[1].match(/^(.*?)\s/)[1].replace("駅", "") + "駅";
        let tempWalkTime = match[1].match(/歩(.*?)$/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    }

    return output;
  }

  async parseAxelHome(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";

    let monthly_rent = $('th:contains("賃料") + td').text();
    let square_m = $('th:contains("面積") + td').text();
    let security_deposit = $('th:contains("敷金") + td').text();
    let reikin = $('th:contains("礼金") + td').text();

    if (!monthly_rent.includes("〜")) {
      output.listing.monthly_rent = parseInt(monthly_rent.match(/(.*?)円/)[1].replace("，", "").convertHalfWidth()) / 10000;
    } else if (!monthly_rent.includes("円")) {
      return null;
    }

    if (!square_m.includes("〜")) {
      output.listing.square_m = square_m.match(/^(.*?)㎡/)[1].convertHalfWidth();
    }

    if (!security_deposit.includes("〜")) {
      output.listing.security_deposit = security_deposit.replace("ヶ月", "").convertHalfWidth();
    }

    if (!reikin.includes("〜")) {
      output.listing.reikin = reikin.replace("ヶ月", "").convertHalfWidth();
    }

    output.property.property_type = "アパート";

    let address = $('th:contains("所在地") + td').text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stationMatch = $('th:contains("交通") + td').text().match(/線(.*?)分/)[1];
    output.listing.closest_station = stationMatch.match(/^(.*?)駅/)[0].replace("　", "");
    output.listing.walking_time = stationMatch.match(/徒歩(.*?)$/)[1].convertHalfWidth();

    return output;
  }

  async parseHousesTokyo(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    if ($('.contact_area').eq(0).text().includes("募集は終了しております")) {
      throw "no longer available";
    }

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = parseInt($('dt:contains("賃料：") + dd').text().replace("¥", "").replace(",", "")) / 10000;
    output.listing.square_m = $('dt:contains("建物面積：") + dd').text().replace("㎡", "");
    output.listing.security_deposit = $('p:contains("敷金：")').text().match(/敷金：(.*?)ヶ月/)[1];
    output.listing.reikin = $('p:contains("敷金：")').text().match(/礼金：(.*?)ヶ月/)[1];
    output.property.property_type = "一戸建て";

    let address = $('dt:contains("住所：") + dd').text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stationMatches = $('dt:contains("最寄駅：") + dd').text().matchAll(/「(.*?)分/g);

    for (const match of stationMatches) {
      if (match[1].indexOf("バス") === -1) {
        let tempStation = match[1].match(/^(.*?)」/)[1] + "駅";
        let tempWalkTime = match[1].match(/徒歩(.*?)$/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    }

    return output;
  }

  async parseChintaiEx(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = $('th:contains("賃料/管理費等") + td').text().match(/(.*?)万円/)[1].replace(/\s/g,"");
    output.listing.square_m = $('th:contains("間取り/面積") + td').text().match(/\/\s(.*?)m²/)[1];

    let security_deposit = $('th:contains("敷金") + td').text();
    let reikin = $('th:contains("礼金") + td').text();

    if (security_deposit.includes("無料")) {
      output.listing.security_deposit = 0;
    } else {
      output.listing.security_deposit = parseFloat(security_deposit.replace("万円", "")) / output.listing.monthly_rent;
    }

    if (reikin.includes("無料")) {
      output.listing.reikin = 0;
    } else {
      output.listing.reikin = parseFloat(reikin.replace("万円", "")) / output.listing.monthly_rent;
    }

    let property_type = $('th:contains("種別/構造") + td').text().match(/(.*?)\//)[1];

    if (property_type === 'マンション') {
      output.property.property_type = 'アパート';
    } else if (property_type === '一戸建' || property_type === 'テラスハウス') {
      output.property.property_type = '一戸建て';
    } else {
      output.property.property_type = property_type;
    }

    let address = $('th:contains("所在地") + td').text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stationMatches = $('th:contains("主要交通機関") + td').text().matchAll(/\/(.*?)分/g);

    for (const match of stationMatches) {
      if (match[1].indexOf("バス") === -1) {
        let tempStation = match[1].match(/^(.*?)\s/)[1].replace("駅", "") + "駅";
        let tempWalkTime = match[1].match(/(\d+)/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    }

    return output;
  }

  async parseHatomarkSite(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = $('th:contains("賃料") + td').text().replace("万円", "");
    output.listing.square_m = $('th:contains("専有面積") + td').text().replace("㎡", "");
    output.listing.security_deposit = $('th:contains("敷金／保証金") + td').text().match(/(.*?)／/)[1].replace("ヶ月", "").replace("なし", "0");
    output.listing.reikin = $('th:contains("礼金") + td').text().replace("ヶ月", "").replace("なし", "0");

    let property_type = $('th:contains("物件種目") + td').text().replace("貸", "");

    if (property_type === 'マンション') {
      output.property.property_type = 'アパート';
    } else if (property_type === '戸建住宅' || property_type === 'テラスハウス') {
      output.property.property_type = '一戸建て';
    } else {
      output.property.property_type = property_type;
    }

    let address = $('th:contains("所在地") + td').text().match(/\n(.*?)\n/)[1].replace(/\s/g,"");
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    output.listing.closest_station = $('th:contains("交通") + td').text().replace(/^\s+/g, "").match(/\s(.*?)\s徒/)[1];
    output.listing.walking_time = $('th:contains("交通") + td').text().match(/徒歩(.*?)分/)[1];

    return output;
  }

  async parseCentury21(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = $('th:contains("賃料") + td').text().replace("万円", "");
    output.listing.square_m = $('th:contains("建物/専有面積") + td').eq(1).text().match(/^(.*?)m²/m)[1].replace(/[\t|\n]/gm, "");
    output.listing.security_deposit = $('th:contains("敷金/礼金") + td').text().match(/(.*?)\//)[1].replace("ヶ月", "").replace("なし", "0").replace(/[\t|\n]/gm, "");
    output.listing.reikin = $('th:contains("敷金/礼金") + td').text().match(/\/(.*?)$/)[1].replace("ヶ月", "").replace("なし", "0").replace(/[\t|\n]/gm, "");

    let property_type = $('th:contains("物件種目") + td').text();

    if (property_type === 'マンション') {
      output.property.property_type = 'アパート';
    } else if (property_type === '貸家') {
      output.property.property_type = '一戸建て';
    } else {
      output.property.property_type = property_type;
    }

    let address = $('th:contains("所在地") + td').text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    output.listing.closest_station = $('ul','th:contains("アクセス") + td').eq(0).children().eq(0).text().match(/^(.*?)\s徒/m)[1].replace(/[\t|\n]/gm, "");
    output.listing.walking_time = $('ul','th:contains("アクセス") + td').eq(0).children().eq(0).text().match(/徒歩(.*?)分/m)[1].replace(/[\t|\n]/gm, "");

    return output;
  }

  async parseHouseOCN(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = $('th:contains("賃料") + td').text().replace("万円", "");
    output.listing.square_m = $('th:contains("専有面積") + td').text().replace("㎡", "");

    var security_deposit = $('th:contains("敷金") + td').text();
    var reikin =　$('th:contains("礼金") + td').text();

    if (security_deposit.includes("ヶ月")) {
      output.listing.security_deposit = security_deposit.replace("ヶ月", "");
    } else if (security_deposit.includes("なし")) {
      output.listing.security_deposit = "0";
    } else if (security_deposit.includes("万円")) {
      output.listing.security_deposit = parseFloat(security_deposit.replace("万円", "")) / output.listing.monthly_rent;
    }

    if (reikin.includes("ヶ月")) {
      output.listing.reikin = reikin.replace("ヶ月", "");
    } else if (reikin.includes("なし")) {
      output.listing.reikin = "0";
    } else if (reikin.includes("万円")) {
      output.listing.reikin = parseFloat(reikin.replace("万円", "")) / output.listing.monthly_rent;
    }

    let property_type = $('tbody').eq(0).children().eq(1).children().eq(4).text().match(/^(.*?)\n/)[1].replace("賃貸", "");

    if (property_type === 'マンション') {
      output.property.property_type = 'アパート';
    } else if (property_type === 'テラスハウス') {
      output.property.property_type = '一戸建て';
    } else {
      output.property.property_type = property_type;
    }

    let address = $('th:contains("住所") + td').children().eq(0).text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    output.listing.closest_station = $('ul','th:contains("交通機関") + td').children().eq(0).text().match(/線\s(.*?)\s徒/m)[1];
    output.listing.walking_time = $('ul','th:contains("交通機関") + td').children().eq(0).text().match(/徒歩(.*?)分/m)[1];

    return output;
  }

  async parseOasisEstate(html) {

    const $ = cheerio.load(html);
    const output = cloneDeep(dataStruct);

    output.listing.url = this.url;
    output.listing.availability = "募集中";
    output.listing.monthly_rent = parseInt($('th:contains("月額賃料 (坪単価)") + td').text().replace(/[\t|\n]/gm, "").match(/^(.*?)円/)[1].replace(",", "")) / 10000;
    output.listing.square_m = $('th:contains("専有面積") + td').text().match(/\((.*?)㎡/)[1];
    output.listing.reikin = $('th:contains("礼金") + td').text().replace("ヶ月", "");

    let security_deposit = $('th:contains("保証金") + td').text().replace(/ヶ月/g, "");

    if (security_deposit.includes('住居')) {
      output.listing.security_deposit = security_deposit.match(/住居(.*?)$/)[1]
    } else {
      output.listing.security_deposit = security_deposit;
    }

    let address = $('th:contains("所在地") + td').text();
    address = await util.parseAddress(address);
    output.property = util.updateFields(output.property, address);

    let stationMatches = $('th:contains("交通アクセス") + td').text().matchAll(/\/(.*?)分/g);

    for (const match of stationMatches) {
      if (match[1].indexOf("バス") === -1) {
        let tempStation = match[1].match(/^\s(.*?)\s徒歩約/)[1];
        let tempWalkTime = match[1].match(/徒歩約(.*?)$/)[1];

        if (output.listing.closest_station === "") {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        } else if (parseFloat(output.listing.walking_time) > parseFloat(tempWalkTime)) {
          output.listing.closest_station = tempStation;
          output.listing.walking_time = tempWalkTime;
        }
      }
    }

    return output;
  }
}

module.exports = {
    scrape
};
