
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Card,
    Select,
    Table,
    Checkbox,
    Button,
    Space,
    message,
    Tag
} from "antd";

const UserPermission = () => {

    const [users, setUsers] = useState([]);
    const [permissions, setPermissions] = useState([]);

    const [selectedUser, setSelectedUser] = useState(null);

    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingPermissions, setLoadingPermissions] =
        useState(false);

    const [saving, setSaving] = useState(false);


    /* =========================================================
       MAIN MENU GROUPS

       controller = existing page which stores
       can_view_main_menu in user_page_permissions
       ========================================================= */

    const menuGroups = [
        {
            key: "library",
            name: "Library",
            controller: "gowdown",
            pages: [
                "gowdown",
                "items",
                "ppbags"
            ]
        },

        {
            key: "users",
            name: "Users",
            controller: "users",
            pages: [
                "users",
                "roles"
            ]
        },

        {
            key: "accounts",
            name: "Accounts",
            controller: "hoa",
            pages: [
                "hoa",
                "control_accounts",
                "general_accounts",
                "subsidiary_accounts",
                "journal_voucher",
                "bank_payment",
                "bank_receipt",
                "cash_payment",
                "cash_receipt",
                "bank_payment2",
                "ledger"
            ]
        },

        {
            key: "fee-system",
            name: "Fee System",
            controller: "fee_heads",
            pages: [
                "fee_heads",
                "fee_structure",
                "student_fee",
                "class_fee_voucher",
                "student_fee_voucher",
                "fee_receipt",
                "outstanding_fee_report",
                "fee_collection_report"
            ]
        },

        {
            key: "school",
            name: "School",
            controller: "academic_years",
            pages: [
                "academic_years",
                "campuses",
                 "section",
                "classes",
                "subjects",
                "teachers",
                "periods",
                "students",
                "timetable"
            ]
        },

        {
            key: "rice",
            name: "Rice",
            controller: "rice_contract",
            pages: [
                "rice_contract",
                "rice_arrival",
                "rice_purchase",
                "local_sale_contract",
                "local_sale",
                "rice_processing"
            ]
        },

        {
            key: "export-sale",
            name: "Export Sale",
            controller: "export_rc",
            pages: [
                "export_rc",
                "export_ra",
                "export_rp",
                "export_lsc",
                "export_ls"
            ]
        }
    ];


    /* =========================================================
       NORMALIZE PAGE KEY

       DB may contain:
       ACADEMIC_YEARS

       Navbar uses:
       academic_years

       Both will now match.
       ========================================================= */

    const normalizeKey = (value) => {

        return String(value || "")
            .trim()
            .toLowerCase();
    };


    /* =========================================================
       GET PERMISSION BY PAGE KEY
       ========================================================= */

    const getPermission = (pageKey) => {

        const wantedKey =
            normalizeKey(pageKey);

        return permissions.find(
            item =>
                normalizeKey(item.page_key) ===
                wantedKey
        );
    };


    /* =========================================================
       LOAD USERS
       ========================================================= */

    const loadUsers = async () => {

        try {

            setLoadingUsers(true);

            const response = await axios.get(
                "/api/permission-users"
            );

            setUsers(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {

            console.error(
                "Load Users Error:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Unable to load users"
            );

        } finally {

            setLoadingUsers(false);
        }
    };


    /* =========================================================
       LOAD USER PERMISSIONS
       ========================================================= */

    const loadPermissions = async (userId) => {

        try {

            setLoadingPermissions(true);

            const response = await axios.get(
                `/api/permissions/${userId}`
            );

            setPermissions(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {

            console.error(
                "Load Permissions Error:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Unable to load user permissions"
            );

            setPermissions([]);

        } finally {

            setLoadingPermissions(false);
        }
    };


    /* =========================================================
       INITIAL LOAD
       ========================================================= */

    useEffect(() => {

        loadUsers();

    }, []);


    /* =========================================================
       USER CHANGE
       ========================================================= */

    const handleUserChange = (userId) => {

        setSelectedUser(userId);

        if (userId) {

            loadPermissions(userId);

        } else {

            setPermissions([]);
        }
    };


    /* =========================================================
       NORMAL PAGE PERMISSION CHANGE
       ========================================================= */

    const handlePermissionChange = (
        pageId,
        permissionName,
        checked
    ) => {

        setPermissions(prev =>
            prev.map(item => {

                if (
                    Number(item.page_id) ===
                    Number(pageId)
                ) {

                    return {
                        ...item,
                        [permissionName]:
                            checked ? 1 : 0
                    };
                }

                return item;
            })
        );
    };


    /* =========================================================
       MAIN MENU CHANGE
       ========================================================= */

    const handleMainMenuChange = (
        controllerPageKey,
        checked
    ) => {

        setPermissions(prev =>
            prev.map(item => {

                if (
                    normalizeKey(item.page_key) ===
                    normalizeKey(controllerPageKey)
                ) {

                    return {
                        ...item,

                        is_main_menu: 1,

                        can_view_main_menu:
                            checked ? 1 : 0
                    };
                }

                return item;
            })
        );
    };


    /* =========================================================
       SELECT ALL
       ========================================================= */

    const setAllPermissions = (
        pageId,
        checked
    ) => {

        setPermissions(prev =>
            prev.map(item => {

                if (
                    Number(item.page_id) ===
                    Number(pageId)
                ) {

                    return {
                        ...item,

                        can_view:
                            checked ? 1 : 0,

                        can_add:
                            checked ? 1 : 0,

                        can_edit:
                            checked ? 1 : 0,

                        can_delete:
                            checked ? 1 : 0,

                        can_print:
                            checked ? 1 : 0
                    };
                }

                return item;
            })
        );
    };


    /* =========================================================
       SAVE
       ========================================================= */

    const savePermissions = async () => {

        if (!selectedUser) {

            message.warning(
                "Please select a user"
            );

            return;
        }


        try {

            setSaving(true);


            /*
             * Make controller rows
             * is_main_menu = 1
             */

            const finalPermissions =
                permissions.map(item => {

                    const controllerGroup =
                        menuGroups.find(
                            group =>
                                normalizeKey(
                                    group.controller
                                ) ===
                                normalizeKey(
                                    item.page_key
                                )
                        );


                    if (controllerGroup) {

                        return {
                            ...item,
                            is_main_menu: 1
                        };
                    }


                    return item;
                });


            await axios.put(
                `/api/permissions/${selectedUser}`,
                {
                    permissions:
                        finalPermissions
                }
            );


            message.success(
                "Permissions saved successfully"
            );


            await loadPermissions(
                selectedUser
            );


        } catch (error) {

            console.error(
                "Save Permissions Error:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Unable to save permissions"
            );

        } finally {

            setSaving(false);
        }
    };


    /* =========================================================
       BUILD TABLE DATA
       ========================================================= */

    const tableData = [];

    const usedPageIds = new Set();


    menuGroups.forEach(group => {

        const controller =
            getPermission(
                group.controller
            );


        /*
         * If controller page does not exist
         * in DB, don't create fake menu.
         */

        if (!controller) {
            return;
        }


        /*
         * MAIN MENU PARENT ROW
         */

        tableData.push({

            key:
                `menu-${group.key}`,

            isMenuRow: true,

            menuName:
                group.name,

            controllerPageKey:
                group.controller,

            can_view_main_menu:
                Number(
                    controller.can_view_main_menu
                ) === 1 ? 1 : 0
        });


        /*
         * SUBMENU ROWS
         */

        group.pages.forEach(pageKey => {

            const permission =
                getPermission(pageKey);


            if (!permission) {
                return;
            }


            usedPageIds.add(
                Number(permission.page_id)
            );


            tableData.push({

                ...permission,

                key:
                    `page-${permission.page_id}`,

                isMenuRow: false,

                menuKey:
                    group.key
            });

        });

    });


    /* =========================================================
       ADD REMAINING PAGES

       Dashboard / Reports / Settings etc.
       ========================================================= */

    permissions.forEach(permission => {

        if (
            usedPageIds.has(
                Number(permission.page_id)
            )
        ) {
            return;
        }


        tableData.push({

            ...permission,

            key:
                `page-${permission.page_id}`,

            isMenuRow: false,

            isStandalone: true
        });

    });


    /* =========================================================
       TABLE COLUMNS
       ========================================================= */

    const columns = [

        {
            title: "#",
            width: 60,

            render: (_, record, index) => {

                if (record.isMenuRow) {
                    return "";
                }

                return index + 1;
            }
        },


        {
            title: "Page",
            dataIndex: "page_name",
            key: "page_name",

            render: (value, record) => {

                /*
                 * MAIN MENU
                 */

                if (record.isMenuRow) {

                    return (
                        <div
                            style={{
                                fontWeight: "bold",
                                fontSize: 16,
                                padding: "6px 0"
                            }}
                        >
                            {record.menuName}
                        </div>
                    );
                }


                /*
                 * NORMAL PAGE
                 */

                return (
                    <div
                        style={{
                            paddingLeft: 25
                        }}
                    >

                        <strong>
                            {value}
                        </strong>

                        <br />

                        <Tag color="blue">
                            {record.route}
                        </Tag>

                    </div>
                );
            }
        },


        {
            title: "View",
            dataIndex: "can_view",
            width: 90,

            render: (value, record) => {

                if (record.isMenuRow) {
                    return null;
                }


                return (
                    <Checkbox
                        checked={
                            Number(value) === 1
                        }

                        onChange={e =>
                            handlePermissionChange(
                                record.page_id,
                                "can_view",
                                e.target.checked
                            )
                        }
                    />
                );
            }
        },


        {
            title: "Main Menu",
            dataIndex:
                "can_view_main_menu",

            width: 120,

            render: (value, record) => {

                /*
                 * MAIN MENU CHECKBOX
                 * ONLY ON PARENT ROW
                 */

                if (!record.isMenuRow) {
                    return null;
                }


                return (
                    <Checkbox
                        checked={
                            Number(value) === 1
                        }

                        onChange={e =>
                            handleMainMenuChange(
                                record.controllerPageKey,
                                e.target.checked
                            )
                        }
                    />
                );
            }
        },


        {
            title: "Add",
            dataIndex: "can_add",
            width: 90,

            render: (value, record) => {

                if (record.isMenuRow) {
                    return null;
                }


                return (
                    <Checkbox
                        checked={
                            Number(value) === 1
                        }

                        onChange={e =>
                            handlePermissionChange(
                                record.page_id,
                                "can_add",
                                e.target.checked
                            )
                        }
                    />
                );
            }
        },


        {
            title: "Edit",
            dataIndex: "can_edit",
            width: 90,

            render: (value, record) => {

                if (record.isMenuRow) {
                    return null;
                }


                return (
                    <Checkbox
                        checked={
                            Number(value) === 1
                        }

                        onChange={e =>
                            handlePermissionChange(
                                record.page_id,
                                "can_edit",
                                e.target.checked
                            )
                        }
                    />
                );
            }
        },


        {
            title: "Delete",
            dataIndex: "can_delete",
            width: 90,

            render: (value, record) => {

                if (record.isMenuRow) {
                    return null;
                }


                return (
                    <Checkbox
                        checked={
                            Number(value) === 1
                        }

                        onChange={e =>
                            handlePermissionChange(
                                record.page_id,
                                "can_delete",
                                e.target.checked
                            )
                        }
                    />
                );
            }
        },


        {
            title: "Print",
            dataIndex: "can_print",
            width: 90,

            render: (value, record) => {

                if (record.isMenuRow) {
                    return null;
                }


                return (
                    <Checkbox
                        checked={
                            Number(value) === 1
                        }

                        onChange={e =>
                            handlePermissionChange(
                                record.page_id,
                                "can_print",
                                e.target.checked
                            )
                        }
                    />
                );
            }
        },


        {
            title: "All",
            width: 80,

            render: (_, record) => {

                if (record.isMenuRow) {
                    return null;
                }


                const allChecked =
                    Number(record.can_view) === 1 &&
                    Number(record.can_add) === 1 &&
                    Number(record.can_edit) === 1 &&
                    Number(record.can_delete) === 1 &&
                    Number(record.can_print) === 1;


                return (
                    <Checkbox
                        checked={allChecked}

                        onChange={e =>
                            setAllPermissions(
                                record.page_id,
                                e.target.checked
                            )
                        }
                    />
                );
            }
        }

    ];


    /* =========================================================
       SELECTED USER
       ========================================================= */

    const selectedUserData =
        users.find(
            user =>
                Number(user.user_id) ===
                Number(selectedUser)
        );


    /* =========================================================
       RETURN
       ========================================================= */

    return (

        <div
            style={{
                padding: 20
            }}
        >

            <Card
                title="User Page Permissions"
            >

                <Space
                    direction="vertical"
                    size="large"
                    style={{
                        width: "100%"
                    }}
                >

                    <Select
                        showSearch
                        allowClear
                        loading={loadingUsers}
                        placeholder="Select User"
                        value={selectedUser}
                        onChange={handleUserChange}
                        style={{
                            width: 400
                        }}
                        optionFilterProp="label"

                        options={
                            users.map(user => ({
                                value:
                                    user.user_id,

                                label:
                                    `${user.name} - ${user.email}`
                            }))
                        }
                    />


                    {selectedUserData && (

                        <div>

                            <strong>
                                User:
                            </strong>{" "}

                            {selectedUserData.name}

                            {" | "}

                            <strong>
                                Role:
                            </strong>{" "}

                            {selectedUserData.role}

                        </div>

                    )}

                </Space>

            </Card>


            {selectedUser && (

                <Card
                    title="Page Permissions"

                    style={{
                        marginTop: 20
                    }}
                >

                    <Table
                        rowKey="key"

                        columns={columns}

                        dataSource={tableData}

                        loading={
                            loadingPermissions
                        }

                        bordered

                        pagination={false}

                        scroll={{
                            x: 900
                        }}

                        rowClassName={
                            record =>
                                record.isMenuRow
                                    ? "main-menu-permission-row"
                                    : ""
                        }
                    />


                    <div
                        style={{
                            marginTop: 20,
                            textAlign: "right"
                        }}
                    >

                        <Button
                            type="primary"
                            size="large"
                            loading={saving}
                            onClick={
                                savePermissions
                            }
                        >
                            Save Permissions
                        </Button>

                    </div>

                </Card>
            )}

        </div>
    );
};


export default UserPermission;
