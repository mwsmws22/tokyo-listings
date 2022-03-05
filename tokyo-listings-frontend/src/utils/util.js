const imageSites = [
  'suumo.jp',
  'www.athome.co.jp',
  'www.realtokyoestate.co.jp',
  'sumaity.com'
]

export function removeNullProps(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== null && v !== ""));
}

export function replaceNullProps(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => v === null ? [k, ""] : [k, v]));
}

export function removeDateFields(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([k, _]) => k !== "updatedAt" && k !== "createdAt"));
}

export function isUrlValid(url) {
    return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(url);
}

export function formatAddress(p) {
  let address = p.prefecture + p.municipality + p.town;

  if (p.district) {
    address += p.district + "丁目";
  }
  if (p.block) {
    address += p.block;
    if (p.house_number) {
      address += "-" + p.house_number;
    }
  } else if (p.house_number) {
    address += p.house_number;
  }

  return address;
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//list_item_height: hover over list item in inspect element in Chrome
//non_list_height: guesstimate
export function scrollMagic(window_height, list_item_height, non_list_height) {
  let listItems = ~~((window_height-non_list_height)/list_item_height);
  if (listItems === 0) {listItems=1;}
  let listHeight = (listItems*list_item_height)+1;
  return listHeight;
}

export function checkForImages(url) {
  return imageSites.some(i => url.includes(i))
}
