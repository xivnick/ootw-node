
const axios = require('axios');
const utils = require('../utils');

const SERVICE_KEY = process.env.SERVICE_KEY;
const CATEGORIES = ['TMP', 'POP', 'PCP', 'REH', 'SKY', 'WSD', 'VEC'];

const fetchHourlyForecast = async (nx, ny, dateStr) => {

    const { base_date, base_time } = utils.getBaseDateTime(dateStr);
    const params = {
        nx, ny,
        numOfRows: 360,
        pageNo: 1,
        dataType: 'JSON',
        base_date,
        base_time,
    };

    const { data } = await axios.get(
        `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${SERVICE_KEY}`,
        { params }
    );

    if(!data.response) {
        console.log({params})
        console.log({data});

        return { error: data };
    }
    
    const header = data.response.header;
    if (header.resultCode !== '00') {
    	return { error: header.resultMsg };
    }

    const items   = data.response.body.items.item
        .filter(i => i.fcstDate === dateStr && CATEGORIES.includes(i.category));
    const hours   = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}00`);
    const forecast  = [];

    for (const h of hours) {
        const entry = { time: h };
        for (const cat of CATEGORIES) {
            const rec = items.find(i => i.fcstTime === h && i.category === cat);
            entry[cat] = rec ? rec.fcstValue : null;
        }
        forecast.push(entry);
    }

    return { forecast };
};

module.exports = {
    fetchHourlyForecast,
}