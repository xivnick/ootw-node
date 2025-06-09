
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

module.exports = {
	toRad,
	distance,
	getBaseDateTime,
}