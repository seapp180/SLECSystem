const { ConnectOracleDB, DisconnectOracleDB } = require("../Common/DBconnection.cjs");

const oracledb = require("oracledb");
require("dotenv").config();

module.exports.getGroupPerson = async function (req, res) {
    const P_FACTORY = req.query.P_FACTORY
    const P_GROUP = req.query.P_GROUP
    const P_USER = req.query.P_USER
    try {
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT T.USER_FACTORY AS P_FAC_CODE, `;
        query += `        F.FACTORY_NAME AS P_FAC_DESC, `;
        query += `        T.USER_NAME AS P_USER, `;
        query += `        T.USER_CC AS P_GROUP_CODE, `;
        query += `        DECODE(T.USER_CC,'MGR','Manager','Inspector') AS P_GROUP_DESC, `;
        query += `        DECODE(T.USER_CC,'MGR','05','20') AS P_GROUP_STATUS `;
        query += `   FROM SLEC_MSTR_INSPECTOR_STATUS T `;
        query += `   LEFT JOIN CUSR.CU_FACTORY_M F ON F.FACTORY_CODE = T.USER_FACTORY `;
        query += `  WHERE 1 = 1 `;
        query += `    AND (T.USER_FACTORY = '${P_FACTORY}' OR '${P_FACTORY}' IS NULL) `;
        query += `    AND (T.USER_CC = '${P_GROUP}' OR '${P_GROUP}' IS NULL) `;
        query += `    AND (UPPER(T.USER_NAME) LIKE UPPER('${P_USER}%')) `;
        query += ` ORDER BY F.FACTORY_NAME, P_GROUP_STATUS, T.USER_NAME `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            P_FAC_CODE: row[0],
            P_FAC_DESC: row[1],
            P_USER: row[2],
            P_GROUP_CODE: row[3],
            P_GROUP_DESC: row[4],
            P_GROUP_STATUS: row[5]
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};


module.exports.mergPerson = async function (req, res) {
    let connect;
    try {
        const { PS_FACTORY,
            PS_GROUP,
            PS_USER } = req.body;
        connect = await ConnectOracleDB("GC");
        let query = ``;
        query = ``;
        query = ` MERGE INTO SLEC_MSTR_INSPECTOR_STATUS T
                        USING (SELECT :1 AS USER_FACTORY,
                                    :2 AS USER_CC,
                                    :3 AS USER_NAME,
                                    DECODE(:4, 'MGR', '05', 'SPEC', '20', '') AS USER_STATUS,
                                    '' AS USER_PRIORITY,
                                    '' AS USER_SELECT
                                FROM DUAL) D
                        ON (T.USER_FACTORY = D.USER_FACTORY AND T.USER_CC = D.USER_CC AND T.USER_NAME = D.USER_NAME)
                        WHEN MATCHED THEN
                        UPDATE
                            SET T.USER_STATUS   = D.USER_STATUS,
                                T.USER_PRIORITY = D.USER_PRIORITY,
                                T.USER_SELECT   = D.USER_SELECT
                        WHEN NOT MATCHED THEN
                        INSERT
                            (T.USER_FACTORY,
                            T.USER_CC,
                            T.USER_NAME,
                            T.USER_STATUS,
                            T.USER_PRIORITY,
                            T.USER_SELECT)
                        VALUES
                            (D.USER_FACTORY,
                            D.USER_CC,
                            D.USER_NAME,
                            D.USER_STATUS,
                            D.USER_PRIORITY,
                            D.USER_SELECT) `;

        await connect.execute(query, [PS_FACTORY.value, PS_GROUP.value, PS_USER, PS_GROUP.value]);

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

module.exports.delPerson = async function (req, res) {
    let connect;
    const P_FACTORY = req.query.P_FACTORY
    const P_GROUP = req.query.P_GROUP
    const P_USER = req.query.P_USER
    try {
      
        connect = await ConnectOracleDB("GC");
        let query = ``;
        query = ``;
        query = ` DELETE SLEC_MSTR_INSPECTOR_STATUS T
                   WHERE T.USER_FACTORY = :1
                     AND T.USER_CC = :2
                     AND T.USER_NAME = :3 `;
                        
        await connect.execute(query, [P_FACTORY, P_GROUP, P_USER]);

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