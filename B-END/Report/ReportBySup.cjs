const { ConnectOracleDB, DisconnectOracleDB } = require("../Common/DBconnection.cjs");

const oracledb = require("oracledb");
require("dotenv").config();

module.exports.getSupervisorByMonthly = async function (req, res) {

    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT DISTINCT S.SLECD_EMPLOYEE_ID AS F_CODE, H.ENAME || ' ' || S.SLECD_EMPLOYEE_ID  AS F_DESC `;
        query += `   FROM SLEC_TRANS_HEADER T `;
        query += `  INNER JOIN SLEC_TRANS_SUPERVISOR S ON S.SLECD_NO = T.SLECH_NO `;
        query += `  INNER JOIN CUSR.CU_USER_HUMANTRIX H ON H.EMPCODE = S.SLECD_EMPLOYEE_ID `;
        query += `  WHERE 1 = 1 `;
        query += `    AND T.SLECH_STATUS = '50' `;
        query += `    AND T.SLECH_FACTORY = '${P_FACTORY}' `;
        query += `    AND TO_CHAR(T.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}' `;
        query += ` ORDER BY S.SLECD_EMPLOYEE_ID `;
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

module.exports.getDataEmpSup = async function (req, res) {
    try {
        const P_EMP_ID = req.query.P_EMP_ID
        const connect = await ConnectOracleDB("CUSR");
        let query = "";
        query += `  SELECT H.EMPCODE || ' : ' || H.ENAME || ' ' || H.ESURNAME AS T_LABEL `;
        query += `    FROM CU_USER_HUMANTRIX H `;
        query += `   WHERE 1 = 1 `;
        query += `     AND H.EMPCODE = '${P_EMP_ID}' `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        res.json(result.rows[0][0]);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getSlecBySup = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const P_EMP_ID = req.query.P_EMP_ID
        const P_SLEC_NO = req.query.P_SLEC_NO
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` 	SELECT H.SLECH_NO AS SLEC_NO,	`;
        query += ` 	       TO_CHAR(H.SLECH_CREATE_DATE, 'DD Mon YYYY') AS SLEC_CREATE,	`;
        query += ` 	       TO_CHAR(H.SLECH_CHECK_DATE, 'DD Mon YYYY') AS SLEC_CHECK,	`;
        query += ` 	       T.SLECD_FULL_SCORE AS SLEC_FULL,	`;
        query += ` 	       T.SLECD_ACTUAL_SCORE AS SLEC_ACTUAL	`;
        query += ` 	  FROM SLEC_TRANS_SUPERVISOR T	`;
        query += ` 	 INNER JOIN SLEC_TRANS_HEADER H ON H.SLECH_NO = T.SLECD_NO	`;
        query += ` 	 WHERE 1 = 1	`;
        query += ` 	   AND H.SLECH_STATUS = '50'	`;
        query += ` 	   AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	   AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += ` 	   AND T.SLECD_EMPLOYEE_ID = '${P_EMP_ID}'	`;
        query += ` 	   AND (H.SLECH_NO = '${P_SLEC_NO}' OR '${P_SLEC_NO}' IS NULL)	`;
        query += ` 	 ORDER BY H.SLECH_NO	`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = await Promise.all(result.rows.map(async (row) => {

            return {
                SLEC_NO: row[0],
                SLEC_CREATE: row[1],
                SLEC_CHECK: row[2],
                SLEC_FULL: row[3],
                SLEC_ACTUAL: row[4]
            };
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getDataSupForTable = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const P_EMP_ID = req.query.P_EMP_ID
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
        query += ` 	  INNER JOIN SLEC_TRANS_SUPERVISOR SS	`;
        query += ` 	     ON SS.SLECD_NO = T.SLFULL_NO	`;
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
        query += ` 	                             AND TS.SLECD_EMPLOYEE_ID = '${P_EMP_ID}'	`;
        query += ` 	                             AND (HTS.SLECH_NO = '${P_SLEC_NO}' OR '${P_SLEC_NO}' IS NULL)	`;
        query += ` 	                           GROUP BY TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM')) NEM	`;
        query += ` 	                  ON NEM.CK_DATE = '${P_MONTH}'	`;
        query += ` 	               WHERE 1 = 1	`;
        query += ` 	                 AND HC.SLECH_STATUS = '50'	`;
        query += ` 	                 AND HC.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                 AND C.SLECC_EMPLOYEE_ID = '${P_EMP_ID}'	`;
        query += ` 	                 AND (HC.SLECH_NO = '${P_SLEC_NO}' OR '${P_SLEC_NO}' IS NULL)	`;
        query += ` 	               GROUP BY C.SLECC_TYPE, NEM.COUNT_SUP) A	`;
        query += ` 	     ON A.SLECC_TYPE = T.SLFULL_TYPE	`;
        query += ` 	  WHERE 1 = 1	`;
        query += ` 	    AND H.SLECH_STATUS = '50'	`;
        query += ` 	    AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	    AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += ` 	    AND SS.SLECD_EMPLOYEE_ID = '${P_EMP_ID}'	`;
        query += ` 	    AND (H.SLECH_NO = '${P_SLEC_NO}' OR '${P_SLEC_NO}' IS NULL)	`;
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
        query += ` 	          INNER JOIN SLEC_TRANS_SUPERVISOR SS	`;
        query += ` 	             ON SS.SLECD_NO = T.SLFULL_NO	`;
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
        query += ` 	                                    AND TS.SLECD_EMPLOYEE_ID = '${P_EMP_ID}'	`;
        query += ` 	                                    AND (HTS.SLECH_NO = '${P_SLEC_NO}' OR '${P_SLEC_NO}' IS NULL)	`;
        query += ` 	                                  GROUP BY TO_CHAR(HTS.SLECH_CHECK_DATE,	`;
        query += ` 	                                                   'YYYYMM')) NEM	`;
        query += ` 	                         ON NEM.CK_DATE = '${P_MONTH}'	`;
        query += ` 	                      WHERE 1 = 1	`;
        query += ` 	                        AND HC.SLECH_STATUS = '50'	`;
        query += ` 	                        AND HC.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                        AND C.SLECC_EMPLOYEE_ID = '${P_EMP_ID}'	`;
        query += ` 	                        AND (HC.SLECH_NO = '${P_SLEC_NO}' OR '${P_SLEC_NO}' IS NULL)	`;
        query += ` 	                      GROUP BY C.SLECC_TYPE, NEM.COUNT_SUP) A	`;
        query += ` 	             ON A.SLECC_TYPE = T.SLFULL_TYPE	`;
        query += ` 	          WHERE 1 = 1	`;
        query += ` 	            AND H.SLECH_STATUS = '50'	`;
        query += ` 	            AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	            AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += ` 	            AND SS.SLECD_EMPLOYEE_ID = '${P_EMP_ID}'	`;
        query += ` 	            AND (H.SLECH_NO = '${P_SLEC_NO}' OR '${P_SLEC_NO}' IS NULL)	`;
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

module.exports.getDataSupForChartPic = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const P_EMP_ID = req.query.P_EMP_ID
        const P_SLEC_NO = req.query.P_SLEC_NO
        let ListMain = await getDataForChartPic(P_FACTORY, P_MONTH, P_EMP_ID, P_SLEC_NO)

        const labels = ListMain.map(item => item.RFT_TYPE_DESC);
        const dataValues = ListMain.map(item => item.RFT_SCORE_PERC);

        const data = {
            labels: labels,
            datasets: [
                {
                    label: P_EMP_ID,
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

async function getDataForChartPic(P_FACTORY, P_MONTH, P_EMP_ID, P_SLEC_NO) {
    try {

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
        query += ` 	  INNER JOIN SLEC_TRANS_SUPERVISOR SS	`;
        query += ` 	     ON SS.SLECD_NO = T.SLFULL_NO	`;
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
        query += ` 	                             AND TS.SLECD_EMPLOYEE_ID = '${P_EMP_ID}'	`;
        query += ` 	                             AND (HTS.SLECH_NO = '${P_SLEC_NO}' OR '${P_SLEC_NO}' IS NULL)	`;
        query += ` 	                           GROUP BY TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM')) NEM	`;
        query += ` 	                  ON NEM.CK_DATE = '${P_MONTH}'	`;
        query += ` 	               WHERE 1 = 1	`;
        query += ` 	                 AND HC.SLECH_STATUS = '50'	`;
        query += ` 	                 AND HC.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                 AND C.SLECC_EMPLOYEE_ID = '${P_EMP_ID}'	`;
        query += ` 	                 AND (HC.SLECH_NO = '${P_SLEC_NO}' OR '${P_SLEC_NO}' IS NULL)	`;
        query += ` 	               GROUP BY C.SLECC_TYPE, NEM.COUNT_SUP) A	`;
        query += ` 	     ON A.SLECC_TYPE = T.SLFULL_TYPE	`;
        query += ` 	  WHERE 1 = 1	`;
        query += ` 	    AND H.SLECH_STATUS = '50'	`;
        query += ` 	    AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	    AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += ` 	    AND SS.SLECD_EMPLOYEE_ID = '${P_EMP_ID}'	`;
        query += ` 	    AND (H.SLECH_NO = '${P_SLEC_NO}' OR '${P_SLEC_NO}' IS NULL)	`;
        query += ` 	  GROUP BY T.SLFULL_TYPE, TP.TYPE_DESC, A.RFT_SCORE_ACTUAL	`;
        query += ` 	  ORDER BY RFT_TYPE_CODE	`;
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

module.exports.getDataSupB = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const P_EMP_ID = req.query.P_EMP_ID
        const P_SLEC_NO = req.query.P_SLEC_NO
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` 	SELECT T.SLECC_EMPLOYEE_ID AS RMGR_EMP_ID,	`;
        query += ` 	       TP.TYPE_DESC        AS RMGR_TYPE,	`;
        query += ` 	       T.SLECC_QUESTC_CODE AS RMGR_QUEST_CODE,	`;
        query += ` 	       Q.SQUESTC_DESC_ENG  AS RMGR_QUESTION_ENG,	`;
        query += ` 	       Q.SQUESTC_DESC_THAI AS RMGR_QUESTION_TH,	`;
        query += ` 	       T.SLECC_COMMENT        AS RMGR_COMMENT,	`;
        query += ` 	       (SELECT COUNT(A.SPIC_QUESTC_CODE) FROM SLEC_TRANS_ATTACH A WHERE A.SPIC_NO = T.SLECC_NO AND A.SPIC_EMPLOYEE_ID = T.SLECC_EMPLOYEE_ID AND A.SPIC_QUESTC_CODE = T.SLECC_QUESTC_CODE AND A.SPIC_TYPE = T.SLECC_TYPE AND A.SPIC_REV = T.SLECC_REV) AS RMGR_COUNT_FILE	`;
        query += ` 	  FROM SLEC_TRANS_SUP_CHECKPOINT T	`;
        query += ` 	 INNER JOIN SLEC_TRANS_HEADER H ON H.SLECH_NO = T.SLECC_NO	`;
        query += ` 	  LEFT JOIN SLEC_MSTR_TYPE_POINT TP ON TP.TYPE_CODE = T.SLECC_TYPE	`;
        query += ` 	  LEFT JOIN SLEC_MSTR_QUES_CHECKPOINT Q ON Q.SQUESTC_CODE = T.SLECC_QUESTC_CODE AND Q.SQUESTC_TYPE = T.SLECC_TYPE AND Q.SQUESTC_REV = T.SLECC_REV  	`;
        query += ` 	 WHERE 1 = 1	`;
        query += ` 	   AND T.SLECC_ASKWER = 'B'	`;
        query += ` 	   AND H.SLECH_STATUS = '50'	`;
        query += ` 	   AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	   AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += ` 	   AND T.SLECC_EMPLOYEE_ID = '${P_EMP_ID}'	`;
        query += ` 	   AND (T.SLECC_NO = '${P_SLEC_NO}' OR '${P_SLEC_NO}' IS NULL)	`;
        query += ` 	ORDER BY T.SLECC_TYPE, T.SLECC_QUESTC_CODE, T.SLECC_NO ASC	`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        const data = await Promise.all(result.rows.map(async (row) => {

            return {
                RMGR_EMP_ID: row[0],
                RMGR_TYPE: row[1],
                RMGR_QUEST_CODE: row[2],
                RMGR_QUESTION_ENG: row[3],
                RMGR_QUESTION_TH: row[4],
                RMGR_COMMENT: row[5],
                RMGR_COUNT_FILE: row[6]
            };
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

