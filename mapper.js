const db = require('./db');

exports.selectAllRegions = async () => {
    const sql = `
        SELECT code
            , level1, level2, level3
            , CONCAT_WS(' ', level1, level2, level3) AS name
            , nx, ny
        FROM region
        ORDER BY code
    `;
    try {
        const [ regions ] = await db.query(sql);

        return { regions };

    } catch (error) {
        console.log(error);

        return { regions: [], error };
    }
};

exports.selectAllRegionsWithLocation = async () => {
    const sql = `
        SELECT code
            , level1, level2, level3
            , CONCAT_WS(' ', level1, level2, level3) AS name
            , nx, ny, lat, lon
        FROM region
        ORDER BY code
    `;
    try {
        const [ regions ] = await db.query(sql);

        return { regions };

    } catch (error) {
        console.log(error);

        return { regions: [], error };
    }
};

exports.selectRegionsByLevel1 = async (level1) => {
    const sql = `
        SELECT code
            , level1, level2, level3
            , CONCAT_WS(' ', level1, level2, level3) AS name
            , nx, ny, lat, lon
        FROM region
        WHERE level1 LIKE ?
          AND level2 IS NULL
    `;
    const values = [`%${level1}%`];
    try {
        const [ regions ] = await db.query(sql, values);

        return { regions };

    } catch (error) {
        console.log(error);

        return { regions: [], error };
    }
};

exports.selectRegionsByLevel2 = async (level2) => {
    const sql = `
        SELECT code
            , level1, level2, level3
            , CONCAT_WS(' ', level1, level2, level3) AS name
            , nx, ny, lat, lon
        FROM region
        WHERE level2 LIKE ?
          AND level3 IS NULL
    `;
    const values = [`%${level2}%`];
    try {
        const [ regions ] = await db.query(sql, values);

        return { regions };

    } catch (error) {
        console.log(error);

        return { regions: [], error };
    }
};

exports.selectRegionsByLevel3 = async (level3) => {
    const sql = `
        SELECT code
            , level1, level2, level3
            , CONCAT_WS(' ', level1, level2, level3) AS name
            , nx, ny, lat, lon
        FROM region
        WHERE level3 LIKE ?
    `;
    const values = [`%${level3}%`];
    try {
        const [ regions ] = await db.query(sql, values);

        return { regions };

    } catch (error) {
        console.log(error);

        return { regions: [], error };
    }
};

exports.selectNearestRegionByCoords = async (lat, lon) => {
    const sql = `
        SELECT code
            , CONCAT_WS(' ', level1, level2, level3) AS name
            , nx, ny, lat, lon
            , (
                6371 * ACOS(
                    COS(RADIANS(?)) * COS(RADIANS(lat)) * COS(RADIANS(lon) - RADIANS(?))
                  + SIN(RADIANS(?)) * SIN(RADIANS(lat))
                )
            ) AS distance
        FROM region
        WHERE level3 IS NOT NULL
        ORDER BY distance ASC
        LIMIT 1
    `;
    const values = [lat, lon, lat];
    try {
        const [[ region ]] = await db.query(sql, values);

        return { region };

    } catch (error) {
        console.log(error);

        return { region: null, error };
    }
};






