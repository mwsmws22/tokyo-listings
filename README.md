# TKL (tokyo-listings)

### Introduction
TKL is a web application I built to organize and archive **rental** real estate listings for properties in Tokyo. My use case was for Tokyo, but this application can easily be repurposed for any location in the world with a little tweaking. 

![tkl-scren](https://github.com/mwsmws22/tokyo-listings/assets/17870112/5b5cd86e-2b2f-4a91-9651-924fdd5ef4a6)

## Requirements
- Node JS
- Javascript
- Postgres

## Start Up Guide

1. Clone repo
2. Run `tokyo-listings-bat-files\installAllModules.bat`
    - Make sure to update the path in the script: `set "dir=C:\Users\me\Documents\GitHub\tokyo-listings\"`
3. Create `tokyo-listings-frontend\\.env`
    - Populate like so:
    - `REACT_APP_GOOGLE_MAPS_API_KEY="API_KEY_GOES_HERE"`
    - `PORT=8081`
4. Create `tokyo-listings-server\app\config\db.config.js`
    - A template is given, see `tokyo-listings-server\app\config\db.config.template.js`
    - I use an Amazon AWS PostgreSQL database, but a local DB can also easily be used
5. Run `tokyo-listings-bat-files\runTokyoListings.bat`
    - Make sure to update the path in the script: `set "dir=C:\Users\me\Documents\GitHub\tokyo-listings\"`

## Modules
#### Core
- **tokyo-listings-frontend**: React UI frontend for main TKL application
- **tokyo-listings-server**: NodeJS/Express backend for main TKL application

#### Extras
- **tokyo-listings-bat-files**: contains scripts for startup and installing node packages
- **tokyo-listings-extension**: an companion Google Chrome extension that checks the DB for listings while browsing in real time
- **tokyo-listing-hotkeys**: an AutoHotkey script that provides shortcut for saving down website HTML and assets

#### Ignore
- **tokyo-listings-database-backup**: my own SQL backup of listings (thousands), can be used for testing data
- **tokyo-listings-queries**: just a place to store random SQL queries
- **tokyo-listings-scripts**: just some random Python scripts

## Key Features
#### Scrape and save listings in SQL database 
- Scraping is supported on 40 Japanese real estate sites, see below
- User defined input is also accepted (for supported and non-supported sites)
- Checks DB if listing is already added based on URL. Will reject if already added
- Checks DB for any similar listings. If it is indeed the same property, you can click the "same" button in the pop-up in to associate the listing with this property
- Based on the listing's address, the application will estimate where the property is. The user can adjust move the pin on the map to exactly where the property is, if known, using the "Set Coordinates" button
- If adding multiple listings in one go, previously added listings will accumulate in "Previous Entries" section
- If you are using the above AHK script and have saved the listing assets locally, you can click "Previous Images" after adding a listing to view the pictures
- If you are using the AHK script, you can also click "Images" buttons in the "Similar Listings" pop-up to make a visual determination if it's the same property

#### Other
- Plot listings on interactive map using Google Maps API
- Associate mutliple listings with a single property (i.e. multiple listings for the same unit on different sites)
- Filter listings using any combination of fields such as user-defined interest, distance from nearest station, rent, etc.

#### Chrome extension (optional)
- Companion extension to TKL application that performs various jobs in real time when browsing real estate site (see supported sites below)
- Removes listings from page that are already entered in DB
- Highlights listings that are similar to properties that are already entered in DB
- When browsing Google, it removes results from sites that are not scrapable
- Works in conjunction with AHK script to automatically send listing to TKL application (Ctrl+Shift+9)

## Google Maps API
Within the [Google Maps Platfrom](https://mapsplatform.google.com/), you will need to enable two APIs for the TKL application.

1. [Geocoding API](https://developers.google.com/maps/documentation/geocoding)
2. [Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)

For a typical user, the volume of API calls will be well within the 'free' quota.

Once these APIs are enabled, your universal API key can be retrieved from the "Keys & Credentials" page.

## Scrapable sites

Most of these scrapers were written over a year ago, so there is a chance some are now broken if a website has changed their UI code.

1. アエラスグループ: https://www.aeras-group.jp/
2. アットホーム: https://www.athome.co.jp/
3. アクセルホーム: https://www.axel-home.com/
4. ベステックス: https://www.bestexnet.co.jp/
5. 文京区不動産: https://xn--ihqxo86hrls96efnv.com/ 
6. センチュリー21: https://www.century21.jp/
7. CHINTAI: https://www.chintai.net/
8. 賃貸EX: https://chintai-ex.jp/
9. DIYP: https://www.diyp.jp/
10. グッドルーム: https://www.goodrooms.jp/
11. ハトマークサイト: https://www.hatomarksite.com/
12. アソシオ: https://house.asocio.co.jp/
13. goo住宅・不動産: https://house.goo.ne.jp/
14. OCN不動産: https://house.ocn.ne.jp/
15. HOUSES: https://housestokyo.jp/
16. 実用春日ホーム: https://www.jkhome.jp/
17. ジョイライフスタイル: https://joylifestyle.jp/
18. ケン・コーポレーション: https://www.kencorp.co.jp/
19. こだて賃貸 - 賃貸スタイル: https://kodate.chintaistyle.jp/ 
20. LIFULL HOME'S: https://www.homes.co.jp/
21. オアシス: https://www.oasis-estate.jp/
22. omusubi不動産: https://www.omusubi-estate.com/
23. ペットホームウェブ: https://www.pethomeweb.com/
24. 東京R不動産: https://www.realtokyoestate.co.jp/
25. 三井のリハウス: https://www.rehouse.co.jp/
26. リノベ百貨店: https://www.renov-depart.jp/
27. R-STORE: https://www.r-store.jp/
28. 賃貸スモッカ: https://smocca.jp/
29. SPACELIST: https://spacelist.jp/
30. スマイティ: https://sumaity.com/
31. SUUMO: https://suumo.jp/
32. TATO DESIGN: https://www.tatodesign.jp/
33. 東京スタイルCC: https://tokyo-style.cc/
34. 富ヶ谷不動産: https://tomigaya.jp/
35. 東京デザイナーズ生活: https://tokyo-designers.com/
36. えびす不動産: https://east-and-west.jp/
37. 創作空間: http://www.sousaku-kukan.com/
38. 青山不動産: https://aoyama-fudousan.com/
39. 神楽坂不動産: http://kagurazaka-fudousan.com/
40. Yahoo!不動産: https://realestate.yahoo.co.jp/

## Extension supported sites
Wildcards (*) determine URL pattern used when deciding whether to trigger the extension.

1. Yahoo!不動産: `https://realestate.yahoo.co.jp/rent/search/*`
2. Google: `https://www.google.com/search*`
3. SUUMO: `https://suumo.jp/jj/chintai/ichiran/FR301FC001/*`
4. SUUMO: `https://suumo.jp/library/*/to_*`
5. スマイティ: `https://sumaity.com/chintai/*_list/*`
6. スマイティ: `https://sumaity.com/chintai/*_bldg/bldg*`
7. スマイティ: `https://sumaity.com/chintai/*_prop/prop_*`
8. R-STORE: `https://www.r-store.jp/search*`
9. 東京R不動産: `https://www.realtokyoestate.co.jp/estate_search*`
10. アットホーム: `https://www.athome.co.jp/chintai/*/list/*`
