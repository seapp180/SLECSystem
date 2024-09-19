const { ConnectOracleDB, DisconnectOracleDB } = require("../Common/DBconnection.cjs");

const oracledb = require("oracledb");
require("dotenv").config();

const { Buffer } = require('buffer');
const path = require('path');
const fs = require('fs');
const base64 = require('base-64');

module.exports.getCountSupByMGR = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const P_MGR = req.query.P_MGR
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += `  SELECT COUNT(DISTINCT TS.SLECD_EMPLOYEE_ID) AS COUNT_SUP `;
        query += `    FROM SLEC_TRANS_SUPERVISOR TS `;
        query += `   INNER JOIN SLEC_TRANS_HEADER HTS ON HTS.SLECH_NO = TS.SLECD_NO `;
        query += `   WHERE 1 = 1 `;
        query += `     AND HTS.SLECH_STATUS = '50' `;
        query += `     AND HTS.SLECH_FACTORY = '${P_FACTORY}' `;
        query += `     AND TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}' `;
        query += `     AND HTS.SLECH_MGR_REFER = '${P_MGR}' `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        res.json(result.rows[0][0]);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getMGRForTable = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const P_MGR = req.query.P_MGR
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` 	SELECT T.SLFULL_TYPE AS RFT_TYPE_CODE,	`;
        query += ` 	       TP.TYPE_DESC AS RFT_TYPE_DESC,	`;
        query += ` 	       SUM(T.SLFULL_SCORE) / COUNT(T.SLFULL_NO) AS RFT_SCORE_FULL,	`;
        query += ` 	       A.RFT_SCORE_ACTUAL,	`;
        query += ` 	       ROUND((A.RFT_SCORE_ACTUAL * 100) /	`;
        query += ` 	                          (SUM(T.SLFULL_SCORE) / COUNT(T.SLFULL_NO)),	`;
        query += ` 	                          2)AS RFT_SCORE_PERC	`;
        query += ` 	  FROM SLEC_TRANS_FULL_SCORE T	`;
        query += ` 	 INNER JOIN SLEC_TRANS_HEADER H	`;
        query += ` 	    ON H.SLECH_NO = T.SLFULL_NO	`;
        query += ` 	  LEFT JOIN SLEC_MSTR_TYPE_POINT TP	`;
        query += ` 	    ON TP.TYPE_CODE = T.SLFULL_TYPE	`;
        query += ` 	  LEFT JOIN (SELECT C.SLECC_TYPE,	`;
        query += ` 	                    ROUND(SUM(C.SLECC_SCORE) / NEM.COUNT_SUP, 2) AS RFT_SCORE_ACTUAL	`;
        query += ` 	               FROM SLEC_TRANS_SUP_CHECKPOINT C	`;
        query += ` 	              INNER JOIN SLEC_TRANS_HEADER HC	`;
        query += ` 	                 ON HC.SLECH_NO = C.SLECC_NO	`;
        query += ` 	                AND TO_CHAR(HC.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += ` 	               LEFT JOIN (SELECT COUNT(TS.SLECD_EMPLOYEE_ID) AS COUNT_SUP,	`;
        query += ` 	                                TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM') AS CK_DATE	`;
        query += ` 	                           FROM SLEC_TRANS_SUPERVISOR TS	`;
        query += ` 	                          INNER JOIN SLEC_TRANS_HEADER HTS	`;
        query += ` 	                             ON HTS.SLECH_NO = TS.SLECD_NO	`;
        query += ` 	                          WHERE 1 = 1	`;
        query += ` 	                            AND HTS.SLECH_STATUS = '50'	`;
        query += ` 	                            AND HTS.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                            AND TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM') =	`;
        query += ` 	                                '${P_MONTH}'	`;
        query += `                              AND HTS.SLECH_MGR_REFER = '${P_MGR}' `;
        query += ` 	                          GROUP BY TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM')) NEM	`;
        query += ` 	                 ON NEM.CK_DATE = '${P_MONTH}'	`;
        query += ` 	              WHERE 1 = 1	`;
        query += ` 	                AND HC.SLECH_STATUS = '50'	`;
        query += ` 	                AND HC.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += `                  AND HC.SLECH_MGR_REFER = '${P_MGR}' `;
        query += ` 	              GROUP BY C.SLECC_TYPE, NEM.COUNT_SUP) A	`;
        query += ` 	    ON A.SLECC_TYPE = T.SLFULL_TYPE	`;
        query += ` 	 WHERE 1 = 1	`;
        query += ` 	   AND H.SLECH_STATUS = '50'	`;
        query += ` 	   AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	   AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += `     AND H.SLECH_MGR_REFER = '${P_MGR}' `;
        query += ` 	 GROUP BY T.SLFULL_TYPE, TP.TYPE_DESC, A.RFT_SCORE_ACTUAL	`;
        query += ` 	UNION	`;
        query += ` 	SELECT DISTINCT 'TY999' AS RFT_TYPE_CODE,	`;
        query += ` 	                'SUM' AS RFT_TYPE_DESC,	`;
        query += ` 	                SUM(S.RFT_SCORE_FULL) AS RFT_SCORE_FULL,	`;
        query += ` 	                SUM(S.RFT_SCORE_ACTUAL) AS RFT_SCORE_ACTUAL,	`;
        query += ` 	                ROUND((SUM(S.RFT_SCORE_ACTUAL) * 100) /	`;
        query += ` 	                                   SUM(S.RFT_SCORE_FULL),	`;
        query += ` 	                                   2) AS RFT_SCORE_PERC	`;
        query += ` 	  FROM (SELECT T.SLFULL_TYPE AS RFT_TYPE_CODE,	`;
        query += ` 	               TP.TYPE_DESC AS RFT_TYPE_DESC,	`;
        query += ` 	               SUM(T.SLFULL_SCORE) / COUNT(T.SLFULL_NO) AS RFT_SCORE_FULL,	`;
        query += ` 	               A.RFT_SCORE_ACTUAL,	`;
        query += ` 	               TRIM(TO_CHAR(ROUND((A.RFT_SCORE_ACTUAL * 100) /	`;
        query += ` 	                                  (SUM(T.SLFULL_SCORE) / COUNT(T.SLFULL_NO)),	`;
        query += ` 	                                  2))) || '%' AS RFT_SCORE_PERC	`;
        query += ` 	          FROM SLEC_TRANS_FULL_SCORE T	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER H	`;
        query += ` 	            ON H.SLECH_NO = T.SLFULL_NO	`;
        query += ` 	          LEFT JOIN SLEC_MSTR_TYPE_POINT TP	`;
        query += ` 	            ON TP.TYPE_CODE = T.SLFULL_TYPE	`;
        query += ` 	          LEFT JOIN (SELECT C.SLECC_TYPE,	`;
        query += ` 	                           ROUND(SUM(C.SLECC_SCORE) / NEM.COUNT_SUP, 2) AS RFT_SCORE_ACTUAL	`;
        query += ` 	                      FROM SLEC_TRANS_SUP_CHECKPOINT C	`;
        query += ` 	                     INNER JOIN SLEC_TRANS_HEADER HC	`;
        query += ` 	                        ON HC.SLECH_NO = C.SLECC_NO	`;
        query += ` 	                       AND TO_CHAR(HC.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += ` 	                      LEFT JOIN (SELECT COUNT(TS.SLECD_EMPLOYEE_ID) AS COUNT_SUP,	`;
        query += ` 	                                       TO_CHAR(HTS.SLECH_CHECK_DATE,	`;
        query += ` 	                                               'YYYYMM') AS CK_DATE	`;
        query += ` 	                                  FROM SLEC_TRANS_SUPERVISOR TS	`;
        query += ` 	                                 INNER JOIN SLEC_TRANS_HEADER HTS	`;
        query += ` 	                                    ON HTS.SLECH_NO = TS.SLECD_NO	`;
        query += ` 	                                 WHERE 1 = 1	`;
        query += ` 	                                   AND HTS.SLECH_STATUS = '50'	`;
        query += ` 	                                   AND HTS.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                                   AND TO_CHAR(HTS.SLECH_CHECK_DATE,	`;
        query += ` 	                                               'YYYYMM') = '${P_MONTH}'	`;
        query += `                                     AND HTS.SLECH_MGR_REFER = '${P_MGR}' `;
        query += ` 	                                 GROUP BY TO_CHAR(HTS.SLECH_CHECK_DATE,	`;
        query += ` 	                                                  'YYYYMM')) NEM	`;
        query += ` 	                        ON NEM.CK_DATE = '${P_MONTH}'	`;
        query += ` 	                     WHERE 1 = 1	`;
        query += ` 	                       AND HC.SLECH_STATUS = '50'	`;
        query += ` 	                       AND HC.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += `                         AND HC.SLECH_MGR_REFER = '${P_MGR}' `;
        query += ` 	                     GROUP BY C.SLECC_TYPE, NEM.COUNT_SUP) A	`;
        query += ` 	            ON A.SLECC_TYPE = T.SLFULL_TYPE	`;
        query += ` 	         WHERE 1 = 1	`;
        query += ` 	           AND H.SLECH_STATUS = '50'	`;
        query += ` 	           AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += `             AND H.SLECH_MGR_REFER = '${P_MGR}' `;
        query += ` 	         GROUP BY T.SLFULL_TYPE, TP.TYPE_DESC, A.RFT_SCORE_ACTUAL	`;
        query += ` 	         ORDER BY T.SLFULL_TYPE) S	`;
        query += ` 	 ORDER BY RFT_TYPE_CODE	`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = await Promise.all(result.rows.map(async (row) => {

            return {
                RFT_TYPE_CODE: row[0],
                RFT_TYPE_DESC: row[1],
                RFT_SCORE_FULL: row[2],
                RFT_SCORE_ACTUAL: row[3],
                RFT_SCORE_PERC: row[4]
            };
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getMGRForChartPic = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const P_MGR = req.query.P_MGR
        const P_RPT_TYPE = req.query.P_RPT_TYPE

        let ListMain ;
        if (P_RPT_TYPE === 'MIN') {
            ListMain = await getDataForChartPic_Min(P_FACTORY, P_MONTH, P_MGR)
        } else {
            ListMain = await getDataForChartPic(P_FACTORY, P_MONTH, P_MGR)
        }
        

        const labels = ListMain.map(item => item.RFT_TYPE_DESC);
        const dataValues = ListMain.map(item => item.RFT_SCORE_PERC);

        const data = {
            labels: labels,
            datasets: [
                {
                    label: P_MGR,
                    data: dataValues,
                    backgroundColor: 'rgba(76, 76, 225, 0.3)',
                    borderColor: '#4C4CE1',
                    borderWidth: 2,
                },
            ],
        };

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

async function getDataForChartPic(P_FACTORY, P_MONTH, P_MGR) {
    try {

        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` 	SELECT T.SLFULL_TYPE AS RFT_TYPE_CODE,	`;
        query += ` 	       TP.TYPE_DESC AS RFT_TYPE_DESC,	`;
        query += ` 	       SUM(T.SLFULL_SCORE) / COUNT(T.SLFULL_NO) AS RFT_SCORE_FULL,	`;
        query += ` 	       A.RFT_SCORE_ACTUAL,	`;
        query += ` 	       ROUND((A.RFT_SCORE_ACTUAL * 100) /	`;
        query += ` 	                          (SUM(T.SLFULL_SCORE) / COUNT(T.SLFULL_NO)),	`;
        query += ` 	                          2)AS RFT_SCORE_PERC	`;
        query += ` 	  FROM SLEC_TRANS_FULL_SCORE T	`;
        query += ` 	 INNER JOIN SLEC_TRANS_HEADER H	`;
        query += ` 	    ON H.SLECH_NO = T.SLFULL_NO	`;
        query += ` 	  LEFT JOIN SLEC_MSTR_TYPE_POINT TP	`;
        query += ` 	    ON TP.TYPE_CODE = T.SLFULL_TYPE	`;
        query += ` 	  LEFT JOIN (SELECT C.SLECC_TYPE,	`;
        query += ` 	                    ROUND(SUM(C.SLECC_SCORE) / NEM.COUNT_SUP, 2) AS RFT_SCORE_ACTUAL	`;
        query += ` 	               FROM SLEC_TRANS_SUP_CHECKPOINT C	`;
        query += ` 	              INNER JOIN SLEC_TRANS_HEADER HC	`;
        query += ` 	                 ON HC.SLECH_NO = C.SLECC_NO	`;
        query += ` 	                AND TO_CHAR(HC.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += ` 	               LEFT JOIN (SELECT COUNT(TS.SLECD_EMPLOYEE_ID) AS COUNT_SUP,	`;
        query += ` 	                                TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM') AS CK_DATE	`;
        query += ` 	                           FROM SLEC_TRANS_SUPERVISOR TS	`;
        query += ` 	                          INNER JOIN SLEC_TRANS_HEADER HTS	`;
        query += ` 	                             ON HTS.SLECH_NO = TS.SLECD_NO	`;
        query += ` 	                          WHERE 1 = 1	`;
        query += ` 	                            AND HTS.SLECH_STATUS = '50'	`;
        query += ` 	                            AND HTS.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += `                              AND HTS.SLECH_MGR_REFER = '${P_MGR}' `;
        query += ` 	                            AND TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM') =	`;
        query += ` 	                                '${P_MONTH}'	`;
        query += ` 	                          GROUP BY TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM')) NEM	`;
        query += ` 	                 ON NEM.CK_DATE = '${P_MONTH}'	`;
        query += ` 	              WHERE 1 = 1	`;
        query += ` 	                AND HC.SLECH_STATUS = '50'	`;
        query += ` 	                AND HC.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += `                  AND HC.SLECH_MGR_REFER = '${P_MGR}' `;
        query += ` 	              GROUP BY C.SLECC_TYPE, NEM.COUNT_SUP) A	`;
        query += ` 	    ON A.SLECC_TYPE = T.SLFULL_TYPE	`;
        query += ` 	 WHERE 1 = 1	`;
        query += ` 	   AND H.SLECH_STATUS = '50'	`;
        query += ` 	   AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	   AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += `     AND H.SLECH_MGR_REFER = '${P_MGR}' `;
        query += ` 	 GROUP BY T.SLFULL_TYPE, TP.TYPE_DESC, A.RFT_SCORE_ACTUAL	`;
        query += ` 	 ORDER BY RFT_TYPE_CODE	`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        if (!result.rows || !Array.isArray(result.rows) || result.rows.length === 0) {
            return [];
        } else {
            const data = await Promise.all(result.rows.map(async (row) => {

                return {
                    RFT_TYPE_CODE: row[0],
                    RFT_TYPE_DESC: row[1],
                    RFT_SCORE_FULL: row[2],
                    RFT_SCORE_ACTUAL: row[3],
                    RFT_SCORE_PERC: row[4]
                };
            }));

            return data;
        }


    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return [];
    }
};

async function getDataSupMGRForChartColumn(P_FACTORY, P_MONTH, P_MGR) {
    try {

        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += `   SELECT TS.SLECD_EMPLOYEE_ID || ' : ' || HT.ENAME || ' ' || HT.ESURNAME AS SLECD_EMPLOYEE_ID,SUM(TS.SLECD_ACTUAL_SCORE) / COUNT(TS.SLECD_EMPLOYEE_ID) AS SLECD_ACTUAL_SCORE `;
        query += ` 	  FROM SLEC_TRANS_SUPERVISOR TS `;
        query += ` 	 INNER JOIN SLEC_TRANS_HEADER HTS ON HTS.SLECH_NO = TS.SLECD_NO `;
        query += ` 	  LEFT JOIN CUSR.CU_USER_HUMANTRIX HT ON HT.EMPCODE = TS.SLECD_EMPLOYEE_ID	`;
        query += ` 	 WHERE 1 = 1 `;
        query += ` 	   AND HTS.SLECH_STATUS = '50' `;
        query += ` 	   AND HTS.SLECH_FACTORY = '${P_FACTORY}' `;
        query += ` 	   AND TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}' `;
        query += `     AND HTS.SLECH_MGR_REFER = '${P_MGR}' `;
        query += ` 	   GROUP BY TS.SLECD_EMPLOYEE_ID, HT.ENAME, HT.ESURNAME `;
        query += ` 	 ORDER BY TS.SLECD_EMPLOYEE_ID `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        if (!result.rows || !Array.isArray(result.rows) || result.rows.length === 0) {
            return [];
        } else {
            const data = await Promise.all(result.rows.map(async (row) => {

                return {
                    RFT_SUP: row[0],
                    RFT_ACTUAL_SCORE: row[1]
                };
            }));

            return data;
        }


    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return [];
    }
};

module.exports.getFacSupMGRForChartColumn = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const P_MGR = req.query.P_MGR
        const P_RPT_TYPE = req.query.P_RPT_TYPE

        let ListMain ;
        if (P_RPT_TYPE === 'MIN') {
            ListMain = await getDataSupMGRForChartColumn_Min(P_FACTORY, P_MONTH, P_MGR)
        } else {
            ListMain = await getDataSupMGRForChartColumn(P_FACTORY, P_MONTH, P_MGR)
        }


        const labels = ListMain.map(item => item.RFT_SUP);
        const dataValues = ListMain.map(item => item.RFT_ACTUAL_SCORE);

        const data = {
            labels: labels,
            datasets: [
                {
                    label: 'Actual Scores',
                    data: dataValues,
                    backgroundColor: 'rgba(193, 225, 76, 1)', // สีพื้นหลังของคอลัมน์
                    borderColor: 'rgba(193, 225, 76, 1)', // สีเส้นขอบของคอลัมน์
                    borderWidth: 1,
                },
            ],
        };


        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getSupBForMGR = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const P_MGR = req.query.P_MGR
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` 	SELECT T.SLECC_EMPLOYEE_ID AS RMGR_EMP_ID,	`;
        query += ` 	       TP.TYPE_DESC        AS RMGR_TYPE,	`;
        query += ` 	       T.SLECC_QUESTC_CODE AS RMGR_QUEST_CODE,	`;
        query += ` 	       Q.SQUESTC_DESC_ENG  AS RMGR_QUESTION_ENG,	`;
        query += ` 	       Q.SQUESTC_DESC_THAI AS RMGR_QUESTION_TH,	`;
        query += ` 	       T.SLECC_COMMENT     AS RMGR_COMMENT,	`;
        query += ` 	       (SELECT COUNT(A.SPIC_QUESTC_CODE) FROM SLEC_TRANS_ATTACH A WHERE A.SPIC_NO = T.SLECC_NO AND A.SPIC_EMPLOYEE_ID = T.SLECC_EMPLOYEE_ID AND A.SPIC_QUESTC_CODE = T.SLECC_QUESTC_CODE AND A.SPIC_TYPE = T.SLECC_TYPE AND A.SPIC_REV = T.SLECC_REV) AS RMGR_COUNT_FILE,	`;
        query += ` 	       T.SLECC_TYPE       AS RMGR_TYPE_CODE,	`;
        query += ` 	       T.SLECC_NO       AS RMGR_SLEC_NO	`;
        query += ` 	  FROM SLEC_TRANS_SUP_CHECKPOINT T	`;
        query += ` 	 INNER JOIN SLEC_TRANS_HEADER H ON H.SLECH_NO = T.SLECC_NO	`;
        query += ` 	  LEFT JOIN SLEC_MSTR_TYPE_POINT TP ON TP.TYPE_CODE = T.SLECC_TYPE	`;
        query += ` 	  LEFT JOIN SLEC_MSTR_QUES_CHECKPOINT Q ON Q.SQUESTC_CODE = T.SLECC_QUESTC_CODE AND Q.SQUESTC_TYPE = T.SLECC_TYPE AND Q.SQUESTC_REV = T.SLECC_REV  	`;
        query += ` 	 WHERE 1 = 1	`;
        query += ` 	   AND T.SLECC_ASKWER = 'B'	`;
        query += ` 	   AND T.SLECC_TYPE = 'TY001'	`;
        query += ` 	   AND H.SLECH_STATUS = '50'	`;
        query += ` 	   AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	   AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += ` 	   AND H.SLECH_MGR_REFER = '${P_MGR}'	`;
        query += ` 	ORDER BY T.SLECC_QUESTC_CODE,T.SLECC_NO ASC	`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = await Promise.all(result.rows.map(async (row) => {
            //let SLEC_FILE = await getFileCheckPoint(row[8], row[0], row[7], row[2])
            let SLEC_FILE = [];
            return {
                RMGR_EMP_ID: row[0],
                RMGR_TYPE: row[1],
                RMGR_QUEST_CODE: row[2],
                RMGR_QUESTION_ENG: row[3],
                RMGR_QUESTION_TH: row[4],
                RMGR_COMMENT: row[5],
                RMGR_COUNT_FILE: row[6],
                RMGR_FILE: SLEC_FILE
            };
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getSupBForMGRCountSlecno = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const P_MGR = req.query.P_MGR
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` 	SELECT T.SLECD_EMPLOYEE_ID || ' : ' || U.ENAME || ' ' || U.ESURNAME AS RS_EMP,	`;
        query += ` 	       ROUND(SUM(T.SLECD_ACTUAL_SCORE) / COUNT(T.SLECD_NO),2) AS RS_SCORE,	`;
        query += ` 	       COUNT(T.SLECD_NO) AS RS_COUNT_SLEC	`;
        query += ` 	  FROM SLEC_TRANS_SUPERVISOR T	`;
        query += ` 	 INNER JOIN SLEC_TRANS_HEADER H ON H.SLECH_NO = T.SLECD_NO	`;
        query += ` 	  LEFT JOIN CUSR.CU_USER_HUMANTRIX U ON U.EMPCODE = T.SLECD_EMPLOYEE_ID	`;
        query += ` 	 WHERE 1 = 1	`;
        query += ` 	   AND H.SLECH_STATUS = '50'	`;
        query += ` 	   AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	   AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += ` 	   AND H.SLECH_MGR_REFER = '${P_MGR}'	`;
        query += ` 	 GROUP BY T.SLECD_EMPLOYEE_ID, U.ENAME, U.ESURNAME	`;
        query += ` 	 ORDER BY T.SLECD_EMPLOYEE_ID	`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = await Promise.all(result.rows.map(async (row) => {

            return {
                RS_EMP: row[0],
                RS_SCORE: row[1],
                RS_COUNT_SLEC: row[2]
            };
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getMGRForTable_Min = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const P_MGR = req.query.P_MGR
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` 	SELECT T.SLFULL_TYPE AS RFT_TYPE_CODE,	`;
        query += ` 	       TP.TYPE_DESC AS RFT_TYPE_DESC,	`;
        query += ` 	       SUM(T.SLFULL_SCORE) / COUNT(T.SLFULL_NO) AS RFT_SCORE_FULL,	`;
        query += ` 	       A.RFT_SCORE_ACTUAL,	`;
        query += ` 	       ROUND((A.RFT_SCORE_ACTUAL * 100) /	`;
        query += ` 	             (SUM(T.SLFULL_SCORE) / COUNT(T.SLFULL_NO)),	`;
        query += ` 	             2) AS RFT_SCORE_PERC	`;
        query += ` 	  FROM SLEC_TRANS_FULL_SCORE T	`;
        query += ` 	 INNER JOIN SLEC_TRANS_HEADER H	`;
        query += ` 	    ON H.SLECH_NO = T.SLFULL_NO	`;
        query += ` 	  LEFT JOIN SLEC_MSTR_TYPE_POINT TP	`;
        query += ` 	    ON TP.TYPE_CODE = T.SLFULL_TYPE	`;
        query += ` 	  LEFT JOIN (SELECT TD.SLECC_TYPE,	`;
        query += ` 	                    (SELECT SUM(DECODE(SUM(C.SLECC_SCORE) /	`;
        query += ` 	                                       COUNT(C.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                                       QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                       QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                       0)) AS RFT_SCORE_ACTUAL	`;
        query += ` 	                     	`;
        query += ` 	                       FROM SLEC_TRANS_SUP_CHECKPOINT C	`;
        query += ` 	                      INNER JOIN SLEC_TRANS_HEADER HC	`;
        query += ` 	                         ON HC.SLECH_NO = C.SLECC_NO	`;
        query += ` 	                      INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	                         ON QC.SQUESTC_SEQ_QUESTION = C.SLECC_SEQ_QUESTION	`;
        query += ` 	                      WHERE 1 = 1	`;
        query += ` 	                        AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	                        AND HC.SLECH_STATUS = HD.SLECH_STATUS	`;
        query += ` 	                        AND HC.SLECH_FACTORY = HD.SLECH_FACTORY	`;
        query += ` 	                        AND TO_CHAR(HC.SLECH_CHECK_DATE, 'YYYYMM') =	`;
        query += ` 	                            TO_CHAR(HD.SLECH_CHECK_DATE, 'YYYYMM')	`;
        query += ` 	                        AND C.SLECC_TYPE = TD.SLECC_TYPE	`;
        query += ` 	                        AND HC.SLECH_MGR_REFER = HD.SLECH_MGR_REFER	`;
        query += ` 	                      GROUP BY C.SLECC_SEQ_QUESTION, QC.SQUESTC_FULL_SCORE) AS RFT_SCORE_ACTUAL	`;
        query += ` 	               FROM SLEC_TRANS_SUP_CHECKPOINT TD	`;
        query += ` 	              INNER JOIN SLEC_TRANS_HEADER HD	`;
        query += ` 	                 ON HD.SLECH_NO = TD.SLECC_NO	`;
        query += ` 	              WHERE 1 = 1	`;
        query += ` 	                AND HD.SLECH_STATUS = '50'	`;
        query += ` 	                AND HD.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                AND TO_CHAR(HD.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += `                  AND HD.SLECH_MGR_REFER = '${P_MGR}' `;
        query += ` 	              GROUP BY TD.SLECC_TYPE,	`;
        query += ` 	                       HD.SLECH_STATUS,	`;
        query += ` 	                       HD.SLECH_FACTORY,	`;
        query += ` 	                       TO_CHAR(HD.SLECH_CHECK_DATE, 'YYYYMM'),	`;
        query += ` 	                       HD.SLECH_MGR_REFER	`;
        query += ` 	              ORDER BY TD.SLECC_TYPE) A	`;
        query += ` 	    ON A.SLECC_TYPE = T.SLFULL_TYPE	`;
        query += ` 	 WHERE 1 = 1	`;
        query += ` 	   AND H.SLECH_STATUS = '50'	`;
        query += ` 	   AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	   AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += `     AND H.SLECH_MGR_REFER = '${P_MGR}' `;
        query += ` 	 GROUP BY T.SLFULL_TYPE, TP.TYPE_DESC, A.RFT_SCORE_ACTUAL	`;
        query += ` 	UNION	`;
        query += ` 	SELECT DISTINCT 'TY999' AS RFT_TYPE_CODE,	`;
        query += ` 	                'SUM' AS RFT_TYPE_DESC,	`;
        query += ` 	                SUM(S.RFT_SCORE_FULL) AS RFT_SCORE_FULL,	`;
        query += ` 	                SUM(S.RFT_SCORE_ACTUAL) AS RFT_SCORE_ACTUAL,	`;
        query += ` 	                ROUND((SUM(S.RFT_SCORE_ACTUAL) * 100) /	`;
        query += ` 	                      SUM(S.RFT_SCORE_FULL),	`;
        query += ` 	                      2) AS RFT_SCORE_PERC	`;
        query += ` 	  FROM (SELECT T.SLFULL_TYPE AS RFT_TYPE_CODE,	`;
        query += ` 	               TP.TYPE_DESC AS RFT_TYPE_DESC,	`;
        query += ` 	               SUM(T.SLFULL_SCORE) / COUNT(T.SLFULL_NO) AS RFT_SCORE_FULL,	`;
        query += ` 	               A.RFT_SCORE_ACTUAL,	`;
        query += ` 	               ROUND((A.RFT_SCORE_ACTUAL * 100) /	`;
        query += ` 	                     (SUM(T.SLFULL_SCORE) / COUNT(T.SLFULL_NO)),	`;
        query += ` 	                     2) AS RFT_SCORE_PERC	`;
        query += ` 	          FROM SLEC_TRANS_FULL_SCORE T	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER H	`;
        query += ` 	            ON H.SLECH_NO = T.SLFULL_NO	`;
        query += ` 	          LEFT JOIN SLEC_MSTR_TYPE_POINT TP	`;
        query += ` 	            ON TP.TYPE_CODE = T.SLFULL_TYPE	`;
        query += ` 	          LEFT JOIN (SELECT TD.SLECC_TYPE,	`;
        query += ` 	                           (SELECT SUM(DECODE(SUM(C.SLECC_SCORE) /	`;
        query += ` 	                                              COUNT(C.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                                              QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                              QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                              0)) AS RFT_SCORE_ACTUAL	`;
        query += ` 	                            	`;
        query += ` 	                              FROM SLEC_TRANS_SUP_CHECKPOINT C	`;
        query += ` 	                             INNER JOIN SLEC_TRANS_HEADER HC	`;
        query += ` 	                                ON HC.SLECH_NO = C.SLECC_NO	`;
        query += ` 	                             INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	                                ON QC.SQUESTC_SEQ_QUESTION =	`;
        query += ` 	                                   C.SLECC_SEQ_QUESTION	`;
        query += ` 	                             WHERE 1 = 1	`;
        query += ` 	                               AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	                               AND HC.SLECH_STATUS = HD.SLECH_STATUS	`;
        query += ` 	                               AND HC.SLECH_FACTORY = HD.SLECH_FACTORY	`;
        query += ` 	                               AND TO_CHAR(HC.SLECH_CHECK_DATE, 'YYYYMM') =	`;
        query += ` 	                                   TO_CHAR(HD.SLECH_CHECK_DATE, 'YYYYMM')	`;
        query += ` 	                               AND C.SLECC_TYPE = TD.SLECC_TYPE	`;
        query += ` 	                               AND HC.SLECH_MGR_REFER = HD.SLECH_MGR_REFER	`;
        query += ` 	                             GROUP BY C.SLECC_SEQ_QUESTION,	`;
        query += ` 	                                      QC.SQUESTC_FULL_SCORE) AS RFT_SCORE_ACTUAL	`;
        query += ` 	                      FROM SLEC_TRANS_SUP_CHECKPOINT TD	`;
        query += ` 	                     INNER JOIN SLEC_TRANS_HEADER HD	`;
        query += ` 	                        ON HD.SLECH_NO = TD.SLECC_NO	`;
        query += ` 	                     WHERE 1 = 1	`;
        query += ` 	                       AND HD.SLECH_STATUS = '50'	`;
        query += ` 	                       AND HD.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                       AND TO_CHAR(HD.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += `                         AND HD.SLECH_MGR_REFER = '${P_MGR}' `;
        query += ` 	                     GROUP BY TD.SLECC_TYPE,	`;
        query += ` 	                              HD.SLECH_STATUS,	`;
        query += ` 	                              HD.SLECH_FACTORY,	`;
        query += ` 	                              TO_CHAR(HD.SLECH_CHECK_DATE, 'YYYYMM'),	`;
        query += ` 	                              HD.SLECH_MGR_REFER	`;
        query += ` 	                     ORDER BY TD.SLECC_TYPE) A	`;
        query += ` 	            ON A.SLECC_TYPE = T.SLFULL_TYPE	`;
        query += ` 	         WHERE 1 = 1	`;
        query += ` 	           AND H.SLECH_STATUS = '50'	`;
        query += ` 	           AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += `             AND H.SLECH_MGR_REFER = '${P_MGR}' `;
        query += ` 	         GROUP BY T.SLFULL_TYPE, TP.TYPE_DESC, A.RFT_SCORE_ACTUAL	`;
        query += ` 	         ORDER BY A.SLECC_TYPE) S	`;
        query += ` 	 ORDER BY RFT_TYPE_CODE	`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = await Promise.all(result.rows.map(async (row) => {

            return {
                RFT_TYPE_CODE: row[0],
                RFT_TYPE_DESC: row[1],
                RFT_SCORE_FULL: row[2],
                RFT_SCORE_ACTUAL: row[3],
                RFT_SCORE_PERC: row[4]
            };
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

async function getDataForChartPic_Min(P_FACTORY, P_MONTH, P_MGR) {
    try {

        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` 	SELECT T.SLFULL_TYPE AS RFT_TYPE_CODE,	`;
        query += ` 	       TP.TYPE_DESC AS RFT_TYPE_DESC,	`;
        query += ` 	       SUM(T.SLFULL_SCORE) / COUNT(T.SLFULL_NO) AS RFT_SCORE_FULL,	`;
        query += ` 	       A.RFT_SCORE_ACTUAL,	`;
        query += ` 	       ROUND((A.RFT_SCORE_ACTUAL * 100) /	`;
        query += ` 	             (SUM(T.SLFULL_SCORE) / COUNT(T.SLFULL_NO)),	`;
        query += ` 	             2) AS RFT_SCORE_PERC	`;
        query += ` 	  FROM SLEC_TRANS_FULL_SCORE T	`;
        query += ` 	 INNER JOIN SLEC_TRANS_HEADER H	`;
        query += ` 	    ON H.SLECH_NO = T.SLFULL_NO	`;
        query += ` 	  LEFT JOIN SLEC_MSTR_TYPE_POINT TP	`;
        query += ` 	    ON TP.TYPE_CODE = T.SLFULL_TYPE	`;
        query += ` 	  LEFT JOIN (SELECT TD.SLECC_TYPE,	`;
        query += ` 	                    (SELECT SUM(DECODE(SUM(C.SLECC_SCORE) /	`;
        query += ` 	                                       COUNT(C.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                                       QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                       QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                       0)) AS RFT_SCORE_ACTUAL	`;
        query += ` 	                     	`;
        query += ` 	                       FROM SLEC_TRANS_SUP_CHECKPOINT C	`;
        query += ` 	                      INNER JOIN SLEC_TRANS_HEADER HC	`;
        query += ` 	                         ON HC.SLECH_NO = C.SLECC_NO	`;
        query += ` 	                      INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	                         ON QC.SQUESTC_SEQ_QUESTION = C.SLECC_SEQ_QUESTION	`;
        query += ` 	                      WHERE 1 = 1	`;
        query += ` 	                        AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	                        AND HC.SLECH_STATUS = HD.SLECH_STATUS	`;
        query += ` 	                        AND HC.SLECH_FACTORY = HD.SLECH_FACTORY	`;
        query += ` 	                        AND TO_CHAR(HC.SLECH_CHECK_DATE, 'YYYYMM') =	`;
        query += ` 	                            TO_CHAR(HD.SLECH_CHECK_DATE, 'YYYYMM')	`;
        query += ` 	                        AND C.SLECC_TYPE = TD.SLECC_TYPE	`;
        query += ` 	                        AND HC.SLECH_MGR_REFER = HD.SLECH_MGR_REFER	`;
        query += ` 	                      GROUP BY C.SLECC_SEQ_QUESTION, QC.SQUESTC_FULL_SCORE) AS RFT_SCORE_ACTUAL	`;
        query += ` 	               FROM SLEC_TRANS_SUP_CHECKPOINT TD	`;
        query += ` 	              INNER JOIN SLEC_TRANS_HEADER HD	`;
        query += ` 	                 ON HD.SLECH_NO = TD.SLECC_NO	`;
        query += ` 	              WHERE 1 = 1	`;
        query += ` 	                AND HD.SLECH_STATUS = '50'	`;
        query += ` 	                AND HD.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                AND TO_CHAR(HD.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += `                  AND HD.SLECH_MGR_REFER = '${P_MGR}' `;
        query += ` 	              GROUP BY TD.SLECC_TYPE,	`;
        query += ` 	                       HD.SLECH_STATUS,	`;
        query += ` 	                       HD.SLECH_FACTORY,	`;
        query += ` 	                       TO_CHAR(HD.SLECH_CHECK_DATE, 'YYYYMM'),	`;
        query += ` 	                       HD.SLECH_MGR_REFER	`;
        query += ` 	              ORDER BY TD.SLECC_TYPE) A	`;
        query += ` 	    ON A.SLECC_TYPE = T.SLFULL_TYPE	`;
        query += ` 	 WHERE 1 = 1	`;
        query += ` 	   AND H.SLECH_STATUS = '50'	`;
        query += ` 	   AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	   AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += `     AND H.SLECH_MGR_REFER = '${P_MGR}' `;
        query += ` 	 GROUP BY T.SLFULL_TYPE, TP.TYPE_DESC, A.RFT_SCORE_ACTUAL	`;
        query += ` 	 ORDER BY RFT_TYPE_CODE	`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        if (!result.rows || !Array.isArray(result.rows) || result.rows.length === 0) {
            return [];
        } else {
            const data = await Promise.all(result.rows.map(async (row) => {

                return {
                    RFT_TYPE_CODE: row[0],
                    RFT_TYPE_DESC: row[1],
                    RFT_SCORE_FULL: row[2],
                    RFT_SCORE_ACTUAL: row[3],
                    RFT_SCORE_PERC: row[4]
                };
            }));

            return data;
        }


    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return [];
    }
};

async function getDataSupMGRForChartColumn_Min(P_FACTORY, P_MONTH, P_MGR) {
    try {

        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` 	   SELECT TS.SLECD_EMPLOYEE_ID || ' : ' || HT.ENAME || ' ' || HT.ESURNAME AS SLECD_EMPLOYEE_ID,	`;
        query += ` 	          (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                             COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                             QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                             QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                             0)) AS SLECD_ACTUAL_SCORE	`;
        query += ` 	             FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	            INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	               ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	            INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	               ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	            WHERE H1.SLECH_MGR_REFER = HTS.SLECH_MGR_REFER	`;
        query += ` 	              AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') =	`;
        query += ` 	                  TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM')	`;
        query += ` 	              AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	              AND H1.SLECH_STATUS = '50'	`;
        query += ` 	              AND SP1.SLECC_EMPLOYEE_ID = TS.SLECD_EMPLOYEE_ID	`;
        query += ` 	            GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                     QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                     H1.SLECH_STATUS) AS SLECD_ACTUAL_SCORE   	`;
        query += ` 	     FROM SLEC_TRANS_SUPERVISOR TS	`;
        query += ` 	    INNER JOIN SLEC_TRANS_HEADER HTS ON HTS.SLECH_NO = TS.SLECD_NO	`;
        query += ` 	     LEFT JOIN CUSR.CU_USER_HUMANTRIX HT ON HT.EMPCODE = TS.SLECD_EMPLOYEE_ID	`;
        query += ` 	    WHERE 1 = 1	`;
        query += ` 	      AND HTS.SLECH_STATUS = '50'	`;
        query += ` 	      AND HTS.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	      AND TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += ` 	      AND HTS.SLECH_MGR_REFER = '${P_MGR}'	`;
        query += ` 	    GROUP BY TS.SLECD_EMPLOYEE_ID, HT.ENAME, HT.ESURNAME, HTS.SLECH_MGR_REFER, TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM')	`;
        query += ` 	    ORDER BY SLECD_ACTUAL_SCORE DESC	`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        if (!result.rows || !Array.isArray(result.rows) || result.rows.length === 0) {
            return [];
        } else {
            const data = await Promise.all(result.rows.map(async (row) => {

                return {
                    RFT_SUP: row[0],
                    RFT_ACTUAL_SCORE: row[1]
                };
            }));

            return data;
        }


    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return [];
    }
};

async function fileToBase64(filename) {
    // อ่านไฟล์และเปลี่ยนเป็น Base64 string
    const filePath = path.join(__dirname, '../UploadFile', filename);
    const fileContent = fs.readFileSync(filePath, { encoding: 'base64' });
    console.log('Convert File to Base64 successfully')
    return fileContent;
}

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
                base64String = await fileToBase64(row[1]);
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