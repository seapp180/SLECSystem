const express = require("express");
const bodyParser = require('body-parser');
const { Client } = require("pg");
const cors = require('cors');
const app = express();
const port = 3003;
require('dotenv').config();

const serverLogin = require("./Login/Login.cjs");
const serverCommon = require("./Common/Common.cjs");
const serverTransaction = require("./Transaction/Transaction.cjs");
const serverReport = require("./Report/ReportSummary.cjs");
const serverReportByFactory = require("./Report/ReportByFacroty.cjs");
const serverReportByMGR = require("./Report/ReportByMGR.cjs");
const serverReportBySlecno = require("./Report/ReportBySlecNo.cjs");
const serverReportBySup = require("./Report/ReportBySup.cjs");
const serverMasterPerson = require("./Master/Person.cjs");
const serverMasterType = require("./Master/TypeCP.cjs");
const serverMasterQuest = require("./Master/Question.cjs");
const serverMaintainData = require("./Maintain/Datamaintain.cjs");
const serverMaintainFile = require("./Maintain/DataFile.cjs");


function checkBasicAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).send('Authorization header is missing');
    }
  
    const [type, credentials] = authHeader.split(' ');
  
    if (type !== 'Basic' || !credentials) {
        return res.status(401).send('Invalid authorization header format');
    }
  
    const decodedCredentials = Buffer.from(credentials, 'base64').toString('utf8');
    const [username, password] = decodedCredentials.split(':');
  
    // ตรวจสอบ username และ password ที่ได้รับจาก Basic Auth
    if (username !== process.env.BASIC_AUTHORIZATION_USER || password !== process.env.BASIC_AUTHORIZATION_PASS) {
        return res.status(401).send('Invalid credentials');
    }
  
    next();
  }
  app.use(cors());
  app.use(checkBasicAuth);
  app.use(bodyParser.urlencoded({ limit: '50mb',extended: true }));
  app.use(bodyParser.json({ limit: '50mb' }));
  
  app.use(express.json());
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  app.get("/login/getLoginCUSR", serverLogin.getLoginCUSR);

  app.get("/common/getFactory", serverCommon.getFactory);
  app.get("/common/getCostCenter", serverCommon.getCostCenter);
  app.get("/common/getStatusSLEC", serverCommon.getStatusSLEC);
  app.get("/common/getSLECForUser", serverCommon.getSLECForUser);
  app.get("/common/getSLECUser_ByFactory", serverCommon.getSLECUser_ByFactory);
  app.get("/common/getTypeForCheckPoint", serverCommon.getTypeForCheckPoint);
  app.get("/common/getMonthlyCheckDate", serverCommon.getMonthlyCheckDate);
  app.get("/common/getGroupPerson", serverCommon.getGroupPerson);
  app.get("/common/getMonthlyForSlec", serverCommon.getMonthlyForSlec);
  app.get("/common/getFisicalYear", serverCommon.getFisicalYear);


  app.get("/transaction/getDataMain", serverTransaction.getDataMain);
  app.get("/transaction/getDataHeader", serverTransaction.getDataHeader);
  app.get("/transaction/getDataInspector", serverTransaction.getDataInspector);
  app.get("/transaction/getSupervisor", serverTransaction.getSupervisor);
  app.get("/transaction/getDataSupervisor", serverTransaction.getDataSupervisor);
  app.get("/transaction/getResultCheckPointBySup", serverTransaction.getResultCheckPointBySup);
  app.get("/transaction/getFileTEST", serverTransaction.getFileCheckPointPG);

  app.post("/transaction/delTransaction", serverTransaction.delTransaction);
  app.post("/transaction/mergHeader", serverTransaction.mergHeader);
  app.post("/transaction/mergInspector", serverTransaction.mergInspector);
  app.post("/transaction/delInspector", serverTransaction.delInspector);
  app.post("/transaction/insertSupervisor", serverTransaction.insertSupervisor);
  app.post("/transaction/delSupervisor", serverTransaction.delSupervisor);
  app.post("/transaction/insertSupCheckpoint", serverTransaction.insertSupCheckpoint);
  app.post("/transaction/copySupCheckpoint", serverTransaction.copySupCheckpoint);

  app.post("/transaction/insertFileTest", serverTransaction.insertFileTest);


  app.get("/report/getSummaryRPT", serverReport.getSummaryRPT);
  app.get("/report/getSummaryRPTExport", serverReport.getSummaryRPTExport);
  app.get("/report/getDetailQuestion", serverReport.getDetailQuestion);

  app.get("/report/getCountSup", serverReportByFactory.getCountSup);
  app.get("/report/getFacSupForTable", serverReportByFactory.getFacSupForTable);
  app.get("/report/getFacSupForTable_Min", serverReportByFactory.getFacSupForTable_Min);
  app.get("/report/getFacSupForChartPic", serverReportByFactory.getFacSupForChartPic);
  app.get("/report/getFacSupForChartColumn", serverReportByFactory.getFacSupForChartColumn);
  app.get("/report/getFacSupForChartColumneExport", serverReportByFactory.getFacSupForChartColumneExport);

  app.get("/report/getCountMGR", serverReportByFactory.getCountMGR);
  app.get("/report/getFacMGRForChartColumn", serverReportByFactory.getFacMGRForChartColumn);
  app.get("/report/getFacMGRForChartColumnExport", serverReportByFactory.getFacMGRForChartColumnExport);
  app.get("/report/getFacMGRExport", serverReportByFactory.getFacMGRExport);
  
  app.get("/report/getFacDetail", serverReportByFactory.getFacDetail);
  app.get("/report/getFacDetail_Min", serverReportByFactory.getFacDetail_Min);

  app.get("/report/getCountSupByMGR", serverReportByMGR.getCountSupByMGR);
  app.get("/report/getMGRForTable", serverReportByMGR.getMGRForTable);
  app.get("/report/getMGRForTable_Min", serverReportByMGR.getMGRForTable_Min);
  app.get("/report/getMGRForChartPic", serverReportByMGR.getMGRForChartPic);
  app.get("/report/getFacSupMGRForChartColumn", serverReportByMGR.getFacSupMGRForChartColumn);
  app.get("/report/getSupBForMGR", serverReportByMGR.getSupBForMGR);
  app.get("/report/getSupBForMGRCountSlecno", serverReportByMGR.getSupBForMGRCountSlecno);

  app.get("/report/getSlecNoByMonthly", serverReportBySlecno.getSlecNoByMonthly);
  app.get("/report/getDataCheckSlecNo", serverReportBySlecno.getDataCheckSlecNo);
  app.get("/report/getSlecNoForTable", serverReportBySlecno.getSlecNoForTable);
  app.get("/report/getSlecNoForChartPic", serverReportBySlecno.getSlecNoForChartPic);
  app.get("/report/getSlecNoBySup", serverReportBySlecno.getSlecNoBySup);
  app.get("/report/getSlecNoForChartStacked", serverReportBySlecno.getSlecNoForChartStacked);
  app.get("/report/getExportDetail", serverReportBySlecno.getExportDetail);


  app.get("/report/getSupervisorByMonthly", serverReportBySup.getSupervisorByMonthly);
  app.get("/report/getDataEmpSup", serverReportBySup.getDataEmpSup);
  app.get("/report/getSlecBySup", serverReportBySup.getSlecBySup);
  app.get("/report/getDataSupForTable", serverReportBySup.getDataSupForTable);
  app.get("/report/getDataSupForChartPic", serverReportBySup.getDataSupForChartPic);
  app.get("/report/getDataSupB", serverReportBySup.getDataSupB);
  

  app.get("/master/getGroupPerson", serverMasterPerson.getGroupPerson);
  app.post("/master/mergPerson", serverMasterPerson.mergPerson);
  app.post("/master/delPerson", serverMasterPerson.delPerson);

  app.get("/master/getTypeCP", serverMasterType.getTypeCP);
  app.get("/master/getMaxType", serverMasterType.getMaxType);
  app.post("/master/mergTypeCP", serverMasterType.mergTypeCP);
  app.post("/master/delTypeCP", serverMasterType.delTypeCP);

  app.get("/master/getQuestionMstr", serverMasterQuest.getQuestionMstr);
  app.get("/master/getRevisonQuest", serverMasterQuest.getRevisonQuest);
  app.get("/master/getRevisonActive", serverMasterQuest.getRevisonActive);
  app.get("/master/getTempExport", serverMasterQuest.getTempExport);

  app.post("/master/changeRev", serverMasterQuest.changeRev);
  app.post("/master/insertQuestionMaster", serverMasterQuest.insertQuestionMaster);

  app.get("/maintain/getSlecNoByMonthlyAll", serverMaintainData.getSlecNoByMonthlyAll);
  app.get("/maintain/getDataMaintain", serverMaintainData.getDataMaintain);

  app.post("/maintain/updateHeader", serverMaintainData.updateHeader);

  app.get("/maintain/getDataFile", serverMaintainFile.getDataFile);
  app.post("/maintain/delfile", serverMaintainFile.delfile);
  

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
