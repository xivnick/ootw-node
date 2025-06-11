
const toRad = (x) => {
	return (x * Math.PI) / 180;
}

const distance = (lat1, lon1, lat2, lon2) => {

    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) ** 2
            + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
            * Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getBaseDateTime = (dateStr) => {

    const year   = Number(dateStr.slice(0, 4));
    const month  = Number(dateStr.slice(4, 6)) - 1;
    const day    = Number(dateStr.slice(6, 8));

    const target = new Date(year, month, day);

    target.setDate(target.getDate() - 1);

    const yyyy = target.getFullYear();
    const mm   = String(target.getMonth() + 1).padStart(2, '0');
    const dd   = String(target.getDate()).padStart(2, '0');

    return {
        base_date: `${yyyy}${mm}${dd}`,
        base_time: '2300',
    };
};

const getRecentDates = () => {
  const now = new Date();
  const isLate = now.getHours() >= 23;      // 23시 이후인지 여부
  const limit  = isLate ? 2 : 3;            // 2개 또는 3개
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const dates = [];

  for (let i = 0; i < limit; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);

    const date = {};

    // 화면 표시용
    {
      const month = d.getMonth() + 1;
      const day   = d.getDate();
      const week  = weekdays[d.getDay()];
      date.display = `${month}월 ${day}일 (${week})`;
    }

    // YYYYMMDD 포맷
    {
      const year  = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day   = String(d.getDate()).padStart(2, '0');
      date.YYYYMMDD = `${year}${month}${day}`;
    }

    dates.push(date);
  }

  return { dates };
};


const generateWeatherInfo = (forecast) => {
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentTime = `${currentHour}00`; // "0000" ~ "2300"

    const closest = forecast.find(item => item.time === currentTime);

    // 2) PTY 우선, 없으면 SKY 코드로
    const pty = +closest.PTY;
    let icon = '';
    if ([1,2,4].includes(pty)) icon = '🌧️';
    else if (pty === 3) icon = '❄️';
    else {
        switch (closest.SKY) {
            case '1': icon = '☀️'; break;
            case '3': icon = '⛅️'; break;
            case '4': icon = '☁️'; break;
            default:  icon = '🌥️';
        }
    }

    // 3) 온도 통계
    const temps = forecast.map(f=>+f.TMP);
    const avgTemp = (temps.reduce((a,b)=>a+b,0)/temps.length).toFixed(1);
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    const currentTemp = (+closest.TMP).toFixed(1);

    // 4) 최고 강수확률
    const popMax = Math.max(...forecast.map(f=>parseInt(f.POP,10)||0));

    // 5) 요약 텍스트
    const summary = `최고 ${maxTemp}°C / 최저 ${minTemp}°C` + (popMax>0 ? ` · 강수 확률 ${popMax}%` : '');

    // 반환
    return { icon, currentTemp, popMax, maxTemp, minTemp, summary };
}

const compareTemp = (temp, tempToday) => {
  const diff = temp - tempToday;
  if (diff > 0)  return `오늘보다 ${diff}°C ↑`;
  if (diff < 0)  return `오늘보다 ${-diff}°C ↓`;
  return '오늘과 같음';
}

module.exports = {
	toRad,
	distance,
	getBaseDateTime,
    getRecentDates,
    generateWeatherInfo,
    compareTemp,
}