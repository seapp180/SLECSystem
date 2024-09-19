const { ConnectOracleDB, DisconnectOracleDB } = require("./DBconnection.cjs");

module.exports.getFactory = async function (req, res) {
    try {
        const connect = await ConnectOracleDB("CUSR");
        let query = "";
        query += ` SELECT T.FACTORY_CODE AS "value", T.FACTORY_NAME AS "label" `;
        query += `   FROM CUSR.CU_FACTORY_M T `;
        query += `  WHERE T.FACTORY_STATUS = 'A' `;
        query += `  ORDER BY T.FACTORY_NAME `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            value: row[0],
            label: row[1]
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getCostCenter = async function (req, res) {
    try {
        const connect = await ConnectOracleDB("CUSR");
        let query = "";
        query += ` SELECT T.CC_CTR AS "value", T.CC_CTR || ' : ' || T.CC_DESC AS "label" `;
        query += `   FROM CUSR.CU_MFGPRO_CC_MSTR T `;
        query += `  WHERE T.CC_DOMAIN = '9000' `;
        query += `    AND T.CC_ACTIVE = 1 `;
        query += `  ORDER BY T.CC_CTR `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            value: row[0],
            label: row[1]
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};


module.exports.getStatusSLEC = async function (req, res) {
    try {
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT T.STSTATUS_CODE, T.STSTATUS_DISPLAY `;
        query += `   FROM SLEC_MSTR_STATUS T `;
        query += `  ORDER BY CAST(T.STSTATUS_CODE AS INTEGER) ASC `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            value: row[0],
            label: row[1]
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getSLECForUser = async function (req, res) {
    const P_FACTORY = req.query.P_FACTORY
    const P_USER = req.query.P_USER

    try {
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT DISTINCT T.SLECH_NO `;
        query += `   FROM SLEC_TRANS_HEADER T `;
        query += `   LEFT JOIN SLEC_TRANS_ROUTING R ON R.SLECR_NO = T.SLECH_NO AND R.SLECR_INSPECTOR = NVL(T.SLECH_CREATE_BY,T.SLECH_MODIFY_BY) `;
        query += `  WHERE 1 = 1 `;
        query += `    AND (T.SLECH_FACTORY = '${P_FACTORY}' OR '${P_FACTORY}' IS NULL) `;
        query += `    AND ((T.SLECH_CREATE_BY = '${P_USER}' OR '${P_USER}' IS NULL) OR (T.SLECH_MODIFY_BY = '${P_USER}' OR '${P_USER}' IS NULL)) `;
        query += `    AND ('50' = DECODE('${P_USER}',NULL,T.SLECH_STATUS, '50')) `;
        query += `  ORDER BY T.SLECH_NO `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            value: row[0],
            label: row[0]
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getSLECUser_ByFactory = async function (req, res) {
    const P_GROUP = req.query.P_GROUP
    const P_FACTORY = req.query.P_FACTORY
    const P_NO = req.query.P_NO

    try {
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT DISTINCT T.USER_NAME AS MGR_USER `;
        query += `   FROM SLEC_MSTR_INSPECTOR_STATUS T `;
        query += `  WHERE T.USER_FACTORY = '${P_FACTORY}' `;
        query += `    AND T.USER_CC = '${P_GROUP}' `;
        query += `    AND T.USER_NAME NOT IN (SELECT H.SLECR_INSPECTOR `;
        query += `                              FROM SLEC_TRANS_ROUTING H `;
        query += `                             WHERE H.SLECR_NO = '${P_NO}') `;
        query += ` ORDER BY T.USER_NAME `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            value: row[0],
            label: row[0]
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getTypeForCheckPoint = async function (req, res) {

    try {
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT T.TYPE_CODE, T.TYPE_DESC `;
        query += `   FROM SLEC_MSTR_TYPE_POINT T `;
        query += `  ORDER BY T.TYPE_CODE `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            value: row[0],
            label: row[1]
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getMonthlyCheckDate = async function (req, res) {
    const P_FACTORY = req.query.P_FACTORY

    try {
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT DISTINCT TO_CHAR(T.SLECH_CHECK_DATE, 'YYYYMM') AS F_CODE, `;
        query += `                 TO_CHAR(T.SLECH_CHECK_DATE, 'MON YYYY') AS F_DESC `;
        query += `   FROM SLEC_TRANS_HEADER T `;
        query += `  WHERE T.SLECH_FACTORY = '${P_FACTORY}' `;
        query += `    AND T.SLECH_CHECK_DATE IS NOT NULL `;
        query += `  ORDER BY TO_CHAR(T.SLECH_CHECK_DATE, 'YYYYMM') DESC `;


        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            value: row[0],
            label: row[1]
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};


module.exports.getGroupPerson = async function (req, res) {
    try {
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT 'MGR' AS F_CODE, 'Manager' AS F_DESC, 0 F_SORT `;
        query += `   FROM DUAL `;
        query += ` UNION `;
        query += ` SELECT 'SPEC' AS F_CODE, 'Inspector' AS F_DESC, 1 F_SORT `;
        query += `   FROM DUAL `;
        query += `  ORDER BY F_SORT `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            value: row[0],
            label: row[1]
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getMonthlyForSlec = async function (req, res) {

    try {
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT DISTINCT TO_CHAR(T.SLECH_CHECK_DATE, 'YYYYMM') AS F_VALUE, `;
        query += `                 TO_CHAR(T.SLECH_CHECK_DATE, 'MON YYYY') AS F_DESC `;
        query += `   FROM SLEC_TRANS_HEADER T `;
        query += `  WHERE 1 = 1 `;
        query += `    AND T.SLECH_STATUS = '50' `;
        query += `    AND TO_CHAR(T.SLECH_CHECK_DATE, 'YYYYMM') >= TO_CHAR(ADD_MONTHS(SYSDATE, -24), 'YYYYMM') `;
        query += `    AND TO_CHAR(T.SLECH_CHECK_DATE, 'YYYYMM') <= TO_CHAR(SYSDATE, 'YYYYMM') `;
        query += `  ORDER BY F_VALUE DESC `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            value: row[0],
            label: row[1]
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getFisicalYear = async function (req, res) {

    try {
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += `  SELECT DISTINCT CASE `;
        query += `                    WHEN CAST(TO_CHAR(T.SLECH_CHECK_DATE, 'MM') AS INTEGER) > 3 THEN `;
        query += `                     TO_CHAR(T.SLECH_CHECK_DATE, 'YYYY') `;
        query += `                    ELSE `;
        query += `                     TO_CHAR(T.SLECH_CHECK_DATE - 356, 'YYYY') `;
        query += `                  END AS F_YEAR `;
        query += `    FROM SLEC_TRANS_HEADER T `;
        query += `   WHERE 1 = 1 `;
        query += `     AND T.SLECH_STATUS = '50' `;
        query += `     AND TO_CHAR(T.SLECH_CHECK_DATE, 'YYYY') >= `;
        query += `         TO_CHAR(SYSDATE - INTERVAL '5' YEAR, 'YYYY') `;
        query += `     AND TO_CHAR(T.SLECH_CHECK_DATE, 'YYYY') <= TO_CHAR(SYSDATE, 'YYYY') `;
        query += `   ORDER BY F_YEAR DESC `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            value: row[0],
            label: row[0]
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};