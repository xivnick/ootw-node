
const mysql2 = require('mysql2/promise');  // mysql2의 Promise 지원 버전을 불러옵니다.

const pool = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: 3306,
});

exports.query = async (sql, params) => {
    return await pool.query(sql, params);
};
