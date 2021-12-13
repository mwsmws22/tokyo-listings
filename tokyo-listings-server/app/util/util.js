const japa = require('jp-address-parser');
const cloneDeep = require('clone-deep');
const property = {
  prefecture: "",
  municipality: "",
  town: "",
  district: "",
  block: "",
  house_number: "",
  property_type: ""
}

module.exports = {
  parseAddress: async function (address) {
    let parseRes = await japa.parse(address).catch(e => { });

    if (!parseRes) {
      parseRes = await japa.parse("東京都" + address).catch(e => { });
    }

    if (!parseRes) {
      parseRes = await japa.parse("千葉県" + address).catch(e => { });
    }

    if (!parseRes) {
      parseRes = await japa.parse("神奈川県" + address).catch(e => { });
    }

    if (parseRes) {
      prop = cloneDeep(property)
      prop.prefecture = parseRes.prefecture ? parseRes.prefecture : "";
      prop.municipality = parseRes.city ? parseRes.city : "";
      prop.town = parseRes.town ? parseRes.town : "";
      prop.district = parseRes.chome ? parseRes.chome : "";
      prop.block = parseRes.ban ? parseRes.ban : "";
      prop.house_number = parseRes.go ? parseRes.go : "";
      return prop
    }
  },
  removeNullProps: function (obj) {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== null && v !== ""));
  }
}
