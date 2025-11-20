// utils/Range.js
const RangeValue = 2000;
const url = "https://api.thingspeak.com/channels/3165131/feeds.json?api_key=9LCWBMTKER3RNXHV&results";

const carvideRangeMin = 120;
const carvideRangeMax = 200;

const thoracicRangeMin = 600;
const thoracicRangeMax = 700;

const lumberRangeMin = 640;
const lumberRangeMax = 700;

const sacralRangeMin = 150;
const sacralRangeMax = 200;

const leftCarvideRangeMin = 190;
const leftCarvideRangeMax = 200;

const rightCarvideRangeMin = 190;
const rightCarvideRangeMax = 200;

const leftIliumRangeMin = 340;
const leftIliumRangeMax = 400;

const rightIliumRangeMin = 340;
const rightIliumRangeMax = 400;

module.exports = {
    RangeValue,
    url,
    carvideRangeMin,
    carvideRangeMax,
    thoracicRangeMin,
    thoracicRangeMax,
    lumberRangeMin,
    lumberRangeMax,
    sacralRangeMin,
    sacralRangeMax,
    leftCarvideRangeMin,
    leftCarvideRangeMax,
    rightCarvideRangeMin,
    rightCarvideRangeMax,
    leftIliumRangeMin,
    leftIliumRangeMax,
    rightIliumRangeMin,
    rightIliumRangeMax
};
