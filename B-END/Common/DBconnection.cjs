const { Client } = require('pg');
const oracledb = require("oracledb");
require("dotenv").config();
oracledb.initOracleClient({
    tnsAdmin: "D:\\app\\\Chayanon.I\\product\\11.2.0\\client_2\\network\\admin",
});
 
const ConnectOracleDB = async (ConnType) => {
    const oracledb = require("oracledb");
 
    if (ConnType === "FPC"){
        const FPC = {
            user: process.env.FPC_USER,
            password: process.env.FPC_PASSWORD,
            connectString : process.env.FPC_CONNECTION_STRING,
        };
        const connection = await oracledb.getConnection(FPC);
        return connection;
    }else if (ConnType === "CUSR"){
        const CUSR = {
            user: process.env.CUSR_USER,
            password: process.env.CUSR_PASSWORD,
            connectString : process.env.CUSR_CONNECTION_STRING,
        };
        console.log(process.env.CUSR_USER,process.env.CUSR_PASSWORD,process.env.CUSR_CONNECTION_STRING)
        const connection = await oracledb.getConnection(CUSR);
        return connection;
    }else if (ConnType === "HR"){
        const HR = {
            user: process.env.HR_USER,
            password: process.env.HR_PASSWORD,
            connectString : process.env.HR_CONNECTION_STRING,
        };
        console.log(process.env.HR_USER,process.env.HR_PASSWORD,process.env.HR_CONNECTION_STRING)
        const connection = await oracledb.getConnection(HR);
        return connection;
    }
    else if (ConnType === "GC"){
        const GC = {
            user: process.env.GC_USER,
            password: process.env.GC_PASSWORD,
            connectString : process.env.GC_CONNECTION_STRING,
        };
        console.log(process.env.GC_USER,process.env.GC_PASSWORD,process.env.GC_CONNECTION_STRING)
        const connection = await oracledb.getConnection(GC);
        return connection;
    }
    else if (ConnType === "CHEM"){
        const CHEM = {
            user: process.env.CHEM_USER,
            password: process.env.CHEM_PASSWORD,
            connectString : process.env.CHEM_CONNECTION_STRING,
        };
        console.log(process.env.CHEM_USER,process.env.CHEM_PASSWORD,process.env.CHEM_CONNECTION_STRING)
        const connection = await oracledb.getConnection(CHEM);
        return connection;
    }
};
 
const DisconnectOracleDB = async (connection) => {
    await connection.close();
}

const ConnectPostgresDB = () => {


    const pgCUSR = {
        user: process.env.BTP_USERNAME,
        host: process.env.BTP_HOST,
        database: process.env.BTP_DATABASE,
        password: process.env.BTP_PASSWORD,
        port: process.env.BTP_PORT,
    };

    const pgGC = {
        user: process.env.BTP_USERNAME,
        host: process.env.BTP_HOST,
        database: process.env.BTP_DATABASE,
        password: process.env.BTP_PASSWORD,
        port: process.env.BTP_PORT,
    };


    return { pgCUSR,pgGC };
};
 
 
module.exports = { ConnectOracleDB, DisconnectOracleDB, ConnectPostgresDB};