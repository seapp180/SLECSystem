const { ConnectOracleDB, DisconnectOracleDB } = require("../Common/DBconnection.cjs");

const oracledb = require("oracledb");
require("dotenv").config();

module.exports.getSlecNoByMonthly = async function (req, res) {

    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const P_SUP = req.query.P_SUP
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT DISTINCT T.SLECH_NO `;
        query += `   FROM SLEC_TRANS_HEADER T `;
        query += `  INNER JOIN SLEC_TRANS_SUPERVISOR S ON S.SLECD_NO = T.SLECH_NO `;
        query += `  WHERE 1 = 1 `;
        query += `    AND T.SLECH_STATUS = '50' `;
        query += `    AND T.SLECH_FACTORY = '${P_FACTORY}' `;
        query += `    AND TO_CHAR(T.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}' `;
        query += `    AND (S.SLECD_EMPLOYEE_ID = '${P_SUP}' OR '${P_SUP}' IS NULL) `;
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

module.exports.getDataCheckSlecNo = async function (req, res) {
    try {
        const P_SLEC_NO = req.query.P_SLEC_NO
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += `  SELECT TO_CHAR(H.SLECH_CHECK_DATE, 'DD Mon YYYY') AS SLEC_CHECK_DATE, H.SLECH_MGR_REFER AS SLEC_MGR `;
        query += `    FROM SLEC_TRANS_HEADER H `;
        query += `   WHERE 1 = 1 `;
        query += `     AND H.SLECH_NO = '${P_SLEC_NO}' `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const row = result.rows[0];
        const data = {
            SLEC_CHECK_DATE: row[0],
            SLEC_MGR: row[1]
        };

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getSlecNoForTable = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const P_SLEC_NO = req.query.P_SLEC_NO
        const connect = await ConnectOracleDB("GC");
        let query = "";

        query += ` 	 SELECT T.SLFULL_TYPE AS RFT_TYPE_CODE,	`;
        query += ` 	        TP.TYPE_DESC AS RFT_TYPE_DESC,	`;
        query += ` 	        SUM(T.SLFULL_SCORE) / COUNT(T.SLFULL_NO) AS RFT_SCORE_FULL,	`;
        query += ` 	        A.RFT_SCORE_ACTUAL,	`;
        query += ` 	        ROUND((A.RFT_SCORE_ACTUAL * 100) /	`;
        query += ` 	              (SUM(T.SLFULL_SCORE) / COUNT(T.SLFULL_NO)),	`;
        query += ` 	              2) AS RFT_SCORE_PERC	`;
        query += ` 	   FROM SLEC_TRANS_FULL_SCORE T	`;
        query += ` 	  INNER JOIN SLEC_TRANS_HEADER H	`;
        query += ` 	     ON H.SLECH_NO = T.SLFULL_NO	`;
        query += ` 	   LEFT JOIN SLEC_MSTR_TYPE_POINT TP	`;
        query += ` 	     ON TP.TYPE_CODE = T.SLFULL_TYPE	`;
        query += ` 	   LEFT JOIN (SELECT C.SLECC_TYPE,	`;
        query += ` 	                     ROUND(SUM(C.SLECC_SCORE) / NEM.COUNT_SUP, 2) AS RFT_SCORE_ACTUAL	`;
        query += ` 	                FROM SLEC_TRANS_SUP_CHECKPOINT C	`;
        query += ` 	               INNER JOIN SLEC_TRANS_HEADER HC	`;
        query += ` 	                  ON HC.SLECH_NO = C.SLECC_NO	`;
        query += ` 	                 AND TO_CHAR(HC.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += ` 	                LEFT JOIN (SELECT COUNT(TS.SLECD_EMPLOYEE_ID) AS COUNT_SUP,	`;
        query += ` 	                                 TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM') AS CK_DATE	`;
        query += ` 	                            FROM SLEC_TRANS_SUPERVISOR TS	`;
        query += ` 	                           INNER JOIN SLEC_TRANS_HEADER HTS	`;
        query += ` 	                              ON HTS.SLECH_NO = TS.SLECD_NO	`;
        query += ` 	                           WHERE 1 = 1	`;
        query += ` 	                             AND HTS.SLECH_STATUS = '50'	`;
        query += ` 	                             AND HTS.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                             AND TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM') =	`;
        query += ` 	                                 '${P_MONTH}'	`;
        query += ` 	                             AND HTS.SLECH_NO = '${P_SLEC_NO}'	`;
        query += ` 	                           GROUP BY TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM')) NEM	`;
        query += ` 	                  ON NEM.CK_DATE = '${P_MONTH}'	`;
        query += ` 	               WHERE 1 = 1	`;
        query += ` 	                 AND HC.SLECH_STATUS = '50'	`;
        query += ` 	                 AND HC.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                 AND HC.SLECH_NO = '${P_SLEC_NO}'	`;
        query += ` 	               GROUP BY C.SLECC_TYPE, NEM.COUNT_SUP) A	`;
        query += ` 	     ON A.SLECC_TYPE = T.SLFULL_TYPE	`;
        query += ` 	  WHERE 1 = 1	`;
        query += ` 	    AND H.SLECH_STATUS = '50'	`;
        query += ` 	    AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	    AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += ` 	    AND H.SLECH_NO = '${P_SLEC_NO}'	`;
        query += ` 	  GROUP BY T.SLFULL_TYPE, TP.TYPE_DESC, A.RFT_SCORE_ACTUAL	`;
        query += ` 	 UNION	`;
        query += ` 	 SELECT DISTINCT 'TY999' AS RFT_TYPE_CODE,	`;
        query += ` 	                 'SUM' AS RFT_TYPE_DESC,	`;
        query += ` 	                 SUM(S.RFT_SCORE_FULL) AS RFT_SCORE_FULL,	`;
        query += ` 	                 SUM(S.RFT_SCORE_ACTUAL) AS RFT_SCORE_ACTUAL,	`;
        query += ` 	                 ROUND((SUM(S.RFT_SCORE_ACTUAL) * 100) /	`;
        query += ` 	                       SUM(S.RFT_SCORE_FULL),	`;
        query += ` 	                       2) AS RFT_SCORE_PERC	`;
        query += ` 	   FROM (SELECT T.SLFULL_TYPE AS RFT_TYPE_CODE,	`;
        query += ` 	                TP.TYPE_DESC AS RFT_TYPE_DESC,	`;
        query += ` 	                SUM(T.SLFULL_SCORE) / COUNT(T.SLFULL_NO) AS RFT_SCORE_FULL,	`;
        query += ` 	                A.RFT_SCORE_ACTUAL,	`;
        query += ` 	                TRIM(TO_CHAR(ROUND((A.RFT_SCORE_ACTUAL * 100) /	`;
        query += ` 	                                   (SUM(T.SLFULL_SCORE) / COUNT(T.SLFULL_NO)),	`;
        query += ` 	                                   2))) || '%' AS RFT_SCORE_PERC	`;
        query += ` 	           FROM SLEC_TRANS_FULL_SCORE T	`;
        query += ` 	          INNER JOIN SLEC_TRANS_HEADER H	`;
        query += ` 	             ON H.SLECH_NO = T.SLFULL_NO	`;
        query += ` 	           LEFT JOIN SLEC_MSTR_TYPE_POINT TP	`;
        query += ` 	             ON TP.TYPE_CODE = T.SLFULL_TYPE	`;
        query += ` 	           LEFT JOIN (SELECT C.SLECC_TYPE,	`;
        query += ` 	                            ROUND(SUM(C.SLECC_SCORE) / NEM.COUNT_SUP, 2) AS RFT_SCORE_ACTUAL	`;
        query += ` 	                       FROM SLEC_TRANS_SUP_CHECKPOINT C	`;
        query += ` 	                      INNER JOIN SLEC_TRANS_HEADER HC	`;
        query += ` 	                         ON HC.SLECH_NO = C.SLECC_NO	`;
        query += ` 	                        AND TO_CHAR(HC.SLECH_CHECK_DATE, 'YYYYMM') =	`;
        query += ` 	                            '${P_MONTH}'	`;
        query += ` 	                       LEFT JOIN (SELECT COUNT(TS.SLECD_EMPLOYEE_ID) AS COUNT_SUP,	`;
        query += ` 	                                        TO_CHAR(HTS.SLECH_CHECK_DATE,	`;
        query += ` 	                                                'YYYYMM') AS CK_DATE	`;
        query += ` 	                                   FROM SLEC_TRANS_SUPERVISOR TS	`;
        query += ` 	                                  INNER JOIN SLEC_TRANS_HEADER HTS	`;
        query += ` 	                                     ON HTS.SLECH_NO = TS.SLECD_NO	`;
        query += ` 	                                  WHERE 1 = 1	`;
        query += ` 	                                    AND HTS.SLECH_STATUS = '50'	`;
        query += ` 	                                    AND HTS.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                                    AND TO_CHAR(HTS.SLECH_CHECK_DATE,	`;
        query += ` 	                                                'YYYYMM') = '${P_MONTH}'	`;
        query += ` 	                                    AND HTS.SLECH_NO = '${P_SLEC_NO}'	`;
        query += ` 	                                  GROUP BY TO_CHAR(HTS.SLECH_CHECK_DATE,	`;
        query += ` 	                                                   'YYYYMM')) NEM	`;
        query += ` 	                         ON NEM.CK_DATE = '${P_MONTH}'	`;
        query += ` 	                      WHERE 1 = 1	`;
        query += ` 	                        AND HC.SLECH_STATUS = '50'	`;
        query += ` 	                        AND HC.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                        AND HC.SLECH_NO = '${P_SLEC_NO}'	`;
        query += ` 	                      GROUP BY C.SLECC_TYPE, NEM.COUNT_SUP) A	`;
        query += ` 	             ON A.SLECC_TYPE = T.SLFULL_TYPE	`;
        query += ` 	          WHERE 1 = 1	`;
        query += ` 	            AND H.SLECH_STATUS = '50'	`;
        query += ` 	            AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	            AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += ` 	            AND H.SLECH_NO = '${P_SLEC_NO}'	`;
        query += ` 	          GROUP BY T.SLFULL_TYPE, TP.TYPE_DESC, A.RFT_SCORE_ACTUAL	`;
        query += ` 	          ORDER BY T.SLFULL_TYPE) S	`;
        query += ` 	  ORDER BY RFT_TYPE_CODE	`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = await Promise.all(result.rows.map(async (row) => {

            return {
                RSN_TYPE_CODE: row[0],
                RSN_TYPE_DESC: row[1],
                RSN_SCORE_FULL: row[2],
                RSN_SCORE_ACTUAL: row[3],
                RSN_SCORE_PERC: row[4]
            };
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getSlecNoForChartPic = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const P_SLEC_NO = req.query.P_SLEC_NO
        let ListMain = await getDataForChartPic(P_FACTORY, P_MONTH, P_SLEC_NO)

        const labels = ListMain.map(item => item.RFT_TYPE_DESC);
        const dataValues = ListMain.map(item => item.RFT_SCORE_PERC);

        const data = {
            labels: labels,
            datasets: [
                {
                    label: P_SLEC_NO,
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

async function getDataForChartPic(P_FACTORY, P_MONTH, P_SLEC_NO) {
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
        query += `                              AND HTS.SLECH_NO = '${P_SLEC_NO}' `;
        query += ` 	                            AND TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM') =	`;
        query += ` 	                                '${P_MONTH}'	`;
        query += ` 	                          GROUP BY TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM')) NEM	`;
        query += ` 	                 ON NEM.CK_DATE = '${P_MONTH}'	`;
        query += ` 	              WHERE 1 = 1	`;
        query += ` 	                AND HC.SLECH_STATUS = '50'	`;
        query += ` 	                AND HC.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += `                  AND HC.SLECH_NO = '${P_SLEC_NO}' `;
        query += ` 	              GROUP BY C.SLECC_TYPE, NEM.COUNT_SUP) A	`;
        query += ` 	    ON A.SLECC_TYPE = T.SLFULL_TYPE	`;
        query += ` 	 WHERE 1 = 1	`;
        query += ` 	   AND H.SLECH_STATUS = '50'	`;
        query += ` 	   AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	   AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += `     AND H.SLECH_NO = '${P_SLEC_NO}' `;
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

module.exports.getSlecNoBySup = async function (req, res) {
    try {
        const P_SLEC_NO = req.query.P_SLEC_NO
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` 	SELECT T.SLECD_EMPLOYEE_ID || ' : ' || U.ENAME || ' ' || U.ESURNAME AS RS_EMP,	`;
        query += ` 	       U.POS_GRADE AS RS_LEVEL,	`;
        query += ` 	       SUBSTR(U.COST_CENTER,1,4) AS RS_CC,	`;
        query += ` 	       T.SLECD_ACTUAL_SCORE AS RS_ACTAUL_SCORE,	`;
        query += ` 	       T.SLECD_FULL_SCORE AS RS_FULL_SCORE	`;
        query += ` 	  FROM SLEC_TRANS_SUPERVISOR T	`;
        query += ` 	 INNER JOIN SLEC_TRANS_HEADER H ON H.SLECH_NO = T.SLECD_NO	`;
        query += ` 	  LEFT JOIN CUSR.CU_USER_HUMANTRIX U ON U.EMPCODE = T.SLECD_EMPLOYEE_ID	`;
        query += ` 	 WHERE 1 = 1	`;
        query += ` 	   AND H.SLECH_NO = '${P_SLEC_NO}'	`;
        query += ` 	 ORDER BY T.SLECD_EMPLOYEE_ID	`;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = await Promise.all(result.rows.map(async (row) => {

            return {
                RS_EMP: row[0],
                RS_LEVEL: row[1],
                RS_CC: row[2],
                RS_ACTAUL_SCORE: row[3],
                RS_FULL_SCORE: row[4]
            };
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};


module.exports.getSlecNoForChartStacked = async function (req, res) {
    try {
        const P_SLEC_NO = req.query.P_SLEC_NO
        let ListMain = await getDataForChartStacked(P_SLEC_NO)

        const labels = ListMain.map(item => item.T_LABEL);
        const dataType1 = ListMain.map(item => item.T_TYPE1);
        const dataType2 = ListMain.map(item => item.T_TYPE2);
        const dataType3 = ListMain.map(item => item.T_TYPE3);
        const dataType4 = ListMain.map(item => item.T_TYPE4);
        const dataType5 = ListMain.map(item => item.T_TYPE5);
        const dataType6 = ListMain.map(item => item.T_TYPE6);
        const dataType7 = ListMain.map(item => item.T_TYPE7);

        const data = {
            labels: labels,
            datasets: [
                {
                    label: 'Safety',
                    data: dataType1,
                    backgroundColor: 'rgba(250, 219, 216, 0.7)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 0,
                },
                {
                    label: 'Delivery',
                    data: dataType2,
                    backgroundColor: 'rgba(175, 122, 197, 0.7)',
                    borderColor: 'rgba(255, 193, 7, 1)',
                    borderWidth: 0,
                },
                {
                    label: 'Quality',
                    data: dataType3,
                    backgroundColor: 'rgba(250, 219, 216, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 0,
                },
                {
                    label: 'Cost',
                    data: dataType4,
                    backgroundColor: 'rgba(133, 193, 233, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 0,
                },
                {
                    label: 'JI Patrols',
                    data: dataType5,
                    backgroundColor: 'rgba(72, 201, 176 , 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 0,
                },
                {
                    label: '5S',
                    data: dataType6,
                    backgroundColor: 'rgba(247, 220, 111, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 0,
                },
                {
                    label: 'Documentation',
                    data: dataType7,
                    backgroundColor: 'rgba(204, 209, 209, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 0,
                },
            ],
        };

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

async function getDataForChartStacked(P_SLEC_NO) {
    try {

        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` 	SELECT T.SLECC_EMPLOYEE_ID || ' : ' || H.ENAME || ' ' || H.ESURNAME AS T_LABEL,	`;
        query += ` 	       (SELECT SUM(S.SLECC_SCORE) FROM SLEC_TRANS_SUP_CHECKPOINT S WHERE S.SLECC_NO = T.SLECC_NO AND S.SLECC_EMPLOYEE_ID = T.SLECC_EMPLOYEE_ID AND S.SLECC_TYPE = 'TY001') AS T_TYPE1,	`;
        query += ` 	       (SELECT SUM(S.SLECC_SCORE) FROM SLEC_TRANS_SUP_CHECKPOINT S WHERE S.SLECC_NO = T.SLECC_NO AND S.SLECC_EMPLOYEE_ID = T.SLECC_EMPLOYEE_ID AND S.SLECC_TYPE = 'TY002') AS T_TYPE2,	`;
        query += ` 	       (SELECT SUM(S.SLECC_SCORE) FROM SLEC_TRANS_SUP_CHECKPOINT S WHERE S.SLECC_NO = T.SLECC_NO AND S.SLECC_EMPLOYEE_ID = T.SLECC_EMPLOYEE_ID AND S.SLECC_TYPE = 'TY003') AS T_TYPE3,	`;
        query += ` 	       (SELECT SUM(S.SLECC_SCORE) FROM SLEC_TRANS_SUP_CHECKPOINT S WHERE S.SLECC_NO = T.SLECC_NO AND S.SLECC_EMPLOYEE_ID = T.SLECC_EMPLOYEE_ID AND S.SLECC_TYPE = 'TY004') AS T_TYPE4,	`;
        query += ` 	       (SELECT SUM(S.SLECC_SCORE) FROM SLEC_TRANS_SUP_CHECKPOINT S WHERE S.SLECC_NO = T.SLECC_NO AND S.SLECC_EMPLOYEE_ID = T.SLECC_EMPLOYEE_ID AND S.SLECC_TYPE = 'TY005') AS T_TYPE5,	`;
        query += ` 	       (SELECT SUM(S.SLECC_SCORE) FROM SLEC_TRANS_SUP_CHECKPOINT S WHERE S.SLECC_NO = T.SLECC_NO AND S.SLECC_EMPLOYEE_ID = T.SLECC_EMPLOYEE_ID AND S.SLECC_TYPE = 'TY006') AS T_TYPE6,	`;
        query += ` 	       (SELECT SUM(S.SLECC_SCORE) FROM SLEC_TRANS_SUP_CHECKPOINT S WHERE S.SLECC_NO = T.SLECC_NO AND S.SLECC_EMPLOYEE_ID = T.SLECC_EMPLOYEE_ID AND S.SLECC_TYPE = 'TY007') AS T_TYPE7	`;
        query += ` 	  FROM SLEC_TRANS_SUP_CHECKPOINT T	`;
        query += ` 	  LEFT JOIN CUSR.CU_USER_HUMANTRIX H ON H.EMPCODE = T.SLECC_EMPLOYEE_ID	`;
        query += ` 	 WHERE T.SLECC_NO = '${P_SLEC_NO}'	`;
        query += ` 	 GROUP BY T.SLECC_NO, T.SLECC_EMPLOYEE_ID, H.ENAME, H.ESURNAME	`;
        query += ` 	 ORDER BY T.SLECC_EMPLOYEE_ID	`;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        if (!result.rows || !Array.isArray(result.rows) || result.rows.length === 0) {
            return [];
        } else {
            const data = await Promise.all(result.rows.map(async (row) => {

                return {
                    T_LABEL: row[0],
                    T_TYPE1: row[1],
                    T_TYPE2: row[2],
                    T_TYPE3: row[3],
                    T_TYPE4: row[4],
                    T_TYPE5: row[5],
                    T_TYPE6: row[6],
                    T_TYPE7: row[7]
                };
            }));

            return data;
        }


    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return [];
    }
};

module.exports.getExportDetail = async function (req, res) {
    try {
        const P_SLEC_NO = req.query.P_SLEC_NO
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += `	SELECT T.SLECH_NO AS SLEC_NO,	`;
        query += `	       S.SLECC_EMPLOYEE_ID || ' : ' || H.ENAME || ' ' || H.ESURNAME AS SUPERVISOR,	`;
        query += `	       TO_CHAR(T.SLECH_CHECK_DATE, 'DD/MM/YYYY') AS CHECK_DATE,	`;
        query += `	       S.SLECC_TYPE AS TYPE_CODE,	`;
        query += `	       TP.TYPE_DESC AS TYPE_DESC,	`;
        query += `	       SUM(S.SLECC_SCORE) AS ACTUAL_SCORE	`;
        query += `	  FROM SLEC_TRANS_HEADER T	`;
        query += `	 INNER JOIN SLEC_TRANS_SUP_CHECKPOINT S ON S.SLECC_NO = T.SLECH_NO	`;
        query += `	  LEFT JOIN CUSR.CU_USER_HUMANTRIX H ON H.EMPCODE = S.SLECC_EMPLOYEE_ID	`;
        query += `	  LEFT JOIN SLEC_MSTR_TYPE_POINT TP ON TP.TYPE_CODE = S.SLECC_TYPE	`;
        query += `	 WHERE T.SLECH_NO = '${P_SLEC_NO}'	`;
        query += `	 GROUP BY T.SLECH_NO,	`;
        query += `	          S.SLECC_EMPLOYEE_ID,	`;
        query += `	          H.ENAME,	`;
        query += `	          H.ESURNAME,	`;
        query += `	          T.SLECH_CHECK_DATE,	`;
        query += `	          S.SLECC_TYPE,	`;
        query += `	          TP.TYPE_DESC	`;
        query += `	 ORDER BY S.SLECC_EMPLOYEE_ID, S.SLECC_TYPE	`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = await Promise.all(result.rows.map(async (row) => {
            return {
                SLEC_NO: row[0],
                SUPERVISOR: row[1],
                CHECK_DATE: row[2],
                TYPE_CODE: row[3],
                TYPE_DESC: row[4],
                ACTUAL_SCORE: row[5],
               
            };
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};