const { ConnectOracleDB, DisconnectOracleDB } = require("../Common/DBconnection.cjs");

const oracledb = require("oracledb");
require("dotenv").config();

module.exports.getTypeCP = async function (req, res) {
    const P_TYPE = req.query.P_TYPE
    try {
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT T.TYPE_CODE, T.TYPE_DESC, T.TYPE_SCORE `;
        query += `   FROM SLEC_MSTR_TYPE_POINT T `;
        query += `  WHERE 1 = 1 `;
        query += `    AND (T.TYPE_CODE = '${P_TYPE}' OR '${P_TYPE}' IS NULL) `;
        query += ` ORDER BY T.TYPE_CODE ASC `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            TYPE_CODE: row[0],
            TYPE_DESC: row[1],
            TYPE_SCORE: row[2]
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getMaxType = async function (req, res) {
    try {
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += `  SELECT CASE LENGTH(CAST(MAX(SUBSTR(T.TYPE_CODE, 3, 3)) AS INTEGER) + 1) `;
        query += `            WHEN 1 THEN `;
        query += `                  'TY00' || TO_CHAR(CAST(MAX(SUBSTR(T.TYPE_CODE, 3, 3)) AS INTEGER) + 1) `;
        query += `            WHEN 2 THEN `;
        query += `                  'TY0' || TO_CHAR(CAST(MAX(SUBSTR(T.TYPE_CODE, 3, 3)) AS INTEGER) + 1) `;
        query += `            WHEN 3 THEN `;
        query += `                  'TY' || TO_CHAR(CAST(MAX(SUBSTR(T.TYPE_CODE, 3, 3)) AS INTEGER) + 1) `;
        query += `            ELSE `;
        query += `              'XXX' `;
        query += `         END AS TYPE_CODE  `;
        query += `    FROM SLEC_MSTR_TYPE_POINT T `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        res.json(result.rows[0][0]);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.mergTypeCP = async function (req, res) {
    let connect;
    try {
        const { T_CODE,
            T_DESC,
            T_SCORE } = req.body;
        connect = await ConnectOracleDB("GC");
        let query = ``;
        query = ``;
        query = ` MERGE INTO SLEC_MSTR_TYPE_POINT T
                        USING (SELECT :1 AS TYPE_CODE, :2 AS TYPE_DESC, :3 AS TYPE_SCORE
                                FROM DUAL) D
                        ON (T.TYPE_CODE = D.TYPE_CODE)
                        WHEN MATCHED THEN
                        UPDATE SET T.TYPE_DESC = D.TYPE_DESC, T.TYPE_SCORE = D.TYPE_SCORE
                        WHEN NOT MATCHED THEN
                        INSERT
                            (T.TYPE_CODE, T.TYPE_DESC, T.TYPE_SCORE)
                        VALUES
                            (D.TYPE_CODE, D.TYPE_DESC, D.TYPE_SCORE) `;


        await connect.execute(query, [T_CODE, T_DESC, T_SCORE]);

        await connect.commit();
        res.status(200).send();

    } catch (err) {
        if (connect) {
            try {
                await connect.rollback();
                res.status(404).send({ err: err.message });
                console.log(err.message)
            } catch (rollbackErr) {
                console.error("Error occurred during rollback: ", rollbackErr.message);
                res.status(500).send("Error occurred during rollback: ", rollbackErr.message);
                console.log(rollbackErr.message)
            }
        }
    } finally {
        if (connect) {
            try {
                await connect.close();
            } catch (closeErr) {
                console.error("Error occurred during closing connection: ", closeErr.message);
                res.status(500).send("Error occurred during closing connection: ", closeErr.message);
            }
        }
    }

};

module.exports.delTypeCP = async function (req, res) {
    let connect;
    const T_CODE = req.query.T_CODE
    try {

        connect = await ConnectOracleDB("GC");
        let query = ``;
        query = ``;
        query = ` DELETE SLEC_MSTR_TYPE_POINT T
                   WHERE T.TYPE_CODE = :1 `;
        await connect.execute(query, [T_CODE]);

        await connect.commit();
        res.status(200).send();

    } catch (err) {
        if (connect) {
            try {
                await connect.rollback();
                res.status(404).send({ err: err.message });
                console.log(err.message)
            } catch (rollbackErr) {
                console.error("Error occurred during rollback: ", rollbackErr.message);
                res.status(500).send("Error occurred during rollback: ", rollbackErr.message);
                console.log(rollbackErr.message)
            }
        }
    } finally {
        if (connect) {
            try {
                await connect.close();
            } catch (closeErr) {
                console.error("Error occurred during closing connection: ", closeErr.message);
                res.status(500).send("Error occurred during closing connection: ", closeErr.message);
            }
        }
    }

};