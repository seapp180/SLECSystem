const { ConnectOracleDB, DisconnectOracleDB } = require("../Common/DBconnection.cjs");

const oracledb = require("oracledb");
require("dotenv").config();

const { Buffer } = require('buffer');
const path = require('path');
const fs = require('fs');
const base64 = require('base-64');

module.exports.getSlecNoByMonthlyAll = async function (req, res) {

    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT DISTINCT T.SLECH_NO `;
        query += `   FROM SLEC_TRANS_HEADER T `;
        query += `  INNER JOIN SLEC_TRANS_SUPERVISOR S ON S.SLECD_NO = T.SLECH_NO `;
        query += `  WHERE 1 = 1 `;
        query += `    AND T.SLECH_FACTORY = '${P_FACTORY}' `;
        query += `    AND TO_CHAR(T.SLECH_CREATE_DATE, 'YYYYMM') = '${P_MONTH}' `;
        query += ` ORDER BY T.SLECH_NO `;
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

module.exports.getDataMaintain = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const P_SLEC_NO = req.query.P_SLEC_NO

        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT T.SLECH_FACTORY, `;
        query += `        F.FACTORY_NAME, `;
        query += `        T.SLECH_NO, `;
        query += `        TO_CHAR(T.SLECH_CHECK_DATE,'DD Mon YYYY') AS SLECH_CHECK_DATE, `;
        query += `        E.SLECD_CC AS USER_COSTCENTER, `;
        query += `        DECODE(E.SLECD_EMPLOYEE_ID,NULL,' ' ,CH.EMPCODE || ' : ' || CH.ENAME || ' ' || CH.ESURNAME) AS SUPERVISOR_DETAIL, `;
        query += `        T.SLECH_STATUS, `;
        query += `        P.STSTATUS_DISPLAY, `;
        query += `        U.USER_EMP_ID AS CREATE_ID, `;
        query += `        T.SLECH_CREATE_BY, `;
        query += `        T.SLECH_MODIFY_BY, `;
        query += `        T.SLECH_CREATE_DATE, `;
        query += `        T.SLECH_MODIFY_DATE, `;
        query += `        T.SLECH_REMARK, `;
        query += `        E.SLECD_EMPLOYEE_ID, `;
        query += `        E.SLECD_FULL_SCORE, `;
        query += `        E.SLECD_ACTUAL_SCORE, `;
        query += `        E.SLECD_STATUS, `;
        query += `        P1.STSTATUS_DISPLAY AS STATUS_SUP, `;
        query += `        (SELECT REPLACE(TO_CHAR(WM_CONCAT(DISTINCT RI.SLECR_INSPECTOR)), ',', CHR(10)) FROM SLEC_TRANS_ROUTING RI WHERE RI.SLECR_NO = T.SLECH_NO) AS INSPEC, `;
        query += `        T.SLECH_MGR_REFER, `;
        query += `        T.SLECH_CHECK_DATE AS SLECH_CHECK_DATE_V `;
        query += `   FROM SLEC_TRANS_HEADER T `;
        query += `   LEFT JOIN CUSR.CU_FACTORY_M F ON F.FACTORY_CODE = T.SLECH_FACTORY `;
        query += `   LEFT JOIN CUSR.CU_USER_M U ON U.USER_LOGIN = T.SLECH_CREATE_BY `;
        query += `   LEFT JOIN SLEC_TRANS_ROUTING V ON V.SLECR_NO = T.SLECH_NO AND V.SLECR_INSPECTOR = U.USER_LOGIN `;
        query += `   LEFT JOIN SLEC_MSTR_STATUS P ON T.SLECH_STATUS = P.STSTATUS_CODE `;
        query += `   LEFT JOIN SLEC_TRANS_SUPERVISOR E ON E.SLECD_NO = T.SLECH_NO `;
        query += `   LEFT JOIN SLEC_MSTR_STATUS P1 ON E.SLECD_STATUS = P1.STSTATUS_CODE `;
        query += `   LEFT JOIN CUSR.CU_USER_HUMANTRIX CH ON CH.EMPCODE = E.SLECD_EMPLOYEE_ID `;
        query += `  WHERE 1 = 1 `;
        query += `    AND (T.SLECH_FACTORY = '${P_FACTORY}' OR '${P_FACTORY}' IS NULL) `;
        query += `    AND (T.SLECH_NO = '${P_SLEC_NO}' OR '${P_SLEC_NO}' IS NULL) `;
        query += `    AND (TO_CHAR(T.SLECH_CREATE_DATE, 'YYYYMM') = '${P_MONTH}' OR '${P_MONTH}' IS NULL) `;
        query += `  ORDER BY T.SLECH_NO DESC`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = result.rows.map(row => ({
            SLEC_NO: row[2],
            SLEC_STATUS_HEAD: row[7],
            SLEC_CHECK_DATE: row[3],
            SLEC_CC: row[4],
            SLEC_SUPERVISOR_ID: row[14],
            SLEC_SUPERVISOR: row[5],
            SLEC_INSPCTOR: row[19],
            SLEC_MANAGER: row[20],
            SLEC_SCORE_FULL: row[15],
            SLEC_SCORE_ACTUAL: row[16],
            SLEC_STATUS_SUP: row[18],
            SLEC_IS_OPEN: false,
            SLEC_STATUS_CODE: row[6],
            SLEC_MANAGER_V: { value: row[20], label: row[20] },
            SLEC_CHECK_DATE_V: row[21]
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.updateHeader = async function (req, res) {
    let connect;
    try {
        const P_SLEC_NO = req.query.P_SLEC_NO
        const P_MGR = req.query.P_MGR
        const P_CK_DATE = req.query.P_CK_DATE
        connect = await ConnectOracleDB("GC");
        let query = ``;

        query = ` UPDATE SLEC_TRANS_HEADER T
                     SET T.SLECH_MGR_REFER = :1,
                         T.SLECH_CHECK_DATE = TO_DATE(:2,'YYYYMMDD')
                     WHERE T.SLECH_NO = :3 `;
        await connect.execute(query, [P_MGR, P_CK_DATE, P_SLEC_NO]);

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