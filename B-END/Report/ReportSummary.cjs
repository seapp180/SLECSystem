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

module.exports.getSummaryRPT = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_SLEC_NO_FRM = req.query.P_SLEC_NO_FRM
        const P_SLEC_NO_TO = req.query.P_SLEC_NO_TO
        const P_CREATE_DATE_FRM = req.query.P_CREATE_DATE_FRM
        const P_CREATE_DATE_TO = req.query.P_CREATE_DATE_TO
        const P_CHECK_DATE_FRM = req.query.P_CHECK_DATE_FRM
        const P_CHECK_DATE_TO = req.query.P_CHECK_DATE_TO
        const P_CC_FRM = req.query.P_CC_FRM
        const P_CC_TO = req.query.P_CC_TO
        const P_EMP_FRM = req.query.P_EMP_FRM
        const P_EMP_TO = req.query.P_EMP_TO
        const P_MGR = req.query.P_MGR
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT H.SLECH_FACTORY AS SR_FAC_CODE, `;
        query += `        F.FACTORY_NAME AS SR_FAC_DESC, `;
        query += `        H.SLECH_NO AS SR_SLEC_NO, `;
        query += `        T.SLECD_EMPLOYEE_ID AS SR_EMP_ID, `;
        query += `        TRIM(TO_CHAR(NVL(T.SLECD_ACTUAL_SCORE,0)) || '/' || TO_CHAR(T.SLECD_FULL_SCORE)) AS SR_SCORE, `;
        query += `        H.SLECH_MGR_REFER AS SR_MGR, `;
        query += `        T.SLECD_EMPLOYEE_ID || ' : ' || U.ENAME || ' ' || U.ESURNAME AS SR_EMP, `;
        query += `        (SELECT REPLACE(TO_CHAR(WM_CONCAT(DISTINCT I.SLECR_INSPECTOR)), ',', '/') FROM SLEC_TRANS_ROUTING I WHERE I.SLECR_NO = T.SLECD_NO) AS SR_INSPECTOR, `; //CHR(10)
        query += `        T.SLECD_CC AS SR_CC, `;
        query += `        TO_CHAR(T.SLECD_CHECK_DATE,'YYYYMM') AS SR_MONTH_CODE, `;
        query += `        TO_CHAR(T.SLECD_CHECK_DATE,'MON YYYY') AS SR_MONTH_DESC, `;
        query += `        U.ENAME || ' ' || T.SLECD_EMPLOYEE_ID AS SR_EMP_DESC `;
        query += `   FROM SLEC_TRANS_SUPERVISOR T `;
        query += `  INNER JOIN SLEC_TRANS_HEADER H ON H.SLECH_NO = T.SLECD_NO `;
        query += `   LEFT JOIN CUSR.CU_FACTORY_M F ON F.FACTORY_CODE = H.SLECH_FACTORY `;
        query += `   LEFT JOIN CUSR.CU_USER_HUMANTRIX U ON U.EMPCODE = T.SLECD_EMPLOYEE_ID `;
        query += `  WHERE 1 = 1 `;
        //query += ` 	  AND H.SLECH_STATUS = '50'	`;
        query += `    AND (H.SLECH_FACTORY = '${P_FACTORY}' OR '${P_FACTORY}' IS NULL) `;
        query += `    AND (H.SLECH_NO >= '${P_SLEC_NO_FRM}' OR '${P_SLEC_NO_FRM}' IS NULL) `;
        query += `    AND (H.SLECH_NO <= '${P_SLEC_NO_TO}' OR '${P_SLEC_NO_TO}' IS NULL) `;
        query += `    AND (TO_CHAR(H.SLECH_CREATE_DATE,'YYYYMMDD') >= '${P_CREATE_DATE_FRM}' OR '${P_CREATE_DATE_FRM}' IS NULL) `;
        query += `    AND (TO_CHAR(H.SLECH_CREATE_DATE,'YYYYMMDD') <= '${P_CREATE_DATE_TO}' OR '${P_CREATE_DATE_TO}' IS NULL) `;
        query += `    AND (TO_CHAR(T.SLECD_CHECK_DATE,'YYYYMMDD') >= '${P_CHECK_DATE_FRM}' OR '${P_CHECK_DATE_FRM}' IS NULL) `;
        query += `    AND (TO_CHAR(T.SLECD_CHECK_DATE,'YYYYMMDD') <= '${P_CHECK_DATE_TO}' OR '${P_CHECK_DATE_TO}' IS NULL) `;
        query += `    AND (T.SLECD_CC >= '${P_CC_FRM}' OR '${P_CC_FRM}' IS NULL) `;
        query += `    AND (T.SLECD_CC <= '${P_CC_TO}' OR '${P_CC_TO}' IS NULL) `;
        query += `    AND (T.SLECD_EMPLOYEE_ID >= '${P_EMP_FRM}' OR '${P_EMP_FRM}' IS NULL) `;
        query += `    AND (T.SLECD_EMPLOYEE_ID <= '${P_EMP_TO}' OR '${P_EMP_TO}' IS NULL) `;
        query += `    AND (H.SLECH_MGR_REFER = '${P_MGR}' OR '${P_MGR}' IS NULL) `;
        query += `  ORDER BY H.SLECH_NO, T.SLECD_EMPLOYEE_ID `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = await Promise.all(result.rows.map(async (row) => {
            // let base64String = '';
            // if (row[10] === 'B') {
            //     base64String = await fileToBase64(row[12]);
            // }
            // let typFile = 'IMG';
            // if (row[12] !== null) {
            //     const spName = row[12].split(".");
            //     if (spName.length > 0) {
            //         if (spName[spName.length - 1].toLowerCase() === 'jpg' ||
            //             spName[spName.length - 1].toLowerCase() === 'png' ||
            //             spName[spName.length - 1].toLowerCase() === 'jpeg' ||
            //             spName[spName.length - 1].toLowerCase() === 'gif') {
            //             typFile = 'IMG';
            //         } else {
            //             typFile = 'FILE';
            //         }
            //     }
            // }

            return {
                SR_FAC_CODE: row[0],
                SR_FAC_DESC: row[1],
                SR_SLEC_NO: row[2],
                SR_EMP_ID: row[3],
                SR_SCORE: row[4],
                SR_MGR: row[5],
                SR_EMP: row[6],
                SR_INSPECTOR: row[7],
                SR_CC: row[8],
                SR_IS_OPEN: false,
                SR_MONTH_CODE: row[9],
                SR_MONTH_DESC: row[10],
                SR_EMP_DESC: row[11],
                SR_DETAIL: await getDetailScore(row[2], row[3])
            };
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};


async function getDetailScore(P_SLEC_NO, P_EMP_ID) {
    try {

        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT TP.TYPE_DESC AS SR_TYPE_POINT, `;
        query += `        T.SLFULL_SCORE AS SR_FULL_SCORE, `;
        query += `        (SELECT SUM(SC.SLECC_SCORE) `;
        query += `           FROM SLEC_TRANS_SUP_CHECKPOINT SC `;
        query += `          WHERE SC.SLECC_NO = S.SLECD_NO `;
        query += `            AND SC.SLECC_EMPLOYEE_ID = S.SLECD_EMPLOYEE_ID `;
        query += `            AND SC.SLECC_TYPE = T.SLFULL_TYPE) AS SR_ACTUAL_SCORE, `;
        query += `        DECODE((SELECT SUM(SC.SLECC_SCORE) `;
        query += `                 FROM SLEC_TRANS_SUP_CHECKPOINT SC `;
        query += `                WHERE SC.SLECC_NO = S.SLECD_NO `;
        query += `                  AND SC.SLECC_EMPLOYEE_ID = S.SLECD_EMPLOYEE_ID `;
        query += `                  AND SC.SLECC_TYPE = T.SLFULL_TYPE), `;
        query += `               0, `;
        query += `               0, `;
        query += `               ROUND((SELECT SUM(SC.SLECC_SCORE) `;
        query += `                        FROM SLEC_TRANS_SUP_CHECKPOINT SC `;
        query += `                       WHERE SC.SLECC_NO = S.SLECD_NO `;
        query += `                         AND SC.SLECC_EMPLOYEE_ID = S.SLECD_EMPLOYEE_ID `;
        query += `                         AND SC.SLECC_TYPE = T.SLFULL_TYPE) * 100 / `;
        query += `                     T.SLFULL_SCORE, `;
        query += `                     2)) AS SR_PERC `;
        query += `   FROM SLEC_TRANS_FULL_SCORE T `;
        query += `   LEFT JOIN SLEC_MSTR_TYPE_POINT TP `;
        query += `     ON TP.TYPE_CODE = T.SLFULL_TYPE `;
        query += `  INNER JOIN SLEC_TRANS_SUPERVISOR S `;
        query += `     ON S.SLECD_NO = T.SLFULL_NO `;
        query += `  WHERE T.SLFULL_NO = '${P_SLEC_NO}' `;
        query += `    AND S.SLECD_EMPLOYEE_ID = '${P_EMP_ID}' `;
        query += `  ORDER BY T.SLFULL_TYPE `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = result.rows.map(row => ({
            SR_TYPE_POINT: row[0],
            SR_FULL_SCORE: row[1],
            SR_ACTUAL_SCORE: row[2],
            SR_PERC: row[3]
        }));

        return data;

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return [];
    }
};

module.exports.getSummaryRPTExport = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_SLEC_NO_FRM = req.query.P_SLEC_NO_FRM
        const P_SLEC_NO_TO = req.query.P_SLEC_NO_TO
        const P_CREATE_DATE_FRM = req.query.P_CREATE_DATE_FRM
        const P_CREATE_DATE_TO = req.query.P_CREATE_DATE_TO
        const P_CHECK_DATE_FRM = req.query.P_CHECK_DATE_FRM
        const P_CHECK_DATE_TO = req.query.P_CHECK_DATE_TO
        const P_CC_FRM = req.query.P_CC_FRM
        const P_CC_TO = req.query.P_CC_TO
        const P_EMP_FRM = req.query.P_EMP_FRM
        const P_EMP_TO = req.query.P_EMP_TO
        const P_MGR = req.query.P_MGR
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT H.SLECH_FACTORY AS SR_FAC_CODE, `;
        query += `        F.FACTORY_NAME AS SR_FAC_DESC, `;
        query += `        H.SLECH_NO AS SR_SLEC_NO, `;
        query += `        T.SLECD_EMPLOYEE_ID AS SR_EMP_ID, `;
        query += `        TRIM(TO_CHAR(NVL(T.SLECD_ACTUAL_SCORE,0)) || '/' || TO_CHAR(T.SLECD_FULL_SCORE)) AS SR_SCORE, `;
        query += `        H.SLECH_MGR_REFER AS SR_MGR, `;
        query += `        T.SLECD_EMPLOYEE_ID || ' : ' || U.ENAME || ' ' || U.ESURNAME AS SR_EMP, `;
        query += `        (SELECT REPLACE(TO_CHAR(WM_CONCAT(DISTINCT I.SLECR_INSPECTOR)), ',', '/') FROM SLEC_TRANS_ROUTING I WHERE I.SLECR_NO = T.SLECD_NO) AS SR_INSPECTOR, `; //CHR(10)
        query += `        T.SLECD_CC AS SR_CC, `;
        query += `        TO_CHAR(T.SLECD_CHECK_DATE,'YYYYMM') AS SR_MONTH_CODE, `;
        query += `        TO_CHAR(T.SLECD_CHECK_DATE,'MON YYYY') AS SR_MONTH_DESC, `;
        query += `        U.ENAME || ' ' || T.SLECD_EMPLOYEE_ID AS SR_EMP_DESC, `;
        query += `        TRIM(TO_CHAR(T.SLECD_FULL_SCORE)) AS SR_FULL_SC, `;
        query += `        TRIM(TO_CHAR(NVL(T.SLECD_ACTUAL_SCORE,0))) AS SR_ACTUAL_SC `;
        query += `   FROM SLEC_TRANS_SUPERVISOR T `;
        query += `  INNER JOIN SLEC_TRANS_HEADER H ON H.SLECH_NO = T.SLECD_NO `;
        query += `   LEFT JOIN CUSR.CU_FACTORY_M F ON F.FACTORY_CODE = H.SLECH_FACTORY `;
        query += `   LEFT JOIN CUSR.CU_USER_HUMANTRIX U ON U.EMPCODE = T.SLECD_EMPLOYEE_ID `;
        query += `  WHERE 1 = 1 `;
        query += `    AND (H.SLECH_FACTORY = '${P_FACTORY}' OR '${P_FACTORY}' IS NULL) `;
        query += `    AND (H.SLECH_NO >= '${P_SLEC_NO_FRM}' OR '${P_SLEC_NO_FRM}' IS NULL) `;
        query += `    AND (H.SLECH_NO <= '${P_SLEC_NO_TO}' OR '${P_SLEC_NO_TO}' IS NULL) `;
        query += `    AND (TO_CHAR(H.SLECH_CREATE_DATE,'YYYYMMDD') >= '${P_CREATE_DATE_FRM}' OR '${P_CREATE_DATE_FRM}' IS NULL) `;
        query += `    AND (TO_CHAR(H.SLECH_CREATE_DATE,'YYYYMMDD') <= '${P_CREATE_DATE_TO}' OR '${P_CREATE_DATE_TO}' IS NULL) `;
        query += `    AND (TO_CHAR(T.SLECD_CHECK_DATE,'YYYYMMDD') >= '${P_CHECK_DATE_FRM}' OR '${P_CHECK_DATE_FRM}' IS NULL) `;
        query += `    AND (TO_CHAR(T.SLECD_CHECK_DATE,'YYYYMMDD') <= '${P_CHECK_DATE_TO}' OR '${P_CHECK_DATE_TO}' IS NULL) `;
        query += `    AND (T.SLECD_CC >= '${P_CC_FRM}' OR '${P_CC_FRM}' IS NULL) `;
        query += `    AND (T.SLECD_CC <= '${P_CC_TO}' OR '${P_CC_TO}' IS NULL) `;
        query += `    AND (T.SLECD_EMPLOYEE_ID >= '${P_EMP_FRM}' OR '${P_EMP_FRM}' IS NULL) `;
        query += `    AND (T.SLECD_EMPLOYEE_ID <= '${P_EMP_TO}' OR '${P_EMP_TO}' IS NULL) `;
        query += `    AND (H.SLECH_MGR_REFER = '${P_MGR}' OR '${P_MGR}' IS NULL) `;
        query += `  ORDER BY H.SLECH_NO, T.SLECD_EMPLOYEE_ID `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = await Promise.all(result.rows.map(async (row) => {

            return {
                FACTORY_NAME: row[1],
                FACTORY_CODE: row[0],
                SLEC_NO: row[2],
                SLEC_CC: row[8],
                SUPERVISOR: row[11],
                FULL_SCORE: row[12],
                ACTUAL_SCORE: row[13],
                INSPECTOR: row[7],
                MANAGER_REFER: row[5]
            };
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getDetailQuestion = async function (req, res) {
    try {
        const P_SUP = req.query.P_SUP
        const P_SLEC_NO = req.query.P_SLEC_NO
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += `	SELECT T.SLECH_NO AS SLEC_NO,	`;
        query += `	       S.SLECC_EMPLOYEE_ID || ' : ' || H.ENAME || ' ' || H.ESURNAME AS SUPERVISOR,	`;
        query += `	       S.SLECC_TYPE AS TYPE_CODE,	`;
        query += `	       TP.TYPE_DESC AS TYPE_DESC,	`;
        query += `	       S.SLECC_QUESTC_CODE AS QUEST_CODE,	`;
        query += `	       Q.SQUESTC_DESC_THAI AS QUEST_THAI,	`;
        query += `	       Q.SQUESTC_DESC_ENG AS QUEST_ENG,	`;
        query += `	       DECODE(S.SLECC_ASKWER,'A','Yes','No') AS SUPERVISOR_ASKWER,	`;
        query += `	       Q.SQUESTC_FULL_SCORE AS WEIGHT_SCORE,	`;
        query += `	       S.SLECC_SCORE        AS ACTUAL_SCORE,	`;
        query += `	       S.SLECC_COMMENT AS SUPERVISOR_COMMENT,	`;
        query += `	       CAST(TO_CHAR(T.SLECH_CREATE_DATE,'YYYYMM') AS INTEGER) AS SLEC_DATEFILE	`;
        query += `	  FROM SLEC_TRANS_HEADER T	`;
        query += `	 INNER JOIN SLEC_TRANS_SUP_CHECKPOINT S ON S.SLECC_NO = T.SLECH_NO	`;
        query += `	  LEFT JOIN CUSR.CU_USER_HUMANTRIX H ON H.EMPCODE = S.SLECC_EMPLOYEE_ID	`;
        query += `	 INNER JOIN SLEC_MSTR_TYPE_POINT TP ON TP.TYPE_CODE = S.SLECC_TYPE	`;
        query += `	 INNER JOIN SLEC_MSTR_QUES_CHECKPOINT Q ON Q.SQUESTC_CODE = S.SLECC_QUESTC_CODE AND Q.SQUESTC_TYPE = S.SLECC_TYPE AND Q.SQUESTC_REV = S.SLECC_REV	`;
        query += `	 WHERE T.SLECH_NO = '${P_SLEC_NO}'	`;
        query += `	   AND S.SLECC_EMPLOYEE_ID = '${P_SUP}'	`;
        query += `	 ORDER BY S.SLECC_EMPLOYEE_ID, S.SLECC_TYPE, CAST(S.SLECC_QUESTC_CODE AS INTEGER)	`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = await Promise.all(result.rows.map(async (row) => {
            let SLEC_FILE = null;
            if (row[11] > 202407) {
                SLEC_FILE = await getFileCheckPointPG_DB(P_SLEC_NO, P_SUP, row[2], row[4]);
            } else {
                SLEC_FILE = await getFileCheckPoint(P_SLEC_NO, P_SUP, row[2], row[4]);
            }

            return {
                SLEC_NO: row[0],
                SUPERVISOR: row[1],
                TYPE_CODE: row[2],
                TYPE_DESC: row[3],
                QUEST_CODE: row[4],
                QUEST_THAI: row[5],
                QUEST_ENG: row[6],
                SUPERVISOR_ASKWER: row[7],
                WEIGHT_SCORE: row[8],
                ACTUAL_SCORE: row[9],
                SUPERVISOR_COMMENT: row[10],
                SLEC_OPEN: false,
                SLEC_FILE : SLEC_FILE
                
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