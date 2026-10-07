import React, { useEffect, useState } from 'react';
import { getUserPermissions } from "../Auth/permission";
import { Layout, Menu, Button, theme } from 'antd';
import { Link, useLocation,useNavigate } from 'react-router-dom';

import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  BookOutlined,
  UserOutlined,
  BankOutlined,
  DollarCircleOutlined,
  ReadOutlined,
  ShoppingOutlined,
  ExportOutlined,
  BarChartOutlined,
  SettingOutlined,
  SafetyOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const Navbar2 = ({ children }) => {

const navigate = useNavigate(); // 👈 Component ke andar ye declare karein

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    
    // capital 'N' ki jagah small 'n' wala navigate use karein
    navigate("/login", { replace: true });
  };

  const user = JSON.parse(localStorage.getItem("user"));

  const isDeveloper = Number(user?.is_developer) === 1;

  const [permissions, setPermissions] = useState([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();


  /* =========================================================
     LOAD USER PERMISSIONS
  ========================================================= */

  useEffect(() => {

    const loadPermissions = async () => {

      // Developer does not need permission checking
      if (isDeveloper) {
        setPermissionsLoaded(true);
        return;
      }

      if (!user?.user_id) {
        setPermissionsLoaded(true);
        return;
      }

      try {

        const data = await getUserPermissions(user.user_id);

        setPermissions(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (error) {

        console.error(
          "Failed to load user permissions:",
          error
        );

        setPermissions([]);

      } finally {

        setPermissionsLoaded(true);

      }
    };

    loadPermissions();

  }, [user?.user_id, isDeveloper]);


  /* =========================================================
     NORMALIZE PAGE KEY
     Handles:
     academic_years
     ACADEMIC_YEARS
     Academic_Years
  ========================================================= */

  const normalizeKey = (value) => {

    return String(value || "")
      .trim()
      .toLowerCase();

  };


  /* =========================================================
     CHECK PAGE VIEW PERMISSION
  ========================================================= */

  const canViewPage = (pageKey) => {

    // Developer can see everything
    if (isDeveloper) {
      return true;
    }

    // Do not show menu while permissions are loading
    if (!permissionsLoaded) {
      return false;
    }

    const key = normalizeKey(pageKey);

    const permission = permissions.find(
      (item) =>
        normalizeKey(item.page_key) === key
    );

    /*
      IMPORTANT:

      If page does not exist in user's permission
      then it should NOT be visible.
    */

    if (!permission) {
      return false;
    }

    return Number(permission.can_view) === 1;
  };


  /* =========================================================
     CHECK MAIN MENU PERMISSION

     controllerKey:
       The page which represents the Main Menu.

     pageKeys:
       All submenu page keys under that Main Menu.

     Rules:

     1. Main menu controller must have is_main_menu = 1
     2. Main menu controller must have can_view_main_menu = 1
     3. At least one submenu must have can_view = 1

     Otherwise parent menu is hidden.
  ========================================================= */

  const canViewMainMenu = (
    controllerKey,
    pageKeys = []
  ) => {

    // Developer sees everything
    if (isDeveloper) {
      return true;
    }

    // Wait for permissions
    if (!permissionsLoaded) {
      return false;
    }

    const controllerKeyNormalized =
      normalizeKey(controllerKey);


    /* ---------------------------------------------
       FIND MAIN MENU CONTROLLER
    --------------------------------------------- */

    const mainMenuPermission =
      permissions.find(
        (item) =>
          normalizeKey(item.page_key) ===
            controllerKeyNormalized &&
          Number(item.is_main_menu) === 1
      );


    /*
      Controller does not exist or is not marked
      as Main Menu.
    */

    if (!mainMenuPermission) {
      return false;
    }


    /* ---------------------------------------------
       CHECK MAIN MENU CHECKBOX
    --------------------------------------------- */

    if (
      Number(
        mainMenuPermission.can_view_main_menu
      ) !== 1
    ) {
      return false;
    }


    /* ---------------------------------------------
       CHECK SUBMENU VIEW PERMISSION
    --------------------------------------------- */

    const hasVisibleSubMenu =
      pageKeys.some((pageKey) => {

        const submenuPermission =
          permissions.find(
            (item) =>
              normalizeKey(item.page_key) ===
              normalizeKey(pageKey)
          );

        return (
          submenuPermission &&
          Number(submenuPermission.can_view) === 1
        );

      });


    /*
      Main menu only appears when at least
      one submenu is visible.
    */

    return hasVisibleSubMenu;
  };


  /* =========================================================
     LOGOUT
  ========================================================= */

 

  /* =========================================================
     ROOT SUBMENUS
  ========================================================= */

  const rootSubmenuKeys = [
    'library',
    'users',
    'accounts',
    'fee-system',
    'school',
    'rice',
    'export-sale',
    'developer',
  ];


  /* =========================================================
     SUBMENU OPEN/CLOSE
  ========================================================= */

  const handleOpenChange = (keys) => {

    const latestOpenKey = keys.find(
      (key) =>
        openKeys.indexOf(key) === -1
    );

    if (
      latestOpenKey &&
      rootSubmenuKeys.indexOf(latestOpenKey) === -1
    ) {

      setOpenKeys(keys);

    } else {

      setOpenKeys(
        latestOpenKey
          ? [latestOpenKey]
          : []
      );

    }
  };


  /* =========================================================
     LIBRARY
  ========================================================= */

  const libraryPageKeys = [
    "gowdown",
    "items",
    "ppbags",
  ];

  const libraryItems = [

    canViewPage("gowdown") && {
      key: '/Gowdown',
      label: (
        <Link to="/Gowdown">
          Add Gowdown
        </Link>
      ),
    },

    canViewPage("items") && {
      key: '/Item',
      label: (
        <Link to="/Item">
          Item
        </Link>
      ),
    },

    canViewPage("ppbags") && {
      key: '/PPBags',
      label: (
        <Link to="/PPBags">
          Bags Variety
        </Link>
      ),
    },

  ].filter(Boolean);


  /* =========================================================
     USERS
  ========================================================= */

  const userPageKeys = [
    "users",
    "roles",
  ];

  const userItems = [

    canViewPage("users") && {
      key: '/add-user',
      label: (
        <Link to="/users">
          Users
        </Link>
      ),
    },

    canViewPage("roles") && {
      key: '/role',
      label: (
        <Link to="/role">
          Role
        </Link>
      ),
    },

  ].filter(Boolean);


  /* =========================================================
     ACCOUNTS
  ========================================================= */

  const accountPageKeys = [
    "hoa",
    "control_accounts",
    "general_accounts",
    "subsidiary_accounts",
    "Journal_Voucher",
    "bank_payment",
    "bank_receipt",
    "cash_payment",
    "cash_receipt",
    "bank_payment2",
    "ledger",
  ];


  const accountMasterItems = [

    canViewPage("hoa") && {
      key: '/HOA',
      label: (
        <Link to="/HOA">
          Head of Account (HO)
        </Link>
      ),
    },

    canViewPage("control_accounts") && {
      key: '/ControlAccount',
      label: (
        <Link to="/ControlAccount">
          Control Account (CA)
        </Link>
      ),
    },

    canViewPage("general_accounts") && {
      key: '/GeneralAccount',
      label: (
        <Link to="/GeneralAccount">
          General Account (GA)
        </Link>
      ),
    },

    canViewPage("subsidiary_accounts") && {
      key: '/SubsidaryAccount',
      label: (
        <Link to="/SubsidaryAccount">
          Subsidiary Account (SA)
        </Link>
      ),
    },

  ].filter(Boolean);


  const accountVoucherItems = [

  canViewPage("Journal_Voucher") && {
  key: "/journalvoucher",
  label: (
    <Link to="/journalvoucher">
      Journal Voucher (JV)
    </Link>
  ),
},

    canViewPage("bank_payment") && {
      key: '/BankPayment',
      label: (
        <Link to="/BankPayment">
          Bank Payment (BP)
        </Link>
      ),
    },

    canViewPage("bank_receipt") && {
      key: '/BankReceipt',
      label: (
        <Link to="/BankReceipt">
          Bank Receipt (BR)
        </Link>
      ),
    },

    canViewPage("cash_payment") && {
      key: '/CashPayment',
      label: (
        <Link to="/CashPayment">
          Cash Payment (CP)
        </Link>
      ),
    },

    canViewPage("cash_receipt") && {
      key: '/CashReceipt',
      label: (
        <Link to="/CashReceipt">
          Cash Receipt (CR)
        </Link>
      ),
    },

    canViewPage("bank_payment2") && {
      key: '/BankPayment2',
      label: (
        <Link to="/BankPayment2">
          BANK PAYMENT 2 (BP2)
        </Link>
      ),
    },

    canViewPage("ledger") && {
      key: '/ledger',
      label: (
        <Link to="/ledger">
          ACCOUNT LEDGER
        </Link>
      ),
    },

  ].filter(Boolean);


  const accountItems = [

    ...accountMasterItems,

    ...(accountVoucherItems.length > 0
      ? [
          {
            type: 'divider',
          },
          ...accountVoucherItems,
        ]
      : []),

  ];


  /* =========================================================
     FEE SYSTEM
  ========================================================= */

  const feePageKeys = [
    "fee_heads",
    "fee_structure",
    "student_fee",
    "class_fee_voucher",
    "student_fee_voucher",
    "fee_receipt",
    "outstanding_fee_report",
    "fee_collection_report",
  ];


  const feeItems = [

    canViewPage("fee_heads") && {
      key: '/feeheads',
      label: (
        <Link to="/feeheads">
          Fee Heads
        </Link>
      ),
    },


    canViewPage("fee_structure") && {
      key: '/feestructure',
      label: (
        <Link to="/feestructure">
          Fee Structure
        </Link>
      ),
    },

canViewPage("class_fee_voucher") && {
      key: '/classfeevoucher',
      label: (
        <Link to="/classfeevoucher">
          Class Fee Voucher
        </Link>
      ),
    },

    

    canViewPage("student_fee") && {
      key: '/studentfee',
      label: (
        <Link to="/studentfee">
          Student Fee
        </Link>
      ),
    },



    

    canViewPage("fee_receipt") && {
      key: '/feereceipt',
      label: (
        <Link to="/feereceipt">
          Fee Receipt
        </Link>
      ),
    },

    canViewPage("outstanding_fee_report") && {
      key: '/outstandingfeereport',
      label: (
        <Link to="/outstandingfeereport">
          Outstanding Fee Report
        </Link>
      ),
    },

    canViewPage("fee_collection_report") && {
      key: '/feecollectionreport',
      label: (
        <Link to="/feecollectionreport">
          Fee Collection Report
        </Link>
      ),
    },

  ].filter(Boolean);


  /* =========================================================
     SCHOOL
  ========================================================= */

  const schoolPageKeys = [
    "academic_years",
    "campuses",
    "classes",
    "subjects",
    "teachers",
    "periods",
    "students",
    "timetable",
    
  ];


  const schoolItems = [

    canViewPage("academic_years") && {
      key: '/academicyear',
      label: (
        <Link to="/academicyear">
          Academic Year
        </Link>
      ),
    },

    canViewPage("campuses") && {
      key: '/campus',
      label: (
        <Link to="/campus">
          Campus
        </Link>
      ),
    },

    canViewPage("section") && {
      key: '/section',
      label: (
        <Link to="/section">
          Section   
        </Link>
      ),
    },


    canViewPage("classes") && {
      key: '/classes',
      label: (
        <Link to="/classes">
          Classes
        </Link>
      ),
    },

    canViewPage("subjects") && {
      key: '/subjects',
      label: (
        <Link to="/subjects">
          Subjects
        </Link>
      ),
    },

    canViewPage("teachers") && {
      key: '/teachers',
      label: (
        <Link to="/teachers">
          Teachers
        </Link>
      ),
    },

    canViewPage("periods") && {
      key: '/period',
      label: (
        <Link to="/period">
          Periods
        </Link>
      ),
    },

    canViewPage("students") && {
      key: '/student',
      label: (
        <Link to="/student">
          Students
        </Link>
      ),
    },

    canViewPage("timetable") && {
      key: '/timetable',
      label: (
        <Link to="/timetable">
          Time Table
        </Link>
      ),
    },

  ].filter(Boolean);


  /* =========================================================
     RICE
  ========================================================= */

  const ricePageKeys = [
    "rice_contract",
    "rice_arrival",
    "rice_purchase",
    "local_sale_contract",
    "local_sale",
    "rice_processing",
  ];


  const riceItems = [

    canViewPage("rice_contract") && {
      key: '/RiceContract',
      label: (
        <Link to="/RiceContract">
          Rice Contract (RC)
        </Link>
      ),
    },

    canViewPage("rice_arrival") && {
      key: '/RiceArrival',
      label: (
        <Link to="/RiceArrival">
          Rice Arrival (RA)
        </Link>
      ),
    },

    canViewPage("rice_purchase") && {
      key: '/RicePurchase',
      label: (
        <Link to="/RicePurchase">
          Rice Purchase (RP)
        </Link>
      ),
    },

    canViewPage("local_sale_contract") && {
      key: '/LocalSaleContract',
      label: (
        <Link to="/LocalSaleContract">
          Local Sale Contract (LSC)
        </Link>
      ),
    },

    canViewPage("local_sale") && {
      key: '/LocalSale',
      label: (
        <Link to="/LocalSale">
          Local Sale (LS)
        </Link>
      ),
    },

    canViewPage("rice_processing") && {
      key: '/RiceProcessing',
      label: (
        <Link to="/RiceProcessing">
          Rice Processing (Process)
        </Link>
      ),
    },

  ].filter(Boolean);


  /* =========================================================
     EXPORT SALE
  ========================================================= */

  const exportSalePageKeys = [
    "export_rc",
    "export_ra",
    "export_rp",
    "export_lsc",
    "export_ls",
  ];


  const exportSaleItems = [

    canViewPage("export_rc") && {
      key: '/export-rc',
      label: (
        <Link to="/export-rc">
          RC
        </Link>
      ),
    },

    canViewPage("export_ra") && {
      key: '/export-ra',
      label: (
        <Link to="/export-ra">
          RA
        </Link>
      ),
    },

    canViewPage("export_rp") && {
      key: '/export-rp',
      label: (
        <Link to="/export-rp">
          RP
        </Link>
      ),
    },

    canViewPage("export_lsc") && {
      key: '/export-lsc',
      label: (
        <Link to="/export-lsc">
          LSC
        </Link>
      ),
    },

    canViewPage("export_ls") && {
      key: '/export-ls',
      label: (
        <Link to="/export-ls">
          LS
        </Link>
      ),
    },

  ].filter(Boolean);


  /* =========================================================
     FINAL MENU
  ========================================================= */

  const menuItems = [

    /* Dashboard */

    {
      key: '/',
      icon: <DashboardOutlined />,
      label: (
        <Link to="/">
          Dashboard
        </Link>
      ),
    },


    /* ---------------------------------------------------------
       LIBRARY
       Controller = gowdown
    --------------------------------------------------------- */

    ...(libraryItems.length > 0 &&
    canViewMainMenu(
      "gowdown",
      libraryPageKeys
    )
      ? [
          {
            key: 'library',
            icon: <BookOutlined />,
            label: 'Library',
            children: libraryItems,
          },
        ]
      : []),


    /* ---------------------------------------------------------
       USERS
       Controller = users
    --------------------------------------------------------- */

    ...(userItems.length > 0 &&
    canViewMainMenu(
      "users",
      userPageKeys
    )
      ? [
          {
            key: 'users',
            icon: <UserOutlined />,
            label: 'Users',
            children: userItems,
          },
        ]
      : []),


    /* ---------------------------------------------------------
       ACCOUNTS
       Controller = hoa
    --------------------------------------------------------- */

    ...(accountItems.length > 0 &&
    canViewMainMenu(
      "hoa",
      accountPageKeys
    )
      ? [
          {
            key: 'accounts',
            icon: <BankOutlined />,
            label: 'Accounts',
            children: accountItems,
          },
        ]
      : []),


    /* ---------------------------------------------------------
       FEE SYSTEM
       Controller = fee_heads
    --------------------------------------------------------- */

    ...(feeItems.length > 0 &&
    canViewMainMenu(
      "fee_heads",
      feePageKeys
    )
      ? [
          {
            key: 'fee-system',
            icon: <DollarCircleOutlined />,
            label: 'Fee System',
            children: feeItems,
          },
        ]
      : []),


    /* ---------------------------------------------------------
       SCHOOL
       Controller = academic_years

       IMPORTANT:
       pages table may contain ACADEMIC_YEARS.
       normalizeKey() handles this.
    --------------------------------------------------------- */

    ...(schoolItems.length > 0 &&
    canViewMainMenu(
      "academic_years",
      schoolPageKeys
    )
      ? [
          {
            key: 'school',
            icon: <ReadOutlined />,
            label: 'School',
            children: schoolItems,
          },
        ]
      : []),


    /* ---------------------------------------------------------
       RICE
       Controller = rice_contract
    --------------------------------------------------------- */

    ...(riceItems.length > 0 &&
    canViewMainMenu(
      "rice_contract",
      ricePageKeys
    )
      ? [
          {
            key: 'rice',
            icon: <ShoppingOutlined />,
            label: 'Rice',
            children: riceItems,
          },
        ]
      : []),


    /* ---------------------------------------------------------
       EXPORT SALE
       Controller = export_rc
    --------------------------------------------------------- */

    ...(exportSaleItems.length > 0 &&
    canViewMainMenu(
      "export_rc",
      exportSalePageKeys
    )
      ? [
          {
            key: 'export-sale',
            icon: <ExportOutlined />,
            label: 'Export Sale',
            children: exportSaleItems,
          },
        ]
      : []),


    /* ---------------------------------------------------------
       REPORTS
    --------------------------------------------------------- */

    ...(canViewPage("reports")
      ? [
          {
            key: '/reports',
            icon: <BarChartOutlined />,
            label: (
              <Link to="/reports">
                Reports
              </Link>
            ),
          },
        ]
      : []),


    /* ---------------------------------------------------------
       SETTINGS
    --------------------------------------------------------- */

    ...(canViewPage("settings")
      ? [
          {
            key: '/settings',
            icon: <SettingOutlined />,
            label: (
              <Link to="/settings">
                Settings
              </Link>
            ),
          },
        ]
      : []),


    /* ---------------------------------------------------------
       DEVELOPER
       Developer automatically sees this menu.
    --------------------------------------------------------- */

    ...(isDeveloper
      ? [
          {
            key: 'developer',
            icon: <SafetyOutlined />,
            label: 'Developer',

            children: [

              {
                key: '/developer-panel',
                label: (
                  <Link to="/developer-panel">
                    Developer Panel
                  </Link>
                ),
              },

              {
                key: '/developer-pages',
                label: (
                  <Link to="/developer-pages">
                    Page Management
                  </Link>
                ),
              },

              {
                key: '/user-permissions',
                label: (
                  <Link to="/user-permissions">
                    User Permissions
                  </Link>
                ),
              },

            ],
          },
        ]
      : []),

  ];


  /* =========================================================
     UI
  ========================================================= */

  return (

    <Layout
      style={{
        minHeight: '100vh',
      }}
    >

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={250}
      >

        <div
          style={{
            height: 32,
            margin: 16,
            color: '#fff',
            fontWeight: 'bold',
            fontSize: collapsed
              ? '14px'
              : '18px',
            textAlign: 'center',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {collapsed
            ? 'MAP'
            : '📋 Admin Panel'}
        </div>


        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[
            location.pathname
          ]}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          items={menuItems}
        />

      </Sider>


      {/* =====================================================
          MAIN LAYOUT
      ===================================================== */}

      <Layout>


        {/* ===================================================
            HEADER
        =================================================== */}

        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
          }}
        >

          <Button
            type="text"
            icon={
              collapsed
                ? <MenuUnfoldOutlined />
                : <MenuFoldOutlined />
            }
            onClick={() =>
              setCollapsed(!collapsed)
            }
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />


       <h3
  style={{
    margin: 0,
    fontSize: '18px',
  }}
>
  {user?.campus_name || 'Campus'}
  {' | '}
  {user?.section_name || 'Section'}
</h3>


          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 15,
              paddingRight: 20,
            }}
          >

            <span
              style={{
                fontWeight: 500,
              }}
            >

              <UserOutlined
                style={{
                  marginRight: 6,
                }}
              />

              {user?.name}

            </span>


            <Button
              danger
              onClick={handleLogout}
            >
              Logout
            </Button>

          </div>

        </Header>


        {/* ===================================================
            CONTENT
        =================================================== */}

        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >

          {children}

        </Content>

      </Layout>

    </Layout>
  );
};


export default Navbar2;