
const weather = require('./lib/weather');
const outfit = require('./lib/outfit');
const kakao = require('./lib/kakao');

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
    let text = `평균 기온이 <b>${temp.toFixed(1)}°C</b>이므로, ${styleText}로는 <b>${main}</b>을(를) 추천드려요.`;
    if (subs.length) {
        text += ` 이외에도 ${subs.map(s => `<b>${s}</b>`).join(' 또는 ')} 등을 고려해 보세요.`;
    }

    return res.json({ outfit: text });
};

exports.postChatbot = async (req, res, next) => {

    const uid = req.body.userRequest.user.id;
    let userMessage = req.body.userRequest.utterance;
    let params = req.body.userRequest.params;
    let detailParams = req.body.action.detailParams;
    let clientExtra = req.body.action.clientExtra;
    const store = {};

    console.log({uid, userMessage, params, detailParams, clientExtra});

    {
		const { error } = await mapper.insertIgnoreUser(uid);
		if(error) return next(error);
    }

    const { user, error } = await mapper.selectUserByUid(uid);
	if(error) return next(error);
    
    console.log({user});

    {
    	const { error } = await mapper.insertUserLog(uid, user.status, userMessage.substring(0, 255))
    	if(error) return next(error);
    }

    // REQUEST

  	if(userMessage === '도움말') { user.status = 'GUIDE' }
  	else if(userMessage === '시작하기') { user.status = null }
  	else if(userMessage === '오늘의 날씨') { user.status = 'WEATHER' }

    else if(user.status === 'REGION' || user.status === 'REGION_PROMPT') {
    	if(userMessage === '돌아가기') {
    		user.status = null;
    	}

    	else if(userMessage === '다시 검색하기') {
    		user.status = 'REGION_PROMPT';
    	}

    	else if(clientExtra.region) {
    		user.status = 'REGION_COMPLETE';

	    	{
	    		const { error } = await mapper.insertUserRegionHistory(uid, user.region);
	    		if(error) return next(error);
	    	}
	    	{
	    		const { error } = await mapper.updateUserRegionByUid(uid, clientExtra.region.name, clientExtra.region.nx, clientExtra.region.ny);
	    		if(error) return next(error);
	    	}
    	}

    	else user.status = 'REGION'
    }

    else if(user.status === 'REGION_COMPLETE') {
    	
    	if(userMessage === 'OOTD 업로드') user.status = 'OOTD_DATE';
    	else if(userMessage === '오늘의 날씨') user.status = 'WEATHER';
    	else user.status = null;
    }

    else if(user.status === 'WEATHER') {

    	if(userMessage === '지역 변경') user.status = 'REGION_PROMPT';
    	else if(userMessage === 'OOTD 업로드') user.status = 'OOTD_DATE';
    	else user.status = null;
    }
    else if(user.status === 'OOTD_DATE') {
		
		if(clientExtra.dateIndex !== undefined) {
    		user.status = `OOTD_IMAGE_${clientExtra.dateIndex}`;
    	}
    	else user.status = null;
    }

    else if(user.status && user.status.startsWith('OOTD_IMAGE')) {
		
    	if(params.media && params.media.type === 'image') {

    		const dateIndex = +user.status.split('_').pop();
    		store.dateIndex = dateIndex;
    		store.url = params.media.url;

	    	const { dates } = utils.getRecentDates();

		    const { forecast, error } = await weather.fetchHourlyForecast(user.nx, user.ny, dates[dateIndex].YYYYMMDD);
		    if(error) return next(error);

		    const { icon, maxTemp, minTemp } = utils.generateWeatherInfo(forecast);

		    {
    			const { error } = await mapper.insertUserOotd(uid, params.media.url, dates[dateIndex].YYYYMMDD, dates[dateIndex].display, maxTemp, minTemp, icon)	
    			if(error) return next(error);
		    }

		    user.status = `OOTD_NOTE_${dates[dateIndex].YYYYMMDD}`;
    	}

    	else if(userMessage === '돌아가기') user.status = 'OOTD_DATE';
    	else user.status = null;
    }

    else if(user.status && user.status.startsWith('OOTD_NOTE')) {

		const date = +user.status.split('_').pop();

    	const { error } = await mapper.updateUserOotdNoteByUidAndDate(uid, date, userMessage);
    	if(error) return next(error);

    	user.status = 'OOTD_COMPLETE';
    }

    else if(user.status === 'GUIDE') {
		
		if(userMessage = '더 알아보기') {
    		user.status = 'GUIDE_2';
    	}
    }

    else {
    	if(userMessage === '지역 변경') user.status = 'REGION_PROMPT';
    	else if(userMessage === 'OOTD 업로드') user.status = 'OOTD_DATE';
    	else if(userMessage === '오늘의 날씨') user.status = 'WEATHER';
    	else if(userMessage === '도움말') user.status = 'GUIDE';
    	else user.status = null;
    }

	{
		const { error } = await mapper.updateUserStatusByUid(uid, user.status);
		if(error) return next(error);
	}

	// RESPONSE

	{
	    const { user, error } = await mapper.selectUserByUid(uid);
		if(error) return next(error);

		const kakaoResponse = new kakao.Response();

	    if(user.status === 'REGION_PROMPT') {

	    	kakaoResponse.addOutput(new kakao.SimpleText({}, '원하는 지역을 입력해주세요.'));

	    	{
	    		const { histories, error } = await mapper.selectUserRegionHistoriesByUid(uid);
	    		if(error) return next(error);

	    		for(const history of histories) {
	    			kakaoResponse.addQuickReplyMessage(history.region);
	    		}
	    	}

	    	kakaoResponse.addQuickReplyMessage('돌아가기')
	    }

	    else if(user.status === 'REGION') {
	    	const keyword = userMessage;

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

			if(regions.length === 0) {

				kakaoResponse.addOutput(new kakao.SimpleText({}, '지역을 찾을 수 없습니다.'))
				kakaoResponse.addOutput(new kakao.SimpleText({}, '다시 입력해주세요.'))

	    		kakaoResponse.addQuickReplyMessage('돌아가기')
			}

			else {

				regions.slice(0, 5);

				const listCard = new kakao.ListCard({}, new kakao.ListItem({}, '원하는 지역을 선택하세요.'));

				for(const region of regions) {
					listCard.addItem(new kakao.ListItem({}, region.name, null, null, null, 'message', null, region.name, {region}));
				}

				kakaoResponse.addOutput(listCard);

	    		kakaoResponse.addQuickReplyMessage('돌아가기')
	    		kakaoResponse.addQuickReplyMessage('다시 검색하기')
			}
	    }

	    else if (user.status === 'REGION_COMPLETE') {

	    	const { dates } = utils.getRecentDates();

	    	const listCard = new kakao.ListCard({}, new kakao.ListItem({}, dates[0].display))
	    	listCard.addItem(new kakao.ListItem({}, user.region, null, null, null, 'message', null, '지역 변경'))

	 		kakaoResponse.addOutput(new kakao.SimpleText({}, '지역 변경이 완료되었습니다.'))
	    	kakaoResponse.addOutput(listCard);			
	    	kakaoResponse.addQuickReplyMessage('오늘의 날씨');
			kakaoResponse.addQuickReplyMessage('OOTD 업로드');
	    }

	    else if (user.status === 'WEATHER') {

	    	const { dates } = utils.getRecentDates();

		    const { forecast, error } = await weather.fetchHourlyForecast(user.nx, user.ny, dates[0].YYYYMMDD);
		    if(error) return next(error);

		    const { icon, currentTemp, maxTemp, minTemp, popMax, summary } = utils.generateWeatherInfo(forecast);

	    	const listCard = new kakao.ListCard({}, new kakao.ListItem({}, '오늘의 날씨'))
	    	listCard.addItem(new kakao.ListItem({}, dates[0].display, user.region));
	    	listCard.addItem(new kakao.ListItem({}, `${icon} ${currentTemp}°C`, summary));

	    	kakaoResponse.addOutput(listCard);

		    const carousel = new kakao.Carousel({});

		    carousel.type = 'itemCard';
		    // carousel.header.title = 'OOTW';
		    // carousel.header.description = '비슷한 날씨의 OOTD를 확인하세요.';
    		// carousel.header.thumbnail.imageUrl = 'https://t1.kakaocdn.net/openbuilder/sample/lj3JUcmrzC53YIjNDkqbWK.jpg';

		    {
		    	const { ootds, error } = await mapper.selectUserOotdsByUidAndTemps(uid, maxTemp, minTemp);
		    	if(error) return { error };

		    	if(ootds.length > 0) {
		    		kakaoResponse.addOutput(new kakao.SimpleText({}, '비슷한 날씨의 OOTD를 확인하세요.'))
		    		kakaoResponse.addOutput(carousel);
		    	}

		    	for(const ootd of ootds) {

        			const itemCard = carousel.addItem(new kakao.ItemCard({thumbnail: true}));

			        itemCard.head = `${ootd.dateDisplay} (${ootd.tempMax}°C/${ootd.tempMin}°C)`;
			        itemCard.title = ootd.note;

			        itemCard.thumbnail.imageUrl = ootd.url;
			        itemCard.thumbnail.link = new kakao.Link({}, null, null, ootd.url);

			        itemCard.addItemList({title: '날씨', description: `${ootd.icon}`})
			        itemCard.addItemList({title: '최고온도', description: `${ootd.tempMax}°C (${utils.compareTemp(ootd.tempMax, maxTemp)})`})
			        itemCard.addItemList({title: '최저온도', description: `${ootd.tempMin}°C (${utils.compareTemp(ootd.tempMin, minTemp)})`})
		    	}
		    }


			kakaoResponse.addQuickReplyMessage('지역 변경');
			kakaoResponse.addQuickReplyMessage('OOTD 업로드');
 			kakaoResponse.addQuickReplyMessage('돌아가기');
	    }

	    else if (user.status === 'OOTD_DATE') {

			const listCard = new kakao.ListCard({}, new kakao.ListItem({}, '업로드할 날짜를 선택하세요.'));

	    	const { dates } = utils.getRecentDates();

			listCard.addItem(new kakao.ListItem({}, '오늘', dates[0].display, null, null, 'message', null, '오늘', {date: dates[0], dateIndex: 0}));	
			listCard.addItem(new kakao.ListItem({}, '어제', dates[1].display, null, null, 'message', null, '어제', {date: dates[1], dateIndex: 1}));	
			listCard.addItem(new kakao.ListItem({}, '2일 전', dates[2].display, null, null, 'message', null, '2일 전', {date: dates[2], dateIndex: 2}));	

			kakaoResponse.addOutput(listCard);
    		kakaoResponse.addQuickReplyMessage('돌아가기')
	    }

	    else if (user.status && user.status.startsWith('OOTD_IMAGE')) {

			const listCard = new kakao.ListCard({}, new kakao.ListItem({}, `${clientExtra.date.display} OOTD`));

			listCard.addItem(new kakao.ListItem({extra: {date: clientExtra.date}}, '사진을 업로드해주세요.', '왼쪽 아래 + 버튼으로 사진을 업로드할 수 있습니다.'));	

			kakaoResponse.addOutput(listCard);
    		kakaoResponse.addQuickReplyMessage('돌아가기')
	    }

	    else if (user.status && user.status.startsWith('OOTD_NOTE')) {

	 		kakaoResponse.addOutput(new kakao.SimpleText({}, 'OOTD 업로드가 완료되었습니다.'))

	    	const { dates } = utils.getRecentDates();
	    	const basicCard = kakaoResponse.addOutput(new kakao.BasicCard({thumbnail: true}));

	    	basicCard.title = dates[store.dateIndex].display;
	    	basicCard.thumbnail.imageUrl = store.url;

	 		kakaoResponse.addOutput(new kakao.SimpleText({}, '이 날의 옷차림은 날씨에 맞았나요? (자유 입력 가능)'))
	    	kakaoResponse.addQuickReplyMessage('더웠음');
			kakaoResponse.addQuickReplyMessage('추웠음');
			kakaoResponse.addQuickReplyMessage('적당했음');
	    }

	    else if (user.status === 'OOTD_COMPLETE') {

	    	const { dates } = utils.getRecentDates();

	    	const listCard = new kakao.ListCard({}, new kakao.ListItem({}, dates[0].display))
	    	listCard.addItem(new kakao.ListItem({}, user.region, null, null, null, 'message', null, '지역 변경'))

	 		kakaoResponse.addOutput(new kakao.SimpleText({}, '메모가 작성되었습니다.'))
	    	kakaoResponse.addOutput(listCard);			
	    	kakaoResponse.addQuickReplyMessage('오늘의 날씨');
			kakaoResponse.addQuickReplyMessage('지역 변경');
			kakaoResponse.addQuickReplyMessage('OOTD 업로드');
	    }

	    else if (user.status === 'GUIDE') {

	    	kakaoResponse.addOutput(new kakao.SimpleText({}, '🌤️ OOTW는 날씨에 맞는 옷차림을 추천하는 서비스입니다.'))
	    	kakaoResponse.addOutput(new kakao.SimpleText({}, '🗺️ 원하는 지역으로 변경 후 오늘의 날씨를 누르면 오늘의 날씨를 확인할 수 있어요.'))
	    	kakaoResponse.addOutput(new kakao.SimpleText({}, '📸 OOTD를 업로드해두었다면 과거의 비슷한 날씨에 입었던 옷차림도 볼 수 있답니다!'))
			kakaoResponse.addQuickReplyMessage('더 알아보기');
			kakaoResponse.addQuickReplyMessage('돌아가기');
	    }
	    else if (user.status === 'GUIDE_2') {

	    	kakaoResponse.addOutput(new kakao.SimpleText({}, '🗺️ 지역 변경에서는 원하는 지역을 검색하여 선택할 수 있습니다. (ex. 신촌)'))
	    	kakaoResponse.addOutput(new kakao.SimpleText({}, '📸 OOTD 업로드에서는 오늘을 포함한 최근 3일간의 OOTD를 업로드할 수 있어요.'))
	    	kakaoResponse.addOutput(new kakao.SimpleText({}, '😎 업로드한 옷차림이 그날 날씨에 맞았는지 메모하면 옷차림을 결정하는데 도움이 될거예요!'))
			kakaoResponse.addQuickReplyMessage('돌아가기');
	    }

	    else {
	    	const { dates } = utils.getRecentDates();

	    	const listCard = new kakao.ListCard({}, new kakao.ListItem({}, dates[0].display))
	    	listCard.addItem(new kakao.ListItem({}, user.region, null, null, null, 'message', null, '지역 변경'))

	    	kakaoResponse.addOutput(listCard);
	    	// kakaoResponse.addOutput(new kakao.SimpleText({}, '무엇을 도와드릴까요?'));
			kakaoResponse.addQuickReplyMessage('오늘의 날씨');
			kakaoResponse.addQuickReplyMessage('지역 변경');
			kakaoResponse.addQuickReplyMessage('OOTD 업로드');
			kakaoResponse.addQuickReplyMessage('도움말');
	    }

	    // console.log(JSON.stringify(kakaoResponse, null, 2));
	
		return res.json(kakaoResponse);
	}

    
}





