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

async function getFileCheckPoint(P_SEQ, P_FILE_NAME) {
    let base64String = '';
    let typFile = 'IMG';

    try {
        base64String = await downloadFileFromFTP(P_FILE_NAME);

        const spName = P_FILE_NAME.split(".");
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

        return ({
            SLEC_FILE_SEQ: P_SEQ,
            SLEC_FILE_NAME: P_FILE_NAME,
            SLEC_FILE_B64: base64String,
            SLEC_FILE_BL: null,
            SLEC_FILE_URL: null,
            SLEC_FILE_TYPE: typFile
        })

    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return ({
            SLEC_FILE_SEQ: P_SEQ,
            SLEC_FILE_NAME: P_FILE_NAME,
            SLEC_FILE_B64: null,
            SLEC_FILE_BL: null,
            SLEC_FILE_URL: null,
            SLEC_FILE_TYPE: typFile
        })
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

async function getFileCheckPointPG_DB(P_SLEC_NO, P_EMP_ID, P_TYPE, P_CODE, P_SEQ, P_FILE_NAME) {
    let typFile = 'IMG';
    let data = null;
    const client = new Client(pgGC);
    client.connect();
    try {
        const query = ` SELECT T.SPIC_SEQ, T.SPIC_FILENAME , T.SPIC_FILE_BINARY
                          FROM "GC".SLEC_TRANS_ATTACH T
                         WHERE T.SPIC_NO = $1
                           AND T.SPIC_EMPLOYEE_ID = $2
                           AND T.SPIC_TYPE = $3
                           AND T.SPIC_QUESTC_CODE = $4
                           AND T.SPIC_SEQ = $5
                         ORDER BY CAST(T.SPIC_SEQ AS INTEGER) `;
        const { rows, rowCount } = await client.query(query, [P_SLEC_NO, P_EMP_ID, P_TYPE, P_CODE, P_SEQ]);
        if (rowCount > 0) {
            const row = rows[0];
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

            data = ({SLEC_FILE_SEQ: row.spic_seq,
                     SLEC_FILE_NAME: row.spic_filename,
                     SLEC_FILE_B64: row.spic_file_binary ? Buffer.from(row.spic_file_binary).toString('base64') : null,
                     SLEC_FILE_BL: null,
                     SLEC_FILE_URL: null,
                     SLEC_FILE_TYPE: typFile})

        } else {
            data = ({SLEC_FILE_SEQ: P_SEQ,
                     SLEC_FILE_NAME: P_FILE_NAME,
                     SLEC_FILE_B64: null,
                     SLEC_FILE_BL: null,
                     SLEC_FILE_URL: null,
                     SLEC_FILE_TYPE: typFile})
        }
        client.end();
        return data;
    } catch (error) {
        client.end();
        console.error("Error querying PostgreSQL:", error.message);
        return ({SLEC_FILE_SEQ: P_SEQ,
                 SLEC_FILE_NAME: P_FILE_NAME,
                 SLEC_FILE_B64: null,
                 SLEC_FILE_BL: null,
                 SLEC_FILE_URL: null,
                 SLEC_FILE_TYPE: typFile})
    }
};

module.exports.getDataFile = async function (req, res) {
    try {

        const P_SLEC_NO = req.query.P_SLEC_NO
        const P_SUP = req.query.P_SUP
        const P_TYPE = req.query.P_TYPE
        const P_QUEST = req.query.P_QUEST

        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += `	SELECT T.SPIC_NO AS F_SLEC_NO,	 `;
        query += `	       T.SPIC_EMPLOYEE_ID AS F_SUP_ID,	 `;
        query += `	       T.SPIC_TYPE AS F_TYPE_CODE,	 `;
        query += `	       T.SPIC_QUESTC_CODE AS F_QUEST_CODE,	 `;
        query += `	       T.SPIC_SEQ AS F_SEQ_FILE,	 `;
        query += `	       T.SPIC_FILENAME AS F_FILE_SERVER,	 `;
        query += `	       CAST(TRIM(TO_CHAR(H.SLECH_CREATE_DATE,'YYYYMM')) AS INTEGER) AS F_CREATE_DEATE	 `;
        query += `	  FROM SLEC_TRANS_ATTACH T	 `;
        query += `	  INNER JOIN SLEC_TRANS_HEADER H ON H.SLECH_NO = T.SPIC_NO	 `;
        query += `	 WHERE 1 = 1	 `;
        query += `	   AND T.SPIC_NO LIKE '${P_SLEC_NO}%'	 `;
        query += `	   AND T.SPIC_EMPLOYEE_ID LIKE '${P_SUP}%'	 `;
        query += `	   AND T.SPIC_TYPE LIKE '${P_TYPE}%'	 `;
        query += `	   AND T.SPIC_QUESTC_CODE LIKE '${P_QUEST}%'	 `;
        query += `	 ORDER BY T.SPIC_NO, T.SPIC_TYPE, T.SPIC_QUESTC_CODE, T.SPIC_EMPLOYEE_ID,T.SPIC_SEQ	 `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = await Promise.all(result.rows.map(async (row) => {
            let SLEC_FILE = null;
            if (row[6] > 202407) {
                SLEC_FILE = await getFileCheckPointPG_DB(row[0], row[1], row[2], row[3],row[4], row[5]);
            } else {
                SLEC_FILE = await getFileCheckPoint(row[4], row[5]);
            }

            return {
                F_SLEC_NO: row[0],
                F_SUP_ID: row[1],
                F_TYPE_CODE: row[2],
                F_QUEST_CODE: row[3],
                F_SEQ_FILE: row[4],
                F_FILE_SERVER: row[5],
                F_CREATE_DEATE: row[6],
                F_FILE: SLEC_FILE

            };
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.delfile = async function (req, res) {
    let connect;
    try {
        const P_SLEC_NO = req.query.P_SLEC_NO
        const P_SUP = req.query.P_SUP
        const P_TYPE = req.query.P_TYPE
        const P_QUEST = req.query.P_QUEST
        const P_SEQ = req.query.P_SEQ
        
        connect = await ConnectOracleDB("GC");
        let query = ``;
        query = ` DELETE FROM SLEC_TRANS_ATTACH T
                   WHERE T.SPIC_NO = :1
                     AND T.SPIC_EMPLOYEE_ID = :2
                     AND T.SPIC_TYPE = :2
                     AND T.SPIC_QUESTC_CODE = :4
                     AND T.SPIC_SEQ = :5 `;
        await connect.execute(query, [P_SLEC_NO, P_SUP, P_TYPE, P_QUEST, P_SEQ]);
        await delPG(P_SLEC_NO, P_SUP, P_TYPE, P_QUEST, P_SEQ);
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

async function delPG(P_SLEC_NO, P_SUP, P_TYPE, P_QUEST, P_SEQ) {
    const client = new Client(pgGC);
    try {
        await client.connect();
        connect = await ConnectOracleDB("GC");
        let query = ``;
        query = ` DELETE FROM "GC".SLEC_TRANS_ATTACH
                   WHERE SPIC_NO = $1
                     AND SPIC_EMPLOYEE_ID = $2
                     AND SPIC_TYPE = $3
                     AND SPIC_QUESTC_CODE = $4
                     AND SPIC_SEQ = $5 `;
        const result = await client.query(query, [P_SLEC_NO, P_SUP, P_TYPE, P_QUEST, P_SEQ]);
        return '';
    } catch (error) {
        console.error("Error querying PostgreSQL:", error.message);
        return '';
    } finally {
        client.end();
    }
};