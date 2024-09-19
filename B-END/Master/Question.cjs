const { ConnectOracleDB, DisconnectOracleDB } = require("../Common/DBconnection.cjs");

const oracledb = require("oracledb");
require("dotenv").config();

module.exports.getQuestionMstr = async function (req, res) {
    try {
        const P_REV = req.query.P_REV
        const P_TYPE = req.query.P_TYPE
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += `  SELECT T.SQUESTC_REV AS MSP_REV, `;
        query += `         DECODE(T.SQUESTC_CODE,'1',T.SQUESTC_TYPE || '\n' || P.TYPE_DESC,'') AS MSP_TYPE, `;
        query += `         T.SQUESTC_CODE AS MSP_CODE, `;
        query += `         T.SQUESTC_DESC_THAI AS MSP_QUEST_TH, `;
        query += `         T.SQUESTC_DESC_ENG AS MSP_QUEST_EN, `;
        query += `         T.SQUESTC_ASKWER AS MSP_ASKWER, `;
        query += `         T.SQUESTC_STATUS AS MSP_STATUS, `;
        query += `         T.SQUESTC_TYPE AS MSP_TYPE_CODE, `;
        query += `         DECODE(T.SQUESTC_CODE,'1',T.SQUESTC_REV,'') AS MSP_REV_SHOW, `;
        query += `         P.TYPE_DESC AS MSP_TYPE_DESC `;
        query += `    FROM SLEC_MSTR_QUES_CHECKPOINT T `;
        query += `    LEFT JOIN SLEC_MSTR_TYPE_POINT P ON P.TYPE_CODE = T.SQUESTC_TYPE `;
        query += `    WHERE 1 = 1 `;
        query += `      AND (T.SQUESTC_REV = '${P_REV}' OR ('${P_REV}' IS NULL AND T.SQUESTC_STATUS = 'Active')) `;
        query += `      AND (T.SQUESTC_TYPE = '${P_TYPE}' OR '${P_TYPE}' IS NULL) `;
        query += ` ORDER BY T.SQUESTC_TYPE, CAST(T.SQUESTC_CODE AS INTEGER), CAST(T.SQUESTC_SEQ_QUESTION AS INTEGER) `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = await Promise.all(result.rows.map(async (row) => {
            let STC_CHOICE = await getChoice(row[2], row[7], row[0])

            return {
                MSP_REV: row[0],
                MSP_TYPE: row[1],
                MSP_CODE: row[2],
                MSP_QUEST_TH: row[3],
                MSP_QUEST_EN: row[4],
                MSP_ASKWER: row[5],
                MSP_CHOICE: STC_CHOICE,
                SQUESTC_STATUS: row[6],
                MSP_REV_SHOW: row[8],
                MSP_TYPE_CODE: row[7],
                MSP_TYPE_DESC: row[9],
            };
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

async function getChoice(CODE, TYPE, REV) {
    try {

        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += `  SELECT PC.SQUESTAS_SCORE AS MSP_SCORE, `;
        query += `         PC.SQUESTAS_CHSEQ AS MSP_CHOICE, `;
        query += `         PC.SQUESTAS_DESC_THAI AS MSP_CHOICE_TH, `;
        query += `         PC.SQUESTAS_DESC_ENG AS MSP_CHOICE_EN `;
        query += `    FROM SLEC_MSTR_CHOICE_CHECKPOINT PC `;
        query += `    WHERE 1 = 1 `;
        query += `      AND PC.SQUESTAS_CODE = '${CODE}'  `;
        query += `      AND PC.SQUESTAS_TYPE = '${TYPE}'  `;
        query += `      AND PC.SQUESTAS_REV = ${REV} `;
        query += ` ORDER BY PC.SQUESTAS_CHSEQ  `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);

        if (!result.rows || !Array.isArray(result.rows) || result.rows.length === 0) {
            return [];
        } else {
            const data = await Promise.all(result.rows.map(async (row) => {
                return {
                    MSP_SCORE: row[0],
                    MSP_CHOICE: row[1],
                    MSP_CHOICE_TH: row[2],
                    MSP_CHOICE_EN: row[3]
                };
            }));

            return data;
        }


    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        return [];
    }
};

module.exports.getRevisonQuest = async function (req, res) {
    try {
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` SELECT DISTINCT T.SQUESTC_REV FROM SLEC_MSTR_QUES_CHECKPOINT T ORDER BY CAST(T.SQUESTC_REV AS INTEGER) `;
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

module.exports.getRevisonActive = async function (req, res) {
    try {
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += `  SELECT DISTINCT T.SQUESTC_REV FROM SLEC_MSTR_QUES_CHECKPOINT T WHERE T.SQUESTC_STATUS = 'Active' ORDER BY CAST(T.SQUESTC_REV AS INTEGER) `;
        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        res.json(result.rows[0][0]);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.changeRev = async function (req, res) {
    let connect;
    try {
        const P_REV = req.query.P_REV
        connect = await ConnectOracleDB("GC");
        let query = ``;
        query = ``;
        query = ` UPDATE SLEC_MSTR_QUES_CHECKPOINT T
                     SET T.SQUESTC_STATUS = 'Active'
                   WHERE T.SQUESTC_REV = :1 `;
        await connect.execute(query, [P_REV]);

        query = ``;
        query = ` UPDATE SLEC_MSTR_QUES_CHECKPOINT T
                     SET T.SQUESTC_STATUS = 'Inactive'
                   WHERE T.SQUESTC_REV != :1 `;
        await connect.execute(query, [P_REV]);

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


module.exports.getTempExport = async function (req, res) {
    try {
        const connect = await ConnectOracleDB("GC");
        let query = "";
        query += ` 	SELECT ROW_NUMBER() OVER(ORDER BY T.SQUESTC_TYPE, CAST(T.SQUESTC_CODE AS INTEGER), C.SQUESTAS_CHSEQ) AS NO,	`;
        query += ` 	       T.SQUESTC_REV,	`;
        query += ` 	       T.SQUESTC_TYPE,	`;
        query += ` 	       T.SQUESTC_CODE,	`;
        query += ` 	       T.SQUESTC_DESC_THAI,	`;
        query += ` 	       T.SQUESTC_DESC_ENG,	`;
        query += ` 	       T.SQUESTC_ASKWER,	`;
        query += ` 	       T.SQUESTC_FULL_SCORE,	`;
        query += ` 	       C.SQUESTAS_CHSEQ,	`;
        query += ` 	       C.SQUESTAS_DESC_THAI,	`;
        query += ` 	       C.SQUESTAS_DESC_ENG,	`;
        query += ` 	       C.SQUESTAS_SCORE	`;
        query += ` 	  FROM SLEC_MSTR_QUES_CHECKPOINT T	`;
        query += ` 	  LEFT JOIN SLEC_MSTR_CHOICE_CHECKPOINT C ON C.SQUESTAS_CODE = T.SQUESTC_CODE AND C.SQUESTAS_TYPE = T.SQUESTC_TYPE AND C.SQUESTAS_REV = T.SQUESTC_REV	`;
        query += ` 	 WHERE T.SQUESTC_STATUS = 'Active'	`;
        query += ` 	 ORDER BY T.SQUESTC_TYPE,	`;
        query += ` 	          CAST(T.SQUESTC_CODE AS INTEGER),	`;
        query += ` 	          C.SQUESTAS_CHSEQ ASC	`;

        const result = await connect.execute(query);
        DisconnectOracleDB(connect);
        const data = await Promise.all(result.rows.map(async (row) => {
            return {
                NO: row[0],
                SQUESTC_REV: row[1],
                SQUESTC_TYPE: row[2],
                SQUESTC_CODE: row[3],
                SQUESTC_DESC_THAI: row[4],
                SQUESTC_DESC_ENG: row[5],
                SQUESTC_ASKWER: row[6],
                SQUESTC_FULL_SCORE: row[7],
                SQUESTAS_CHSEQ: row[8],
                SQUESTAS_DESC_THAI: row[9],
                SQUESTAS_DESC_ENG: row[10],
                SQUESTAS_SCORE: row[11]
            };
        }));

        res.json(data);
    } catch (error) {
        console.error("ข้อผิดพลาดในการค้นหาข้อมูล:", error.message);
        res.status(500).send("ข้อผิดพลาดในการค้นหาข้อมูล");
    }
};

module.exports.insertQuestionMaster = async function (req, res) {
    let connect;
    try {
        const P_STATUS = req.query.P_STATUS;
        const P_REV = req.query.P_REV;
        const STC_QUEST = req.body;
        connect = await ConnectOracleDB("GC");
        let query = ``;

        query = ``;
        query = ` DELETE FROM SLEC_MSTR_CHOICE_CHECKPOINT T WHERE T.SQUESTAS_REV = :1 `;
        await connect.execute(query, [P_REV]);

        query = ``;
        query = ` DELETE FROM SLEC_MSTR_QUES_CHECKPOINT T WHERE T.SQUESTC_REV = :1 `;
        await connect.execute(query, [P_REV]);

        if (P_STATUS === 'Active') {
            query = ``;
            query = ` UPDATE SLEC_MSTR_QUES_CHECKPOINT T SET T.SQUESTC_STATUS = 'Inactive' `;
            await connect.execute(query);
        }

        for (const item of STC_QUEST) {
            const { SQUESTC_CODE, SQUESTC_TYPE, SQUESTC_REV, SQUESTC_SEQ_QUESTION, SQUESTC_DESC_THAI, SQUESTC_DESC_ENG, SQUESTC_ASKWER, SQUESTC_FULL_SCORE, SQUESTC_FLAG, SQUESTC_CHOICE_DETAIL } = item;
            query = ``;
            query = ` INSERT INTO SLEC_MSTR_QUES_CHECKPOINT T
                                (T.SQUESTC_CODE,
                                T.SQUESTC_TYPE,
                                T.SQUESTC_REV,
                                T.SQUESTC_SEQ_QUESTION,
                                T.SQUESTC_DESC_THAI,
                                T.SQUESTC_DESC_ENG,
                                T.SQUESTC_ASKWER,
                                T.SQUESTC_FULL_SCORE,
                                T.SQUESTC_FLAG,
                                T.SQUESTC_PARENT_CODE,
                                T.SQUESTC_STATUS)
                                VALUES
                                (:1,
                                :2,
                                :3,
                                :4,
                                :5,
                                :6,
                                :7,
                                :8,
                                :9,
                                '',
                                :10) `;
            await connect.execute(query, [SQUESTC_CODE, SQUESTC_TYPE, SQUESTC_REV, SQUESTC_SEQ_QUESTION, SQUESTC_DESC_THAI, SQUESTC_DESC_ENG, SQUESTC_ASKWER, SQUESTC_FULL_SCORE, SQUESTC_FLAG, P_STATUS]);

            for (const itemDetail of SQUESTC_CHOICE_DETAIL) {
                const { SQUESTAS_CODE, SQUESTAS_TYPE, SQUESTAS_REV, SQUESTAS_CHSEQ, SQUESTAS_DESC_ENG, SQUESTAS_DESC_THAI, SQUESTAS_SCORE } = itemDetail;
                query = ``;
                query = ` INSERT INTO SLEC_MSTR_CHOICE_CHECKPOINT C
                                        (C.SQUESTAS_CODE,
                                        C.SQUESTAS_TYPE,
                                        C.SQUESTAS_REV,
                                        C.SQUESTAS_CHSEQ,
                                        C.SQUESTAS_DESC_ENG,
                                        C.SQUESTAS_DESC_THAI,
                                        C.SQUESTAS_SCORE)
                                        VALUES
                                        (:1,
                                        :2,
                                        :3,
                                        :4,
                                        :5,
                                        :6,
                                        :7) `;
                await connect.execute(query, [SQUESTAS_CODE, SQUESTAS_TYPE, SQUESTAS_REV, SQUESTAS_CHSEQ, SQUESTAS_DESC_ENG, SQUESTAS_DESC_THAI, SQUESTAS_SCORE]);
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