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
        WHERE (
            level2 LIKE ?
            OR (
              CONCAT_WS(' ', level1, level2) LIKE ?
              AND level1 NOT LIKE ?
            )
          )
          AND level3 IS NULL
    `;
    const values = [`%${level2}%`, `%${level2}%`, `%${level2}%`];
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
        OR (
            CONCAT_WS(' ', level1, level2, level3) LIKE ? 
            AND CONCAT_WS(' ', level1, level2) NOT LIKE ?
            AND level1 NOT LIKE ?
            AND level2 NOT LIKE ?
        )
    `;
    const values = [`%${level3}%`, `%${level3}%`, `%${level3}%`, `%${level3}%`, `%${level3}%`];
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


exports.insertIgnoreUser = async (uid) => {

    const sql = 'INSERT IGNORE INTO user (uid) values (?)';
    const values = [uid];

    try {
        const [ result ] = await db.query(sql, values);

        if(result.affectedRows == 0) return { success: false };

        return { success: true }
    }
    catch (error) {
        console.log(error);

        return { success: false, error }
    }
}

exports.selectUserByUid = async (uid) => {

    const sql = `
        SELECT uid, region, nx, ny, status FROM user where uid = ?
    `;
    const values = [uid];

    try {
        const [[ user ]] = await db.query(sql, values);

        return { user };

    } catch (error) {
        console.log(error);

        return { user: null, error };
    }
};

exports.updateUserStatusByUid = async (uid, status) => {

    const sql = `
        UPDATE user SET status = ? WHERE uid = ?
    `;
    const values = [status, uid];

    try {
        const [ result ] = await db.query(sql, values);

        if(result.affectedRows == 0) return { success: false };

        return { success: true }
    }
    catch (error) {
        console.log(error);

        return { success: false, error }
    }
}

exports.updateUserRegionByUid = async (uid, region, nx, ny) => {

    const sql = `
        UPDATE user SET region = ?, nx = ?, ny = ? WHERE uid = ?
    `;
    const values = [region, nx, ny, uid];

    try {
        const [ result ] = await db.query(sql, values);

        if(result.affectedRows == 0) return { success: false };

        return { success: true }
    }
    catch (error) {
        console.log(error);

        return { success: false, error }
    }
}

exports.insertUserRegionHistory = async (uid, region) => {

    const sql = `
        INSERT INTO user_region_history (uid, region) VALUES (?, ?)
    `;
    const values = [uid, region];

    try {
        const [ result ] = await db.query(sql, values);

        if(result.affectedRows == 0) return { success: false };

        return { success: true }
    }
    catch (error) {
        console.log(error);

        return { success: false, error }
    }
}

exports.selectUserRegionHistoriesByUid = async (uid) => {

    const sql = `
        SELECT region FROM user_region_history WHERE uid = ? ORDER BY id DESC LIMIT 3
    `;
    const values = [ uid ];

    try {
        const [ histories ] = await db.query(sql, values);

        return { histories };

    } catch (error) {
        console.log(error);

        return { histories: [], error };
    }
};

exports.insertUserOotd = async (uid, url, date, dateDisplay, tempMax, tempMin, icon) => {

    const sql = `
          INSERT INTO user_ootd (uid, url, date, date_display, temp_max, temp_min, icon)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            url = VALUES(url)
            , temp_max = VALUES(temp_max)
            , temp_min = VALUES(temp_min)
            , icon = VALUES(icon)
            , note = NULL
        `;
    const values = [uid, url, date, dateDisplay, tempMax, tempMin, icon];

    try {
        const [ result ] = await db.query(sql, values);

        if(result.affectedRows == 0) return { success: false };

        return { success: true }
    }
    catch (error) {
        console.log(error);

        return { success: false, error }
    }
}

exports.updateUserOotdNoteByUidAndDate = async (uid, date, note) => {

    const sql = `
        UPDATE user_ootd SET note = ?
        WHERE uid = ? AND date = ?
    `;
    const values = [note, uid, date];

    try {
        const [ result ] = await db.query(sql, values);

        if(result.affectedRows == 0) return { success: false };

        return { success: true }
    }
    catch (error) {
        console.log(error);

        return { success: false, error }
    }
}

exports.selectUserOotdsByUidAndTemps = async (uid, tempMax, tempMin) => {

    const sql = `
        SELECT uid, url, date, date_display dateDisplay, temp_max tempMax, temp_min tempMin, icon, note
        , ABS(temp_max - ?) + ABS(temp_min - ?) diff
        FROM user_ootd
        WHERE uid = ?
        ORDER BY diff ASC LIMIT 5
    `;
    const values = [tempMax, tempMin, uid];

    try {
        const [ ootds ] = await db.query(sql, values);

        return { ootds };

    } catch (error) {
        console.log(error);

        return { ootds: [], error };
    }
};

exports.insertUserLog = async (uid, status, message) => {

    const sql = `
        INSERT INTO user_log (uid, status, message) VALUES (?, ?, ?)
    `;
    const values = [uid, status, message];

    try {
        const [ result ] = await db.query(sql, values);

        if(result.affectedRows == 0) return { success: false };

        return { success: true }
    }
    catch (error) {
        console.log(error);

        return { success: false, error }
    }
}