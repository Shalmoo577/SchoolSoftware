import express from "express";
import cors from "cors";

import SARouter from '../Pages/Accounts/Parents Account/SARouter.js'
import GowdownRouter from '../backend/Router/GowdownRouter.js'
// import BPRouter from '../backend/Router/BPRouter.js'
import GARouter from '../backend/Router/GARouter.js'
import HoaRouter from  '../backend/Router/HoaRouter.js'
import CARouter from '../backend/Router/CARouter.js'
import ItemRouter from './Router/ItemRouter.js'
import PPBagRouter from './Router/PPBagRouter.js'
import BankPaymentRouter2 from './Router/BankPaymentRouter2.js'
import CompanyProfileRouter from './Router/CompanyProfileRouter.js'
import BankReceiptRouter from './Router/BankReceiptRouter.js';
import CashPayment from "./Router/CashPaymentRouter.js";
import CashReceipt from './Router/CashReceiptRouter.js';
import uppercaseMiddleware from './Router/uppercaseMiddleware.js';
import LedgerRouter from './Router/LedgerRouter.js';
import CampusRouter from './Router/School Router/CampusRouter.js'
import SubjectRouter from "./Router/School Router/SubjectRouter.js";
import TimeTableRouter from './Router/School Router/TimeTableRouter.js'
import Classes from './Router/School Router/classes.js'
import Teachers from './Router/School Router/TeacherRouter.js'
import periodRouter from './Router/School Router/periodRouter.js'
import StudentRouter from './Router/School Router/StudentRouter.js'

import FeeHeadRouter  from './Router/School Router/FeeHeadRouter.js'
import FeeStructureRouter  from './Router/School Router/FeeStructureRouter.js'
import StudentFeeRouter   from './Router/School Router/StudentFeeRouter.js'
import FeeTypeRouter from './Router/School Router/FeeTypeRouter.js'
import ClassFeeVoucherRouter from './Router/School Router/ClassFeeVoucherRouter.js'
import StudentFeeVoucherRouter from './Router/School Router/StudentFeeVoucherRouter.js'
import FeeReceiptRouter  from './Router/School Router/FeeReceiptRouter.js'
import OutstandingFeeReportRouter from './Router/School Router/OutstandingFeeReportRouter.js'
import FeeCollectionReportRouter from './Router/School Router/FeeCollectionReportRouter.js'
import FeeReceiptPrint from './Router/School Router/FeeReceiptRouter.js'
import PageRouter from './Router/PageRouter.js'
import PermissionRouter from './Router/PermissionRouter.js'
import DeveloperSetupRouter from "./Router/DeveloperSetupRouter.js";
import LoginRouter from "./Router/LoginRouter.js";
import UserRouter from "./Router/UserRouter.js";
import SectionRouter from './Router/SectionRouter.js'
import JournalVoucherRouter from './Router/JournalVoucherRouter.js'
import AcademicYearRouter from './Router/School Router/AcademicYearRouter.js'

const app = express();

app.use(cors());
app.use(express.json());
app.use(uppercaseMiddleware);
app.use("/api", LedgerRouter);
// Routes

 app.use("/api", GowdownRouter);
 app.use("/api/" , SARouter);
app.use("/api/" , GARouter);
app.use("/api/" , HoaRouter);
// app.use("/api/" , BPRouter);
app.use("/api/" , CARouter);
app.use("/api/" , ItemRouter);
app.use("/api/" , PPBagRouter);
 app.use("/api/" , BankPaymentRouter2);
app.use("/api", CompanyProfileRouter);
app.use("/api", BankReceiptRouter);
app.use("/api", CashPayment);
app.use("/api", CashReceipt);
app.use("/api", CampusRouter);
app.use("/api", SubjectRouter);
app.use("/api", TimeTableRouter);
app.use("/api", Classes);
app.use("/api", Teachers);
app.use("/api", periodRouter);
app.use("/api", StudentRouter);
app.use("/api", AcademicYearRouter);
app.use("/api", FeeHeadRouter );
app.use("/api", FeeStructureRouter );
app.use("/api", StudentFeeRouter );
app.use("/api", FeeTypeRouter );
app.use("/api", ClassFeeVoucherRouter );
app.use("/api", StudentFeeVoucherRouter );
app.use("/api", FeeReceiptRouter);
app.use("/api", OutstandingFeeReportRouter);
app.use("/api", FeeCollectionReportRouter);
app.use("/api", PageRouter);
app.use("/api", PermissionRouter);
app.use("/api", DeveloperSetupRouter);
app.use("/api", LoginRouter);
app.use("/api", UserRouter);
app.use("/api", SectionRouter);
app.use("/api", JournalVoucherRouter);

// app.use("/api", FeeReceiptPrint );


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is Running on Port ${PORT}`);
});

export default app;