const express = require("express");
const { Client } = require("pg");
const app = express();

const { ConnectOracleDB, DisconnectOracleDB, ConnectPostgresDB } = require("../Common/DBconnection.cjs");
const { pgCUSR, pgGC } = ConnectPostgresDB();

const oracledb = require("oracledb");
require("dotenv").config();

const { Buffer } = require('buffer');
const path = require('path');
const fs = require('fs');
const base64 = require('base-64');

const ftp = require('ftp');

module.exports.getDataMain = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_SLEC_FRM = req.query.P_SLEC_FRM
        const P_SLEC_TO = req.query.P_SLEC_TO
        const P_ISS_DATE_FRM = req.query.P_ISS_DATE_FRM
        const P_ISS_DATE_TO = req.query.P_ISS_DATE_TO
        const P_STATUS = req.query.P_STATUS
        const P_USER = req.query.P_USER

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
        query += `        T.SLECH_MGR_REFER `;
        query += `   FROM SLEC_TRANS_HEADER T `;
        query += `   LEFT JOIN CUSR.CU_FACTORY_M F ON F.FACTORY_CODE = T.SLECH_FACTORY `;
        query += `   LEFT JOIN CUSR.CU_USER_M U ON U.USER_LOGIN = T.SLECH_CREATE_BY `;
        query += `   LEFT JOIN SLEC_TRANS_ROUTING V ON V.SLECR_NO = T.SLECH_NO AND V.SLECR_INSPECTOR = U.USER_LOGIN `;
        query += `   LEFT JOIN SLEC_MSTR_STATUS P ON T.SLECH_STATUS = P.STSTATUS_CODE `;
        query += `   LEFT JOIN SLEC_TRANS_SUPERVISOR E ON E.SLECD_NO = T.SLECH_NO `;
        query += `   LEFT JOIN SLEC_MSTR_STATUS P1 ON E.SLECD_STATUS = P1.STSTATUS_CODE `;
        query += `   LEFT JOIN CUSR.CU_USER_HUMANTRIX CH ON CH.EMPCODE = E.SLECD_EMPLOYEE_ID `;
        query += `  WHERE 1 = 1 `;
        query += `    AND ((T.SLECH_CREATE_BY = '${P_USER}' OR '${P_USER}' IS NULL) OR (V.SLECR_INSPECTOR = '${P_USER}' OR '${P_USER}' IS NULL)) `;
        query += `    AND (T.SLECH_FACTORY = '${P_FACTORY}' OR '${P_FACTORY}' IS NULL) `;
        query += `    AND (T.SLECH_NO >= '${P_SLEC_FRM}' OR '${P_SLEC_FRM}' IS NULL) `;
        query += `    AND (T.SLECH_NO <= '${P_SLEC_TO}' OR '${P_SLEC_TO}' IS NULL) `;
        query += `    AND (TO_CHAR(T.SLECH_CREATE_DATE, 'YYYYMMDD') >= '${P_ISS_DATE_FRM}' OR '${P_ISS_DATE_FRM}' IS NULL) `;
        query += `    AND (TO_CHAR(T.SLECH_CREATE_DATE, 'YYYYMMDD') <= '${P_ISS_DATE_TO}' OR '${P_ISS_DATE_TO}' IS NULL) `;
        query += `    AND (T.SLECH_STATUS = '${P_STATUS}' OR '${P_STATUS}' IS NULL) `;
        query += `  ORDER BY T.SLECH_NO `;
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
            SLEC_STATUS_CODE: row[6]
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getDataHeader = async function (req, res) {
    try {
        const SLEC_NO = req.query.SLEC_NO
        const SLEC_USER = req.query.SLEC_USER

        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT T.SLECH_NO AS SLEC_NO, `;
        query += `        T.SLECH_STATUS AS SLEC_STS_CODE, `;
        query += `        S.STSTATUS_DISPLAY AS SLEC_STS_DESC, `;
        query += `        T.SLECH_FACTORY AS SLEC_FAC_CODE, `;
        query += `        F.FACTORY_NAME AS SLEC_FAC_DESC, `;
        query += `        T.SLECH_CHECK_DATE AS SLEC_CK_DATE, `;
        query += `        TO_CHAR(T.SLECH_CHECK_DATE,'DD Mon YYYY') AS SLEC_CK_DATE_SHOW, `;
        query += `        T.SLECH_REMARK AS SLEC_REMARK, `;
        query += `        T.SLECH_CREATE_BY || ' : ' || TO_CHAR(T.SLECH_CREATE_DATE,'DD/MM/YYYY') AS SLEC_CREATE, `;
        query += `        T.SLECH_MODIFY_BY || ' : ' || TO_CHAR(T.SLECH_MODIFY_DATE,'DD/MM/YYYY') AS SLEC_MODIFY, `;
        query += `        T.SLECH_MGR_REFER AS SLEC_MGR `;
        query += `   FROM SLEC_TRANS_HEADER T `;
        query += `   LEFT JOIN SLEC_MSTR_STATUS S ON S.STSTATUS_CODE = T.SLECH_STATUS  `;
        query += `   LEFT JOIN CUSR.CU_FACTORY_M F ON F.FACTORY_CODE = T.SLECH_FACTORY `;
        query += `  WHERE T.SLECH_NO = '${SLEC_NO}' `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        if (!result.rows || !Array.isArray(result.rows) || result.rows.length === 0) {
            throw new Error("Data is not available or in incorrect format");
        }

        const row = result.rows[0];
        const data = {
            SLEC_NO: row[0],
            SLEC_STS_CODE: row[1],
            SLEC_STS_DESC: row[2],
            SLEC_FACTORY: { value: row[3], label: row[4] },
            SLEC_CK_DATE: row[5],
            SLEC_CK_DATE_SHOW: row[6],
            SLEC_REMARK: row[7],
            SLEC_CREATE: row[8],
            SLEC_MODIFY: row[9],
            SLEC_MGR: { value: row[10], label: row[10] },
            SLEC_USER: SLEC_USER,
            SLEC_OPEN: false
        };
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

async function Getrunning(P_FAC_CODE) {
    try {

        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT R.RUN_DESC || '-' || R.RUN_YEAR || '-' || R.RUN_NO AS RUN_NO `;
        query += `   FROM SLEC_MSTR_RUN_NO R `;
        query += `  WHERE R.RUN_FACTORY = '${P_FAC_CODE}' `;
        query += `    AND R.RUN_YEAR = TO_CHAR(SYSDATE, 'YY') `;
        const result = await connect.execute(query);
        if (!result.rows || !Array.isArray(result.rows) || result.rows.length === 0) {
            query = ``;
            query += ` SELECT (SELECT F.FACTORY_NAME `;
            query += `           FROM CUSR.CU_FACTORY_M F `;
            query += `          WHERE F.FACTORY_CODE = '${P_FAC_CODE}') || '-' || TO_CHAR(SYSDATE, 'YY') || `;
            query += `        '-000001' AS RUN_NO `;
            query += `   FROM DUAL `;
            const result2 = await connect.execute(query);
            DisconnectOracleDB(connect);
            const row = result.rows[0];
            return row[0]
        } else {
            DisconnectOracleDB(connect);
            const row = result.rows[0];
            return row[0]
        }

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return '';
    }
};

async function GetStatusHeader_FromCheckSup(SLECno) {
    try {

        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT T.SLECD_EMPLOYEE_ID FROM SLEC_TRANS_SUPERVISOR T WHERE T.SLECD_NO = '${SLECno}' AND T.SLECD_STATUS != '50' `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        if (!result.rows || !Array.isArray(result.rows) || result.rows.length === 0) {
            return '50'
        } else {
            if (result.rows.length > 1) {
                return '40'
            } else {
                return '50'
            }
        }

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return '';
    }
};

module.exports.delTransaction = async function (req, res) {
    let connect;
    try {
        const P_SLEC_NO = req.query.P_SLEC_NO
        const P_EMP_ID = req.query.P_EMP_ID
        connect = await ConnectOracleDB("GC");
        let query = ``;

        query = ``;
        query = ` DELETE SLEC_TRANS_ATTACH T WHERE T.SPIC_NO = :1 AND T.SPIC_EMPLOYEE_ID = :2  `;
        await connect.execute(query, [P_SLEC_NO, P_EMP_ID]);

        query = ``;
        query = ` DELETE SLEC_TRANS_SUP_CHECKPOINT T WHERE T.SLECC_NO = :1 AND T.SLECC_EMPLOYEE_ID = :2  `;
        await connect.execute(query, [P_SLEC_NO, P_EMP_ID]);

        query = ``;
        query = ` DELETE SLEC_TRANS_SUPERVISOR T WHERE T.SLECD_NO = :1 AND T.SLECD_EMPLOYEE_ID = :2  `;
        await connect.execute(query, [P_SLEC_NO, P_EMP_ID]);

        query = ``;
        query = ` DELETE SLEC_TRANS_FULL_SCORE T WHERE T.SLFULL_NO = :1 AND 0 = (SELECT COUNT(S.SLECD_EMPLOYEE_ID) FROM SLEC_TRANS_SUPERVISOR S WHERE S.SLECD_NO = T.SLFULL_NO)  `;
        await connect.execute(query, [P_SLEC_NO]);

        query = ``;
        query = ` DELETE SLEC_TRANS_ROUTING T WHERE T.SLECR_NO = :1 AND 0 = (SELECT COUNT(S.SLECD_EMPLOYEE_ID) FROM SLEC_TRANS_SUPERVISOR S WHERE S.SLECD_NO = T.SLECR_NO)  `;
        await connect.execute(query, [P_SLEC_NO]);

        query = ``;
        query = ` DELETE SLEC_TRANS_HEADER T WHERE T.SLECH_NO = :1 AND 0 = (SELECT COUNT(S.SLECD_EMPLOYEE_ID) FROM SLEC_TRANS_SUPERVISOR S WHERE S.SLECD_NO = T.SLECH_NO)  `;
        await connect.execute(query, [P_SLEC_NO]);

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

module.exports.mergHeader = async function (req, res) {
    let connect;
    try {
        const { SLEC_NO,
            SLEC_STS_CODE,
            SLEC_FACTORY,
            SLEC_CK_DATE_SHOW,
            SLEC_REMARK,
            SLEC_MGR,
            SLEC_USER } = req.body;
        let SLECno = '';
        if (SLEC_NO.trim() === '' || SLEC_NO === null) {
            SLECno = await Getrunning(SLEC_FACTORY.value)
        } else {
            SLECno = SLEC_NO
        }
        connect = await ConnectOracleDB("GC");
        let query = ``;
        query = ``;
        query = `   MERGE INTO SLEC_TRANS_HEADER T
                    USING (SELECT :1 AS SLECH_NO,
                            :2 AS SLECH_STATUS,
                            :3 AS SLECH_FACTORY,
                            TO_DATE(:4, 'YYYYMMDD') AS SLECH_CHECK_DATE,
                            :5 AS SLECH_REMARK,
                            :6 AS SLECH_CREATE_BY,
                            SYSDATE AS SLECH_CREATE_DATE,
                            :7 AS SLECH_MODIFY_BY,
                            SYSDATE AS SLECH_MODIFY_DATE,
                            :8 AS SLECH_MGR_REFER
                        FROM DUAL) D
                ON (T.SLECH_NO = D.SLECH_NO)
                WHEN MATCHED THEN
                UPDATE
                    SET T.SLECH_STATUS      = D.SLECH_STATUS,
                        T.SLECH_CHECK_DATE  = D.SLECH_CHECK_DATE,
                        T.SLECH_REMARK      = D.SLECH_REMARK,
                        T.SLECH_MGR_REFER   = D.SLECH_MGR_REFER,
                        T.SLECH_MODIFY_BY   = D.SLECH_MODIFY_BY,
                        T.SLECH_MODIFY_DATE = D.SLECH_MODIFY_DATE
                WHEN NOT MATCHED THEN
                INSERT
                    (T.SLECH_NO,
                    T.SLECH_STATUS,
                    T.SLECH_FACTORY,
                    T.SLECH_CHECK_DATE,
                    T.SLECH_REMARK,
                    T.SLECH_CREATE_BY,
                    T.SLECH_CREATE_DATE,
                    T.SLECH_MODIFY_BY,
                    T.SLECH_MODIFY_DATE,
                    T.SLECH_MGR_REFER)
                VALUES
                    (D.SLECH_NO,
                    D.SLECH_STATUS,
                    D.SLECH_FACTORY,
                    D.SLECH_CHECK_DATE,
                    D.SLECH_REMARK,
                    D.SLECH_CREATE_BY,
                    D.SLECH_CREATE_DATE,
                    D.SLECH_MODIFY_BY,
                    D.SLECH_MODIFY_DATE,
                    D.SLECH_MGR_REFER) `;
        await connect.execute(query, [SLECno,
            SLEC_STS_CODE,
            SLEC_FACTORY.value,
            SLEC_CK_DATE_SHOW,
            SLEC_REMARK,
            SLEC_USER,
            SLEC_USER,
            SLEC_MGR.value]);

        if (SLEC_NO.trim() === '' || SLEC_NO === null) {
            query = ``;
            query = `   MERGE INTO SLEC_MSTR_RUN_NO T
                    USING (SELECT :1 AS RUN_FACTORY,
                                TO_CHAR(SYSDATE, 'YY') AS RUN_YEAR,
                                (SELECT F.FACTORY_NAME
                                    FROM CUSR.CU_FACTORY_M F
                                    WHERE F.FACTORY_CODE = :2) AS RUN_DESC,
                                NVL((SELECT CASE LENGTH(CAST(G.RUN_NO AS INTEGER) + 1)
                                            WHEN 1 THEN
                                                '00000' || TO_CHAR(CAST(G.RUN_NO AS INTEGER) + 1)
                                            WHEN 2 THEN
                                                '0000' || TO_CHAR(CAST(G.RUN_NO AS INTEGER) + 1)
                                            WHEN 3 THEN
                                                '000' || TO_CHAR(CAST(G.RUN_NO AS INTEGER) + 1)
                                            WHEN 4 THEN
                                                '00' || TO_CHAR(CAST(G.RUN_NO AS INTEGER) + 1)
                                            WHEN 5 THEN
                                                '0' || TO_CHAR(CAST(G.RUN_NO AS INTEGER) + 1)
                                            ELSE
                                                TO_CHAR(CAST(G.RUN_NO AS INTEGER) + 1)
                                            END AS RUNNO
                                        FROM SLEC_MSTR_RUN_NO G
                                    WHERE G.RUN_FACTORY = :3
                                        AND G.RUN_YEAR = TO_CHAR(SYSDATE, 'YY')),
                                    '000001') AS RUN_NO
                            FROM DUAL) D
                    ON (T.RUN_FACTORY = D.RUN_FACTORY AND T.RUN_YEAR = D.RUN_YEAR)
                    WHEN MATCHED THEN
                    UPDATE SET T.RUN_NO = D.RUN_NO
                    WHEN NOT MATCHED THEN
                    INSERT
                        (T.RUN_FACTORY, T.RUN_YEAR, T.RUN_DESC, T.RUN_NO)
                    VALUES
                        (D.RUN_FACTORY, D.RUN_YEAR, D.RUN_DESC, D.RUN_NO) `;
            await connect.execute(query, [SLEC_FACTORY.value,
            SLEC_FACTORY.value,
            SLEC_FACTORY.value]);
        }


        if (SLEC_STS_CODE === '30') {
            query = ``;
            query = `  DELETE FROM SLEC_TRANS_FULL_SCORE T WHERE T.SLFULL_NO = :1 `;
            await connect.execute(query, [SLECno]);

            query = ``;
            query = `  INSERT INTO SLEC_TRANS_FULL_SCORE T
                  (T.SLFULL_NO, T.SLFULL_TYPE, T.SLFULL_SCORE)
                  (SELECT :1 AS SLFULL_NO,
                          P.TYPE_CODE AS SLFULL_TYPE,
                          P.TYPE_SCORE AS SLFULL_SCORE
                     FROM SLEC_MSTR_TYPE_POINT P) `;

            await connect.execute(query, [SLECno]);
        }

        await connect.commit();
        res.status(200).send(SLECno);

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

module.exports.getDataInspector = async function (req, res) {
    try {
        const P_NO = req.query.P_NO
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT T.SLECR_INSPECTOR AS USER_INSP, `;
        query += `        H.USER_EMP_ID || ' : ' || H.USER_FNAME || ' ' || H.USER_SURNAME AS USER_INSP_NAME `;
        query += `   FROM SLEC_TRANS_ROUTING T `;
        query += `   LEFT JOIN CUSR.CU_USER_M H ON H.USER_LOGIN = T.SLECR_INSPECTOR `;
        query += `  WHERE T.SLECR_NO = '${P_NO}' `;
        query += `  ORDER BY T.SLECR_INSPECTOR `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = result.rows.map(row => ({
            USER_INSP: row[0],
            USER_INSP_NAME: row[1]
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.mergInspector = async function (req, res) {
    let connect;
    try {
        const STC_INSPECTOR = req.body;

        connect = await ConnectOracleDB("GC");
        let query = ``;
        for (const item of STC_INSPECTOR) {
            const { SLECR_NO, SLECR_INSPECTOR, SLECR_COMMENT } = item;
            query = ``;
            query = `   MERGE INTO SLEC_TRANS_ROUTING T
                    USING (SELECT :1 AS SLECR_NO,
                                :2 AS SLECR_INSPECTOR,
                                SYSDATE AS SLECR_INSPECT_DATE,
                                :3 AS SLECR_COMMENT
                            FROM DUAL) D
                    ON (T.SLECR_NO = D.SLECR_NO AND T.SLECR_INSPECTOR = D.SLECR_INSPECTOR)
                    WHEN MATCHED THEN
                    UPDATE SET T.SLECR_COMMENT = D.SLECR_COMMENT
                    WHEN NOT MATCHED THEN
                    INSERT
                        (T.SLECR_NO, T.SLECR_INSPECTOR, T.SLECR_INSPECT_DATE, T.SLECR_COMMENT)
                    VALUES
                        (D.SLECR_NO, D.SLECR_INSPECTOR, D.SLECR_INSPECT_DATE, D.SLECR_COMMENT) `;
            await connect.execute(query, [SLECR_NO,
                SLECR_INSPECTOR,
                SLECR_COMMENT]);
        }

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

module.exports.delInspector = async function (req, res) {
    let connect;
    try {
        const P_NO = req.query.P_NO;
        const P_INSPECTOR = req.query.P_INSPECTOR;

        connect = await ConnectOracleDB("GC");
        let query = ``;
        query = `   DELETE FROM SLEC_TRANS_ROUTING T WHERE T.SLECR_NO = :1 AND T.SLECR_INSPECTOR = :2 `;

        await connect.execute(query, [P_NO, P_INSPECTOR]);

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

module.exports.getSupervisor = async function (req, res) {
    try {
        const P_NO = req.query.P_NO
        const P_CC = req.query.P_CC
        const P_EMP = req.query.P_EMP
        const P_PROCESS = req.query.P_PROCESS

        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT T.EMPCODE AS SUP_EMP_ID, `;
        query += `        T.EMPCODE || ' : ' || UPPER(SUBSTR(T.ENAME, 1, 1)) || `;
        query += `        LOWER(SUBSTR(T.ENAME, 2, LENGTH(T.ENAME) - 1)) || ' ' || `;
        query += `        UPPER(SUBSTR(T.ESURNAME, 1, 1)) || `;
        query += `        LOWER(SUBSTR(T.ESURNAME, 2, LENGTH(T.ESURNAME) - 1)) AS SUP_NAME, `;
        query += `        T.COST_CENTER AS SUP_CC, `;
        query += `        T.POS_GRADE AS SUP_LEVEL `;
        query += `   FROM CUSR.CU_USER_HUMANTRIX T `;
        query += `  WHERE 1 = 1 `;
        query += `    AND T.STATUS = 'Active' `;
        query += `    AND T.EMPCODE NOT IN `;
        query += `        (SELECT SP.SLECD_EMPLOYEE_ID `;
        query += `           FROM SLEC_TRANS_SUPERVISOR SP `;
        query += `          WHERE SP.SLECD_NO = '${P_NO}') `;
        query += `    AND T.POS_GRADE IN `;
        query += `        (SELECT L.SLEVEL_GRADE `;
        query += `           FROM SLEC_MSTR_LEVEL L `;
        query += `          WHERE L.SLEVEL_FACTORY = `;
        query += `                (SELECT DISTINCT H.SLECH_FACTORY `;
        query += `                   FROM SLEC_TRANS_HEADER H `;
        query += `                  WHERE H.SLECH_NO = '${P_NO}')) `;
        query += `    AND (TRIM(SUBSTR(T.COST_CENTER,1,4)) = '${P_CC}' OR '${P_CC}' IS NULL) `;
        query += `    AND UPPER(T.EMPCODE || T.ENAME || T.ESURNAME) LIKE UPPER('%${P_EMP}%') `;
        query += `  ORDER BY T.EMPCODE `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        let PROC = '';
        if (P_PROCESS === null) {
            PROC = ''
        } else {
            PROC = P_PROCESS
        }
        const data = result.rows.map(row => ({
            SUP_SELECT: false,
            SUP_EMP_ID: row[0],
            SUP_NAME: row[1],
            SUP_CC: row[2],
            SUP_LEVEL: row[3],
            SUP_PROCESS: PROC
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.insertSupervisor = async function (req, res) {
    let connect;
    try {
        const P_NO = req.query.P_NO
        const STC_SUPERVISOR = req.body;
        connect = await ConnectOracleDB("GC");
        let query = ``;

        // query = ``;
        // query = `   DELETE FROM SLEC_TRANS_SUPERVISOR T WHERE T.SLECD_NO = :1  `;
        // await connect.execute(query, [P_NO]);

        for (const item of STC_SUPERVISOR) {
            const { SLECD_NO,
                SLECD_EMPLOYEE_ID,
                SLECD_CC,
                SLECD_PROCESS,
                SLECD_JOB_GRADE,
                SLECD_FULL_SCORE,
                SLECD_ACTUAL_SCORE,
                SLECD_STATUS,
                SLECR_USER
            } = item;

            query = ``;
            query = `  INSERT INTO SLEC_TRANS_SUPERVISOR T
                            (T.SLECD_NO,
                            T.SLECD_EMPLOYEE_ID,
                            T.SLECD_CHECK_DATE,
                            T.SLECD_CC,
                            T.SLECD_PROCESS,
                            T.SLECD_JOB_GRADE,
                            T.SLECD_FULL_SCORE,
                            T.SLECD_ACTUAL_SCORE,
                            T.SLECD_CREATE_BY,
                            T.SLECD_CREATE_DATE,
                            T.SLECD_MODIFY_BY,
                            T.SLECD_MODIFY_DATE,
                            T.SLECD_STATUS)
                        VALUES
                            (:1,
                            :2,
                            SYSDATE,
                            :3,
                            :4,
                            :5,
                            :6,
                            :7,
                            :8,
                            SYSDATE,
                            :9,
                            SYSDATE,
                            :10) `;

            await connect.execute(query, [SLECD_NO,
                SLECD_EMPLOYEE_ID,
                SLECD_CC,
                SLECD_PROCESS,
                SLECD_JOB_GRADE,
                SLECD_FULL_SCORE,
                SLECD_ACTUAL_SCORE,
                SLECR_USER,
                SLECR_USER,
                SLECD_STATUS,
            ]);
        }


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

module.exports.getDataSupervisor = async function (req, res) {
    try {
        const P_NO = req.query.P_NO
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT T.SLECD_NO AS SUP_SLEC_NO, `;
        query += `        T.SLECD_EMPLOYEE_ID AS SUP_EMP_ID, `;
        query += `        H.EMPCODE || ' : ' || UPPER(SUBSTR(H.ENAME, 1, 1)) || `;
        query += `        LOWER(SUBSTR(H.ENAME, 2, LENGTH(H.ENAME) - 1)) || ' ' || `;
        query += `        UPPER(SUBSTR(H.ESURNAME, 1, 1)) || `;
        query += `        LOWER(SUBSTR(H.ESURNAME, 2, LENGTH(H.ESURNAME) - 1)) AS SUP_EMP_NAME, `;
        query += `        T.SLECD_CC AS SUP_CC, `;
        query += `        T.SLECD_FULL_SCORE AS SUP_FULL_SCORE, `;
        query += `        NVL(T.SLECD_ACTUAL_SCORE,0) AS SUP_ACTUAL_SCORE, `;
        query += `        T.SLECD_STATUS AS SUP_STS_CODE, `;
        query += `        S.STSTATUS_DISPLAY AS SUP_STS_DESC `;
        query += `   FROM SLEC_TRANS_SUPERVISOR T `;
        query += `   LEFT JOIN CUSR.CU_USER_HUMANTRIX H ON H.EMPCODE = T.SLECD_EMPLOYEE_ID `;
        query += `   LEFT JOIN SLEC_MSTR_STATUS S ON S.STSTATUS_CODE = T.SLECD_STATUS `;
        query += `  WHERE T.SLECD_NO = '${P_NO}' `;
        query += `  ORDER BY T.SLECD_EMPLOYEE_ID `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = result.rows.map(row => ({
            SUP_SLEC_NO: row[0],
            SUP_EMP_ID: row[1],
            SUP_EMP_NAME: row[2],
            SUP_CC: row[3],
            SUP_FULL_SCORE: row[4],
            SUP_ACTUAL_SCORE: row[5],
            SUP_STS_CODE: row[6],
            SUP_STS_DESC: row[7],
            SUP_SLECT_COPY: false
        }));
        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.delSupervisor = async function (req, res) {
    let connect;
    try {
        const P_NO = req.query.P_NO;
        const P_SUP = req.query.P_SUP;

        connect = await ConnectOracleDB("GC");
        let query = ``;
        query = `   DELETE FROM SLEC_TRANS_SUPERVISOR T WHERE T.SLECD_NO = :1 AND T.SLECD_EMPLOYEE_ID = :2 `;

        await connect.execute(query, [P_NO, P_SUP]);

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

module.exports.getResultCheckPointBySup = async function (req, res) {
    try {
        const P_NO = req.query.P_NO
        const P_SUP = req.query.P_SUP
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT T.SQUESTC_TYPE AS SLEC_QUES_TYPE, `;
        query += `        TP.TYPE_DESC AS SLEC_QUES_TYPE_DESC, `;
        query += `        T.SQUESTC_CODE AS SLEC_QUES_CODE, `;
        query += `        T.SQUESTC_REV AS SLEC_QUES_REV, `;
        query += `        T.SQUESTC_SEQ_QUESTION AS SLEC_QUES_SEQ, `;
        query += `        T.SQUESTC_DESC_THAI AS SLEC_QUES_TH, `;
        query += `        T.SQUESTC_DESC_ENG AS SLEC_QUES_EN, `;
        query += `        T.SQUESTC_FULL_SCORE AS SLEC_QUES_FSCORE, `;
        query += `        '${P_NO}' AS SLEC_NO, `;
        query += `        NVL(R.RES_EMP_ID, '${P_SUP}') AS SLEC_SUP, `;
        query += `        NVL(R.RES_SCORE, T.SQUESTC_FULL_SCORE) AS SLEC_ASCORE, `;
        query += `        NVL(R.RES_ASKWER, 'A') AS SLEC_ASKWER, `;
        query += `        R.RES_CMMT AS SLEC_COMMENT, `;
        query += `        R.RES_FILE AS SLEC_FILE, `;
        query += `        R.RES_CHECK_DATEFILE AS SLEC_DATEFILE, `;
        query += `        DECODE(R.RES_EMP_ID,'',DECODE(T.SQUESTC_TYPE,'TY001','T','F'),'T') AS SLEC_CHECK_RESULT `;
        query += `   FROM SLEC_MSTR_QUES_CHECKPOINT T `;
        query += `   LEFT JOIN SLEC_MSTR_TYPE_POINT TP ON TP.TYPE_CODE = T.SQUESTC_TYPE `;
        query += `   LEFT JOIN (SELECT S.SLECC_EMPLOYEE_ID AS RES_EMP_ID, `;
        query += `                     S.SLECC_QUESTC_CODE AS RES_CODE, `;
        query += `                     S.SLECC_TYPE        AS RES_TYPE, `;
        query += `                     S.SLECC_SCORE       AS RES_SCORE, `;
        query += `                     S.SLECC_ASKWER      AS RES_ASKWER, `;
        query += `                     S.SLECC_COMMENT     AS RES_CMMT, `;
        query += `                     ''     AS RES_FILE, `;
        query += `                     CAST(TO_CHAR(H.SLECH_CREATE_DATE,'YYYYMM') AS INTEGER) AS RES_CHECK_DATEFILE `;
        query += `                FROM SLEC_TRANS_SUP_CHECKPOINT S `;
        query += `               INNER JOIN SLEC_TRANS_HEADER H ON H.SLECH_NO = S.SLECC_NO `;
        query += `               WHERE S.SLECC_NO = '${P_NO}' `;
        query += `                 AND S.SLECC_EMPLOYEE_ID = '${P_SUP}' `;
        query += `                 AND S.SLECC_REV = `;
        query += `                     (SELECT DISTINCT MAX(SR.SLECC_REV) `;
        query += `                        FROM SLEC_TRANS_SUP_CHECKPOINT SR `;
        query += `                       WHERE SR.SLECC_NO = S.SLECC_NO `;
        query += `                         AND SR.SLECC_EMPLOYEE_ID = S.SLECC_EMPLOYEE_ID) `;
        query += `               ORDER BY S.SLECC_TYPE, CAST(S.SLECC_QUESTC_CODE AS INTEGER)) R `;
        query += `     ON R.RES_CODE = T.SQUESTC_CODE AND R.RES_TYPE = T.SQUESTC_TYPE `;
        query += `  WHERE 1 = 1 `;
        query += `    AND T.SQUESTC_REV = (SELECT DISTINCT MAX(M.SQUESTC_REV) FROM SLEC_MSTR_QUES_CHECKPOINT M) `;
        query += `    AND T.SQUESTC_STATUS = 'Active' `;
        query += `  ORDER BY T.SQUESTC_TYPE, `;
        query += `           CAST(T.SQUESTC_SEQ_QUESTION AS INTEGER), `;
        query += `           CAST(T.SQUESTC_CODE AS INTEGER) `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);


        const data = await Promise.all(result.rows.map(async (row) => {
            let SLEC_FILE = null;
            if (row[14] > 202407) {
                SLEC_FILE = await getFileCheckPointPG_DB(P_NO, P_SUP, row[0], row[2]);
            } else {
                SLEC_FILE = await getFileCheckPoint(P_NO, P_SUP, row[0], row[2]);
            }
            return {
                SLEC_QUES_TYPE: row[0],
                SLEC_QUES_TYPE_DESC: row[1],
                SLEC_QUES_CODE: row[2],
                SLEC_QUES_REV: row[3],
                SLEC_QUES_SEQ: row[4],
                SLEC_QUES_TH: row[5],
                SLEC_QUES_EN: row[6],
                SLEC_QUES_FSCORE: row[7],
                SLEC_NO: row[8],
                SLEC_SUP: row[9],
                SLEC_ASCORE: row[10],
                SLEC_ASKWER: row[11],
                SLEC_COMMENT: row[12],
                SLEC_CHECK_RESULT: row[15],
                SLEC_FILE_NAME: null,
                SLEC_FILE_B64: '',
                SLEC_FILE_BL: null,
                SLEC_FILE_URL: null,
                SLEC_FILE_TYPE: 'IMG',
                SLEC_FILE_DETAIL: SLEC_FILE,
                SLEC_OPEN: false
            };
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

async function getFileCheckPoint(P_SLEC_NO, P_EMP_ID, P_TYPE, P_CODE) {
    try {

        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT T.SPIC_SEQ, T.SPIC_FILENAME `;
        query += `   FROM SLEC_TRANS_ATTACH T `;
        query += `  WHERE T.SPIC_NO = '${P_SLEC_NO}' `;
        query += `    AND T.SPIC_EMPLOYEE_ID = '${P_EMP_ID}' `;
        query += `    AND T.SPIC_TYPE = '${P_TYPE}' `;
        query += `    AND T.SPIC_QUESTC_CODE = '${P_CODE}' `;
        query += ` ORDER BY CAST(T.SPIC_SEQ AS INTEGER) `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        if (!result.rows || !Array.isArray(result.rows) || result.rows.length === 0) {
            return [];
        } else {
            const data = await Promise.all(result.rows.map(async (row) => {
                let base64String = '';
                // base64String = await fileToBase64(row[1]);
                base64String = await downloadFileFromFTP(row[1]);
                let typFile = 'IMG';

                const spName = row[1].split(".");
                if (spName.length > 0) {
                    if (spName[spName.length - 1].toLowerCase() === 'jpg' ||
                        spName[spName.length - 1].toLowerCase() === 'png' ||
                        spName[spName.length - 1].toLowerCase() === 'jpeg' ||
                        spName[spName.length - 1].toLowerCase() === 'gif') {
                        typFile = 'IMG';
                    } else {
                        typFile = 'FILE';
                    }
                }

                return {
                    SLEC_FILE_SEQ_D: row[0],
                    SLEC_FILE_NAME_D: row[1],
                    SLEC_FILE_B64_D: base64String,
                    SLEC_FILE_BL_D: null,
                    SLEC_FILE_URL_D: null,
                    SLEC_FILE_TYPE_D: typFile
                };
            }));

            return data;
        }


    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return [];
    }
};

async function downloadFileFromFTP(fileName) {
    return new Promise((resolve, reject) => {
        const client = new ftp();
        client.on('ready', () => {
            console.log(fileName);
            console.log('Connected to FTP server');
            const remotePath = `/BTP2-Application_CUSR/SLEC_FILE/${fileName}`;

            client.get(remotePath, (err, stream) => {
                if (err) {
                    client.end();
                    return reject(err);
                }

                let data = [];

                stream.on('data', (chunk) => {
                    data.push(chunk);
                });

                stream.on('end', () => {
                    const buffer = Buffer.concat(data);
                    const base64String = buffer.toString('base64');
                    console.log('File downloaded and converted to Base64 successfully');
                    client.end();
                    resolve(base64String);
                });

                stream.on('error', (err) => {
                    client.end();
                    reject(err);
                });
            });
        });

        client.on('error', (err) => {
            reject(err);
        });

        client.connect({
            host: process.env.FTP_HOST,
            port: process.env.FTP_POST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD
        });
    });
}

async function fileToBase64(filename) {
    // อ่านไฟล์และเปลี่ยนเป็น Base64 string
    const filePath = path.join(__dirname, '../UploadFile', filename);
    const fileContent = fs.readFileSync(filePath, { encoding: 'base64' });
    console.log('Convert File to Base64 successfully')
    return fileContent;
}

async function saveBase64ToFile(filename, base64String) {

    // แปลง Base64 string เป็น Buffer
    const filePath = path.join(__dirname, '../UploadFile', filename);
    const buffer = Buffer.from(base64String, 'base64');
    console.log('File read successfully...');

    // เขียน Buffer ลงในไฟล์
    fs.writeFileSync(filePath, buffer);
    console.log('Save File successfully');
}


module.exports.insertSupCheckpoint = async function (req, res) {
    let connect;
    try {
        const P_SLEC_NO = req.query.P_SLEC_NO;
        const P_SUP_EMP = req.query.P_SUP_EMP;
        const P_SUP_SCORE = req.query.P_SUP_SCORE;
        const P_STS_SUP = req.query.P_STS_SUP;
        const P_USER = req.query.P_USER;
        const STC_POINT = req.body;
        let STS_HEADER = await GetStatusHeader_FromCheckSup(P_SLEC_NO);
        connect = await ConnectOracleDB("GC");
        let query = ``;

        if (P_STS_SUP === '40') {
            query = ``;
            query = ` UPDATE SLEC_TRANS_HEADER T
                        SET T.SLECH_STATUS = '40', T.SLECH_CHECK_DATE = SYSDATE
                      WHERE T.SLECH_NO = :1
                        AND T.SLECH_CHECK_DATE IS NULL `;
            await connect.execute(query, [P_SLEC_NO]);
        } else {
            if (STS_HEADER === '50') {
                query = ``;
                query = ` UPDATE SLEC_TRANS_HEADER T
                            SET T.SLECH_STATUS = '50', T.SLECH_CHECK_DATE = SYSDATE
                        WHERE T.SLECH_NO = :1 `;
                await connect.execute(query, [P_SLEC_NO]);
            }else{
                if (P_STS_SUP === '50') {
                    query = ``;
                    query = ` UPDATE SLEC_TRANS_HEADER T
                                SET T.SLECH_STATUS = '40', T.SLECH_CHECK_DATE = SYSDATE
                              WHERE T.SLECH_NO = :1
                                AND T.SLECH_CHECK_DATE IS NULL `;
                    await connect.execute(query, [P_SLEC_NO]);
                } 
            }

        }

        query = ``;
        query = ` UPDATE SLEC_TRANS_SUPERVISOR T
                     SET T.SLECD_ACTUAL_SCORE = :1 , T.SLECD_STATUS = :2
                   WHERE T.SLECD_NO = :3
                     AND T.SLECD_EMPLOYEE_ID = :4 `;
        await connect.execute(query, [P_SUP_SCORE, P_STS_SUP, P_SLEC_NO, P_SUP_EMP]);

        query = ``;
        query = ` DELETE FROM SLEC_TRANS_ATTACH T
                   WHERE T.SPIC_NO = :1
                     AND T.SPIC_EMPLOYEE_ID = :2 `;
        await connect.execute(query, [P_SLEC_NO, P_SUP_EMP]);

        await delAttachFliePG(P_SLEC_NO, P_SUP_EMP);

        query = ``;
        query = ` DELETE FROM SLEC_TRANS_SUP_CHECKPOINT T
                   WHERE T.SLECC_NO = :1
                     AND T.SLECC_EMPLOYEE_ID = :2 `;
        await connect.execute(query, [P_SLEC_NO, P_SUP_EMP]);

        for (const item of STC_POINT) {
            const { SLEC_NO, SLEC_SUP, SLEC_QUES_CODE, SLEC_QUES_REV, SLEC_QUES_TYPE, SLEC_ASKWER, SLEC_ASCORE, SLEC_QUES_SEQ, SLEC_COMMENT, SLEC_FILE_NAME, SLEC_FILE_B64 } = item;
            query = ``;
            query = ` INSERT INTO SLEC_TRANS_SUP_CHECKPOINT T
                                (T.SLECC_NO,
                                T.SLECC_EMPLOYEE_ID,
                                T.SLECC_QUESTC_CODE,
                                T.SLECC_TYPE,
                                T.SLECC_REV,
                                T.SLECC_QUESTAS_CHSEQ,
                                T.SLECC_ASKWER,
                                T.SLECC_SCORE,
                                T.SLECC_SEQ_QUESTION,
                                T.SLECC_COMMENT)
                                VALUES
                                (:1, 
                                :2, 
                                :3, 
                                :4, 
                                :5, 
                                'A', 
                                :6, 
                                :7, 
                                :8, 
                                :9)  `;
            await connect.execute(query, [SLEC_NO, SLEC_SUP, SLEC_QUES_CODE, SLEC_QUES_TYPE, SLEC_QUES_REV, SLEC_ASKWER, SLEC_ASCORE, SLEC_QUES_SEQ, SLEC_COMMENT]);

            for (const itemFile of item.SLEC_FILE_DETAIL) {
                const { SLEC_FILE_SEQ_D, SLEC_FILE_NAME_D, SLEC_FILE_B64_D } = itemFile;
                // await saveBase64ToFile(SLEC_FILE_NAME_D, SLEC_FILE_B64_D)

                query = ``;
                query = ` INSERT INTO SLEC_TRANS_ATTACH T
                                    (T.SPIC_NO,
                                    T.SPIC_EMPLOYEE_ID,
                                    T.SPIC_QUESTC_CODE,
                                    T.SPIC_TYPE,
                                    T.SPIC_REV,
                                    T.SPIC_SEQ,
                                    T.SPIC_FILENAME)
                                    VALUES
                                    (:1, :2, :3, :4, :5, :6, :7) `;
                await connect.execute(query, [SLEC_NO, SLEC_SUP, SLEC_QUES_CODE, SLEC_QUES_TYPE, SLEC_QUES_REV, SLEC_FILE_SEQ_D, SLEC_FILE_NAME_D]);

                await insertAttachFliePG(SLEC_NO, SLEC_SUP, SLEC_QUES_CODE, SLEC_QUES_TYPE, SLEC_QUES_REV, SLEC_FILE_SEQ_D, SLEC_FILE_NAME_D,SLEC_FILE_B64_D);
            }

        }

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

async function GetStatusHeader_Copy(SLECno, EmpID) {
    try {

        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT T.SLECD_EMPLOYEE_ID `;
        query += `   FROM SLEC_TRANS_SUPERVISOR T `;
        query += `  WHERE T.SLECD_NO = '${SLECno}' `;
        query += `    AND T.SLECD_STATUS != '50' `;
        query += `    AND T.SLECD_EMPLOYEE_ID NOT IN `;
        query += `        (SELECT TRIM(REGEXP_SUBSTR('${EmpID}', '[^,]+', 1, LEVEL)) AS SLECD_EMPLOYEE_ID `;
        query += `           FROM DUAL `;
        query += `         CONNECT BY LEVEL <= LENGTH('${EmpID}') - `;
        query += `                    LENGTH(REPLACE('${EmpID}', ',', '')) + 1) `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        if (!result.rows || !Array.isArray(result.rows) || result.rows.length === 0) {
            return '50'
        } else {
            if (result.rows.length > 0) {
                return '40'
            } else {
                return '50'
            }
        }

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return '';
    }
};


module.exports.copySupCheckpoint = async function (req, res) {
    let connect;
    let STS_HEADER = '';
    try {
        const P_SLEC_NO = req.query.P_SLEC_NO;
        const P_SUP_EMP = req.query.P_SUP_EMP;
        const P_USER = req.query.P_USER;
        const STC_COPY = req.body;
        connect = await ConnectOracleDB("GC");
        let EmpID = '';
        let query = ``;
        for (const item of STC_COPY) {
            const { P_SUP_COPY } = item;

            query = ``;
            query = ` DELETE FROM SLEC_TRANS_ATTACH T
                       WHERE T.SPIC_NO = :1
                         AND T.SPIC_EMPLOYEE_ID = :2 `;
            await connect.execute(query, [P_SLEC_NO, P_SUP_COPY]);

            query = ``;
            query = ` DELETE FROM SLEC_TRANS_SUP_CHECKPOINT T
                       WHERE T.SLECC_NO = :1
                         AND T.SLECC_EMPLOYEE_ID = :2 `;
            await connect.execute(query, [P_SLEC_NO, P_SUP_COPY]);

            query = ``;
            query = ` INSERT INTO SLEC_TRANS_SUP_CHECKPOINT T
                            (T.SLECC_NO,
                            T.SLECC_EMPLOYEE_ID,
                            T.SLECC_QUESTC_CODE,
                            T.SLECC_TYPE,
                            T.SLECC_REV,
                            T.SLECC_QUESTAS_CHSEQ,
                            T.SLECC_ASKWER,
                            T.SLECC_SCORE,
                            T.SLECC_SEQ_QUESTION,
                            T.SLECC_COMMENT)
                            (SELECT I.SLECC_NO,
                                    :1 AS SLECC_EMPLOYEE_ID,
                                    I.SLECC_QUESTC_CODE,
                                    I.SLECC_TYPE,
                                    I.SLECC_REV,
                                    I.SLECC_QUESTAS_CHSEQ,
                                    I.SLECC_ASKWER,
                                    I.SLECC_SCORE,
                                    I.SLECC_SEQ_QUESTION,
                                    I.SLECC_COMMENT
                            FROM SLEC_TRANS_SUP_CHECKPOINT I
                           WHERE I.SLECC_NO = :2
                             AND I.SLECC_EMPLOYEE_ID = :3) `;
            await connect.execute(query, [P_SUP_COPY, P_SLEC_NO, P_SUP_EMP]);


            query = ``;
            query = ` INSERT INTO SLEC_TRANS_ATTACH T
                            (T.SPIC_NO,
                             T.SPIC_EMPLOYEE_ID,
                             T.SPIC_QUESTC_CODE,
                             T.SPIC_TYPE,
                             T.SPIC_REV,
                             T.SPIC_SEQ,
                             T.SPIC_FILENAME)
                            (SELECT I.SPIC_NO,
                                    :1 AS SPIC_EMPLOYEE_ID,
                                    I.SPIC_QUESTC_CODE,
                                    I.SPIC_TYPE,
                                    I.SPIC_REV,
                                    I.SPIC_SEQ,
                                    I.SPIC_FILENAME
                            FROM SLEC_TRANS_ATTACH I
                           WHERE I.SPIC_NO = :2
                             AND I.SPIC_EMPLOYEE_ID = :3) `;
            await connect.execute(query, [P_SUP_COPY, P_SLEC_NO, P_SUP_EMP]);
            await copyAttachFliePG(P_SUP_COPY, P_SLEC_NO, P_SUP_EMP);


            query = ``;
            query = ` UPDATE SLEC_TRANS_SUPERVISOR T
                         SET T.SLECD_STATUS = '50',
                            T.SLECD_ACTUAL_SCORE = (SELECT I.SLECD_ACTUAL_SCORE FROM SLEC_TRANS_SUPERVISOR I WHERE I.SLECD_NO = T.SLECD_NO AND I.SLECD_EMPLOYEE_ID = :1)
                       WHERE T.SLECD_NO = :2
                         AND T.SLECD_EMPLOYEE_ID = :3 `;
            await connect.execute(query, [P_SUP_EMP, P_SLEC_NO, P_SUP_COPY]);

            if (EmpID === '') {
                EmpID = P_SUP_COPY;
            } else {
                EmpID = EmpID + ',' + P_SUP_COPY;
            }
        }

        STS_HEADER = await GetStatusHeader_Copy(P_SLEC_NO, EmpID);

        query = ``;
        query = ` UPDATE SLEC_TRANS_HEADER T
                     SET T.SLECH_STATUS = :1
                   WHERE T.SLECH_NO = :2 `;
        await connect.execute(query, [STS_HEADER, P_SLEC_NO]);

        await connect.commit();
        res.status(200).send(STS_HEADER);

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

module.exports.getFileCheckPointPG = async function (req, res) {
    const client = new Client(pgGC);
    client.connect();
    try {
        const query = ` SELECT T.SPIC_SEQ, T.SPIC_FILENAME , T.SPIC_FILE_BINARY
                          FROM "GC".SLEC_TRANS_ATTACH T
                         WHERE T.SPIC_NO = 'A1-24-000182'
                           AND T.SPIC_EMPLOYEE_ID = '5002684'
                           AND T.SPIC_TYPE = 'TY003' 
                           AND T.SPIC_QUESTC_CODE = '3'
                         ORDER BY CAST(T.SPIC_SEQ AS INTEGER) `;
        const { rows } = await client.query(query);
        const convertedRows = rows.map(row => {
            let typFile = 'IMG';

            const spName = row.spic_filename.split(".");
            if (spName.length > 0) {
                if (spName[spName.length - 1].toLowerCase() === 'jpg' ||
                    spName[spName.length - 1].toLowerCase() === 'png' ||
                    spName[spName.length - 1].toLowerCase() === 'jpeg' ||
                    spName[spName.length - 1].toLowerCase() === 'gif') {
                    typFile = 'IMG';
                } else {
                    typFile = 'FILE';
                }
            }

            return {
                SLEC_FILE_SEQ_D: row.spic_seq,
                SLEC_FILE_NAME_D: row.spic_filename,
                SLEC_FILE_B64_D: row.spic_file_binary ? Buffer.from(row.spic_file_binary).toString('base64') : null,
                SLEC_FILE_BL_D: null,
                SLEC_FILE_URL_D: null,
                SLEC_FILE_TYPE_D: typFile
            };
        });

        client.end();
        res.json(convertedRows);
    } catch (error) {
        client.end();
        console.error("Error querying PostgreSQL:", error.message);
        res.status(500).send({ error: error.message });
    }
};

async function getFileCheckPointPG_DB(P_SLEC_NO, P_EMP_ID, P_TYPE, P_CODE) {
    const client = new Client(pgGC);
    client.connect();
    try {
        const query = ` SELECT T.SPIC_SEQ, T.SPIC_FILENAME , T.SPIC_FILE_BINARY
                          FROM "GC".SLEC_TRANS_ATTACH T
                         WHERE T.SPIC_NO = $1
                           AND T.SPIC_EMPLOYEE_ID = $2
                           AND T.SPIC_TYPE = $3
                           AND T.SPIC_QUESTC_CODE = $4
                         ORDER BY CAST(T.SPIC_SEQ AS INTEGER) `;
        const { rows } = await client.query(query, [P_SLEC_NO, P_EMP_ID, P_TYPE, P_CODE]);
        const convertedRows = rows.map(row => {
            let typFile = 'IMG';

            const spName = row.spic_filename.split(".");
            if (spName.length > 0) {
                if (spName[spName.length - 1].toLowerCase() === 'jpg' ||
                    spName[spName.length - 1].toLowerCase() === 'png' ||
                    spName[spName.length - 1].toLowerCase() === 'jpeg' ||
                    spName[spName.length - 1].toLowerCase() === 'gif') {
                    typFile = 'IMG';
                } else {
                    typFile = 'FILE';
                }
            }

            return {
                SLEC_FILE_SEQ_D: row.spic_seq,
                SLEC_FILE_NAME_D: row.spic_filename,
                SLEC_FILE_B64_D: row.spic_file_binary ? Buffer.from(row.spic_file_binary).toString('base64') : null,
                SLEC_FILE_BL_D: null,
                SLEC_FILE_URL_D: null,
                SLEC_FILE_TYPE_D: typFile
            };
        });

        client.end();
        return convertedRows
    } catch (error) {
        client.end();
        console.error("Error querying PostgreSQL:", error.message);
        return [];
    }
};

module.exports.insertFileTest = async function (req, res) {
    const client = new Client(pgGC);
    try {
        await client.connect(); // เปลี่ยนเป็น await
        const JSList = req.body;
        connect = await ConnectOracleDB("GC");
        let query = ``;
        console.log(JSList)
        for (const item of JSList) {
            const { SPIC_NO, SPIC_EMPLOYEE_ID, SPIC_QUESTC_CODE, SPIC_TYPE, SPIC_REV, SPIC_SEQ, SPIC_FILENAME, SPIC_FILE_BINARY } = item;
            const buffer = Buffer.from(SPIC_FILE_BINARY, 'base64');
            console.log("Convert Base64 to Buffer Completed.");
            query = `INSERT INTO "GC".SLEC_TRANS_ATTACH
                                (SPIC_NO,
                                 SPIC_EMPLOYEE_ID,
                                 SPIC_QUESTC_CODE,
                                 SPIC_TYPE,
                                 SPIC_REV,
                                 SPIC_SEQ,
                                 SPIC_FILENAME,
                                 SPIC_FILE_BINARY)
                               VALUES
                                 ($1,
                                  $2,
                                  $3,
                                  $4,
                                  $5,
                                  $6,
                                  $7,
                                  $8)`;
            const result = await client.query(query, [
                SPIC_NO,
                SPIC_EMPLOYEE_ID,
                SPIC_QUESTC_CODE,
                SPIC_TYPE,         // แก้ไขตรงนี้ โดยลบพารามิเตอร์ซ้ำออก
                SPIC_REV,
                SPIC_SEQ,
                SPIC_FILENAME,
                buffer
            ]);
        }
        res.status(200).send('');
    } catch (error) {
        console.error("Error querying PostgreSQL:", error.message);
        res.status(500).send({ error: error.message });
    } finally {
        client.end(); // ย้าย client.end() มาไว้ที่ finally เพื่อให้ปิดการเชื่อมต่อไม่ว่าจะมี error หรือไม่
    }
};

async function delAttachFliePG(P_SLEC_NO, P_EMP_ID) {
    const client = new Client(pgGC);
    client.connect();
    try {
        const query = ` DELETE FROM "GC".SLEC_TRANS_ATTACH
                         WHERE SPIC_NO = $1
                           AND SPIC_EMPLOYEE_ID = $2 `;
        const result = await client.query(query, [P_SLEC_NO, P_EMP_ID]);
        client.end();
        return '';
    } catch (error) {
        client.end();
        console.error("Error querying PostgreSQL:", error.message);
        return '';
    }
};

async function insertAttachFliePG(SPIC_NO, SPIC_EMPLOYEE_ID, SPIC_QUESTC_CODE, SPIC_TYPE, SPIC_REV, SPIC_SEQ, SPIC_FILENAME, SPIC_FILE_BINARY) {
    const client = new Client(pgGC);
    try {
        await client.connect();
        connect = await ConnectOracleDB("GC");
        const buffer = Buffer.from(SPIC_FILE_BINARY, 'base64');
        let query = ``;
        query = `INSERT INTO "GC".SLEC_TRANS_ATTACH
                                (SPIC_NO,
                                 SPIC_EMPLOYEE_ID,
                                 SPIC_QUESTC_CODE,
                                 SPIC_TYPE,
                                 SPIC_REV,
                                 SPIC_SEQ,
                                 SPIC_FILENAME,
                                 SPIC_FILE_BINARY)
                               VALUES
                                 ($1,
                                  $2,
                                  $3,
                                  $4,
                                  $5,
                                  $6,
                                  $7,
                                  $8)`;
        const result = await client.query(query, [
            SPIC_NO,
            SPIC_EMPLOYEE_ID,
            SPIC_QUESTC_CODE,
            SPIC_TYPE,         // แก้ไขตรงนี้ โดยลบพารามิเตอร์ซ้ำออก
            SPIC_REV,
            SPIC_SEQ,
            SPIC_FILENAME,
            buffer
        ]);
        return '';
    } catch (error) {
        console.error("Error querying PostgreSQL:", error.message);
        return '';
    } finally {
        client.end(); // ย้าย client.end() มาไว้ที่ finally เพื่อให้ปิดการเชื่อมต่อไม่ว่าจะมี error หรือไม่
    }
};

async function copyAttachFliePG(P_SUP_COPY, P_SLEC_NO, P_SUP_EMP) {
    const client = new Client(pgGC);
    try {
        await client.connect();
        connect = await ConnectOracleDB("GC");
        let query = ``;
        query = ` INSERT INTO "GC".SLEC_TRANS_ATTACH
                (SPIC_NO,
                 SPIC_EMPLOYEE_ID,
                 SPIC_QUESTC_CODE,
                 SPIC_TYPE,
                 SPIC_REV,
                 SPIC_SEQ,
                 SPIC_FILENAME,
                 SPIC_FILE_BINARY)
         (SELECT C.SPIC_NO,
		       $1 AS SPIC_EMPLOYEE_ID,
			   C.SPIC_QUESTC_CODE,
			   C.SPIC_TYPE,
			   C.SPIC_REV,
			   C.SPIC_SEQ,
			   C.SPIC_FILENAME,
			   C.SPIC_FILE_BINARY 
		 FROM "GC".SLEC_TRANS_ATTACH C 
		WHERE C.SPIC_NO = $2 
		  AND C.SPIC_EMPLOYEE_ID = $3) `;
        const result = await client.query(query, [P_SUP_COPY, P_SLEC_NO, P_SUP_EMP]);
        return '';
    } catch (error) {
        console.error("Error querying PostgreSQL:", error.message);
        return '';
    } finally {
        client.end(); // ย้าย client.end() มาไว้ที่ finally เพื่อให้ปิดการเชื่อมต่อไม่ว่าจะมี error หรือไม่
    }
};