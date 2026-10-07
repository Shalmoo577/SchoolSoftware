
import mysql from "mysql2/promise";

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),

    ssl: {
        rejectUnauthorized: true,
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export default db;
