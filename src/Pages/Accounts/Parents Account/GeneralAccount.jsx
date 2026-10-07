import axios from "axios";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
    Card,
    Form,
    Input,
    Select,
    Button,
    Table,
    Space,
    Typography,
    Tag,
    message,
} from "antd";

import {
    PlusOutlined,
    EditOutlined,
    ReloadOutlined,
    CloseOutlined,
    SearchOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const GeneralAccount = () => {

    const [form] = Form.useForm();

    // =====================================================
    // STATES
    // =====================================================

    const [searchTerm, setSearchTerm] = useState("");

    const [editId, setEditId] = useState(null);

    const [getGeneralAccount, setGetGeneralAccount] =
        useState([]);

    const [controlAccount, setControlAccount] =
        useState([]);

    const [controlLoading, setControlLoading] =
        useState(false);

    const [tableLoading, setTableLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    // =====================================================
    // FETCH CONTROL ACCOUNTS
    // =====================================================

    const fetchControlAccounts = async () => {

        try {

            setControlLoading(true);

            const response = await axios.get(
                "/api/controlaccount"
            );

            setControlAccount(
                response.data || []
            );

        } catch (error) {

            console.error(
                "CONTROL ACCOUNT FETCH ERROR:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Unable to load Control Accounts."
            );

        } finally {

            setControlLoading(false);

        }
    };

    // =====================================================
    // FETCH GENERAL ACCOUNTS
    // =====================================================

    const fetchGeneralAccountsData = async () => {

        try {

            setTableLoading(true);

            const response = await axios.get(
                "/api/table-general"
            );

            setGetGeneralAccount(
                response.data || []
            );

        } catch (error) {

            console.error(
                "GENERAL ACCOUNT FETCH ERROR:",
                error
            );

            message.error(
                error.response?.data?.message ||
                "Unable to load General Accounts."
            );

        } finally {

            setTableLoading(false);

        }
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        fetchGeneralAccountsData();

        fetchControlAccounts();

    }, []);

    // =====================================================
    // RESET FORM
    // =====================================================

    const resetForm = () => {

        form.resetFields();

        setEditId(null);

    };

    // =====================================================
    // CANCEL EDIT
    // =====================================================

    const cancelEdit = () => {

        resetForm();

    };

    // =====================================================
    // RESET / CANCEL
    // =====================================================

    const handleReset = async () => {

        const result = await Swal.fire({

            icon: "warning",

            title: "Are you sure?",

            text: "All entered data will be cleared.",

            showCancelButton: true,

            confirmButtonText: "Yes, clear it",

            cancelButtonText: "No, keep it",

            confirmButtonColor: "#d33",

            cancelButtonColor: "#3085d6",

        });

        if (result.isConfirmed) {

            resetForm();

            Swal.fire({

                icon: "success",

                title: "Cleared!",

                text: "The form has been cleared.",

                timer: 1200,

                showConfirmButton: false,

            });

        }

    };

    // =====================================================
    // SAVE / UPDATE
    // =====================================================

    const handleSubmit = async (values) => {

        try {

            setSaving(true);

            let response;

            const payload = {

                tb_generalaccount:
                    values.tb_generalaccount.trim(),

                tb_controlaccount:
                    values.tb_controlaccount,

            };

            // =================================================
            // UPDATE
            // =================================================

            if (editId !== null) {

                response = await axios.put(

                    `/api/Updategeneral-accounts/${editId}`,

                    payload

                );

            }

            // =================================================
            // SAVE
            // =================================================

            else {

                response = await axios.post(

                    "/api/SavingGA",

                    payload

                );

            }

            // =================================================
            // SUCCESS
            // =================================================

            Swal.fire({

                icon: "success",

                title:
                    editId !== null
                        ? "Updated Successfully!"
                        : "Saved Successfully!",

                text:
                    response.data.message ||
                    "Operation completed successfully.",

                showConfirmButton: false,

                timer: 1800,

            });

            // Clear form

            resetForm();

            // Refresh table

            fetchGeneralAccountsData();

        } catch (error) {

            console.error(
                "SAVE / UPDATE GENERAL ACCOUNT ERROR:",
                error
            );

            Swal.fire({

                icon: "error",

                title:
                    editId !== null
                        ? "Update Failed"
                        : "Save Failed",

                text:
                    error.response?.data?.message ||
                    "Something went wrong.",

            });

        } finally {

            setSaving(false);

        }

    };

    // =====================================================
    // EDIT GENERAL ACCOUNT
    // =====================================================

    const handleEdit = (item) => {

        setEditId(
            item.General_Account_Id
        );

        form.setFieldsValue({

            tb_controlaccount:
                item.Control_Account_Id
                    ?.toString() || "",

            tb_generalaccount:
                item.General_Account_Name || "",

        });

        window.scrollTo({

            top: 0,

            behavior: "smooth",

        });

    };

    // =====================================================
    // FILTER TABLE
    // =====================================================

    const filteredGeneralAccount =
        getGeneralAccount.filter((item) =>

            item.General_Account_Name
                ?.toLowerCase()
                .includes(
                    searchTerm.toLowerCase()
                )

        );

    // =====================================================
    // TABLE COLUMNS
    // =====================================================

    const columns = [

        {
            title: "#",

            key: "serial",

            width: 70,

            align: "center",

            render: (_, __, index) => (

                <Tag color="blue">

                    {index + 1}

                </Tag>

            ),

        },

        {
            title: "General Account Name",

            dataIndex:
                "General_Account_Name",

            key:
                "General_Account_Name",

            render: (value) => (

                <strong>

                    {value || "-"}

                </strong>

            ),

        },

        {
            title: "Control Account Name",

            dataIndex:
                "ControlAccountName",

            key:
                "ControlAccountName",

            render: (value) => (

                <span>

                    {value || "-"}

                </span>

            ),

        },

        {
            title: "Action",

            key: "action",

            width: 120,

            align: "center",

            render: (_, record) => (

                <Button

                    type={
                        editId ===
                        record.General_Account_Id
                            ? "primary"
                            : "default"
                    }

                    icon={
                        <EditOutlined />
                    }

                    onClick={(e) => {

                        e.stopPropagation();

                        handleEdit(record);

                    }}

                >

                    Edit

                </Button>

            ),

        },

    ];

    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div
            style={{
                width: "100%",
                padding: "20px",
            }}
        >

            {/* =================================================
                FORM CARD
            ================================================= */}

            <Card
                style={{
                    marginBottom: 20,
                }}
            >

                <Title
                    level={3}
                    style={{
                        marginTop: 0,
                        marginBottom: 25,
                    }}
                >

                    General Account

                </Title>

                <Form

                    form={form}

                    layout="vertical"

                    onFinish={
                        handleSubmit
                    }

                    autoComplete="off"

                >

                    <div
                        style={{
                            display: "grid",

                            gridTemplateColumns:
                                "1fr 1fr",

                            gap: "20px",
                        }}
                    >

                        {/* =====================================
                            CONTROL ACCOUNT
                        ====================================== */}

                        <Form.Item

                            label="Control Account"

                            name="tb_controlaccount"

                            rules={[
                                {
                                    required: true,

                                    message:
                                        "Please select Control Account.",
                                },
                            ]}

                        >

                            <Select

                                size="large"

                                placeholder="Select Control Account"

                                loading={
                                    controlLoading
                                }

                                showSearch

                                optionFilterProp="label"

                                options={

                                    controlAccount.map(
                                        (item) => ({

                                            value:
                                                String(
                                                    item.ControlAccountID
                                                ),

                                            label:
                                                item.ControlAccountName,

                                        })
                                    )

                                }

                            />

                        </Form.Item>

                        {/* =====================================
                            GENERAL ACCOUNT
                        ====================================== */}

                        <Form.Item

                            label="General Account"

                            name="tb_generalaccount"

                            rules={[
                                {
                                    required: true,

                                    message:
                                        "Please enter General Account.",
                                },

                                {
                                    whitespace: true,

                                    message:
                                        "General Account cannot be empty.",
                                },
                            ]}

                        >

                            <Input

                                size="large"

                                placeholder="General Account Name"

                            />

                        </Form.Item>

                    </div>

                    {/* =====================================
                        BUTTONS
                    ====================================== */}

                    <Form.Item

                        style={{
                            marginBottom: 0,
                            marginTop: 10,
                        }}

                    >

                        <Space>

                            <Button

                                type="primary"

                                htmlType="submit"

                                loading={
                                    saving
                                }

                                icon={
                                    editId !== null
                                        ? <EditOutlined />
                                        : <PlusOutlined />
                                }

                                size="large"

                            >

                                {editId !== null
                                    ? "Update"
                                    : "Save"}

                            </Button>

                            <Button

                                danger

                                type="default"

                                icon={
                                    editId !== null
                                        ? <CloseOutlined />
                                        : <ReloadOutlined />
                                }

                                size="large"

                                onClick={
                                    editId !== null
                                        ? cancelEdit
                                        : handleReset
                                }

                            >

                                {editId !== null
                                    ? "Cancel Edit"
                                    : "Cancel"}

                            </Button>

                        </Space>

                    </Form.Item>

                </Form>

            </Card>

            {/* =================================================
                TABLE CARD
            ================================================= */}

            <Card>

                {/* =============================================
                    TABLE HEADER
                ============================================== */}

                <div
                    style={{
                        display: "flex",

                        justifyContent:
                            "space-between",

                        alignItems: "center",

                        marginBottom: 16,

                        gap: 20,
                    }}
                >

                    <div>

                        <Title
                            level={4}
                            style={{
                                margin: 0,
                            }}
                        >

                            General Accounts

                        </Title>

                        <span
                            style={{
                                color: "#888",
                            }}
                        >

                            {
                                getGeneralAccount.length
                            }

                            {" "}

                            Accounts

                        </span>

                    </div>

                    {/* SEARCH + REFRESH */}

                    <Space>

                        <Input

                            allowClear

                            prefix={
                                <SearchOutlined />
                            }

                            placeholder="Search General Account..."

                            value={
                                searchTerm
                            }

                            onChange={(e) =>
                                setSearchTerm(
                                    e.target.value
                                )
                            }

                            style={{
                                width: 280,
                            }}

                        />

                        <Button

                            icon={
                                <ReloadOutlined />
                            }

                            onClick={
                                fetchGeneralAccountsData
                            }

                            loading={
                                tableLoading
                            }

                        >

                            Refresh

                        </Button>

                    </Space>

                </div>

                {/* =============================================
                    TABLE
                ============================================== */}

                <Table

                    rowKey="General_Account_Id"

                    columns={columns}

                    dataSource={
                        filteredGeneralAccount
                    }

                    loading={
                        tableLoading
                    }

                    bordered

                    size="middle"

                    onRow={(record) => ({

                        onClick: () =>
                            handleEdit(record),

                        style: {
                            cursor: "pointer",
                        },

                    })}

                    rowClassName={(record) =>

                        editId ===
                        record.General_Account_Id

                            ? "ant-table-row-selected"

                            : ""

                    }

                    pagination={{

                        pageSize: 10,

                        showSizeChanger: true,

                        pageSizeOptions: [
                            "10",
                            "20",
                            "50",
                            "100",
                        ],

                        showTotal: (total) =>
                            `Total ${total} accounts`,

                    }}

                    locale={{

                        emptyText:
                            searchTerm
                                ? "No General Account found."
                                : "No General Accounts saved yet.",

                    }}

                />

            </Card>

        </div>

    );

};

export default GeneralAccount;
