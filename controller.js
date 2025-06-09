
const weather = require('./lib/weather');
const outfit = require('./lib/outfit');
const mapper = require('./mapper');
const utils = require('./utils');

exports.getWeather = async (req, res, next) => {

	const { nx, ny, date } = req.query;

	if(!nx || !ny || !date) return res.status(422).send();

	if (!/^\d{8}$/.test(date)) return res.status(400).json({error: '', message: 'DATE 형식 오류'});
    
    const { forecast, error } = await weather.fetchHourlyForecast(nx, ny, date);
    if(error) return next(error);

    return res.json({nx, ny, date, forecast})
}

exports.getRegions = async (req, res, next) => {

	let { keyword, lat, lon } = req.query;

	lat = parseFloat(lat);
	lon = parseFloat(lon);

	if(keyword) {

		const regions = [];

		{
			const { regions: r, error } = await mapper.selectRegionsByLevel1(keyword);
			if(error) return next(error);

			regions.push(...r);
		}

		{
			const { regions: r, error } = await mapper.selectRegionsByLevel2(keyword);
			if(error) return next(error);

			regions.push(...r);
		}

		{
			const { regions: r, error } = await mapper.selectRegionsByLevel3(keyword);
			if(error) return next(error);

			regions.push(...r);
		}

		if(lat && lon) {
            regions.sort((a, b) =>
                distance(lat, lon, a.lat, a.lon) - distance(lat, lon, b.lat, b.lon)
            );
		}

		regions.slice(0, 10);

		return res.json({ regions });
	}

	else if(lat && lon) {
		
		const { region, error } = await mapper.selectNearestRegionByCoords(lat, lon);
		if(error) return next(error);

		return res.json({regions: [ region ]});
	}

	else {
		
		const { regions, error } = await mapper.selectAllRegions();
		if(error) return next(error);

		return res.json({regions});

	}
}

exports.getOutfit = async (req, res, next) => {

	let { temp, style = 'normal' } = req.query;
	temp = parseFloat(temp);

	if(isNaN(temp)) return res.status(422).json({ error: 'temp 파라미터가 필요합니다' });

	if (!['normal','formal','casual','fancy'].includes(style)) {
		return res.status(422).json({ error: 'style 파라미터가 잘못되었습니다' });
	}

	// 룰 테이블에서 해당 온도대 룰 찾기
    const rule = outfit.outfitTable.find(r => temp >= r.min)
              || outfit.outfitTable[outfit.outfitTable.length - 1];
    const list = rule.outfits[style] || rule.outfits.normal;

    // 메인 1개, 서브 최대 2개
    const main = list[0];
    const subs = list.slice(1, 3);

    // 스타일 문구 매핑
    const styleText = {
        normal: '무난한 스타일',
        formal: '포멀 스타일',
        casual: '캐주얼 스타일',
        fancy:  '꾸민 스타일'
    }[style];

    // 자연어 문장 생성
    let text = `평균 기온이 ${temp.toFixed(1)}°C이므로, ${styleText}로는 "${main}"을(를) 추천드려요.`;
    if (subs.length) {
        text += ` 이외에도 ${subs.map(s => `"${s}"`).join(' 또는 ')} 등을 고려해 보세요.`;
    }

    return res.json({ outfit: text });
};






