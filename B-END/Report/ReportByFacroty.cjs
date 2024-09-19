const { ConnectOracleDB, DisconnectOracleDB } = require("../Common/DBconnection.cjs");

const oracledb = require("oracledb");
require("dotenv").config();

module.exports.getCountSup = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += `  SELECT COUNT(DISTINCT TS.SLECD_EMPLOYEE_ID) AS COUNT_SUP `;
        query += `    FROM SLEC_TRANS_SUPERVISOR TS `;
        query += `   INNER JOIN SLEC_TRANS_HEADER HTS ON HTS.SLECH_NO = TS.SLECD_NO `;
        query += `   WHERE 1 = 1 `;
        query += `     AND HTS.SLECH_STATUS = '50' `;
        query += `     AND HTS.SLECH_FACTORY = '${P_FACTORY}' `;
        query += `     AND TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}' `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        res.json(result.rows[0][0]);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getFacSupForTable = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
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
        query += ` 	                          GROUP BY TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM')) NEM	`;
        query += ` 	                 ON NEM.CK_DATE = '${P_MONTH}'	`;
        query += ` 	              WHERE 1 = 1	`;
        query += ` 	                AND HC.SLECH_STATUS = '50'	`;
        query += ` 	                AND HC.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	              GROUP BY C.SLECC_TYPE, NEM.COUNT_SUP) A	`;
        query += ` 	    ON A.SLECC_TYPE = T.SLFULL_TYPE	`;
        query += ` 	 WHERE 1 = 1	`;
        query += ` 	   AND H.SLECH_STATUS = '50'	`;
        query += ` 	   AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	   AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
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
        query += ` 	                                 GROUP BY TO_CHAR(HTS.SLECH_CHECK_DATE,	`;
        query += ` 	                                                  'YYYYMM')) NEM	`;
        query += ` 	                        ON NEM.CK_DATE = '${P_MONTH}'	`;
        query += ` 	                     WHERE 1 = 1	`;
        query += ` 	                       AND HC.SLECH_STATUS = '50'	`;
        query += ` 	                       AND HC.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                     GROUP BY C.SLECC_TYPE, NEM.COUNT_SUP) A	`;
        query += ` 	            ON A.SLECC_TYPE = T.SLFULL_TYPE	`;
        query += ` 	         WHERE 1 = 1	`;
        query += ` 	           AND H.SLECH_STATUS = '50'	`;
        query += ` 	           AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
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

async function getDataForChartPic(P_FACTORY, P_MONTH) {
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
        query += ` 	                            AND TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM') =	`;
        query += ` 	                                '${P_MONTH}'	`;
        query += ` 	                          GROUP BY TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM')) NEM	`;
        query += ` 	                 ON NEM.CK_DATE = '${P_MONTH}'	`;
        query += ` 	              WHERE 1 = 1	`;
        query += ` 	                AND HC.SLECH_STATUS = '50'	`;
        query += ` 	                AND HC.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	              GROUP BY C.SLECC_TYPE, NEM.COUNT_SUP) A	`;
        query += ` 	    ON A.SLECC_TYPE = T.SLFULL_TYPE	`;
        query += ` 	 WHERE 1 = 1	`;
        query += ` 	   AND H.SLECH_STATUS = '50'	`;
        query += ` 	   AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	   AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
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

module.exports.getFacSupForChartPic = async function (req, res) {
    try {
        const P_FAC_CODE = req.query.P_FAC_CODE
        const P_FAC_DESC = req.query.P_FAC_DESC
        const P_MONTH = req.query.P_MONTH
        const P_RPT_TYPE = req.query.P_RPT_TYPE

        let ListMain;

        if (P_RPT_TYPE === 'MIN') {
            ListMain = await getDataForChartPic_Min(P_FAC_CODE, P_MONTH)
        } else {
            ListMain = await getDataForChartPic(P_FAC_CODE, P_MONTH)
        }

        const labels = ListMain.map(item => item.RFT_TYPE_DESC);
        const dataValues = ListMain.map(item => item.RFT_SCORE_PERC);

        const data = {
            labels: labels,
            datasets: [
                {
                    label: P_FAC_DESC,
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

async function getDataSupForChartColumn(P_FACTORY, P_MONTH) {
    try {

        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += `   SELECT HTS.SLECH_MGR_REFER, TS.SLECD_EMPLOYEE_ID || ' : ' || HT.ENAME || ' ' || HT.ESURNAME AS SLECD_EMPLOYEE_ID,SUM(TS.SLECD_ACTUAL_SCORE) / COUNT(TS.SLECD_EMPLOYEE_ID) AS SLECD_ACTUAL_SCORE `;
        query += ` 	  FROM SLEC_TRANS_SUPERVISOR TS `;
        query += ` 	 INNER JOIN SLEC_TRANS_HEADER HTS ON HTS.SLECH_NO = TS.SLECD_NO `;
        query += ` 	  LEFT JOIN CUSR.CU_USER_HUMANTRIX HT ON HT.EMPCODE = TS.SLECD_EMPLOYEE_ID	`;
        query += ` 	 WHERE 1 = 1 `;
        query += ` 	   AND HTS.SLECH_STATUS = '50' `;
        query += ` 	   AND HTS.SLECH_FACTORY = '${P_FACTORY}' `;
        query += ` 	   AND TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}' `;
        query += ` 	 GROUP BY TS.SLECD_EMPLOYEE_ID, HT.ENAME, HT.ESURNAME, HTS.SLECH_MGR_REFER `;
        query += ` 	 ORDER BY TS.SLECD_EMPLOYEE_ID `;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        if (!result.rows || !Array.isArray(result.rows) || result.rows.length === 0) {
            return [];
        } else {
            const data = await Promise.all(result.rows.map(async (row) => {

                return {
                    RFT_MGR: row[0],
                    RFT_SUP: row[1],
                    RFT_ACTUAL_SCORE: row[2]
                };
            }));

            return data;
        }


    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return [];
    }
};

module.exports.getFacSupForChartColumn = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const P_RPT_TYPE = req.query.P_RPT_TYPE

        let ListMain;

        if (P_RPT_TYPE === 'MIN') {
            ListMain = await getDataSupForChartColumn_Min(P_FACTORY, P_MONTH)
        } else {
            ListMain = await getDataSupForChartColumn(P_FACTORY, P_MONTH)
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


module.exports.getFacSupForChartColumneExport = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const P_RPT_TYPE = req.query.P_RPT_TYPE

        let ListMain;

        if (P_RPT_TYPE === 'MIN') {
            ListMain = await getDataSupForChartColumn_Min(P_FACTORY, P_MONTH)
        } else {
            ListMain = await getDataSupForChartColumn(P_FACTORY, P_MONTH)
        }

        let data = [];
        ListMain.forEach(item => {
            data.push({
                SLEC_MGR_REFER: item.RFT_MGR,
                SUPERVISOR: item.RFT_SUP,
                ACTUAL_SCORE: item.RFT_ACTUAL_SCORE
            });
        })


        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getCountMGR = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += `  SELECT COUNT(DISTINCT HTS.SLECH_MGR_REFER) AS COUNT_MGR `;
        query += `    FROM SLEC_TRANS_HEADER HTS `;
        query += `   WHERE 1 = 1 `;
        query += `     AND HTS.SLECH_STATUS = '50' `;
        query += `     AND HTS.SLECH_FACTORY = '${P_FACTORY}' `;
        query += `     AND TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}' `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        res.json(result.rows[0][0]);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

async function getDataMGRForChartColumn(P_FACTORY, P_MONTH) {
    try {

        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += `   SELECT H.SLECH_MGR_REFER,ROUND((SUM(S.SLECD_ACTUAL_SCORE) / SUM(S.SLECD_FULL_SCORE)) * 100,2) AS SCORE_ACH `;
        query += `     FROM SLEC_TRANS_SUPERVISOR S `;
        query += `    INNER JOIN SLEC_TRANS_HEADER H ON H.SLECH_NO = S.SLECD_NO `;
        query += `    WHERE 1 = 1 `;
        query += `      AND H.SLECH_STATUS = '50' `;
        query += `      AND H.SLECH_FACTORY = '${P_FACTORY}' `;
        query += `      AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}' `;
        query += `    GROUP BY H.SLECH_MGR_REFER `;
        query += `    ORDER BY SCORE_ACH DESC `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        if (!result.rows || !Array.isArray(result.rows) || result.rows.length === 0) {
            return [];
        } else {
            const data = await Promise.all(result.rows.map(async (row) => {

                return {
                    RFT_MGR: row[0],
                    RFT_SCORE_ACH: row[1]
                };
            }));

            return data;
        }


    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return [];
    }
};

module.exports.getFacMGRForChartColumn = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const P_RPT_TYPE = req.query.P_RPT_TYPE

        let ListMain;

        if (P_RPT_TYPE === 'MIN') {
            ListMain = await getDataMGRForChartColumn_Min(P_FACTORY, P_MONTH)
        } else {
            ListMain = await getDataMGRForChartColumn(P_FACTORY, P_MONTH)
        }


        const labels = ListMain.map(item => item.RFT_MGR);
        const dataValues = ListMain.map(item => item.RFT_SCORE_ACH);

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

module.exports.getFacMGRForChartColumnExport = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const P_RPT_TYPE = req.query.P_RPT_TYPE

        let ListMain;

        if (P_RPT_TYPE === 'MIN') {
            ListMain = await getDataMGRForChartColumn_Min(P_FACTORY, P_MONTH)
        } else {
            ListMain = await getDataMGRForChartColumn(P_FACTORY, P_MONTH)
        }

        let data = [];
        ListMain.forEach(item => {
            data.push({
                SLEC_MGR_REFER: item.RFT_MGR,
                ACTUAL_SCORE: item.RFT_SCORE_ACH
            });
        })



        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getFacDetail = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_FISICAL_YEAR = req.query.P_FISICAL_YEAR
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` 	SELECT TC.TYPE_DESC AS ITEM,	`;
        query += ` 	       MC.SQUESTC_CODE AS CODE,	`;
        query += ` 	       MC.SQUESTC_DESC_THAI,	`;
        query += ` 	       MC.SQUESTC_DESC_ENG,	`;
        query += ` 	       MC.SQUESTC_FULL_SCORE AS WEIGHT,	`;
        query += ` 	       (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	            ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	         WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	           AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	           AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}04') AS APR,	`;
        query += ` 	       (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	            ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	         WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	           AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	           AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}05') AS MAY,	`;
        query += ` 	       (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	            ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	         WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	           AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	           AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}06') AS JUN,	`;
        query += ` 	       (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	            ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	         WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	           AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	           AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}07') AS JUL,	`;
        query += ` 	       (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	            ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	         WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	           AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	           AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}08') AS AUG,	`;
        query += ` 	       (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	            ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	         WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	           AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	           AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}09') AS SEP,	`;
        query += ` 	       (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	            ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	         WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	           AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	           AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}10') AS OCT,	`;
        query += ` 	       (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	            ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	         WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	           AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	           AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}11') AS NOV,	`;
        query += ` 	       (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	            ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	         WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	           AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	           AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}12') AS DEC,	`;
        query += ` 	       (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	            ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	         WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	           AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	           AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR + 1}01') AS JAN,	`;
        query += ` 	       (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	            ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	         WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	           AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	           AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR + 1}02') AS FEB,	`;
        query += ` 	       (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	            ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	         WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	           AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	           AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR + 1}03') AS MAR,	`;
        query += ` 	       (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	            ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	         WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	           AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	           AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND (TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') >= '${P_FISICAL_YEAR}04' OR	`;
        query += ` 	               TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') <= '${P_FISICAL_YEAR + 1}03')) AS AVG,	`;
        query += ` 	       CAST(MC.SQUESTC_SEQ_QUESTION AS INTEGER) AS SQUESTC_SEQ_QUESTION	`;
        query += ` 	  FROM SLEC_MSTR_QUES_CHECKPOINT MC	`;
        query += ` 	 INNER JOIN SLEC_MSTR_TYPE_POINT TC	`;
        query += ` 	    ON TC.TYPE_CODE = MC.SQUESTC_TYPE	`;
        query += ` 	 WHERE MC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	UNION	`;
        query += ` 	SELECT '' AS ITEM,	`;
        query += ` 	       '999' AS CODE,	`;
        query += ` 	       'รวม' AS SQUESTC_DESC_THAI,	`;
        query += ` 	       'Sum' AS SQUESTC_DESC_ENG,	`;
        query += ` 	       SUM(WEIGHT) AS WEIGHT,	`;
        query += ` 	       SUM(APR) AS APR,	`;
        query += ` 	       SUM(MAY) AS MAY,	`;
        query += ` 	       SUM(JUN) AS JUN,	`;
        query += ` 	       SUM(JUL) AS JUL,	`;
        query += ` 	       SUM(AUG) AS AUG,	`;
        query += ` 	       SUM(SEP) AS SEP,	`;
        query += ` 	       SUM(OCT) AS OCT,	`;
        query += ` 	       SUM(NOV) AS NOV,	`;
        query += ` 	       SUM(DEC) AS DEC,	`;
        query += ` 	       SUM(JAN) AS JAN,	`;
        query += ` 	       SUM(FEB) AS FEB,	`;
        query += ` 	       SUM(MAR) AS MAR,	`;
        query += ` 	       SUM(AVG) AS AVG,	`;
        query += ` 	       999 AS SQUESTC_SEQ_QUESTION	`;
        query += ` 	  FROM (SELECT TC.TYPE_DESC AS ITEM,	`;
        query += ` 	               MC.SQUESTC_CODE AS CODE,	`;
        query += ` 	               MC.SQUESTC_DESC_THAI,	`;
        query += ` 	               MC.SQUESTC_DESC_ENG,	`;
        query += ` 	               MC.SQUESTC_FULL_SCORE AS WEIGHT,	`;
        query += ` 	               (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	                    ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	                 WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                   AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	                   AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}04') AS APR,	`;
        query += ` 	               (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	                    ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	                 WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                   AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	                   AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}05') AS MAY,	`;
        query += ` 	               (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	                    ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	                 WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                   AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	                   AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}06') AS JUN,	`;
        query += ` 	               (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	                    ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	                 WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                   AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	                   AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}07') AS JUL,	`;
        query += ` 	               (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	                    ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	                 WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                   AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	                   AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}08') AS AUG,	`;
        query += ` 	               (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	                    ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	                 WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                   AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	                   AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}09') AS SEP,	`;
        query += ` 	               (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	                    ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	                 WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                   AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	                   AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}10') AS OCT,	`;
        query += ` 	               (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	                    ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	                 WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                   AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	                   AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}11') AS NOV,	`;
        query += ` 	               (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	                    ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	                 WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                   AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	                   AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}12') AS DEC,	`;
        query += ` 	               (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	                    ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	                 WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                   AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	                   AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR + 1}01') AS JAN,	`;
        query += ` 	               (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	                    ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	                 WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                   AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	                   AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR + 1}02') AS FEB,	`;
        query += ` 	               (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	                    ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	                 WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                   AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	                   AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR + 1}03') AS MAR,	`;
        query += ` 	               (SELECT ROUND(SUM(SC.SLECC_SCORE) / COUNT(SC.SLECC_SCORE), 1)	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER TH	`;
        query += ` 	                    ON TH.SLECH_NO = SC.SLECC_NO	`;
        query += ` 	                 WHERE SC.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                   AND SC.SLECC_REV = MC.SQUESTC_REV	`;
        query += ` 	                   AND TH.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND (TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') >= '${P_FISICAL_YEAR}04' OR	`;
        query += ` 	                       TO_CHAR(TH.SLECH_CHECK_DATE, 'YYYYMM') <= '${P_FISICAL_YEAR + 1}03')) AS AVG	`;
        query += ` 	          FROM SLEC_MSTR_QUES_CHECKPOINT MC	`;
        query += ` 	         INNER JOIN SLEC_MSTR_TYPE_POINT TC	`;
        query += ` 	            ON TC.TYPE_CODE = MC.SQUESTC_TYPE	`;
        query += ` 	         WHERE MC.SQUESTC_STATUS = 'Active') SM	`;
        query += ` 	 ORDER BY SQUESTC_SEQ_QUESTION	`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        let checkItem = '';
        let itemName = '';
        const data = await Promise.all(result.rows.map(async (row) => {
            if (row[0] !== checkItem) {
                itemName = row[0]
                checkItem = row[0]
            } else {
                itemName = ''
            }
            return {
                RFT_TYPE_DESC: itemName || '',
                RFT_QUEST_TH: row[2],
                RFT_QUEST_ENG: row[3],
                RFT_WEIGTH: row[4] || 0,
                RFT_APR: row[5] || 0,
                RFT_MAY: row[6] || 0,
                RFT_JUN: row[7] || 0,
                RFT_JUL: row[8] || 0,
                RFT_AUG: row[9] || 0,
                RFT_SEP: row[10] || 0,
                RFT_OCT: row[11] || 0,
                RFT_NOV: row[12] || 0,
                RFT_DEC: row[13] || 0,
                RFT_JAN: row[14] || 0,
                RFT_FEB: row[15] || 0,
                RFT_MAR: row[16] || 0,
                RFT_AVG: row[17] || 0
            };
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};


module.exports.getFacSupForTable_Min = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
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
        query += ` 	                      GROUP BY C.SLECC_SEQ_QUESTION, QC.SQUESTC_FULL_SCORE) AS RFT_SCORE_ACTUAL	`;
        query += ` 	               FROM SLEC_TRANS_SUP_CHECKPOINT TD	`;
        query += ` 	              INNER JOIN SLEC_TRANS_HEADER HD	`;
        query += ` 	                 ON HD.SLECH_NO = TD.SLECC_NO	`;
        query += ` 	              WHERE 1 = 1	`;
        query += ` 	                AND HD.SLECH_STATUS = '50'	`;
        query += ` 	                AND HD.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                AND TO_CHAR(HD.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += ` 	              GROUP BY TD.SLECC_TYPE,	`;
        query += ` 	                       HD.SLECH_STATUS,	`;
        query += ` 	                       HD.SLECH_FACTORY,	`;
        query += ` 	                       TO_CHAR(HD.SLECH_CHECK_DATE, 'YYYYMM')	`;
        query += ` 	              ORDER BY TD.SLECC_TYPE) A	`;
        query += ` 	    ON A.SLECC_TYPE = T.SLFULL_TYPE	`;
        query += ` 	 WHERE 1 = 1	`;
        query += ` 	   AND H.SLECH_STATUS = '50'	`;
        query += ` 	   AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	   AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
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
        query += ` 	                             GROUP BY C.SLECC_SEQ_QUESTION,	`;
        query += ` 	                                      QC.SQUESTC_FULL_SCORE) AS RFT_SCORE_ACTUAL	`;
        query += ` 	                      FROM SLEC_TRANS_SUP_CHECKPOINT TD	`;
        query += ` 	                     INNER JOIN SLEC_TRANS_HEADER HD	`;
        query += ` 	                        ON HD.SLECH_NO = TD.SLECC_NO	`;
        query += ` 	                     WHERE 1 = 1	`;
        query += ` 	                       AND HD.SLECH_STATUS = '50'	`;
        query += ` 	                       AND HD.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                       AND TO_CHAR(HD.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += ` 	                     GROUP BY TD.SLECC_TYPE,	`;
        query += ` 	                              HD.SLECH_STATUS,	`;
        query += ` 	                              HD.SLECH_FACTORY,	`;
        query += ` 	                              TO_CHAR(HD.SLECH_CHECK_DATE, 'YYYYMM')	`;
        query += ` 	                     ORDER BY TD.SLECC_TYPE) A	`;
        query += ` 	            ON A.SLECC_TYPE = T.SLFULL_TYPE	`;
        query += ` 	         WHERE 1 = 1	`;
        query += ` 	           AND H.SLECH_STATUS = '50'	`;
        query += ` 	           AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
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

async function getDataForChartPic_Min(P_FACTORY, P_MONTH) {
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
        query += ` 	                      GROUP BY C.SLECC_SEQ_QUESTION, QC.SQUESTC_FULL_SCORE) AS RFT_SCORE_ACTUAL	`;
        query += ` 	               FROM SLEC_TRANS_SUP_CHECKPOINT TD	`;
        query += ` 	              INNER JOIN SLEC_TRANS_HEADER HD	`;
        query += ` 	                 ON HD.SLECH_NO = TD.SLECC_NO	`;
        query += ` 	              WHERE 1 = 1	`;
        query += ` 	                AND HD.SLECH_STATUS = '50'	`;
        query += ` 	                AND HD.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                AND TO_CHAR(HD.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += ` 	              GROUP BY TD.SLECC_TYPE,	`;
        query += ` 	                       HD.SLECH_STATUS,	`;
        query += ` 	                       HD.SLECH_FACTORY,	`;
        query += ` 	                       TO_CHAR(HD.SLECH_CHECK_DATE, 'YYYYMM')	`;
        query += ` 	              ORDER BY TD.SLECC_TYPE) A	`;
        query += ` 	    ON A.SLECC_TYPE = T.SLFULL_TYPE	`;
        query += ` 	 WHERE 1 = 1	`;
        query += ` 	   AND H.SLECH_STATUS = '50'	`;
        query += ` 	   AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	   AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
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

async function getDataSupForChartColumn_Min(P_FACTORY, P_MONTH) {
    try {

        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` 	   SELECT HTS.SLECH_MGR_REFER, TS.SLECD_EMPLOYEE_ID || ' : ' || HT.ENAME || ' ' || HT.ESURNAME AS SLECD_EMPLOYEE_ID,	`;
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
        query += ` 	            WHERE 1 = 1	`;
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
        query += ` 	    GROUP BY TS.SLECD_EMPLOYEE_ID, HT.ENAME, HT.ESURNAME, TO_CHAR(HTS.SLECH_CHECK_DATE, 'YYYYMM'), HTS.SLECH_MGR_REFER	`;
        query += ` 	    ORDER BY SLECD_ACTUAL_SCORE DESC	`;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        if (!result.rows || !Array.isArray(result.rows) || result.rows.length === 0) {
            return [];
        } else {
            const data = await Promise.all(result.rows.map(async (row) => {

                return {
                    RFT_MGR: row[0],
                    RFT_SUP: row[1],
                    RFT_ACTUAL_SCORE: row[2]
                };
            }));

            return data;
        }


    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return [];
    }
};

async function getDataMGRForChartColumn_Min(P_FACTORY, P_MONTH) {
    try {

        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` 	   SELECT H.SLECH_MGR_REFER,	`;
        query += ` 	          (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                             COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                             QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                             QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                             0)) AS TESTEIEI	`;
        query += ` 	             FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	            INNER JOIN SLEC_TRANS_HEADER H1 ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	            INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	            WHERE H1.SLECH_MGR_REFER = H.SLECH_MGR_REFER	`;
        query += ` 	              AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM')	`;
        query += ` 	              AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	              AND H1.SLECH_STATUS = '50'	`;
        query += ` 	            GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                     QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                     H1.SLECH_STATUS) AS SCORE_ACH	`;
        query += ` 	     FROM SLEC_TRANS_SUPERVISOR S	`;
        query += ` 	    INNER JOIN SLEC_TRANS_HEADER H	`;
        query += ` 	       ON H.SLECH_NO = S.SLECD_NO	`;
        query += ` 	    WHERE 1 = 1	`;
        query += ` 	      AND H.SLECH_STATUS = '50'	`;
        query += ` 	      AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	      AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += ` 	    GROUP BY H.SLECH_MGR_REFER, TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM')	`;
        query += ` 	    ORDER BY SCORE_ACH DESC	`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        if (!result.rows || !Array.isArray(result.rows) || result.rows.length === 0) {
            return [];
        } else {
            const data = await Promise.all(result.rows.map(async (row) => {

                return {
                    RFT_MGR: row[0],
                    RFT_SCORE_ACH: row[1]
                };
            }));

            return data;
        }


    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return [];
    }
};

module.exports.getFacDetail_Min = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_FISICAL_YEAR = req.query.P_FISICAL_YEAR
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` 	SELECT TC.TYPE_DESC AS ITEM,	`;
        query += ` 	       MC.SQUESTC_CODE AS CODE,	`;
        query += ` 	       MC.SQUESTC_DESC_THAI,	`;
        query += ` 	       MC.SQUESTC_DESC_ENG,	`;
        query += ` 	       MC.SQUESTC_FULL_SCORE AS WEIGHT,	`;
        query += ` 	       (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                          COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          0)) AS TESTEIEI	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	            ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	         INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	            ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	         WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}04'	`;
        query += ` 	           AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	           AND H1.SLECH_STATUS = '50'	`;
        query += ` 	           AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	         GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                  H1.SLECH_STATUS) AS APR,	`;
        query += ` 	       (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                          COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          0)) AS TESTEIEI	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	            ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	         INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	            ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	         WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}05'	`;
        query += ` 	           AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	           AND H1.SLECH_STATUS = '50'	`;
        query += ` 	           AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	         GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                  H1.SLECH_STATUS) AS MAY,	`;
        query += ` 	       (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                          COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          0)) AS TESTEIEI	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	            ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	         INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	            ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	         WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}06'	`;
        query += ` 	           AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	           AND H1.SLECH_STATUS = '50'	`;
        query += ` 	           AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	         GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                  H1.SLECH_STATUS) AS JUN,	`;
        query += ` 	       (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                          COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          0)) AS TESTEIEI	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	            ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	         INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	            ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	         WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}07'	`;
        query += ` 	           AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	           AND H1.SLECH_STATUS = '50'	`;
        query += ` 	           AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	         GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                  H1.SLECH_STATUS) AS JUL,	`;
        query += ` 	       (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                          COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          0)) AS TESTEIEI	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	            ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	         INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	            ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	         WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}08'	`;
        query += ` 	           AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	           AND H1.SLECH_STATUS = '50'	`;
        query += ` 	           AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	         GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                  H1.SLECH_STATUS) AS AUG,	`;
        query += ` 	       (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                          COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          0)) AS TESTEIEI	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	            ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	         INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	            ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	         WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}09'	`;
        query += ` 	           AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	           AND H1.SLECH_STATUS = '50'	`;
        query += ` 	           AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	         GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                  H1.SLECH_STATUS) AS SEP,	`;
        query += ` 	       (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                          COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          0)) AS TESTEIEI	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	            ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	         INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	            ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	         WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}10'	`;
        query += ` 	           AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	           AND H1.SLECH_STATUS = '50'	`;
        query += ` 	           AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	         GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                  H1.SLECH_STATUS) AS OCT,	`;
        query += ` 	       (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                          COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          0)) AS TESTEIEI	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	            ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	         INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	            ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	         WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}11'	`;
        query += ` 	           AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	           AND H1.SLECH_STATUS = '50'	`;
        query += ` 	           AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	         GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                  H1.SLECH_STATUS) AS NOV,	`;
        query += ` 	       (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                          COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          0)) AS TESTEIEI	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	            ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	         INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	            ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	         WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}12'	`;
        query += ` 	           AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	           AND H1.SLECH_STATUS = '50'	`;
        query += ` 	           AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	         GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                  H1.SLECH_STATUS) AS DEC,	`;
        query += ` 	       (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                          COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          0)) AS TESTEIEI	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	            ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	         INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	            ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	         WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR + 1}01'	`;
        query += ` 	           AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	           AND H1.SLECH_STATUS = '50'	`;
        query += ` 	           AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	         GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                  H1.SLECH_STATUS) AS JAN,	`;
        query += ` 	       (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                          COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          0)) AS TESTEIEI	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	            ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	         INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	            ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	         WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR + 1}02'	`;
        query += ` 	           AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	           AND H1.SLECH_STATUS = '50'	`;
        query += ` 	           AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	         GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                  H1.SLECH_STATUS) AS FEB,	`;
        query += ` 	       (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                          COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          0)) AS TESTEIEI	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	            ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	         INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	            ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	         WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR + 1}03'	`;
        query += ` 	           AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	           AND H1.SLECH_STATUS = '50'	`;
        query += ` 	           AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	         GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                  H1.SLECH_STATUS) AS MAR,	`;
        query += ` 	       (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                          COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          0)) AS TESTEIEI	`;
        query += ` 	          FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	         INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	            ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	         INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	            ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	         WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	           AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	           AND H1.SLECH_STATUS = '50'	`;
        query += ` 	           AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	           AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') >= '${P_FISICAL_YEAR}04'	`;
        query += ` 	           AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') <= '${P_FISICAL_YEAR + 1}03'	`;
        query += ` 	         GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                  H1.SLECH_STATUS) AS AVG,	`;
        query += ` 	       CAST(MC.SQUESTC_SEQ_QUESTION AS INTEGER) AS SQUESTC_SEQ_QUESTION	`;
        query += ` 	  FROM SLEC_MSTR_QUES_CHECKPOINT MC	`;
        query += ` 	 INNER JOIN SLEC_MSTR_TYPE_POINT TC	`;
        query += ` 	    ON TC.TYPE_CODE = MC.SQUESTC_TYPE	`;
        query += ` 	 WHERE MC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	UNION	`;
        query += ` 	SELECT '' AS ITEM,	`;
        query += ` 	       '999' AS CODE,	`;
        query += ` 	       'รวม' AS SQUESTC_DESC_THAI,	`;
        query += ` 	       'Sum' AS SQUESTC_DESC_ENG,	`;
        query += ` 	       SUM(WEIGHT) AS WEIGHT,	`;
        query += ` 	       SUM(APR) AS APR,	`;
        query += ` 	       SUM(MAY) AS MAY,	`;
        query += ` 	       SUM(JUN) AS JUN,	`;
        query += ` 	       SUM(JUL) AS JUL,	`;
        query += ` 	       SUM(AUG) AS AUG,	`;
        query += ` 	       SUM(SEP) AS SEP,	`;
        query += ` 	       SUM(OCT) AS OCT,	`;
        query += ` 	       SUM(NOV) AS NOV,	`;
        query += ` 	       SUM(DEC) AS DEC,	`;
        query += ` 	       SUM(JAN) AS JAN,	`;
        query += ` 	       SUM(FEB) AS FEB,	`;
        query += ` 	       SUM(MAR) AS MAR,	`;
        query += ` 	       SUM(AVG) AS AVG,	`;
        query += ` 	       999 AS SQUESTC_SEQ_QUESTION	`;
        query += ` 	  FROM (SELECT TC.TYPE_DESC AS ITEM,	`;
        query += ` 	               MC.SQUESTC_CODE AS CODE,	`;
        query += ` 	               MC.SQUESTC_DESC_THAI,	`;
        query += ` 	               MC.SQUESTC_DESC_ENG,	`;
        query += ` 	               MC.SQUESTC_FULL_SCORE AS WEIGHT,	`;
        query += ` 	               (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                                  COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  0)) AS TESTEIEI	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	                    ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	                 INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	                    ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	                 WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}04'	`;
        query += ` 	                   AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	                   AND H1.SLECH_STATUS = '50'	`;
        query += ` 	                   AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                 GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          H1.SLECH_STATUS) AS APR,	`;
        query += ` 	               (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                                  COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  0)) AS TESTEIEI	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	                    ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	                 INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	                    ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	                 WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}05'	`;
        query += ` 	                   AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	                   AND H1.SLECH_STATUS = '50'	`;
        query += ` 	                   AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                 GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          H1.SLECH_STATUS) AS MAY,	`;
        query += ` 	               (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                                  COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  0)) AS TESTEIEI	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	                    ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	                 INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	                    ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	                 WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}06'	`;
        query += ` 	                   AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	                   AND H1.SLECH_STATUS = '50'	`;
        query += ` 	                   AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                 GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          H1.SLECH_STATUS) AS JUN,	`;
        query += ` 	               (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                                  COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  0)) AS TESTEIEI	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	                    ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	                 INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	                    ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	                 WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}07'	`;
        query += ` 	                   AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	                   AND H1.SLECH_STATUS = '50'	`;
        query += ` 	                   AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                 GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          H1.SLECH_STATUS) AS JUL,	`;
        query += ` 	               (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                                  COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  0)) AS TESTEIEI	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	                    ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	                 INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	                    ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	                 WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}08'	`;
        query += ` 	                   AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	                   AND H1.SLECH_STATUS = '50'	`;
        query += ` 	                   AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                 GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          H1.SLECH_STATUS) AS AUG,	`;
        query += ` 	               (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                                  COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  0)) AS TESTEIEI	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	                    ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	                 INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	                    ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	                 WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}09'	`;
        query += ` 	                   AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	                   AND H1.SLECH_STATUS = '50'	`;
        query += ` 	                   AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                 GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          H1.SLECH_STATUS) AS SEP,	`;
        query += ` 	               (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                                  COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  0)) AS TESTEIEI	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	                    ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	                 INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	                    ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	                 WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}10'	`;
        query += ` 	                   AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	                   AND H1.SLECH_STATUS = '50'	`;
        query += ` 	                   AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                 GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          H1.SLECH_STATUS) AS OCT,	`;
        query += ` 	               (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                                  COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  0)) AS TESTEIEI	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	                    ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	                 INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	                    ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	                 WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}11'	`;
        query += ` 	                   AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	                   AND H1.SLECH_STATUS = '50'	`;
        query += ` 	                   AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                 GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          H1.SLECH_STATUS) AS NOV,	`;
        query += ` 	               (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                                  COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  0)) AS TESTEIEI	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	                    ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	                 INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	                    ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	                 WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR}12'	`;
        query += ` 	                   AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	                   AND H1.SLECH_STATUS = '50'	`;
        query += ` 	                   AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                 GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          H1.SLECH_STATUS) AS DEC,	`;
        query += ` 	               (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                                  COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  0)) AS TESTEIEI	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	                    ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	                 INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	                    ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	                 WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR + 1}01'	`;
        query += ` 	                   AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	                   AND H1.SLECH_STATUS = '50'	`;
        query += ` 	                   AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                 GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          H1.SLECH_STATUS) AS JAN,	`;
        query += ` 	               (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                                  COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  0)) AS TESTEIEI	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	                    ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	                 INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	                    ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	                 WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR + 1}02'	`;
        query += ` 	                   AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	                   AND H1.SLECH_STATUS = '50'	`;
        query += ` 	                   AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                 GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          H1.SLECH_STATUS) AS FEB,	`;
        query += ` 	               (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                                  COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  0)) AS TESTEIEI	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	                    ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	                 INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	                    ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	                 WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') = '${P_FISICAL_YEAR + 1}03'	`;
        query += ` 	                   AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	                   AND H1.SLECH_STATUS = '50'	`;
        query += ` 	                   AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                 GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          H1.SLECH_STATUS) AS MAR,	`;
        query += ` 	               (SELECT SUM(DECODE(SUM(SP1.SLECC_SCORE) /	`;
        query += ` 	                                  COUNT(SP1.SLECC_EMPLOYEE_ID),	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                                  0)) AS TESTEIEI	`;
        query += ` 	                  FROM SLEC_TRANS_SUP_CHECKPOINT SP1	`;
        query += ` 	                 INNER JOIN SLEC_TRANS_HEADER H1	`;
        query += ` 	                    ON SP1.SLECC_NO = H1.SLECH_NO	`;
        query += ` 	                 INNER JOIN SLEC_MSTR_QUES_CHECKPOINT QC	`;
        query += ` 	                    ON QC.SQUESTC_SEQ_QUESTION = SP1.SLECC_SEQ_QUESTION	`;
        query += ` 	                 WHERE H1.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += ` 	                   AND QC.SQUESTC_STATUS = 'Active'	`;
        query += ` 	                   AND H1.SLECH_STATUS = '50'	`;
        query += ` 	                   AND SP1.SLECC_SEQ_QUESTION = MC.SQUESTC_SEQ_QUESTION	`;
        query += ` 	                   AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') >= '${P_FISICAL_YEAR}04'	`;
        query += ` 	                   AND TO_CHAR(H1.SLECH_CHECK_DATE, 'YYYYMM') <= '${P_FISICAL_YEAR + 1}03'	`;
        query += ` 	                 GROUP BY SP1.SLECC_SEQ_QUESTION,	`;
        query += ` 	                          QC.SQUESTC_FULL_SCORE,	`;
        query += ` 	                          H1.SLECH_STATUS) AS AVG	`;
        query += ` 	          FROM SLEC_MSTR_QUES_CHECKPOINT MC	`;
        query += ` 	         INNER JOIN SLEC_MSTR_TYPE_POINT TC	`;
        query += ` 	            ON TC.TYPE_CODE = MC.SQUESTC_TYPE	`;
        query += ` 	         WHERE MC.SQUESTC_STATUS = 'Active') SM	`;
        query += ` 	 ORDER BY SQUESTC_SEQ_QUESTION	`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        let checkItem = '';
        let itemName = '';
        const data = await Promise.all(result.rows.map(async (row) => {
            if (row[0] !== checkItem) {
                itemName = row[0]
                checkItem = row[0]
            } else {
                itemName = ''
            }
            return {
                RFT_TYPE_DESC: itemName || '',
                RFT_QUEST_TH: row[2],
                RFT_QUEST_ENG: row[3],
                RFT_WEIGTH: row[4] || 0,
                RFT_APR: row[5] || 0,
                RFT_MAY: row[6] || 0,
                RFT_JUN: row[7] || 0,
                RFT_JUL: row[8] || 0,
                RFT_AUG: row[9] || 0,
                RFT_SEP: row[10] || 0,
                RFT_OCT: row[11] || 0,
                RFT_NOV: row[12] || 0,
                RFT_DEC: row[13] || 0,
                RFT_JAN: row[14] || 0,
                RFT_FEB: row[15] || 0,
                RFT_MAR: row[16] || 0,
                RFT_AVG: row[17] || 0
            };
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.getFacMGRExport = async function (req, res) {
    try {
        const P_FACTORY = req.query.P_FACTORY
        const P_MONTH = req.query.P_MONTH
        const P_RPT_TYPE = req.query.P_RPT_TYPE

        let ListMain;

        // if (P_RPT_TYPE === 'MIN') {
        //     ListMain = await getDataMGRForChartColumn_Min(P_FACTORY, P_MONTH)
        // } else {
             ListMain = await getDataMGRExport(P_FACTORY, P_MONTH)
        // }

        res.json(ListMain);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

async function getDataMGRExport(P_FACTORY, P_MONTH) {
    try {

        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += `	SELECT H.SLECH_MGR_REFER,	`;
        query += `	       SC.SLECC_TYPE,	`;
        query += `	       TY.TYPE_DESC,	`;
        query += `	       TY.TYPE_SCORE AS MGR_FULL_SCORE,	`;
        query += `	       ROUND(SUM(SC.SLECC_SCORE) /	`;
        query += `	       (SELECT COUNT(DISTINCT SC2.SLECC_EMPLOYEE_ID)	`;
        query += `	          FROM SLEC_TRANS_SUP_CHECKPOINT SC2	`;
        query += `	         INNER JOIN SLEC_TRANS_HEADER H2	`;
        query += `	            ON H2.SLECH_NO = SC2.SLECC_NO	`;
        query += `	         WHERE 1 = 1	`;
        query += `	           AND H2.SLECH_STATUS = '50'	`;
        query += `	           AND H2.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += `	           AND TO_CHAR(H2.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += `	           AND H2.SLECH_MGR_REFER = H.SLECH_MGR_REFER),2) AS MGR_ACTUAL_SCORE	`;
        query += `	  FROM SLEC_TRANS_SUP_CHECKPOINT SC	`;
        query += `	 INNER JOIN SLEC_TRANS_HEADER H ON H.SLECH_NO = SC.SLECC_NO	`;
        query += `	 INNER JOIN SLEC_MSTR_TYPE_POINT TY ON TY.TYPE_CODE = SC.SLECC_TYPE	`;
        query += `	 WHERE 1 = 1	`;
        query += `	   AND H.SLECH_STATUS = '50'	`;
        query += `	   AND H.SLECH_FACTORY = '${P_FACTORY}'	`;
        query += `	   AND TO_CHAR(H.SLECH_CHECK_DATE, 'YYYYMM') = '${P_MONTH}'	`;
        query += `	 GROUP BY H.SLECH_MGR_REFER, SC.SLECC_TYPE, TY.TYPE_DESC, TY.TYPE_SCORE	`;
        query += `	 ORDER BY H.SLECH_MGR_REFER, SC.SLECC_TYPE	`;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        if (!result.rows || !Array.isArray(result.rows) || result.rows.length === 0) {
            return [];
        } else {
            const data = await Promise.all(result.rows.map(async (row) => {

                return {
                    SLEC_MGR_REFER: row[0],
                    TYPE_CODE: row[1],
                    TYPE_DESC: row[2],
                    TYPE_SCORE: row[3],
                    TYPE_ACTUAL: row[4]
                };
            }));

            return data;
        }


    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return [];
    }
};
