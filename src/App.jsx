import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';

import Navbar2 from './Components/Navbar/Navbar2';
import Dashboard from './Components/Dashboard/Dashboard';

import RiceArrival from './Pages/Rice/Rice Arrival/RiceArrival';
import RiceContract from './Pages/Rice/Rice Contract/RiceContract';
import RicePurchase from './Pages/Rice/Rice  Purchase/RicePurchase';
import LocalSaleContract from './Pages/Rice/Local Sale/LocalSaleContract';
import LocalSale from './Pages/Rice/Local Sale/LocalSale';
import RiceProcessing from './Pages/Rice/Rice Processing/RiceProcessing';

import Item from './Pages/Library/Item/Item';
import Gowdown from './Pages/Library/Gowdown/Gowdown';
import PPBags from './Pages/Library/P P bags/PPBags';

import HOA from './Pages/Accounts/Parents Account/HOA';
import ControlAccount from './Pages/Accounts/Parents Account/ControlAccount';
import GeneralAccount from './Pages/Accounts/Parents Account/GeneralAccount';
import SubsidaryAccount from './Pages/Accounts/Parents Account/SubsidaryAccount';

import BankReceipt from './Pages/Accounts/Bank Receipt/BankReceipt';
import BankPayment2 from './Pages/Accounts/Bank Payment/BankPayment2';
import CashPayment from './Pages/Accounts/Cash Payment/CashPayment';
import CashReceipt from './Pages/Accounts/Cash Receipt/CashReceipt';
import Ledger from './Pages/Accounts/Ledger/Ledger';

import Campus from './Pages/School/Campus';
import Subjects from './Pages/School/Subject';
import Timetable from './Pages/School/Timetable';
import Classes from './Pages/School/Class';
import Teachers from './Pages/School/Teacher';
import Period from './Pages/School/Period';
import Student from './Pages/School/Student';
import AcademicYear from './Pages/School/AcademicYear';

import FeeHeads from './Pages/School/FeeHeads';
import FeeStructure from './Pages/School/FeeStructure';
import StudentFee from './Pages/School/StudentFee';
import ClassFeeVoucher from './Pages/School/ClassFeeVoucher';
import StudentFeeVoucher from './Pages/School/StudentFeeVoucher';
import FeeReceipt from './Pages/School/FeeReceipt';
import OutstandingFeeReport from './Pages/School/OutstandingFeeReport';
import FeeCollectionReport from './Pages/School/FeeCollectionReport';
import FeeReceiptPrint from './Pages/School/FeeReceiptPrint';

import DeveloperSetup from './Pages/DeveloperSetup';
import Login from './Components/Login/Login';

import ProtectedRoute from './Components/Auth/ProtectedRoute';
import DeveloperRoute from './Components/Auth/DeveloperRoute';
import PermissionRoute from './Components/Auth/PermissionRoute';

import DeveloperPanel from './Pages/Developer/DeveloperPanel';
import DeveloperPages from './Pages/Developer/DeveloperPages';
import UserPermission from './Pages/Developer/UserPermission';

import User from "./Pages/User/User";
import Section from "./Pages/School/Section";

import JournalVoucherEntry from './Pages/Accounts/Journal Voucher/JournalVoucherEntry'
import JournalVoucherHistory from './Pages/Accounts/Journal Voucher/JournalVoucherHistory';
import JournalVoucherView from    './Pages/Accounts/Journal Voucher/JournalVoucherView';

const App = () => {

  return (

    <Router>

      <Routes>

        {/* =====================================================
            PUBLIC ROUTES
        ===================================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/developer-setup"
          element={<DeveloperSetup />}
        />


        {/* =====================================================
            PRINT ROUTES
            IMPORTANT:
            These routes are OUTSIDE Navbar2
        ===================================================== */}

        <Route
          path="/student-fee-voucher-all"
          element={
            <ProtectedRoute>
              <StudentFeeVoucher />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-fee-voucher/:studentFeeId"
          element={
            <ProtectedRoute>
              <StudentFeeVoucher />
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            NORMAL PROTECTED APPLICATION
            Navbar2 will appear on these pages
        ===================================================== */}

        <Route
          path="/*"
          element={

            <ProtectedRoute>

              <Navbar2>

                <Routes>


                  {/* =================================================
                      DASHBOARD
                  ================================================= */}

                  <Route
                    path="/dashboard"
                    element={
                      <Dashboard />
                    }
                  />


                  {/* =================================================
                      ROOT
                  ================================================= */}

                  <Route
                    path="RiceArrival"
                    element={
                      <PermissionRoute pageKey="rice_arrival">
                        <RiceArrival />
                      </PermissionRoute>
                    }
                  />


                  {/* =================================================
                      USERS
                  ================================================= */}

                  <Route
                    path="/users"
                    element={
                      <PermissionRoute pageKey="users">
                        <DeveloperRoute>
                          <User />
                        </DeveloperRoute>
                      </PermissionRoute>
                    }
                  />


                  {/* =================================================
                      RICE
                  ================================================= */}

                  <Route
                    path="/ricecontract"
                    element={
                      <PermissionRoute pageKey="rice_contract">
                        <RiceContract />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/RiceArrival"
                    element={
                      <PermissionRoute pageKey="rice_arrival">
                        <RiceArrival />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/RicePurchase"
                    element={
                      <PermissionRoute pageKey="rice_purchase">
                        <RicePurchase />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/localsalecontract"
                    element={
                      <PermissionRoute pageKey="local_sale_contract">
                        <LocalSaleContract />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/localsale"
                    element={
                      <PermissionRoute pageKey="local_sale">
                        <LocalSale />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/riceprocessing"
                    element={
                      <PermissionRoute pageKey="rice_processing">
                        <RiceProcessing />
                      </PermissionRoute>
                    }
                  />


                  {/* =================================================
                      LIBRARY
                  ================================================= */}

                  <Route
                    path="/item"
                    element={
                      <PermissionRoute pageKey="items">
                        <Item />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/gowdown"
                    element={
                      <PermissionRoute pageKey="gowdown">
                        <Gowdown />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/ppbags"
                    element={
                      <PermissionRoute pageKey="ppbags">
                        <PPBags />
                      </PermissionRoute>
                    }
                  />


                  {/* =================================================
                      ACCOUNTS - MASTER
                  ================================================= */}

                  <Route
                    path="/hoa"
                    element={
                      <PermissionRoute pageKey="hoa">
                        <HOA />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/ControlAccount"
                    element={
                      <PermissionRoute pageKey="control_accounts">
                        <ControlAccount />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/GeneralAccount"
                    element={
                      <PermissionRoute pageKey="general_accounts">
                        <GeneralAccount />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/SubsidaryAccount"
                    element={
                      <PermissionRoute pageKey="subsidiary_accounts">
                        <SubsidaryAccount />
                      </PermissionRoute>
                    }
                  />


                  {/* =================================================
                      ACCOUNTS - VOUCHERS
                  ================================================= */}
                 <Route
                      path="/journalvoucher"
                      element={
                        <PermissionRoute pageKey="Journal_Voucher">
                          <JournalVoucherHistory />
                        </PermissionRoute>
                      }
                    />

<Route
  path="/journalvoucher"
  element={
    <PermissionRoute pageKey="Journal_Voucher">
      <JournalVoucherHistory />
    </PermissionRoute>
  }
/>

<Route
  path="/journalvoucherentry"
  element={
    <PermissionRoute pageKey="Journal_Voucher">
      <JournalVoucherEntry />
    </PermissionRoute>
  }
/>

{/* <Route
  path="/journalvoucherentry/:vno"
  element={
    <PermissionRoute pageKey="Journal_Voucher">
      <JournalVoucherEntry />
    </PermissionRoute>
  }
/> */}

{/* <Route
  path="/journalvoucherview/:vno"
  element={
    <PermissionRoute pageKey="Journal_Voucher">
      <JournalVoucherView />
    </PermissionRoute>
  }
/> */}
<Route
    path="/journalvoucherview/:vno"
    element={<JournalVoucherView />}
/>
<Route
    path="/journalvoucherentry/:vno"
    element={<JournalVoucherEntry />}
/>     
                  <Route
                    path="/BankPayment2"
                    element={
                      <PermissionRoute pageKey="bank_payment2">
                        <BankPayment2 />
                      </PermissionRoute>
                    }
                  />

                  

                  <Route
                    path="/BankReceipt"
                    element={
                      <PermissionRoute pageKey="bank_receipt">
                        <BankReceipt />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/CashPayment"
                    element={
                      <PermissionRoute pageKey="cash_payment">
                        <CashPayment />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/CashReceipt"
                    element={
                      <PermissionRoute pageKey="cash_receipt">
                        <CashReceipt />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/ledger"
                    element={
                      <PermissionRoute pageKey="ledger">
                        <Ledger />
                      </PermissionRoute>
                    }
                  />


                  {/* =================================================
                      SCHOOL
                  ================================================= */}

                  <Route
                    path="/academicyear"
                    element={
                      <PermissionRoute pageKey="ACADEMIC_YEARS">
                        <AcademicYear />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/campus"
                    element={
                      <PermissionRoute pageKey="campuses">
                        <Campus />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/subjects"
                    element={
                      <PermissionRoute pageKey="subjects">
                        <Subjects />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/timetable"
                    element={
                      <PermissionRoute pageKey="timetable">
                        <Timetable />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/classes"
                    element={
                      <PermissionRoute pageKey="classes">
                        <Classes />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/teachers"
                    element={
                      <PermissionRoute pageKey="teachers">
                        <Teachers />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/period"
                    element={
                      <PermissionRoute pageKey="periods">
                        <Period />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/student"
                    element={
                      <PermissionRoute pageKey="students">
                        <Student />
                      </PermissionRoute>
                    }
                  />


                  {/* =================================================
                      FEE SYSTEM
                  ================================================= */}

                  <Route
                    path="/feeheads"
                    element={
                      <PermissionRoute pageKey="fee_heads">
                        <FeeHeads />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/feestructure"
                    element={
                      <PermissionRoute pageKey="fee_structure">
                        <FeeStructure />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/studentfee"
                    element={
                      <PermissionRoute pageKey="student_fee">
                        <StudentFee />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/classfeevoucher"
                    element={
                      <PermissionRoute pageKey="class_fee_voucher">
                        <ClassFeeVoucher />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/studentfeevoucher"
                    element={
                      <PermissionRoute pageKey="student_fee_voucher">
                        <StudentFeeVoucher />
                      </PermissionRoute>
                    }
                  />


                  {/* IMPORTANT:
                      Print routes are NOT here anymore.
                  */}


                  <Route
                    path="/feereceipt"
                    element={
                      <PermissionRoute pageKey="fee_receipt">
                        <FeeReceipt />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/outstandingfeereport"
                    element={
                      <PermissionRoute pageKey="outstanding_fee_report">
                        <OutstandingFeeReport />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/feecollectionreport"
                    element={
                      <PermissionRoute pageKey="fee_collection_report">
                        <FeeCollectionReport />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/fee-receipt-print/:receiptNo"
                    element={
                      <PermissionRoute pageKey="fee_receipt">
                        <FeeReceiptPrint />
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/section"
                    element={
                      <PermissionRoute pageKey="section">
                        <Section />
                      </PermissionRoute>
                    }
                  />


                  {/* =================================================
                      DEVELOPER
                  ================================================= */}

                  <Route
                    path="/developer-panel"
                    element={
                      <PermissionRoute pageKey="developer_panel">
                        <DeveloperRoute>
                          <DeveloperPanel />
                        </DeveloperRoute>
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/developer-pages"
                    element={
                      <PermissionRoute pageKey="developer_pages">
                        <DeveloperRoute>
                          <DeveloperPages />
                        </DeveloperRoute>
                      </PermissionRoute>
                    }
                  />

                  <Route
                    path="/user-permissions"
                    element={
                      <PermissionRoute pageKey="user_permissions">
                        <DeveloperRoute>
                          <UserPermission />
                        </DeveloperRoute>
                      </PermissionRoute>
                    }
                  />


                </Routes>

              </Navbar2>

            </ProtectedRoute>
          }
        />

      </Routes>

    </Router>
  );
};

export default App;