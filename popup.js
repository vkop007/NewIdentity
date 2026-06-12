const MAIL_TM_BASE = 'https://api.mail.tm';
const MAIL_TM_FALLBACK_DOMAINS = ['wshu.net'];
const CATCHMAIL_BASE = 'https://api.catchmail.io';
const CATCHMAIL_DOMAIN = 'catchmail.io';
const AUTOFILL_ORIGINS = ['http://*/*', 'https://*/*'];
const AUTOFILL_SCRIPT_ID = 'new-identity-auto-fill';
const SPOOF_SCRIPT_ID = 'new-identity-spoof';
const DEFAULT_PROXY_COUNTRY = 'US';
const PRIVATE_CARD_FILE = 'private-card.json';
const INBOX_REFRESH_INTERVAL_MS = 12_000;

const STORAGE_KEYS = {
  identity: 'newIdentity.current',
  history: 'newIdentity.history',
  settings: 'newIdentity.settings',
  otp: 'newIdentity.latestOtp',
  proxy: 'newIdentity.proxy',
};

const DEFAULT_SETTINGS = {
  country: 'US',
  nameStyle: 'any',
  saveHistory: true,
  autoCopy: false,
  autoFill: false,
  cardAutoFill: false,
  antiFingerprint: true,
};

const COUNTRY_OVERRIDES = {
  US: {
    label: 'United States',
    states: ['California', 'New York', 'Texas', 'Florida', 'Washington', 'Illinois'],
    cities: ['San Diego', 'Austin', 'Seattle', 'Chicago', 'Brooklyn', 'Miami'],
    streets: ['Maple Avenue', 'Cedar Street', 'Lakeview Road', 'Pine Lane', 'Sunset Drive'],
    postal: () => String(rand(10000, 99999)),
    phone: () => `+1 ${rand(201, 989)}-${rand(200, 999)}-${rand(1000, 9999)}`,
  },
  IN: {
    label: 'India',
    states: ['Maharashtra', 'Delhi', 'Karnataka', 'Gujarat', 'Tamil Nadu', 'Rajasthan'],
    cities: ['Mumbai', 'Delhi', 'Bengaluru', 'Ahmedabad', 'Chennai', 'Jaipur'],
    streets: ['MG Road', 'Park Street', 'Nehru Marg', 'Station Road', 'Lake View Road'],
    postal: () => String(rand(110001, 855999)),
    phone: () => `+91 ${rand(70000, 99999)} ${rand(10000, 99999)}`,
  },
  GB: {
    label: 'United Kingdom',
    states: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
    cities: ['London', 'Manchester', 'Bristol', 'Leeds', 'Edinburgh', 'Cardiff'],
    streets: ['High Street', 'Church Road', 'Station Road', 'Victoria Street', 'King Street'],
    postal: () => `${pick(['SW', 'NW', 'M', 'BS', 'LS'])}${rand(1, 19)} ${rand(1, 9)}${pick('ABCDEFGHJKLMNPQRSTUVWXYZ'.split(''))}${pick('ABCDEFGHJKLMNPQRSTUVWXYZ'.split(''))}`,
    phone: () => `+44 7${rand(100, 999)} ${rand(100000, 999999)}`,
  },
  CA: {
    label: 'Canada',
    states: ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Nova Scotia'],
    cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa', 'Halifax'],
    streets: ['Queen Street', 'King Street', 'Granville Street', 'Jasper Avenue', 'Main Street'],
    postal: () => `${pick('ABCEGHJKLMNPRSTVXY'.split(''))}${rand(1, 9)}${pick('ABCEGHJKLMNPRSTVWXYZ'.split(''))} ${rand(1, 9)}${pick('ABCEGHJKLMNPRSTVWXYZ'.split(''))}${rand(1, 9)}`,
    phone: () => `+1 ${rand(204, 905)}-${rand(200, 999)}-${rand(1000, 9999)}`,
  },
  AU: {
    label: 'Australia',
    states: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia'],
    cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
    streets: ['George Street', 'Collins Street', 'Queen Street', 'Hay Street', 'King William Street'],
    postal: () => String(rand(2000, 7999)),
    phone: () => `+61 4${rand(10, 99)} ${rand(100, 999)} ${rand(100, 999)}`,
  },
};

const REGION_TEMPLATES = {
  Africa: {
    states: ['Central Region', 'Northern Province', 'Eastern Province', 'Western District', 'Capital District', 'Coastal Region'],
    cities: ['Central City', 'Riverbend', 'Harbor Point', 'Lakeview', 'Hillcrest'],
    streets: ['Independence Avenue', 'Market Road', 'Station Road', 'Unity Street', 'Garden Road'],
  },
  Americas: {
    states: ['North District', 'South District', 'Central Province', 'Coastal County', 'River County', 'Capital Region'],
    cities: ['Springfield', 'Riverside', 'Fairview', 'Georgetown', 'Kingston'],
    streets: ['Main Street', 'Oak Avenue', 'Cedar Road', 'Liberty Street', 'Park Lane'],
  },
  Asia: {
    states: ['Central Province', 'Northern Region', 'Southern District', 'Eastern Province', 'Capital Territory', 'Western District'],
    cities: ['Metro City', 'Green Park', 'New Town', 'Garden City', 'Riverside'],
    streets: ['Main Road', 'Station Road', 'Park Street', 'Market Street', 'Temple Road'],
  },
  Europe: {
    states: ['Central Region', 'Northern County', 'Southern County', 'Eastern District', 'Western District', 'Capital District'],
    cities: ['Old Town', 'Riverside', 'Newport', 'Lakeside', 'Kingsbridge'],
    streets: ['High Street', 'Church Road', 'Station Street', 'Market Square', 'King Street'],
  },
  Oceania: {
    states: ['North Island Region', 'South Coast Region', 'Central District', 'Capital Territory', 'Harbor District', 'West Coast'],
    cities: ['Harbor City', 'Palm Bay', 'Coral Town', 'Green Island', 'Riverside'],
    streets: ['Ocean Road', 'Queen Street', 'Harbor Drive', 'Palm Avenue', 'Market Road'],
  },
  Antarctic: {
    states: ['Research Sector', 'Icefield District', 'Base Territory', 'Coastal Sector'],
    cities: ['Research Base', 'South Station', 'Ice Harbor', 'Polar Camp'],
    streets: ['Station Road', 'Base Camp Lane', 'Research Drive', 'Harbor Track'],
  },
  World: {
    states: ['Central Region', 'Capital District', 'Northern District', 'Southern District', 'Eastern District', 'Western District'],
    cities: ['Central City', 'Riverside', 'Harbor Town', 'Fairview', 'New Town'],
    streets: ['Main Street', 'Market Road', 'Station Road', 'Park Avenue', 'High Street'],
  },
};

// Country labels, capitals, regions, and phone prefixes are generated from the public mledoze/countries dataset.
const COUNTRY_DEFINITIONS = [
  ["AF","Afghanistan","+93","Asia","Southern Asia","Kabul"],
  ["AX","Aland Islands","+35818","Europe","Northern Europe","Mariehamn"],
  ["AL","Albania","+355","Europe","Southeast Europe","Tirana"],
  ["DZ","Algeria","+213","Africa","Northern Africa","Algiers"],
  ["AS","American Samoa","+1684","Oceania","Polynesia","Pago Pago"],
  ["AD","Andorra","+376","Europe","Southern Europe","Andorra la Vella"],
  ["AO","Angola","+244","Africa","Middle Africa","Luanda"],
  ["AI","Anguilla","+1264","Americas","Caribbean","The Valley"],
  ["AQ","Antarctica","","Antarctic","",""],
  ["AG","Antigua and Barbuda","+1268","Americas","Caribbean","Saint John's"],
  ["AR","Argentina","+54","Americas","South America","Buenos Aires"],
  ["AM","Armenia","+374","Asia","Western Asia","Yerevan"],
  ["AW","Aruba","+297","Americas","Caribbean","Oranjestad"],
  ["AU","Australia","+61","Oceania","Australia and New Zealand","Canberra"],
  ["AT","Austria","+43","Europe","Central Europe","Vienna"],
  ["AZ","Azerbaijan","+994","Asia","Western Asia","Baku"],
  ["BS","Bahamas","+1242","Americas","Caribbean","Nassau"],
  ["BH","Bahrain","+973","Asia","Western Asia","Manama"],
  ["BD","Bangladesh","+880","Asia","Southern Asia","Dhaka"],
  ["BB","Barbados","+1246","Americas","Caribbean","Bridgetown"],
  ["BY","Belarus","+375","Europe","Eastern Europe","Minsk"],
  ["BE","Belgium","+32","Europe","Western Europe","Brussels"],
  ["BZ","Belize","+501","Americas","Central America","Belmopan"],
  ["BJ","Benin","+229","Africa","Western Africa","Porto-Novo"],
  ["BM","Bermuda","+1441","Americas","North America","Hamilton"],
  ["BT","Bhutan","+975","Asia","Southern Asia","Thimphu"],
  ["BO","Bolivia","+591","Americas","South America","Sucre"],
  ["BA","Bosnia and Herzegovina","+387","Europe","Southeast Europe","Sarajevo"],
  ["BW","Botswana","+267","Africa","Southern Africa","Gaborone"],
  ["BV","Bouvet Island","+47","Antarctic","",""],
  ["BR","Brazil","+55","Americas","South America","Brasilia"],
  ["IO","British Indian Ocean Territory","+246","Africa","Eastern Africa","Diego Garcia"],
  ["VG","British Virgin Islands","+1284","Americas","Caribbean","Road Town"],
  ["BN","Brunei","+673","Asia","South-Eastern Asia","Bandar Seri Begawan"],
  ["BG","Bulgaria","+359","Europe","Southeast Europe","Sofia"],
  ["BF","Burkina Faso","+226","Africa","Western Africa","Ouagadougou"],
  ["BI","Burundi","+257","Africa","Eastern Africa","Gitega"],
  ["KH","Cambodia","+855","Asia","South-Eastern Asia","Phnom Penh"],
  ["CM","Cameroon","+237","Africa","Middle Africa","Yaounde"],
  ["CA","Canada","+1","Americas","North America","Ottawa"],
  ["CV","Cape Verde","+238","Africa","Western Africa","Praia"],
  ["BQ","Caribbean Netherlands","+599","Americas","Caribbean","Kralendijk"],
  ["KY","Cayman Islands","+1345","Americas","Caribbean","George Town"],
  ["CF","Central African Republic","+236","Africa","Middle Africa","Bangui"],
  ["TD","Chad","+235","Africa","Middle Africa","N'Djamena"],
  ["CL","Chile","+56","Americas","South America","Santiago"],
  ["CN","China","+86","Asia","Eastern Asia","Beijing"],
  ["CX","Christmas Island","+61","Oceania","Australia and New Zealand","Flying Fish Cove"],
  ["CC","Cocos (Keeling) Islands","+61","Oceania","Australia and New Zealand","West Island"],
  ["CO","Colombia","+57","Americas","South America","Bogota"],
  ["KM","Comoros","+269","Africa","Eastern Africa","Moroni"],
  ["CG","Congo","+242","Africa","Middle Africa","Brazzaville"],
  ["CK","Cook Islands","+682","Oceania","Polynesia","Avarua"],
  ["CR","Costa Rica","+506","Americas","Central America","San Jose"],
  ["HR","Croatia","+385","Europe","Southeast Europe","Zagreb"],
  ["CU","Cuba","+53","Americas","Caribbean","Havana"],
  ["CW","Curacao","+599","Americas","Caribbean","Willemstad"],
  ["CY","Cyprus","+357","Europe","Southern Europe","Nicosia"],
  ["CZ","Czechia","+420","Europe","Central Europe","Prague"],
  ["DK","Denmark","+45","Europe","Northern Europe","Copenhagen"],
  ["DJ","Djibouti","+253","Africa","Eastern Africa","Djibouti"],
  ["DM","Dominica","+1767","Americas","Caribbean","Roseau"],
  ["DO","Dominican Republic","+1","Americas","Caribbean","Santo Domingo"],
  ["CD","DR Congo","+243","Africa","Middle Africa","Kinshasa"],
  ["EC","Ecuador","+593","Americas","South America","Quito"],
  ["EG","Egypt","+20","Africa","Northern Africa","Cairo"],
  ["SV","El Salvador","+503","Americas","Central America","San Salvador"],
  ["GQ","Equatorial Guinea","+240","Africa","Middle Africa","Malabo"],
  ["ER","Eritrea","+291","Africa","Eastern Africa","Asmara"],
  ["EE","Estonia","+372","Europe","Northern Europe","Tallinn"],
  ["SZ","Eswatini","+268","Africa","Southern Africa","Lobamba"],
  ["ET","Ethiopia","+251","Africa","Eastern Africa","Addis Ababa"],
  ["FK","Falkland Islands","+500","Americas","South America","Stanley"],
  ["FO","Faroe Islands","+298","Europe","Northern Europe","Torshavn"],
  ["FJ","Fiji","+679","Oceania","Melanesia","Suva"],
  ["FI","Finland","+358","Europe","Northern Europe","Helsinki"],
  ["FR","France","+33","Europe","Western Europe","Paris"],
  ["GF","French Guiana","+594","Americas","South America","Cayenne"],
  ["PF","French Polynesia","+689","Oceania","Polynesia","Papeete"],
  ["TF","French Southern and Antarctic Lands","+262","Antarctic","","Port-aux-Francais"],
  ["GA","Gabon","+241","Africa","Middle Africa","Libreville"],
  ["GM","Gambia","+220","Africa","Western Africa","Banjul"],
  ["GE","Georgia","+995","Asia","Western Asia","Tbilisi"],
  ["DE","Germany","+49","Europe","Western Europe","Berlin"],
  ["GH","Ghana","+233","Africa","Western Africa","Accra"],
  ["GI","Gibraltar","+350","Europe","Southern Europe","Gibraltar"],
  ["GR","Greece","+30","Europe","Southern Europe","Athens"],
  ["GL","Greenland","+299","Americas","North America","Nuuk"],
  ["GD","Grenada","+1473","Americas","Caribbean","St. George's"],
  ["GP","Guadeloupe","+590","Americas","Caribbean","Basse-Terre"],
  ["GU","Guam","+1671","Oceania","Micronesia","Hagatna"],
  ["GT","Guatemala","+502","Americas","Central America","Guatemala City"],
  ["GG","Guernsey","+44","Europe","Northern Europe","St. Peter Port"],
  ["GN","Guinea","+224","Africa","Western Africa","Conakry"],
  ["GW","Guinea-Bissau","+245","Africa","Western Africa","Bissau"],
  ["GY","Guyana","+592","Americas","South America","Georgetown"],
  ["HT","Haiti","+509","Americas","Caribbean","Port-au-Prince"],
  ["HM","Heard Island and McDonald Islands","","Antarctic","",""],
  ["HN","Honduras","+504","Americas","Central America","Tegucigalpa"],
  ["HK","Hong Kong","+852","Asia","Eastern Asia","City of Victoria"],
  ["HU","Hungary","+36","Europe","Central Europe","Budapest"],
  ["IS","Iceland","+354","Europe","Northern Europe","Reykjavik"],
  ["IN","India","+91","Asia","Southern Asia","New Delhi"],
  ["ID","Indonesia","+62","Asia","South-Eastern Asia","Jakarta"],
  ["IR","Iran","+98","Asia","Southern Asia","Tehran"],
  ["IQ","Iraq","+964","Asia","Western Asia","Baghdad"],
  ["IE","Ireland","+353","Europe","Northern Europe","Dublin"],
  ["IM","Isle of Man","+44","Europe","Northern Europe","Douglas"],
  ["IL","Israel","+972","Asia","Western Asia","Jerusalem"],
  ["IT","Italy","+39","Europe","Southern Europe","Rome"],
  ["CI","Ivory Coast","+225","Africa","Western Africa","Yamoussoukro"],
  ["JM","Jamaica","+1876","Americas","Caribbean","Kingston"],
  ["JP","Japan","+81","Asia","Eastern Asia","Tokyo"],
  ["JE","Jersey","+44","Europe","Northern Europe","Saint Helier"],
  ["JO","Jordan","+962","Asia","Western Asia","Amman"],
  ["KZ","Kazakhstan","+7","Asia","Central Asia","Astana"],
  ["KE","Kenya","+254","Africa","Eastern Africa","Nairobi"],
  ["KI","Kiribati","+686","Oceania","Micronesia","South Tarawa"],
  ["XK","Kosovo","+383","Europe","Southeast Europe","Pristina"],
  ["KW","Kuwait","+965","Asia","Western Asia","Kuwait City"],
  ["KG","Kyrgyzstan","+996","Asia","Central Asia","Bishkek"],
  ["LA","Laos","+856","Asia","South-Eastern Asia","Vientiane"],
  ["LV","Latvia","+371","Europe","Northern Europe","Riga"],
  ["LB","Lebanon","+961","Asia","Western Asia","Beirut"],
  ["LS","Lesotho","+266","Africa","Southern Africa","Maseru"],
  ["LR","Liberia","+231","Africa","Western Africa","Monrovia"],
  ["LY","Libya","+218","Africa","Northern Africa","Tripoli"],
  ["LI","Liechtenstein","+423","Europe","Western Europe","Vaduz"],
  ["LT","Lithuania","+370","Europe","Northern Europe","Vilnius"],
  ["LU","Luxembourg","+352","Europe","Western Europe","Luxembourg"],
  ["MO","Macau","+853","Asia","Eastern Asia",""],
  ["MG","Madagascar","+261","Africa","Eastern Africa","Antananarivo"],
  ["MW","Malawi","+265","Africa","Eastern Africa","Lilongwe"],
  ["MY","Malaysia","+60","Asia","South-Eastern Asia","Kuala Lumpur"],
  ["MV","Maldives","+960","Asia","Southern Asia","Male"],
  ["ML","Mali","+223","Africa","Western Africa","Bamako"],
  ["MT","Malta","+356","Europe","Southern Europe","Valletta"],
  ["MH","Marshall Islands","+692","Oceania","Micronesia","Majuro"],
  ["MQ","Martinique","+596","Americas","Caribbean","Fort-de-France"],
  ["MR","Mauritania","+222","Africa","Western Africa","Nouakchott"],
  ["MU","Mauritius","+230","Africa","Eastern Africa","Port Louis"],
  ["YT","Mayotte","+262","Africa","Eastern Africa","Mamoudzou"],
  ["MX","Mexico","+52","Americas","North America","Mexico City"],
  ["FM","Micronesia","+691","Oceania","Micronesia","Palikir"],
  ["MD","Moldova","+373","Europe","Eastern Europe","Chisinau"],
  ["MC","Monaco","+377","Europe","Western Europe","Monaco"],
  ["MN","Mongolia","+976","Asia","Eastern Asia","Ulan Bator"],
  ["ME","Montenegro","+382","Europe","Southeast Europe","Podgorica"],
  ["MS","Montserrat","+1664","Americas","Caribbean","Plymouth"],
  ["MA","Morocco","+212","Africa","Northern Africa","Rabat"],
  ["MZ","Mozambique","+258","Africa","Eastern Africa","Maputo"],
  ["MM","Myanmar","+95","Asia","South-Eastern Asia","Naypyidaw"],
  ["NA","Namibia","+264","Africa","Southern Africa","Windhoek"],
  ["NR","Nauru","+674","Oceania","Micronesia","Yaren"],
  ["NP","Nepal","+977","Asia","Southern Asia","Kathmandu"],
  ["NL","Netherlands","+31","Europe","Western Europe","Amsterdam"],
  ["NC","New Caledonia","+687","Oceania","Melanesia","Noumea"],
  ["NZ","New Zealand","+64","Oceania","Australia and New Zealand","Wellington"],
  ["NI","Nicaragua","+505","Americas","Central America","Managua"],
  ["NE","Niger","+227","Africa","Western Africa","Niamey"],
  ["NG","Nigeria","+234","Africa","Western Africa","Abuja"],
  ["NU","Niue","+683","Oceania","Polynesia","Alofi"],
  ["NF","Norfolk Island","+672","Oceania","Australia and New Zealand","Kingston"],
  ["KP","North Korea","+850","Asia","Eastern Asia","Pyongyang"],
  ["MK","North Macedonia","+389","Europe","Southeast Europe","Skopje"],
  ["MP","Northern Mariana Islands","+1670","Oceania","Micronesia","Saipan"],
  ["NO","Norway","+47","Europe","Northern Europe","Oslo"],
  ["OM","Oman","+968","Asia","Western Asia","Muscat"],
  ["PK","Pakistan","+92","Asia","Southern Asia","Islamabad"],
  ["PW","Palau","+680","Oceania","Micronesia","Ngerulmud"],
  ["PS","Palestine","+970","Asia","Western Asia","Ramallah"],
  ["PA","Panama","+507","Americas","Central America","Panama City"],
  ["PG","Papua New Guinea","+675","Oceania","Melanesia","Port Moresby"],
  ["PY","Paraguay","+595","Americas","South America","Asuncion"],
  ["PE","Peru","+51","Americas","South America","Lima"],
  ["PH","Philippines","+63","Asia","South-Eastern Asia","Manila"],
  ["PN","Pitcairn Islands","+64","Oceania","Polynesia","Adamstown"],
  ["PL","Poland","+48","Europe","Central Europe","Warsaw"],
  ["PT","Portugal","+351","Europe","Southern Europe","Lisbon"],
  ["PR","Puerto Rico","+1","Americas","Caribbean","San Juan"],
  ["QA","Qatar","+974","Asia","Western Asia","Doha"],
  ["RE","Reunion","+262","Africa","Eastern Africa","Saint-Denis"],
  ["RO","Romania","+40","Europe","Southeast Europe","Bucharest"],
  ["RU","Russia","+7","Europe","Eastern Europe","Moscow"],
  ["RW","Rwanda","+250","Africa","Eastern Africa","Kigali"],
  ["BL","Saint Barthelemy","+590","Americas","Caribbean","Gustavia"],
  ["SH","Saint Helena, Ascension and Tristan da Cunha","+2","Africa","Western Africa","Jamestown"],
  ["KN","Saint Kitts and Nevis","+1869","Americas","Caribbean","Basseterre"],
  ["LC","Saint Lucia","+1758","Americas","Caribbean","Castries"],
  ["MF","Saint Martin","+590","Americas","Caribbean","Marigot"],
  ["PM","Saint Pierre and Miquelon","+508","Americas","North America","Saint-Pierre"],
  ["VC","Saint Vincent and the Grenadines","+1784","Americas","Caribbean","Kingstown"],
  ["WS","Samoa","+685","Oceania","Polynesia","Apia"],
  ["SM","San Marino","+378","Europe","Southern Europe","City of San Marino"],
  ["ST","Sao Tome and Principe","+239","Africa","Middle Africa","Sao Tome"],
  ["SA","Saudi Arabia","+966","Asia","Western Asia","Riyadh"],
  ["SN","Senegal","+221","Africa","Western Africa","Dakar"],
  ["RS","Serbia","+381","Europe","Southeast Europe","Belgrade"],
  ["SC","Seychelles","+248","Africa","Eastern Africa","Victoria"],
  ["SL","Sierra Leone","+232","Africa","Western Africa","Freetown"],
  ["SG","Singapore","+65","Asia","South-Eastern Asia","Singapore"],
  ["SX","Sint Maarten","+1721","Americas","Caribbean","Philipsburg"],
  ["SK","Slovakia","+421","Europe","Central Europe","Bratislava"],
  ["SI","Slovenia","+386","Europe","Central Europe","Ljubljana"],
  ["SB","Solomon Islands","+677","Oceania","Melanesia","Honiara"],
  ["SO","Somalia","+252","Africa","Eastern Africa","Mogadishu"],
  ["ZA","South Africa","+27","Africa","Southern Africa","Pretoria"],
  ["GS","South Georgia","+500","Antarctic","","King Edward Point"],
  ["KR","South Korea","+82","Asia","Eastern Asia","Seoul"],
  ["SS","South Sudan","+211","Africa","Middle Africa","Juba"],
  ["ES","Spain","+34","Europe","Southern Europe","Madrid"],
  ["LK","Sri Lanka","+94","Asia","Southern Asia","Colombo"],
  ["SD","Sudan","+249","Africa","Northern Africa","Khartoum"],
  ["SR","Suriname","+597","Americas","South America","Paramaribo"],
  ["SJ","Svalbard and Jan Mayen","+47","Europe","Northern Europe","Longyearbyen"],
  ["SE","Sweden","+46","Europe","Northern Europe","Stockholm"],
  ["CH","Switzerland","+41","Europe","Western Europe","Bern"],
  ["SY","Syria","+963","Asia","Western Asia","Damascus"],
  ["TW","Taiwan","+886","Asia","Eastern Asia","Taipei"],
  ["TJ","Tajikistan","+992","Asia","Central Asia","Dushanbe"],
  ["TZ","Tanzania","+255","Africa","Eastern Africa","Dodoma"],
  ["TH","Thailand","+66","Asia","South-Eastern Asia","Bangkok"],
  ["TL","Timor-Leste","+670","Asia","South-Eastern Asia","Dili"],
  ["TG","Togo","+228","Africa","Western Africa","Lome"],
  ["TK","Tokelau","+690","Oceania","Polynesia","Fakaofo"],
  ["TO","Tonga","+676","Oceania","Polynesia","Nuku'alofa"],
  ["TT","Trinidad and Tobago","+1868","Americas","Caribbean","Port of Spain"],
  ["TN","Tunisia","+216","Africa","Northern Africa","Tunis"],
  ["TR","Turkiye","+90","Asia","Western Asia","Ankara"],
  ["TM","Turkmenistan","+993","Asia","Central Asia","Ashgabat"],
  ["TC","Turks and Caicos Islands","+1649","Americas","Caribbean","Cockburn Town"],
  ["TV","Tuvalu","+688","Oceania","Polynesia","Funafuti"],
  ["UG","Uganda","+256","Africa","Eastern Africa","Kampala"],
  ["UA","Ukraine","+380","Europe","Eastern Europe","Kyiv"],
  ["AE","United Arab Emirates","+971","Asia","Western Asia","Abu Dhabi"],
  ["GB","United Kingdom","+44","Europe","Northern Europe","London"],
  ["US","United States","+1","Americas","North America","Washington D.C."],
  ["UM","United States Minor Outlying Islands","+268","Americas","North America",""],
  ["VI","United States Virgin Islands","+1340","Americas","Caribbean","Charlotte Amalie"],
  ["UY","Uruguay","+598","Americas","South America","Montevideo"],
  ["UZ","Uzbekistan","+998","Asia","Central Asia","Tashkent"],
  ["VU","Vanuatu","+678","Oceania","Melanesia","Port Vila"],
  ["VA","Vatican City","+3","Europe","Southern Europe","Vatican City"],
  ["VE","Venezuela","+58","Americas","South America","Caracas"],
  ["VN","Vietnam","+84","Asia","South-Eastern Asia","Hanoi"],
  ["WF","Wallis and Futuna","+681","Oceania","Polynesia","Mata-Utu"],
  ["EH","Western Sahara","+212","Africa","Northern Africa","El Aaiun"],
  ["YE","Yemen","+967","Asia","Western Asia","Sana'a"],
  ["ZM","Zambia","+260","Africa","Eastern Africa","Lusaka"],
  ["ZW","Zimbabwe","+263","Africa","Eastern Africa","Harare"],
];

const REGION_GEODATA = {
  Africa: { timezone: 'Africa/Johannesburg', locale: 'en-ZA', latitude: -26.2041, longitude: 28.0473 },
  Americas: { timezone: 'America/New_York', locale: 'en-US', latitude: 40.7128, longitude: -74.0060 },
  Asia: { timezone: 'Asia/Singapore', locale: 'en-SG', latitude: 1.3521, longitude: 103.8198 },
  Europe: { timezone: 'Europe/London', locale: 'en-GB', latitude: 51.5074, longitude: -0.1278 },
  Oceania: { timezone: 'Australia/Sydney', locale: 'en-AU', latitude: -33.8688, longitude: 151.2093 },
  Antarctic: { timezone: 'Antarctica/McMurdo', locale: 'en-US', latitude: -77.8460, longitude: 166.6660 },
  World: { timezone: 'UTC', locale: 'en-US', latitude: 0, longitude: 0 },
};

const COUNTRY_GEODATA_OVERRIDES = {
  US: { timezone: 'America/New_York', locale: 'en-US', latitude: 40.7128, longitude: -74.0060 },
  IN: { timezone: 'Asia/Kolkata', locale: 'en-IN', latitude: 19.0760, longitude: 72.8777 },
  GB: { timezone: 'Europe/London', locale: 'en-GB', latitude: 51.5074, longitude: -0.1278 },
  CA: { timezone: 'America/Toronto', locale: 'en-CA', latitude: 43.6532, longitude: -79.3832 },
  AU: { timezone: 'Australia/Sydney', locale: 'en-AU', latitude: -33.8688, longitude: 151.2093 },
  DE: { timezone: 'Europe/Berlin', locale: 'de-DE', latitude: 52.5200, longitude: 13.4050 },
  FR: { timezone: 'Europe/Paris', locale: 'fr-FR', latitude: 48.8566, longitude: 2.3522 },
  JP: { timezone: 'Asia/Tokyo', locale: 'ja-JP', latitude: 35.6762, longitude: 139.6503 },
  CN: { timezone: 'Asia/Shanghai', locale: 'zh-CN', latitude: 31.2304, longitude: 121.4737 },
  BR: { timezone: 'America/Sao_Paulo', locale: 'pt-BR', latitude: -23.5505, longitude: -46.6333 },
  ZA: { timezone: 'Africa/Johannesburg', locale: 'en-ZA', latitude: -26.2041, longitude: 28.0473 },
  RU: { timezone: 'Europe/Moscow', locale: 'ru-RU', latitude: 55.7558, longitude: 37.6173 },
  MX: { timezone: 'America/Mexico_City', locale: 'es-MX', latitude: 19.4326, longitude: -99.1332 },
  NZ: { timezone: 'Pacific/Auckland', locale: 'en-NZ', latitude: -36.8485, longitude: 174.7633 },
  SG: { timezone: 'Asia/Singapore', locale: 'en-SG', latitude: 1.3521, longitude: 103.8198 },
  AE: { timezone: 'Asia/Dubai', locale: 'en-AE', latitude: 25.2048, longitude: 55.2708 },
};

const COUNTRIES = buildCountries();

function buildCountries() {
  const countries = Object.fromEntries(
    COUNTRY_DEFINITIONS.map(definition => [definition[0], createCountryConfig(definition)])
  );

  for (const [code, override] of Object.entries(COUNTRY_OVERRIDES)) {
    countries[code] = { ...countries[code], ...override };
  }

  return countries;
}

function createCountryConfig([code, label, phoneCode, region, subregion, capital]) {
  const template = REGION_TEMPLATES[region] || REGION_TEMPLATES.World;
  const cities = unique([capital, ...template.cities, `${label} City`]).slice(0, 6);
  const states = unique([
    capital ? `${capital} District` : '',
    subregion || '',
    `${label} Region`,
    ...template.states,
  ]).slice(0, 8);

  const baseGeo = REGION_GEODATA[region] || REGION_GEODATA.World;
  const geoOverride = COUNTRY_GEODATA_OVERRIDES[code] || {};
  const timezone = geoOverride.timezone || baseGeo.timezone;
  const locale = geoOverride.locale || baseGeo.locale;
  const latitude = geoOverride.latitude || baseGeo.latitude;
  const longitude = geoOverride.longitude || baseGeo.longitude;

  return {
    label,
    states,
    cities,
    streets: template.streets,
    postal: () => createPostalCode(region, code),
    phone: () => createPhoneNumber(phoneCode, region),
    timezone,
    locale,
    latitude,
    longitude,
  };
}

function createPostalCode(region, code) {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.split('');

  if (region === 'Europe') {
    return `${rand(1000, 99999)}`;
  }

  if (region === 'Americas') {
    return `${rand(10000, 99999)}${pick(['', '', `-${rand(1000, 9999)}`])}`;
  }

  if (region === 'Asia') {
    return String(rand(100000, 999999));
  }

  if (region === 'Africa') {
    return String(rand(1000, 99999)).padStart(5, '0');
  }

  if (region === 'Oceania') {
    return String(rand(1000, 9999));
  }

  if (region === 'Antarctic') {
    return `${code}-${rand(1000, 9999)}`;
  }

  return `${pick(letters)}${rand(1000, 9999)}`;
}

function createPhoneNumber(phoneCode, region) {
  const code = phoneCode || '+999';
  const pattern = region === 'Europe'
    ? [3, 3, 3]
    : region === 'Asia'
      ? [3, 4, 3]
      : region === 'Oceania'
        ? [2, 3, 3]
        : [3, 3, 4];

  return [code, ...pattern.map(createNumberGroup)].join(' ');
}

function createNumberGroup(digits) {
  const min = 10 ** (digits - 1);
  const max = (10 ** digits) - 1;
  return String(rand(min, max));
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}


const FIRST_NAMES = {
  female: ['Ava', 'Mia', 'Sophia', 'Olivia', 'Emma', 'Anaya', 'Priya', 'Isla', 'Grace', 'Zara'],
  male: ['Liam', 'Noah', 'Ethan', 'Oliver', 'Aarav', 'Vihaan', 'Leo', 'Henry', 'Mason', 'Arjun'],
};

const LAST_NAMES = ['Patel', 'Sharma', 'Khan', 'Smith', 'Johnson', 'Williams', 'Brown', 'Miller', 'Wilson', 'Davis'];
const JOB_TITLES = ['Product Analyst', 'Operations Manager', 'Software Tester', 'Marketing Coordinator', 'Data Specialist', 'Support Lead'];
const COMPANY_NAMES = ['Northstar Labs', 'Brightline Studio', 'Riverstone Trading', 'Evergreen Systems', 'Summit Works', 'Bluefield Group'];
const ADDRESS2_PREFIXES = ['Apt', 'Suite', 'Unit', 'Flat', 'Floor'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

let state = {
  settings: { ...DEFAULT_SETTINGS },
  identity: null,
  history: [],
  inboxMessages: [],
  messageDetails: {},
  privateCard: null,
  cardRevealed: false,
  activeTab: 'home',
  inboxRefreshTimer: null,
  proxy: null,
  proxyAction: '',
  permissionStatus: {
    siteAccess: false,
  },
};

const els = {
  countrySelect: document.querySelector('#countrySelect'),
  nameStyleSelect: document.querySelector('#nameStyleSelect'),
  saveHistoryToggle: document.querySelector('#saveHistoryToggle'),
  autoCopyToggle: document.querySelector('#autoCopyToggle'),
  autoFillToggle: document.querySelector('#autoFillToggle'),
  cardAutoFillToggle: document.querySelector('#cardAutoFillToggle'),
  antiFingerprintToggle: document.querySelector('#antiFingerprintToggle'),
  statusLines: document.querySelectorAll('[data-status-line]'),
  messageList: document.querySelector('#messageList'),
  historyList: document.querySelector('#historyList'),
  inboxAddress: document.querySelector('#inboxAddress'),
  inboxList: document.querySelector('#inboxList'),
  inboxCount: document.querySelector('#inboxCount'),
  mailboxState: document.querySelector('#mailboxState'),
  copyLatestOtpBtn: document.querySelector('#copyLatestOtpBtn'),
  cardRevealBtn: document.querySelector('#cardRevealBtn'),
  cardSafetyStatus: document.querySelector('#cardSafetyStatus'),
  proxyRefreshBtn: document.querySelector('#proxyRefreshBtn'),
  proxyToggleBtn: document.querySelector('#proxyToggleBtn'),
  proxyCountrySelect: document.querySelector('#proxyCountrySelect'),
  proxyCountryEyebrow: document.querySelector('#proxyCountryEyebrow'),
  proxyCountLabel: document.querySelector('#proxyCountLabel'),
  proxyBadge: document.querySelector('#proxyBadge'),
  proxySignal: document.querySelector('#proxySignal'),
  proxyCount: document.querySelector('#proxyCount'),
  proxyIp: document.querySelector('#proxyIp'),
  proxyVerifiedCountry: document.querySelector('#proxyVerifiedCountry'),
  proxyVerifiedAt: document.querySelector('#proxyVerifiedAt'),
  proxyAutoReconnectToggle: document.querySelector('#proxyAutoReconnectToggle'),
  proxyCurrent: document.querySelector('#proxyCurrent'),
  proxyList: document.querySelector('#proxyList'),
  proxyStatusLine: document.querySelector('#proxyStatusLine'),
  webshareTokenInput: document.querySelector('#webshareTokenInput'),
  saveWebshareTokenBtn: document.querySelector('#saveWebshareTokenBtn'),
  clearWebshareTokenBtn: document.querySelector('#clearWebshareTokenBtn'),
  proxyStableNote: document.querySelector('#proxyStableNote'),
  proxySourceSteps: document.querySelector('#proxySourceSteps'),
  autoFillAccessStatus: document.querySelector('#autoFillAccessStatus'),
  proxyAuthAccessStatus: document.querySelector('#proxyAuthAccessStatus'),
  webshareSourceStatus: document.querySelector('#webshareSourceStatus'),
  exportJsonBtn: document.querySelector('#exportJsonBtn'),
  exportCsvBtn: document.querySelector('#exportCsvBtn'),
  importJsonBtn: document.querySelector('#importJsonBtn'),
  importProfilesInput: document.querySelector('#importProfilesInput'),
};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  populateCountries();
  populateProxyCountries();
  bindEvents();
  await loadState();
  const upgradedIdentity = ensurePasswordFields();
  if (upgradedIdentity) {
    await chrome.storage.local.set({
      [STORAGE_KEYS.identity]: state.identity,
      [STORAGE_KEYS.history]: state.history,
    });
  }
  hydrateControls();
  await syncAutoFillPermissionState();
  await loadPrivateCard();
  await loadProxyState(false);
  await refreshPermissionStatus();

  if (!state.identity?.mailbox?.address) {
    await generateIdentity(false);
    return;
  }

  renderAll();
}

function populateCountries() {
  for (const [code, country] of Object.entries(COUNTRIES)) {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = formatCountryOptionLabel(code, country.label);
    els.countrySelect.append(option);
  }
}

function populateProxyCountries() {
  for (const [code, country] of Object.entries(COUNTRIES)) {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = formatCountryOptionLabel(code, country.label);
    els.proxyCountrySelect.append(option);
  }
  els.proxyCountrySelect.value = DEFAULT_PROXY_COUNTRY;
}

function bindEvents() {
  document.querySelectorAll('.tab').forEach(button => {
    button.addEventListener('click', () => activateTab(button.dataset.tab));
  });

  document.querySelector('#generateBtn').addEventListener('click', () => generateIdentity(true));
  document.querySelector('#copyAllBtn').addEventListener('click', copyFullIdentity);
  document.querySelector('#fillPageBtn').addEventListener('click', fillCurrentPage);
  document.querySelector('#saveSettingsBtn').addEventListener('click', saveSettingsFromControls);
  document.querySelector('#refreshInboxBtn').addEventListener('click', () => refreshInbox(true));
  els.copyLatestOtpBtn.addEventListener('click', copyLatestOtp);
  document.querySelector('#copyInboxBtn').addEventListener('click', copyInboxAddress);
  document.querySelector('#clearHistoryBtn').addEventListener('click', clearHistory);
  els.cardRevealBtn.addEventListener('click', toggleCardReveal);
  els.proxyRefreshBtn.addEventListener('click', () => refreshProxyList(true));
  els.proxyToggleBtn.addEventListener('click', toggleProxyConnection);
  els.proxyCountrySelect.addEventListener('change', handleProxyCountryChange);
  els.proxyAutoReconnectToggle.addEventListener('change', handleProxyAutoReconnectToggle);
  els.saveWebshareTokenBtn.addEventListener('click', saveWebshareToken);
  els.clearWebshareTokenBtn.addEventListener('click', clearWebshareToken);
  els.autoFillToggle.addEventListener('change', handleAutoFillToggle);
  els.cardAutoFillToggle.addEventListener('change', handleCardAutoFillToggle);
  els.antiFingerprintToggle.addEventListener('change', handleAntiFingerprintToggle);
  els.exportJsonBtn.addEventListener('click', exportProfilesJson);
  els.exportCsvBtn.addEventListener('click', exportProfilesCsv);
  els.importJsonBtn.addEventListener('click', () => els.importProfilesInput.click());
  els.importProfilesInput.addEventListener('change', importProfilesJson);

  els.countrySelect.addEventListener('change', () => {
    state.settings.country = els.countrySelect.value;
    persistSettings();
    generateIdentity(true);
  });

  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', () => copyValue(button.dataset.copy));
  });
}

async function loadState() {
  const stored = await chrome.storage.local.get(Object.values(STORAGE_KEYS));
  state.settings = { ...DEFAULT_SETTINGS, ...(stored[STORAGE_KEYS.settings] || {}) };
  state.identity = stored[STORAGE_KEYS.identity] || null;
  state.history = Array.isArray(stored[STORAGE_KEYS.history])
    ? stored[STORAGE_KEYS.history].filter(item => item?.mailbox?.address)
    : [];
}

async function loadPrivateCard() {
  try {
    const response = await fetch(chrome.runtime.getURL(PRIVATE_CARD_FILE), { cache: 'no-store' });
    if (!response.ok) {
      state.privateCard = null;
      return;
    }

    const payload = await response.json();
    state.privateCard = normalizePrivateCard(payload.paymentCard || payload.card || payload);
  } catch {
    state.privateCard = null;
  }
}

function normalizePrivateCard(card = {}) {
  const cardNumber = String(card.number || card.cardNumber || '').replace(/\D/g, '');
  const monthValue = String(card.expiryMonth || card.month || '').replace(/\D/g, '');
  const yearValue = String(card.expiryYear || card.year || '').replace(/\D/g, '');
  const cardCvv = String(card.cvv || card.cvc || card.securityCode || '').replace(/\D/g, '');
  const cardExpiryMonth = monthValue ? monthValue.padStart(2, '0').slice(-2) : '';
  const cardExpiryYear = yearValue.length === 2 ? `20${yearValue}` : yearValue;

  if (!cardNumber && !cardExpiryMonth && !cardExpiryYear && !cardCvv) return null;

  return {
    cardNumber,
    cardExpiryMonth,
    cardExpiryYear,
    cardExpiry: [cardExpiryMonth, cardExpiryYear].filter(Boolean).join('/'),
    cardCvv,
    cardLine: [cardNumber, cardExpiryMonth, cardExpiryYear, cardCvv].join('|'),
  };
}

function hydrateControls() {
  els.countrySelect.value = state.settings.country;
  els.nameStyleSelect.value = state.settings.nameStyle;
  els.saveHistoryToggle.checked = state.settings.saveHistory;
  els.autoCopyToggle.checked = state.settings.autoCopy;
  els.autoFillToggle.checked = state.settings.autoFill;
  els.cardAutoFillToggle.checked = state.settings.cardAutoFill;
  els.antiFingerprintToggle.checked = state.settings.antiFingerprint;
}

function activateTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.panel === tab));

  if (tab === 'messages' && state.identity?.mailbox?.address) {
    refreshInbox(false);
  }
  updateInboxAutoRefresh();

  if (tab === 'proxy') {
    loadProxyState(false);
  }

  if (tab === 'settings') {
    refreshPermissionStatus();
  }
}

async function generateIdentity(showStatus) {
  const country = COUNTRIES[state.settings.country] || COUNTRIES.US;
  const style = state.settings.nameStyle;
  const resolvedStyle = style === 'any' ? pick(['female', 'male']) : style;
  const firstName = pick(FIRST_NAMES[resolvedStyle] || [...FIRST_NAMES.female, ...FIRST_NAMES.male]);
  const middleName = createMiddleName(resolvedStyle, firstName);
  const lastName = pick(LAST_NAMES);
  const fullName = `${firstName} ${lastName}`;
  const city = pick(country.cities);
  const stateName = pick(country.states);
  const address1 = `${rand(18, 998)} ${pick(country.streets)}`;
  const phone = country.phone();
  const postalCode = country.postal();
  const accountPassword = createAccountPassword();
  const identityProfile = createIdentityProfile({
    firstName,
    middleName,
    lastName,
    fullName,
    gender: resolvedStyle === 'female' ? 'Female' : 'Male',
    phone,
    address1,
    city,
    state: stateName,
    postalCode,
    country: country.label,
    countryCode: state.settings.country,
  });

  if (showStatus) setStatus('Creating a real temporary inbox...', '');

  let mailbox;
  try {
    mailbox = await createTemporaryMailbox(firstName, lastName);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create a temporary inbox.';
    setStatus(message, 'error');
    renderInbox();
    return;
  }

  state.identity = {
    firstName,
    middleName,
    lastName,
    fullName,
    fullNameWithMiddle: `${firstName} ${middleName} ${lastName}`,
    email: mailbox.address,
    password: accountPassword,
    confirmPassword: accountPassword,
    phone,
    address1,
    city,
    state: stateName,
    postalCode,
    country: country.label,
    countryCode: state.settings.country,
    ...identityProfile,
    mailbox,
    createdAt: new Date().toISOString(),
  };
  state.inboxMessages = [];
  state.messageDetails = {};

  if (state.settings.saveHistory) {
    state.history = [state.identity, ...state.history.filter(item => item.email !== state.identity.email)].slice(0, 8);
  }

  await chrome.storage.local.set({
    [STORAGE_KEYS.identity]: state.identity,
    [STORAGE_KEYS.history]: state.history,
  });

  renderAll();

  if (state.settings.autoCopy) {
    await copyFullIdentity();
  } else {
    setStatus('Real temporary inbox is ready.', 'success');
  }
}

function renderAll() {
  renderIdentity();
  renderInbox();
  renderMessages();
  renderHistory();
  renderProxy();
  renderSettingsStatus();
}

function renderIdentity() {
  for (const key of ['firstName', 'lastName', 'fullName', 'fullNameWithMiddle', 'username', 'email', 'password', 'confirmPassword', 'prefix', 'gender', 'age', 'country', 'phone', 'phoneNational', 'address1', 'address2', 'city', 'postalCode', 'state', 'addressBlock', 'dateOfBirth', 'birthYear', 'birthMonthName', 'birthDay', 'company', 'jobTitle', 'website']) {
    document.querySelector(`#${key}`).textContent = state.identity?.[key] || '-';
  }

  renderPrivateCard();
}

function renderPrivateCard() {
  const card = state.privateCard;
  const hasCard = Boolean(card?.cardLine);
  const displayCard = state.cardRevealed ? card : maskPrivateCard(card);

  document.querySelectorAll('.private-card-field').forEach(field => {
    field.classList.toggle('is-blurred', hasCard && !state.cardRevealed);
  });

  for (const key of ['cardNumber', 'cardExpiry', 'cardCvv', 'cardLine']) {
    document.querySelector(`#${key}`).textContent = displayCard?.[key] || '-';
  }

  els.cardRevealBtn.textContent = state.cardRevealed ? 'Hide' : 'Reveal';
  els.cardRevealBtn.disabled = !hasCard;
  renderCardSafetyStatus(card);
}

function maskPrivateCard(card) {
  if (!card) return null;
  const last4 = card.cardNumber ? card.cardNumber.slice(-4) : '';
  const maskedNumber = last4 ? `**** **** **** ${last4}` : '';
  return {
    cardNumber: maskedNumber,
    cardExpiry: card.cardExpiry ? '**/****' : '',
    cardCvv: card.cardCvv ? '***' : '',
    cardLine: [maskedNumber, card.cardExpiryMonth ? '**' : '', card.cardExpiryYear ? '****' : '', card.cardCvv ? '***' : ''].join('|'),
  };
}

function renderCardSafetyStatus(card) {
  if (!els.cardSafetyStatus) return;

  const status = getCardExpiryStatus(card);
  els.cardSafetyStatus.textContent = status.message;
  els.cardSafetyStatus.className = `private-card-status ${status.type}`.trim();
}

function getCardExpiryStatus(card) {
  if (!card?.cardLine) {
    return {
      type: '',
      message: 'No private card configured.',
    };
  }

  const month = Number(card.cardExpiryMonth);
  const year = Number(card.cardExpiryYear);
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
    return {
      type: 'warning',
      message: 'Private card loaded, but expiry is incomplete.',
    };
  }

  const expiryDate = new Date(year, month, 0, 23, 59, 59);
  const today = new Date();
  const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / 86_400_000);
  if (daysLeft < 0) {
    return {
      type: 'error',
      message: `Private card expired in ${card.cardExpiry}.`,
    };
  }

  if (daysLeft <= 90) {
    return {
      type: 'warning',
      message: `Private card expires soon: ${card.cardExpiry}.`,
    };
  }

  return {
    type: 'success',
    message: `Private card loaded. Expires ${card.cardExpiry}.`,
  };
}

function toggleCardReveal() {
  state.cardRevealed = !state.cardRevealed;
  renderPrivateCard();
}

function renderInbox() {
  const mailbox = state.identity?.mailbox;
  els.mailboxState.textContent = mailbox ? `Live ${mailbox.label || mailbox.provider} mailbox` : 'No mailbox';
  els.inboxAddress.textContent = mailbox?.address || 'Generate an identity first';
  renderInboxMessages();
  updateInboxAutoRefresh();
}

function renderInboxMessages() {
  if (!state.identity?.mailbox?.address) {
    els.inboxCount.textContent = 'Not ready';
    els.inboxList.replaceChildren(emptyCard('No mailbox yet', 'Generate an identity to create a working temporary email address.', 'mail'));
    updateLatestOtpButton();
    return;
  }

  if (!state.inboxMessages.length) {
    els.inboxCount.textContent = 'No messages';
    els.inboxList.replaceChildren(emptyCard('Inbox is empty', 'Send a verification email to this address, then tap Check mail.', 'empty'));
    updateLatestOtpButton();
    return;
  }

  els.inboxCount.textContent = `${state.inboxMessages.length} message${state.inboxMessages.length === 1 ? '' : 's'}`;

  els.inboxList.replaceChildren(...state.inboxMessages.map(message => {
    const detail = state.messageDetails[message.id];
    const from = normalizeSender(message.from);
    const body = detail ? getMessageBody(detail) : '';
    const code = extractCode([message.subject, message.intro, body].filter(Boolean).join(' '));
    const dateLabel = formatMessageDate(message.date);
    const preview = getMessagePreview(message, body);
    const senderInitial = getSenderInitial(from);
    const card = document.createElement('article');
    card.className = 'message-card inbox-message';
    card.innerHTML = [
      '<header class="message-card-header">',
      '<div class="sender-cluster">',
      `<span class="sender-dot" aria-hidden="true">${escapeHtml(senderInitial)}</span>`,
      '<div>',
      `<span class="message-meta">${escapeHtml(from)}</span>`,
      `<strong>${escapeHtml(message.subject || 'No subject')}</strong>`,
      '</div>',
      '</div>',
      code ? `<span class="message-code">Code ${escapeHtml(code)}</span>` : '',
      '</header>',
      `<p class="message-preview">${escapeHtml(preview)}</p>`,
      dateLabel ? `<span class="message-time">${escapeHtml(dateLabel)}</span>` : '',
      body ? `<details class="message-details"><summary>Open message</summary><div class="message-body">${formatMessageBody(body, message)}</div></details>` : '',
    ].join('');

    const actions = document.createElement('div');
    actions.className = 'message-actions';

    if (code) {
      actions.append(
        createMessageAction('Copy OTP', () => copyOtpCode(code, message.id), 'primary'),
        createMessageAction('Fill OTP', () => fillOtpFromInbox(code, message.id), 'primary')
      );
      card.append(actions);
    }

    return card;
  }));
  updateLatestOtpButton();
}

function updateLatestOtpButton() {
  const latestOtp = findLatestInboxOtp();
  els.copyLatestOtpBtn.disabled = !latestOtp;
  els.copyLatestOtpBtn.textContent = latestOtp ? `Copy ${latestOtp.code}` : 'Copy OTP';
}

function updateInboxAutoRefresh() {
  window.clearInterval(state.inboxRefreshTimer);
  state.inboxRefreshTimer = null;

  if (state.activeTab !== 'messages' || !state.identity?.mailbox?.address) return;

  state.inboxRefreshTimer = window.setInterval(() => {
    if (state.activeTab === 'messages') refreshInbox(false);
  }, INBOX_REFRESH_INTERVAL_MS);
}

async function copyLatestOtp() {
  const latestOtp = findLatestInboxOtp();
  if (!latestOtp) {
    setStatus('No OTP code found yet.', 'error');
    return;
  }
  await copyOtpCode(latestOtp.code, latestOtp.messageId);
}

function createMessageAction(label, onClick, tone = '') {
  const button = document.createElement('button');
  button.className = `message-action ${tone}`.trim();
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', async event => {
    event.stopPropagation();
    await onClick();
  });
  return button;
}

function getMessagePreview(message, body) {
  const subject = String(message.subject || '').trim();
  const intro = String(message.intro || '').trim();
  const cleanBody = stripHtml(body).replace(/\s+/g, ' ').trim();
  const preview = intro && intro !== subject ? intro : cleanBody;
  return preview || 'No preview text available.';
}

function getSenderInitial(sender) {
  return String(sender || '@').replace(/^[^a-z0-9]+/i, '').charAt(0).toUpperCase() || '@';
}

function formatMessageDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function emptyCard(title, body, tone = '') {
  const card = document.createElement('div');
  card.className = `empty-state ${tone}`.trim();
  card.innerHTML = [
    '<span class="empty-icon" aria-hidden="true"></span>',
    `<strong>${escapeHtml(title)}</strong>`,
    `<small>${escapeHtml(body)}</small>`,
  ].join('');
  return card;
}

async function refreshInbox(showStatus) {
  const mailbox = state.identity?.mailbox;
  if (!mailbox?.address) {
    setStatus('Generate an identity first.', 'error');
    renderInbox();
    return;
  }

  if (showStatus) setStatus('Checking the temporary inbox...', '');

  try {
    state.inboxMessages = await listMailboxMessages(mailbox);
    await hydrateRecentInboxDetails(mailbox);
    renderInboxMessages();
    if (showStatus) {
      const count = state.inboxMessages.length;
      const latestOtp = findLatestInboxOtp();
      if (latestOtp) {
        const filled = await fillOtpFromInbox(latestOtp.code, latestOtp.messageId, false);
        setStatus(filled > 0 ? `Inbox refreshed. OTP ${latestOtp.code} filled on the page.` : `Inbox refreshed. OTP ${latestOtp.code} found and ready to copy.`, 'success');
        return;
      }
      setStatus(`Inbox refreshed. ${count} message${count === 1 ? '' : 's'} found.`, 'success');
    }
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Unable to refresh inbox.', 'error');
  }
}

async function hydrateRecentInboxDetails(mailbox) {
  const messagesToHydrate = state.inboxMessages
    .filter(message => !state.messageDetails[message.id])
    .slice(0, 6);

  await Promise.all(messagesToHydrate.map(async message => {
    try {
      state.messageDetails[message.id] = await readMailboxMessage(mailbox, message.id);
    } catch {
      // Some inbox providers may reject individual reads. Keep the inbox usable.
    }
  }));
}

function findLatestInboxOtp() {
  for (const message of state.inboxMessages) {
    const detail = state.messageDetails[message.id];
    const code = extractCode([message.subject, message.intro, getMessageBody(detail)].filter(Boolean).join(' '));
    if (code) return { code, messageId: message.id };
  }
  return null;
}

async function copyOtpCode(code, messageId) {
  await rememberOtp(code, messageId);
  await copyText(code, `OTP ${code} copied.`);
}

async function fillOtpFromInbox(code, messageId, showStatus = true) {
  await rememberOtp(code, messageId);
  return fillOtpOnActiveTab(code, showStatus);
}

async function rememberOtp(code, messageId) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.otp]: {
      code,
      messageId,
      address: state.identity?.mailbox?.address || '',
      createdAt: new Date().toISOString(),
    },
  });
}

function renderMessages() {
  const identity = state.identity;
  if (!identity) return;

  const messages = [
    {
      title: 'Intro',
      label: 'Name + email',
      text: `Hi, my name is ${identity.fullName}. You can reach me at ${identity.email}.`,
    },
    {
      title: 'Address',
      label: 'Shipping block',
      text: `${identity.fullName}\n${identity.address1}\n${identity.city}, ${identity.state} ${identity.postalCode}\n${identity.country}`,
    },
    {
      title: 'Contact',
      label: 'Email + phone',
      text: `${identity.fullName}\n${identity.email}\n${identity.phone}`,
    },
    {
      title: 'Credentials',
      label: 'Login fields',
      text: `Email: ${identity.email}\nPassword: ${identity.password}\nConfirm password: ${identity.confirmPassword}`,
    },
  ];

  els.messageList.replaceChildren(...messages.map(message => {
    const button = document.createElement('button');
    button.className = 'message-card';
    button.type = 'button';
    button.innerHTML = [
      `<span class="message-meta">${escapeHtml(message.label)}</span>`,
      `<strong>${escapeHtml(message.title)}</strong>`,
      `<small>${escapeHtml(message.text)}</small>`,
    ].join('');
    button.addEventListener('click', () => copyText(message.text, `${message.title} copied.`));
    return button;
  }));
}

function renderHistory() {
  if (!state.history.length) {
    els.historyList.replaceChildren(emptyCard('No history yet', 'Generated identities will appear here.', 'history'));
    return;
  }

  els.historyList.replaceChildren(...state.history.slice(0, 4).map(identity => {
    const button = document.createElement('button');
    button.className = 'history-card';
    button.type = 'button';
    button.innerHTML = `<strong>${escapeHtml(identity.fullName)}</strong><small>${escapeHtml(identity.email)} - ${escapeHtml(identity.country)}</small>`;
    button.addEventListener('click', async () => {
      state.identity = identity;
      state.inboxMessages = [];
      state.messageDetails = {};
      await chrome.storage.local.set({ [STORAGE_KEYS.identity]: identity });
      renderAll();
      refreshInbox(false);
      setStatus('Loaded identity with temporary inbox.', 'success');
      activateTab('home');
    });
    return button;
  }));
}

async function loadProxyState(showStatus) {
  try {
    const response = await sendProxyMessage('proxy:getState');
    if (!response?.ok) throw new Error(response?.error || 'Unable to load proxy state.');
    state.proxy = response.state;
    renderProxy();
    renderSettingsStatus();
    if (showStatus) setProxyStatus('Proxy state loaded.', 'success');
  } catch (error) {
    renderProxy();
    setProxyStatus(error instanceof Error ? error.message : 'Unable to load proxy state.', 'error');
  }
}

async function refreshProxyList(showStatus) {
  const country = getProxyCountryCode();
  if (showStatus) setProxyStatus(`Refreshing ${getProxyCountryLabel(country)} proxies...`, '');
  setProxyBusy(true);

  try {
    const response = await sendProxyMessage('proxy:refresh');
    if (!response?.ok) throw new Error(response?.error || 'Unable to refresh proxy list.');
    state.proxy = response.state;
    const count = state.proxy?.proxies?.length || 0;
    const nextCountry = getProxyCountryCode();
    setProxyStatus(count ? `Found ${count} ${getProxyCountryLabel(nextCountry)} route${count === 1 ? '' : 's'}.` : `No working ${getProxyCountryLabel(nextCountry)} proxy is available right now.`, count ? 'success' : 'error');
  } catch (error) {
    setProxyStatus(error instanceof Error ? error.message : 'Unable to refresh proxy list.', 'error');
  } finally {
    setProxyBusy(false);
    renderProxy();
  }
}

async function handleProxyCountryChange() {
  const country = els.proxyCountrySelect.value || DEFAULT_PROXY_COUNTRY;
  setProxyStatus(`Loading ${getProxyCountryLabel(country)} routes...`, '');
  setProxyBusy(true);

  try {
    const response = await sendProxyMessage('proxy:setCountry', { country });
    if (!response?.ok) throw new Error(response?.error || 'Unable to change proxy country.');
    state.proxy = response.state;
    const count = state.proxy?.proxies?.length || 0;
    setProxyStatus(count ? `${getProxyCountryLabel(country)} routes ready.` : `No ${getProxyCountryLabel(country)} routes found right now.`, count ? 'success' : 'error');
  } catch (error) {
    setProxyStatus(error instanceof Error ? error.message : 'Unable to change proxy country.', 'error');
  } finally {
    setProxyBusy(false);
    renderProxy();
  }
}

async function handleProxyAutoReconnectToggle() {
  const enabled = els.proxyAutoReconnectToggle.checked;
  setProxyBusy(true);

  try {
    const response = await sendProxyMessage('proxy:setAutoReconnect', { enabled });
    if (!response?.ok) throw new Error(response?.error || 'Unable to update auto reconnect.');
    state.proxy = response.state;
    setProxyStatus(enabled ? 'Auto reconnect is on.' : 'Auto reconnect is off.', 'success');
  } catch (error) {
    els.proxyAutoReconnectToggle.checked = Boolean(state.proxy?.autoReconnect ?? true);
    setProxyStatus(error instanceof Error ? error.message : 'Unable to update auto reconnect.', 'error');
  } finally {
    setProxyBusy(false);
    renderProxy();
  }
}

async function saveWebshareToken() {
  const token = els.webshareTokenInput.value.trim();
  if (!token) {
    setProxyStatus('Paste a Webshare API token first.', 'error');
    return;
  }

  setProxyStatus('Saving Webshare free source...', '');
  setProxyBusy(true);

  try {
    const response = await sendProxyMessage('proxy:saveWebshareToken', { token });
    if (!response?.ok) throw new Error(response?.error || 'Unable to save Webshare source.');
    state.proxy = response.state;
    els.webshareTokenInput.value = '';
    const count = state.proxy?.webshareRouteCount || 0;
    setProxyStatus(count ? `Webshare free source ready with ${count} route${count === 1 ? '' : 's'}.` : 'Webshare token saved. No matching route found yet.', count ? 'success' : 'error');
    await refreshPermissionStatus();
  } catch (error) {
    setProxyStatus(error instanceof Error ? error.message : 'Unable to save Webshare source.', 'error');
  } finally {
    setProxyBusy(false);
    renderProxy();
  }
}

async function clearWebshareToken() {
  setProxyStatus('Clearing Webshare free source...', '');
  setProxyBusy(true);

  try {
    const response = await sendProxyMessage('proxy:clearWebshareToken');
    if (!response?.ok) throw new Error(response?.error || 'Unable to clear Webshare source.');
    state.proxy = response.state;
    els.webshareTokenInput.value = '';
    if (!state.settings.autoFill) {
      await removeAutoFillPermission();
    }
    setProxyStatus('Webshare free source cleared.', 'success');
    await refreshPermissionStatus();
  } catch (error) {
    setProxyStatus(error instanceof Error ? error.message : 'Unable to clear Webshare source.', 'error');
  } finally {
    setProxyBusy(false);
    renderProxy();
  }
}

async function toggleProxyConnection() {
  if (state.proxy?.connected) {
    await disconnectProxy();
    return;
  }

  await connectProxy();
}

async function connectProxy() {
  const country = getProxyCountryCode();
  setProxyStatus(`Connecting browser through ${getProxyCountryLabel(country)}...`, '');
  state.proxyAction = 'connecting';
  renderProxy();
  setProxyBusy(true);

  try {
    const hasAuthenticatedRoutes = state.proxy?.webshareConfigured || (state.proxy?.proxies || []).some(proxy => proxy.authenticated);
    if (hasAuthenticatedRoutes && !(await requestProxySiteAccess())) {
      setProxyStatus('Website access is needed for authenticated proxy login.', 'error');
      return;
    }
    await refreshPermissionStatus();

    const response = await sendProxyMessage('proxy:connectBest');
    if (!response?.ok) throw new Error(response?.error || 'Unable to connect proxy.');
    state.proxy = response.state;
    const proxy = state.proxy?.currentProxy;
    setProxyStatus(proxy ? `Browser proxy connected through ${formatProxyAddress(proxy)}.` : 'Browser proxy connected.', 'success');
  } catch (error) {
    setProxyStatus(error instanceof Error ? error.message : 'Unable to connect proxy.', 'error');
  } finally {
    state.proxyAction = '';
    setProxyBusy(false);
    renderProxy();
  }
}

async function connectProxyById(proxyId) {
  if (!proxyId) return;
  setProxyStatus(`Switching ${getProxyCountryLabel(getProxyCountryCode())} route...`, '');
  state.proxyAction = 'connecting';
  renderProxy();
  setProxyBusy(true);

  try {
    const targetProxy = (state.proxy?.proxies || []).find(proxy => proxy.id === proxyId);
    if (targetProxy?.authenticated && !(await requestProxySiteAccess())) {
      setProxyStatus('Website access is needed for authenticated proxy login.', 'error');
      return;
    }
    await refreshPermissionStatus();

    const response = await sendProxyMessage('proxy:connectProxy', { proxyId });
    if (!response?.ok) throw new Error(response?.error || 'Unable to switch proxy.');
    state.proxy = response.state;
    const proxy = state.proxy?.currentProxy;
    setProxyStatus(proxy ? `Browser proxy switched to ${formatProxyAddress(proxy)}.` : 'Browser proxy switched.', 'success');
  } catch (error) {
    setProxyStatus(error instanceof Error ? error.message : 'Unable to switch proxy.', 'error');
  } finally {
    state.proxyAction = '';
    setProxyBusy(false);
    renderProxy();
  }
}

async function disconnectProxy() {
  setProxyStatus('Disconnecting browser proxy...', '');
  state.proxyAction = 'disconnecting';
  renderProxy();
  setProxyBusy(true);

  try {
    const response = await sendProxyMessage('proxy:disconnect');
    if (!response?.ok) throw new Error(response?.error || 'Unable to disconnect proxy.');
    state.proxy = response.state;
    setProxyStatus('Browser proxy disconnected.', 'success');
  } catch (error) {
    setProxyStatus(error instanceof Error ? error.message : 'Unable to disconnect proxy.', 'error');
  } finally {
    state.proxyAction = '';
    setProxyBusy(false);
    renderProxy();
  }
}

function renderProxy() {
  if (!els.proxyList) return;

  const proxyState = state.proxy || {
    connected: false,
    autoReconnect: true,
    proxies: [],
    currentProxy: null,
    lastRefreshAt: '',
    error: '',
  };
  const currentProxy = proxyState.currentProxy;
  const proxies = Array.isArray(proxyState.proxies) ? proxyState.proxies : [];
  const country = proxyState.country || DEFAULT_PROXY_COUNTRY;
  const countryButtonLabel = getProxyCountryButtonLabel(country);

  els.proxyCountrySelect.value = country;
  els.proxyCountryEyebrow.textContent = `${countryButtonLabel} proxy`;
  els.proxyCountLabel.textContent = `Working ${countryButtonLabel}`;
  els.proxyBadge.textContent = proxyState.connected ? 'Connected' : 'Off';
  els.proxySignal.classList.toggle('connected', Boolean(proxyState.connected));
  els.proxyCount.textContent = String(proxies.length);
  els.proxyIp.textContent = currentProxy?.verifiedIp || 'None';
  els.proxyVerifiedCountry.textContent = currentProxy?.verifiedCountry || currentProxy?.country || 'None';
  els.proxyVerifiedAt.textContent = formatProxyTime(currentProxy?.verifiedAt || proxyState.lastRefreshAt);
  els.proxyAutoReconnectToggle.checked = proxyState.autoReconnect !== false;
  els.proxyCurrent.textContent = currentProxy
    ? `${formatProxyLocation(currentProxy)} via ${formatProxyAddress(currentProxy)}`
    : 'No browser proxy active.';
  if (els.proxyStableNote) {
    const stableCount = proxyState.webshareRouteCount || proxies.filter(proxy => proxy.provider === 'Webshare Free').length;
    els.proxyStableNote.textContent = proxyState.webshareConfigured
      ? stableCount
        ? `${stableCount} route${stableCount === 1 ? '' : 's'}`
        : 'Token saved'
      : 'Not configured';
  }
  if (els.clearWebshareTokenBtn) {
    els.clearWebshareTokenBtn.disabled = !proxyState.webshareConfigured;
  }
  renderProxySourceSteps(proxyState);
  const buttonState = getProxyButtonState(proxyState);
  els.proxyToggleBtn.textContent = buttonState.label;
  els.proxyToggleBtn.className = buttonState.className;
  els.proxyToggleBtn.disabled = !proxyState.connected && proxies.length === 0;

  renderProxyList(proxies, currentProxy?.id || '');

  if (proxyState.error) {
    setProxyStatus(proxyState.error, proxyState.connected ? 'success' : 'error');
  }
}

function renderProxyList(proxies, currentProxyId) {
  const visibleProxies = proxies.slice(0, 8);
  const country = getProxyCountryCode();

  if (!visibleProxies.length) {
    els.proxyList.replaceChildren(emptyCard(`No ${getProxyCountryButtonLabel(country)} routes yet`, 'Tap Refresh to fetch routes from Webshare, Proxifly, ProxyScrape, and Geonode.', 'proxy'));
    return;
  }

  els.proxyList.replaceChildren(...visibleProxies.map(proxy => createProxyRouteButton(proxy, currentProxyId)));
}

function renderProxySourceSteps(proxyState) {
  if (!els.proxySourceSteps) return;
  const steps = Array.from(els.proxySourceSteps.querySelectorAll('span'));
  const hasToken = Boolean(proxyState.webshareConfigured);
  const hasRoutes = Boolean(proxyState.webshareRouteCount || (proxyState.proxies || []).some(proxy => proxy.provider === 'Webshare Free'));
  const connected = Boolean(proxyState.connected);
  [hasToken, hasRoutes, connected].forEach((isActive, index) => {
    steps[index]?.classList.toggle('active', isActive);
  });
}

function createProxyRouteButton(proxy, currentProxyId) {
  const button = document.createElement('button');
  button.className = `proxy-route ${proxy.id === currentProxyId ? 'active' : ''}`.trim();
  button.type = 'button';
  button.addEventListener('click', () => connectProxyById(proxy.id));

  const header = document.createElement('div');
  header.className = 'proxy-route-header';

  const copy = document.createElement('div');
  const label = document.createElement('span');
  label.className = 'proxy-route-label';
  label.textContent = proxy.id === currentProxyId ? 'Active route' : 'Available route';

  const title = document.createElement('strong');
  title.textContent = formatProxyLocation(proxy);
  copy.append(label, title);

  const checked = document.createElement('small');
  checked.textContent = formatProxyTime(proxy.lastChecked);
  header.append(copy, checked);

  const meta = document.createElement('div');
  meta.className = 'proxy-route-meta';
  [
    proxy.provider || '',
    proxy.authenticated ? 'Auth' : '',
    proxy.verifiedCountry ? `Verified ${proxy.verifiedCountry}` : '',
    proxy.verifiedIp ? `IP ${proxy.verifiedIp}` : '',
    proxy.protocol.toUpperCase(),
    formatProxyMetric(proxy.responseTime || proxy.latency, 'ms'),
    proxy.uptime ? `${Math.round(proxy.uptime)}% uptime` : '',
    proxy.anonymityLevel || '',
  ].filter(Boolean).forEach(value => {
    const chip = document.createElement('span');
    chip.className = 'proxy-chip';
    chip.textContent = value;
    meta.append(chip);
  });

  button.append(header, meta);
  return button;
}

function setProxyBusy(isBusy) {
  [
    els.proxyRefreshBtn,
    els.proxyToggleBtn,
    els.proxyCountrySelect,
    els.proxyAutoReconnectToggle,
    els.webshareTokenInput,
    els.saveWebshareTokenBtn,
    els.clearWebshareTokenBtn,
  ].filter(Boolean).forEach(control => {
    control.disabled = isBusy;
  });
}

function setProxyStatus(message, type = '') {
  if (!els.proxyStatusLine) return;
  els.proxyStatusLine.textContent = message;
  els.proxyStatusLine.className = `proxy-card-status status-line ${type}`.trim();
}

function sendProxyMessage(type, payload = {}) {
  return chrome.runtime.sendMessage({ ...payload, type });
}

function formatCountryOptionLabel(code, label = '') {
  return [countryFlag(code), label || code].filter(Boolean).join(' ');
}

function countryFlag(code) {
  const countryCode = String(code || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) return '';
  return Array.from(countryCode)
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

function getProxyCountryCode() {
  return state.proxy?.country || els.proxyCountrySelect?.value || DEFAULT_PROXY_COUNTRY;
}

function getProxyCountryLabel(code) {
  const countryCode = code || DEFAULT_PROXY_COUNTRY;
  return formatCountryOptionLabel(countryCode, COUNTRIES[countryCode]?.label || countryCode);
}

function getProxyCountryButtonLabel(code) {
  const countryCode = code || DEFAULT_PROXY_COUNTRY;
  const label = countryCode === 'US' ? 'USA' : countryCode;
  return formatCountryOptionLabel(countryCode, label);
}

function getProxyButtonState(proxyState) {
  if (state.proxyAction === 'connecting') {
    return {
      label: 'Connecting...',
      className: 'primary-action proxy-toggle connecting',
    };
  }

  if (state.proxyAction === 'disconnecting' || proxyState.connected) {
    return {
      label: 'Disconnect',
      className: 'secondary-action proxy-toggle disconnect',
    };
  }

  return {
    label: 'Connect',
    className: 'primary-action proxy-toggle',
  };
}

function formatProxyLocation(proxy) {
  const country = proxy.verifiedCountry || proxy.country;
  return [
    proxy.verifiedCity || proxy.city,
    proxy.verifiedRegion || proxy.region,
    getProxyCountryLabel(country),
  ].filter(Boolean).join(', ') || getProxyCountryLabel(country);
}

function formatProxyAddress(proxy) {
  return `${proxy.protocol.toUpperCase()} ${proxy.host}:${proxy.port}`;
}

function formatProxyMetric(value, suffix) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return '';
  return `${Math.round(number)} ${suffix}`;
}

function formatProxyTime(value) {
  if (!value) return 'Never';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never';

  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return 'Now';
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;

  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

async function saveSettingsFromControls() {
  state.settings = {
    ...state.settings,
    country: els.countrySelect.value,
    nameStyle: els.nameStyleSelect.value,
    saveHistory: els.saveHistoryToggle.checked,
    autoCopy: els.autoCopyToggle.checked,
    autoFill: state.settings.autoFill,
    cardAutoFill: els.cardAutoFillToggle.checked,
    antiFingerprint: els.antiFingerprintToggle.checked,
  };
  hydrateControls();
  await persistSettings();
  renderSettingsStatus();
  setStatus('Settings saved.', 'success');
}

async function persistSettings() {
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: state.settings });
}

async function handleAutoFillToggle() {
  const shouldEnable = els.autoFillToggle.checked;

  try {
    if (shouldEnable) {
      setStatus('Chrome will ask for website access before auto-fill turns on.', '');
      const granted = await requestAutoFillPermission();
      if (!granted) {
        state.settings.autoFill = false;
        hydrateControls();
        await persistSettings();
        setStatus('Auto-fill permission was not granted.', 'error');
        return;
      }

      state.settings.autoFill = true;
      await persistSettings();
      await registerAutoFillScript();
      await runAutoFillOnActiveTab();
      await refreshPermissionStatus();
      setStatus('Auto-fill is on. New forms will fill automatically.', 'success');
      return;
    }

    state.settings.autoFill = false;
    await persistSettings();
    await unregisterAutoFillScript();
    const removedPermission = await removeAutoFillPermission();
    await refreshPermissionStatus();
    setStatus(removedPermission ? 'Auto-fill is off and website access was removed.' : 'Auto-fill is off. Website access stayed on for proxy auth.', 'success');
  } catch (error) {
    state.settings.autoFill = false;
    hydrateControls();
    await persistSettings();
    setStatus(error instanceof Error ? error.message : 'Unable to update auto-fill.', 'error');
  }
}

async function handleCardAutoFillToggle() {
  state.settings.cardAutoFill = els.cardAutoFillToggle.checked;
  await persistSettings();
  renderSettingsStatus();
  setStatus(state.settings.cardAutoFill ? 'Card autofill is on for manual Fill form.' : 'Card autofill is off.', 'success');
}

async function handleAntiFingerprintToggle() {
  state.settings.antiFingerprint = els.antiFingerprintToggle.checked;
  await persistSettings();
  if (state.settings.autoFill) {
    await syncAutoFillPermissionState();
  }
  setStatus(state.settings.antiFingerprint ? 'Anti-fingerprinting is on.' : 'Anti-fingerprinting is off.', 'success');
}

async function syncAutoFillPermissionState() {
  if (!state.settings.autoFill) {
    await unregisterAutoFillScript();
    return;
  }

  if (!(await hasAutoFillPermission())) {
    state.settings.autoFill = false;
    await persistSettings();
    hydrateControls();
    return;
  }

  try {
    await registerAutoFillScript();
  } catch {
    state.settings.autoFill = false;
    await persistSettings();
    hydrateControls();
  }
}

async function refreshPermissionStatus() {
  state.permissionStatus.siteAccess = await hasAutoFillPermission();
  renderSettingsStatus();
}

function renderSettingsStatus() {
  const siteAccess = Boolean(state.permissionStatus.siteAccess);
  setStatusPill(els.autoFillAccessStatus, siteAccess ? 'On' : 'Off', siteAccess);
  setStatusPill(els.proxyAuthAccessStatus, siteAccess ? 'On' : 'Off', siteAccess);
  setStatusPill(els.webshareSourceStatus, state.proxy?.webshareConfigured ? 'Configured' : 'Not configured', Boolean(state.proxy?.webshareConfigured));
}

function setStatusPill(element, text, isOn) {
  if (!element) return;
  element.textContent = text;
  element.className = isOn ? 'on' : 'off';
}

async function hasAutoFillPermission() {
  return chrome.permissions.contains({ origins: AUTOFILL_ORIGINS });
}

async function requestAutoFillPermission() {
  if (await hasAutoFillPermission()) return true;
  return chrome.permissions.request({ origins: AUTOFILL_ORIGINS });
}

async function requestProxySiteAccess() {
  if (await hasAutoFillPermission()) return true;
  setProxyStatus('Chrome will ask for website access to log in to the proxy.', '');
  return chrome.permissions.request({ origins: AUTOFILL_ORIGINS });
}

async function removeAutoFillPermission() {
  if (state.proxy?.connected && state.proxy?.currentProxy?.authenticated) return false;
  if (!(await hasAutoFillPermission())) return false;
  return chrome.permissions.remove({ origins: AUTOFILL_ORIGINS });
}

async function registerAutoFillScript() {
  await unregisterAutoFillScript();
  await chrome.scripting.registerContentScripts([
    {
      id: AUTOFILL_SCRIPT_ID,
      matches: AUTOFILL_ORIGINS,
      js: ['content-autofill.js'],
      runAt: 'document_idle',
      allFrames: true,
      persistAcrossSessions: true,
    },
    {
      id: SPOOF_SCRIPT_ID,
      matches: AUTOFILL_ORIGINS,
      js: ['content-spoof.js'],
      runAt: 'document_start',
      allFrames: true,
      persistAcrossSessions: true,
    }
  ]);
}

async function unregisterAutoFillScript() {
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [AUTOFILL_SCRIPT_ID, SPOOF_SCRIPT_ID] });
  } catch {
    // Chrome throws if the script was not registered yet.
  }
}

async function runAutoFillOnActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !/^https?:\/\//.test(tab.url || '')) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ['content-autofill.js'],
    });
    if (state.settings.antiFingerprint) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ['content-spoof.js'],
      });
    }
  } catch {
    // Some active pages block scripting. Future normal pages still auto-fill.
  }
}

async function copyValue(key) {
  const value = getCopyValue(key);
  if (!value) return;
  await copyText(value, `${labelForKey(key)} copied.`);
}

function getCopyValue(key) {
  return state.privateCard?.[key] || state.identity?.[key] || '';
}

async function copyInboxAddress() {
  const email = state.identity?.email;
  if (!email) {
    setStatus('No inbox address to copy.', 'error');
    return;
  }
  await copyText(email, 'Inbox address copied.');
}

async function copyFullIdentity() {
  if (!state.identity) return;
  const text = [
    state.identity.fullName,
    state.identity.fullNameWithMiddle ? `Full name with middle: ${state.identity.fullNameWithMiddle}` : '',
    state.identity.username ? `Username: ${state.identity.username}` : '',
    state.identity.prefix ? `Title: ${state.identity.prefix}` : '',
    state.identity.gender ? `Gender: ${state.identity.gender}` : '',
    state.identity.age ? `Age: ${state.identity.age}` : '',
    state.identity.email,
    `Password: ${state.identity.password}`,
    `Confirm password: ${state.identity.confirmPassword}`,
    state.identity.phone,
    state.identity.phoneNational ? `National phone: ${state.identity.phoneNational}` : '',
    state.identity.address1,
    state.identity.address2,
    `${state.identity.city}, ${state.identity.state} ${state.identity.postalCode}`,
    state.identity.country,
    state.identity.addressBlock ? `Address block:\n${state.identity.addressBlock}` : '',
    state.identity.dateOfBirth ? `Date of birth: ${state.identity.dateOfBirth}` : '',
    state.identity.birthYear ? `Birth year: ${state.identity.birthYear}` : '',
    state.identity.birthMonthName ? `Birth month: ${state.identity.birthMonthName}` : '',
    state.identity.birthDay ? `Birth day: ${state.identity.birthDay}` : '',
    state.identity.company ? `Company: ${state.identity.company}` : '',
    state.identity.jobTitle ? `Job title: ${state.identity.jobTitle}` : '',
    state.privateCard?.cardLine ? `Card: ${state.privateCard.cardLine}` : '',
  ].filter(Boolean).join('\n');
  await copyText(text, 'Full identity copied.');
}

function exportProfilesJson() {
  const payload = {
    exportedAt: new Date().toISOString(),
    current: sanitizeExportIdentity(state.identity),
    history: state.history.map(sanitizeExportIdentity).filter(Boolean),
  };
  downloadText(`new-identity-profiles-${dateStamp()}.json`, JSON.stringify(payload, null, 2), 'application/json');
  setStatus('Profiles exported as JSON.', 'success');
}

function exportProfilesCsv() {
  const profiles = exportableProfiles();
  if (!profiles.length) {
    setStatus('No profiles to export.', 'error');
    return;
  }

  const headers = ['fullName', 'fullNameWithMiddle', 'username', 'prefix', 'gender', 'age', 'email', 'phone', 'phoneNational', 'address1', 'address2', 'city', 'state', 'postalCode', 'country', 'addressBlock', 'dateOfBirth', 'birthYear', 'birthMonthName', 'birthDay', 'company', 'jobTitle', 'website'];
  const lines = [
    headers.join(','),
    ...profiles.map(profile => headers.map(header => csvCell(profile[header])).join(',')),
  ];
  downloadText(`new-identity-profiles-${dateStamp()}.csv`, lines.join('\n'), 'text/csv');
  setStatus('Profiles exported as CSV.', 'success');
}

async function importProfilesJson(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;

  try {
    const payload = JSON.parse(await file.text());
    const importedProfiles = normalizeImportedProfiles(payload);
    if (!importedProfiles.length) throw new Error('No profiles found in this JSON file.');

    state.identity = importedProfiles[0];
    state.history = uniqueProfiles([...importedProfiles, ...state.history]).slice(0, 12);
    await chrome.storage.local.set({
      [STORAGE_KEYS.identity]: state.identity,
      [STORAGE_KEYS.history]: state.history,
    });
    renderAll();
    setStatus(`Imported ${importedProfiles.length} profile${importedProfiles.length === 1 ? '' : 's'}.`, 'success');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Unable to import profiles.', 'error');
  }
}

function exportableProfiles() {
  return uniqueProfiles([state.identity, ...state.history].filter(Boolean)).map(sanitizeExportIdentity).filter(Boolean);
}

function sanitizeExportIdentity(identity) {
  if (!identity) return null;
  const {
    cardNumber,
    cardName,
    cardExpiry,
    cardExpiryMonth,
    cardExpiryYear,
    cardCvv,
    cardLine,
    cardAutofillEnabled,
    ...safeIdentity
  } = identity;
  return safeIdentity;
}

function normalizeImportedProfiles(payload) {
  const rawProfiles = [
    payload?.current,
    ...(Array.isArray(payload?.history) ? payload.history : []),
    ...(Array.isArray(payload?.profiles) ? payload.profiles : []),
    ...(Array.isArray(payload) ? payload : []),
  ].filter(Boolean);

  return uniqueProfiles(rawProfiles.map(sanitizeExportIdentity).filter(profile => profile?.email || profile?.fullName));
}

function uniqueProfiles(profiles) {
  const seen = new Set();
  return profiles.filter(profile => {
    const key = profile?.email || `${profile?.fullName || ''}:${profile?.createdAt || ''}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    setStatus(message, 'success');
  } catch {
    setStatus('Clipboard access was blocked by the browser.', 'error');
  }
}

async function fillCurrentPage() {
  if (!state.identity) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab found.');

    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ['content-autofill.js'],
    });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: identity => window.__newIdentityFillFields?.(identity, { force: true }) || 0,
      args: [buildFillIdentity()],
    });
    const filled = results.reduce((total, item) => total + Number(item.result || 0), 0);

    setStatus(filled > 0 ? `Filled ${filled} field${filled === 1 ? '' : 's'} on this page.` : 'No matching fields found.', filled > 0 ? 'success' : 'error');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Unable to fill this page.', 'error');
  }
}

function buildFillIdentity() {
  const identity = { ...state.identity };
  if (state.settings.cardAutoFill && state.privateCard) {
    Object.assign(identity, {
      cardAutofillEnabled: true,
      cardName: state.identity.fullName,
      cardNumber: state.privateCard.cardNumber,
      cardExpiry: state.privateCard.cardExpiry,
      cardExpiryMonth: state.privateCard.cardExpiryMonth,
      cardExpiryYear: state.privateCard.cardExpiryYear,
      cardCvv: state.privateCard.cardCvv,
    });
  }
  return identity;
}

async function fillOtpOnActiveTab(code, showStatus = true) {
  if (!code) {
    if (showStatus) setStatus('No OTP code found to fill.', 'error');
    return 0;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https?:\/\//.test(tab.url || '')) {
      if (showStatus) setStatus('Open the verification page, then tap Fill OTP.', 'error');
      return 0;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ['content-autofill.js'],
    });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: otp => window.__newIdentityFillOtp?.(otp, { force: true }) || 0,
      args: [code],
    });
    const filled = results.reduce((total, item) => total + Number(item.result || 0), 0);

    if (showStatus) {
      setStatus(filled > 0 ? `OTP ${code} filled on the page.` : `No OTP field found. OTP ${code} is ready to copy.`, filled > 0 ? 'success' : 'error');
    }

    return filled;
  } catch (error) {
    if (showStatus) setStatus(error instanceof Error ? error.message : 'Unable to fill OTP on this page.', 'error');
    return 0;
  }
}

async function createTemporaryMailbox(firstName, lastName) {
  try {
    return createCatchmailMailbox(firstName, lastName);
  } catch {
    return createMailTmMailbox(firstName, lastName);
  }
}

function createCatchmailMailbox(firstName, lastName) {
  const localPart = buildMailboxLocalPart(firstName, lastName, 0).slice(0, 48);
  return {
    provider: 'catchmail',
    label: 'Catchmail',
    address: `${localPart}@${CATCHMAIL_DOMAIN}`,
    createdAt: new Date().toISOString(),
  };
}

async function createMailTmMailbox(firstName, lastName) {
  const domain = await getMailTmDomain();
  if (!domain) throw new Error('Mail.tm did not return an available domain.');

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const localPart = buildMailboxLocalPart(firstName, lastName, attempt);
    const address = `${localPart}@${domain}`;
    const password = createPassword();

    try {
      const account = await mailTmRequest('/accounts', {
        method: 'POST',
        body: { address, password },
      });
      const tokenResponse = await loginMailTm(address, password);

      if (!tokenResponse.token) throw new Error('Mail.tm did not return an inbox token.');

      return {
        provider: 'mail.tm',
        label: 'Mail.tm',
        address,
        password,
        token: tokenResponse.token,
        accountId: account.id,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error?.status === 422 && attempt < 4) continue;
      throw error;
    }
  }

  throw new Error('Unable to reserve a unique temporary mailbox.');
}

async function loginMailTm(address, password) {
  let lastError;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      if (attempt > 0) await delay(450 * attempt);
      return await mailTmRequest('/token', {
        method: 'POST',
        body: { address, password },
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to sign in to the temporary inbox.');
}

async function listMailboxMessages(mailbox) {
  if (mailbox.provider === 'catchmail') {
    const response = await catchmailRequest(`/api/v1/mailbox?address=${encodeURIComponent(mailbox.address)}`);
    return (response.messages || []).map(message => ({
      id: String(message.id),
      from: message.from,
      subject: message.subject || 'No subject',
      intro: message.subject || '',
      date: message.date,
      provider: 'catchmail',
    }));
  }

  const response = await mailTmRequest('/messages', { token: mailbox.token });
  return response['hydra:member'] || [];
}

async function readMailboxMessage(mailbox, messageId) {
  if (mailbox.provider === 'catchmail') {
    return catchmailRequest(`/api/v1/message/${encodeURIComponent(messageId)}?mailbox=${encodeURIComponent(mailbox.address)}`);
  }

  return mailTmRequest(`/messages/${messageId}`, { token: mailbox.token });
}

async function getMailTmDomain() {
  const responses = [];

  try {
    responses.push(await mailTmRequest('/domains'));
  } catch {
    responses.push(null);
  }

  try {
    responses.push(await mailTmRequest('/domains?page=1'));
  } catch {
    responses.push(null);
  }

  for (const response of responses) {
    const domain = extractMailTmDomains(response).find(item => item.isActive !== false && item.domain)?.domain;
    if (domain) return domain;
  }

  return MAIL_TM_FALLBACK_DOMAINS[0] || '';
}

function extractMailTmDomains(response) {
  const collections = [
    response?.['hydra:member'],
    response?.member,
    response?.domains,
    response?.items,
    response?.data,
    Array.isArray(response) ? response : null,
  ].filter(Array.isArray);

  return collections
    .flat()
    .map(item => typeof item === 'string' ? { domain: item, isActive: true } : item)
    .filter(item => item?.domain);
}

async function mailTmRequest(path, options = {}) {
  const headers = {
    accept: 'application/json',
  };

  if (options.body) headers['content-type'] = 'application/json';
  if (options.token) headers.authorization = `Bearer ${options.token}`;

  const response = await fetch(`${MAIL_TM_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (!response.ok) {
    const message = data?.detail || data?.message || `Mail.tm request failed with status ${response.status}.`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data || {};
}

async function catchmailRequest(path) {
  const response = await fetch(`${CATCHMAIL_BASE}${path}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
    },
  });
  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (!response.ok) {
    const message = data?.error?.message || data?.message || `Catchmail request failed with status ${response.status}.`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data || {};
}

async function clearHistory() {
  state.history = [];
  await chrome.storage.local.set({ [STORAGE_KEYS.history]: [] });
  renderHistory();
  setStatus('History cleared.', 'success');
}

function setStatus(message, type = '') {
  els.statusLines.forEach(line => {
    line.textContent = message;
    line.className = `status-line ${type}`.trim();
  });
}

function buildMailboxLocalPart(firstName, lastName, attempt) {
  const seed = `${slug(firstName)}.${slug(lastName)}.${Date.now().toString(36)}${rand(100, 999)}${attempt || ''}`;
  return seed.replace(/^\.+|\.+$/g, '').slice(0, 54) || `user.${Date.now().toString(36)}`;
}

function createIdentityProfile(identity) {
  const birth = identity.dateOfBirth ? parseBirthDate(identity.dateOfBirth) : createBirthDate();
  const gender = identity.gender || inferGender(identity.firstName);
  const prefix = gender === 'Female' ? 'Ms.' : 'Mr.';
  const middleName = identity.middleName || createMiddleName(gender.toLowerCase(), identity.firstName);
  const address2 = identity.address2 || `${pick(ADDRESS2_PREFIXES)} ${rand(2, 998)}`;
  const company = identity.company || pick(COMPANY_NAMES);
  const jobTitle = identity.jobTitle || pick(JOB_TITLES);
  const username = identity.username || createUsername(identity.firstName, identity.lastName);
  const countryCode = identity.countryCode || '';
  const countryConfig = COUNTRIES[countryCode] || {};

  return {
    middleName,
    fullNameWithMiddle: `${identity.firstName} ${middleName} ${identity.lastName}`,
    prefix,
    title: prefix,
    gender,
    genderShort: gender === 'Female' ? 'F' : 'M',
    username,
    phoneNational: createNationalPhone(identity.phone),
    address2,
    addressBlock: [identity.address1, address2, `${identity.city}, ${identity.state} ${identity.postalCode}`, identity.country].filter(Boolean).join('\n'),
    dateOfBirth: birth.dateOfBirth,
    birthDay: birth.day,
    birthDayPadded: String(birth.day).padStart(2, '0'),
    birthMonth: birth.month,
    birthMonthPadded: String(birth.month).padStart(2, '0'),
    birthMonthName: MONTH_NAMES[birth.month - 1],
    birthYear: birth.year,
    age: birth.age,
    company,
    organization: company,
    jobTitle,
    occupation: jobTitle,
    website: `https://${slug(company)}-${countryCode.toLowerCase() || 'global'}.example`,
    timezone: countryConfig.timezone || 'UTC',
    locale: countryConfig.locale || 'en-US',
    latitude: countryConfig.latitude || 0,
    longitude: countryConfig.longitude || 0,
  };
}

function createMiddleName(style, firstName) {
  const names = FIRST_NAMES[style] || [...FIRST_NAMES.female, ...FIRST_NAMES.male];
  const availableNames = names.filter(name => name !== firstName);
  return pick(availableNames.length ? availableNames : names);
}

function createUsername(firstName, lastName) {
  return `${slug(firstName)}.${slug(lastName)}${rand(10, 999)}`;
}

function createNationalPhone(phone) {
  return String(phone || '').replace(/^\+\d+\s*/, '').trim();
}

function createBirthDate() {
  const today = new Date();
  const age = rand(21, 58);
  const year = today.getFullYear() - age;
  const month = rand(1, 12);
  const day = rand(1, 28);
  return {
    age,
    year,
    month,
    day,
    dateOfBirth: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  };
}

function parseBirthDate(value) {
  const [yearValue, monthValue, dayValue] = String(value || '').split('-').map(Number);
  if (!yearValue || !monthValue || !dayValue) return createBirthDate();

  const today = new Date();
  const birthdayThisYear = new Date(today.getFullYear(), monthValue - 1, dayValue);
  const age = today.getFullYear() - yearValue - (birthdayThisYear > today ? 1 : 0);
  return {
    age,
    year: yearValue,
    month: monthValue,
    day: dayValue,
    dateOfBirth: `${yearValue}-${String(monthValue).padStart(2, '0')}-${String(dayValue).padStart(2, '0')}`,
  };
}

function inferGender(firstName) {
  if (FIRST_NAMES.female.includes(firstName)) return 'Female';
  if (FIRST_NAMES.male.includes(firstName)) return 'Male';
  return pick(['Female', 'Male']);
}

function createPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, value => chars[value % chars.length]).join('');
}

function createAccountPassword() {
  const groups = [
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    'abcdefghijkmnopqrstuvwxyz',
    '23456789',
    '!@#$%',
  ];
  const allChars = groups.join('');
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  const required = groups.map((group, index) => group[bytes[index] % group.length]);
  const rest = Array.from(bytes.slice(required.length), value => allChars[value % allChars.length]);
  return shuffle([...required, ...rest]).join('');
}

function ensurePasswordFields() {
  let changed = false;

  state.identity = ensureIdentityPasswordFields(state.identity);
  if (state.identity?.__passwordFieldsAdded) {
    changed = true;
    delete state.identity.__passwordFieldsAdded;
  }

  state.history = state.history.map(identity => {
    const updated = ensureIdentityPasswordFields(identity);
    if (updated?.__passwordFieldsAdded) {
      changed = true;
      delete updated.__passwordFieldsAdded;
    }
    return updated;
  });

  return changed;
}

function ensureIdentityPasswordFields(identity) {
  if (!identity) return identity;
  let updatedIdentity = identity;

  if (!identity.password || identity.confirmPassword !== identity.password) {
    const password = identity.password || createAccountPassword();
    updatedIdentity = {
      ...updatedIdentity,
      password,
      confirmPassword: password,
      __passwordFieldsAdded: true,
    };
  }

  const profile = createIdentityProfile(updatedIdentity);
  const missingProfile = Object.fromEntries(
    Object.entries(profile).filter(([key]) => !updatedIdentity[key])
  );

  if (!Object.keys(missingProfile).length) return updatedIdentity;

  return {
    ...updatedIdentity,
    ...missingProfile,
    __passwordFieldsAdded: true,
  };
}

function getMessageBody(detail) {
  if (!detail) return '';
  const catchmailBody = detail.body?.text || detail.body?.html;
  const value = catchmailBody || detail.body_text || detail.text || (Array.isArray(detail.html) ? detail.html.join('\n') : detail.html) || detail.intro || '';
  return stripHtml(appendHtmlLinkTargets(value)).replace(/\s+\n/g, '\n').trim();
}

function appendHtmlLinkTargets(value) {
  return String(value || '').replace(/<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi, (match, quote, href, label) => {
    const cleanHref = href.replace(/&amp;/g, '&').trim();
    const cleanLabel = stripHtml(label).trim();
    return cleanLabel.includes(cleanHref) ? cleanLabel : `${cleanLabel} ${cleanHref}`;
  });
}

function formatMessageBody(body, message) {
  const preview = String(body || '').slice(0, 1400);
  const urlPattern = /https?:\/\/[^\s<>"']+/g;
  let cursor = 0;
  let output = '';
  let match;

  while ((match = urlPattern.exec(preview)) !== null) {
    const rawUrl = match[0];
    const cleanUrl = rawUrl.replace(/[),.;:!?]+$/g, '');
    const trailing = rawUrl.slice(cleanUrl.length);

    output += escapeHtml(preview.slice(cursor, match.index));
    output += createMessageLinkHtml(cleanUrl, message, body);
    output += escapeHtml(trailing);
    cursor = match.index + rawUrl.length;
  }

  output += escapeHtml(preview.slice(cursor));
  return output;
}

function createMessageLinkHtml(url, message, body) {
  const href = safeHttpUrl(url);
  if (!href) return escapeHtml(url);

  const label = buildMessageLinkLabel(href, message, body);
  return `<a class="message-link" href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function buildMessageLinkLabel(url, message, body) {
  const brand = inferMessageLinkBrand(url, message) || 'website';
  const text = `${message?.subject || ''} ${message?.intro || ''} ${body || ''}`.toLowerCase();
  const verb = /sign\s*up|signup|register|registration/.test(text)
    ? 'Sign up'
    : /verify|verification|confirm|activate/.test(text)
      ? 'Verify'
      : 'Open';

  return `${verb} ${brand}`;
}

function inferMessageLinkBrand(url, message) {
  const sender = normalizeSender(message?.from || '');
  const senderName = sender.replace(/<[^>]+>/g, '').replace(/["']/g, '').trim();
  if (senderName && !senderName.includes('@') && senderName.length <= 32) return senderName;

  try {
    const hostParts = new URL(url).hostname.split('.').filter(Boolean);
    const ignoredParts = new Set(['www', 'app', 'api', 'auth', 'login', 'account', 'accounts', 'clerk', 'mail', 'email', 'verify']);
    const meaningful = hostParts.filter(part => !ignoredParts.has(part));
    const name = meaningful.length >= 2 ? meaningful[meaningful.length - 2] : meaningful[0] || hostParts[0];
    return titleCaseSlug(name);
  } catch {
    return '';
  }
}

function normalizeSender(sender) {
  if (!sender) return 'Unknown sender';
  if (typeof sender === 'string') return sender;
  return sender.address || sender.name || 'Unknown sender';
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function stripHtml(value) {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/\s{2,}/g, ' ');
}

function extractCode(value) {
  const text = stripHtml(value || '');
  const preferred = text.match(/(?:code|otp|verification|verify|passcode|pin)[^\d]{0,24}(\d[\d\s-]{2,14}\d)/i)
    || text.match(/(\d[\d\s-]{2,14}\d)[^\w]{0,24}(?:code|otp|verification|verify|passcode|pin)/i);
  const fallback = preferred ? null : text.match(/\b(\d{6})\b/);
  const digits = (preferred?.[1] || fallback?.[1] || '').replace(/\D/g, '');
  return digits.length >= 4 && digits.length <= 8 ? digits : '';
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function labelForKey(key) {
  const labels = {
    fullNameWithMiddle: 'Full name with middle',
    phoneNational: 'National phone',
    addressBlock: 'Address block',
    dateOfBirth: 'Date of birth',
    birthYear: 'Birth year',
    birthMonthName: 'Birth month',
    birthDay: 'Birth day',
    cardNumber: 'Card number',
    cardExpiry: 'Card expiry',
    cardCvv: 'CVV',
    cardLine: 'Card line',
  };
  if (labels[key]) return labels[key];
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, char => char.toUpperCase());
}

function titleCaseSlug(value) {
  return String(value || '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = rand(0, index);
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
