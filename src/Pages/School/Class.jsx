
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./School.css";

import {
    Form,
    Input,
    Button,
    Table,
    Space,
    Card,
    Select,
    Switch,
    Tag
} from "antd";

import {
    SaveOutlined,
    EditOutlined,
    CloseOutlined,
    SearchOutlined,
    StopOutlined,
    CheckOutlined
} from "@ant-design/icons";


const API = "/api";


const Class = () => {

    const [form] = Form.useForm();

    const [classes, setClasses] = useState([]);
    const [campuses, setCampuses] = useState([]);
    const [sections, setSections] = useState([]);

    const [loading, setLoading] = useState(false);

    const [editingId, setEditingId] = useState(null);

    const [searchText, setSearchText] = useState("");

    const [statusFilter, setStatusFilter] = useState("all");


    // =====================================================
    // LOGGED IN USER
    // =====================================================

    const loggedInUser = JSON.parse(
        localStorage.getItem("user") || "null"
    );


    const userCampusId = Number(
        loggedInUser?.campus_id || 0
    );


    const userSectionId = Number(
        loggedInUser?.section_id || 0
    );


    const userRole = String(
        loggedInUser?.role || ""
    ).toUpperCase();


    const isAdmin =
        userRole === "SUPER_ADMIN" ||
        userRole === "CAMPUS_ADMIN" ||
        Number(loggedInUser?.is_developer) === 1;


    // =====================================================
    // LOAD ALL DATA
    // =====================================================
// 
  const loadData = async () => {
    try {
        setLoading(true);

        const [classResponse, campusResponse] = await Promise.all([
            axios.get(`${API}/classes`),
            axios.get(`${API}/campuses`)
        ]);

        setClasses(classResponse.data || []);
        setCampuses(campusResponse.data || []);

        // ==========================================
        // NORMAL USER
        // ==========================================
        if (!isAdmin) {

            if (!userCampusId) {
                setSections([]);
                return;
            }

            // Campus automatically select
            form.setFieldValue(
                "campus_id",
                userCampusId
            );

            // Load user's campus sections
            await loadSections(
                userCampusId,
                userSectionId
            );

        }

    } catch (error) {

        console.error(
            "LOAD CLASS DATA ERROR:",
            error
        );

        Swal.fire(
            "Error",
            "Unable to load class data",
            "error"
        );

    } finally {
        setLoading(false);
    }
};


    // =====================================================
    // LOAD SECTIONS BY CAMPUS
    // =====================================================

  const loadSections = async (
    campusId,
    selectedSectionId = null
) => {

    try {

        if (!campusId) {

            setSections([]);

            form.setFieldValue(
                "section_id",
                undefined
            );

            return;
        }

        const response = await axios.get(
            `${API}/sections`,
            {
                params: {
                    campus_id: Number(campusId)
                }
            }
        );

        const sectionData =
            response.data || [];

        console.log(
            "SECTIONS RESPONSE:",
            sectionData
        );

        setSections(sectionData);

        // ==========================================
        // NORMAL USER
        // ==========================================
        if (!isAdmin) {

            const userSection =
                sectionData.find(
                    item =>
                        Number(item.section_id) ===
                        Number(userSectionId)
                );

            if (userSection) {

                form.setFieldValue(
                    "section_id",
                    Number(userSectionId)
                );

            } else {

                form.setFieldValue(
                    "section_id",
                    undefined
                );

                console.warn(
                    "User section not found:",
                    userSectionId
                );
            }

            return;
        }

        // ==========================================
        // ADMIN
        // ==========================================
        if (selectedSectionId) {

            const exists =
                sectionData.some(
                    item =>
                        Number(item.section_id) ===
                        Number(selectedSectionId)
                );

            if (exists) {

                form.setFieldValue(
                    "section_id",
                    Number(selectedSectionId)
                );

            }
        }

    } catch (error) {

        console.error(
            "LOAD SECTIONS ERROR:",
            error
        );

        setSections([]);

        form.setFieldValue(
            "section_id",
            undefined
        );

        Swal.fire(
            "Error",
            "Unable to load sections",
            "error"
        );
    }
};


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadData();

    }, []);


    // =====================================================
    // CAMPUS CHANGE
    // =====================================================

    const handleCampusChange = async (
        campusId
    ) => {

        form.setFieldValue(
            "section_id",
            undefined
        );


        setSections([]);


        await loadSections(
            campusId
        );

    };


    // =====================================================
    // SAVE / UPDATE
    // =====================================================

    const handleSubmit = async (
        values
    ) => {

        try {

            setLoading(true);


            const data = {

                campus_id:
                    Number(
                        values.campus_id
                    ),

                section_id:
                    Number(
                        values.section_id
                    ),

                name:
                    values.name
                        ?.trim()
                        .toUpperCase(),

                code:
                    values.code
                        ?.trim()
                        .toUpperCase(),

                description:
                    values.description
                        ?.trim()
                        .toUpperCase(),

                is_active:
                    values.is_active !== false

            };


            // =================================================
            // UPDATE
            // =================================================

            if (editingId) {

                await axios.put(

                    `${API}/classes/${editingId}`,

                    data

                );


                await Swal.fire({

                    icon: "success",

                    title: "Updated",

                    text:
                        "Class updated successfully",

                    timer: 1500,

                    showConfirmButton: false

                });

            }


            // =================================================
            // SAVE
            // =================================================

            else {

                await axios.post(

                    `${API}/classes`,

                    data

                );


                await Swal.fire({

                    icon: "success",

                    title: "Saved",

                    text:
                        "Class saved successfully",

                    timer: 1500,

                    showConfirmButton: false

                });

            }


            form.resetFields();


            form.setFieldValue(
                "is_active",
                true
            );


            // Normal user ka campus/section
            // dobara automatically set hoga

            if (!isAdmin) {

                form.setFieldValue(
                    "campus_id",
                    userCampusId
                );

                await loadSections(
                    userCampusId,
                    userSectionId
                );

            }


            setEditingId(null);


            await loadData();


        } catch (error) {

            console.error(error);


            Swal.fire(

                "Error",

                error.response?.data?.message ||
                "Something went wrong",

                "error"

            );

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // EDIT
    // =====================================================

    const handleEdit = async (
        record
    ) => {

        try {

            setEditingId(
                record.class_id
            );


            // =================================================
            // LOAD SECTIONS OF CAMPUS
            // =================================================

            await loadSections(
                record.campus_id,
                record.section_id
            );


            // =================================================
            // SET FORM
            // =================================================

            form.setFieldsValue({

                campus_id:
                    record.campus_id,

                section_id:
                    record.section_id,

                name:
                    record.name || "",

                code:
                    record.code || "",

                description:
                    record.description || "",

                is_active:
                    record.is_active === 1

            });


            window.scrollTo({

                top: 0,

                behavior: "smooth"

            });

        } catch (error) {

            console.error(error);

        }

    };


    // =====================================================
    // CANCEL
    // =====================================================

    const handleCancel = async () => {

        form.resetFields();


        form.setFieldValue(
            "is_active",
            true
        );


        setEditingId(null);


        if (!isAdmin && userCampusId) {

            form.setFieldValue(
                "campus_id",
                userCampusId
            );


            await loadSections(
                userCampusId,
                userSectionId
            );

        } else {

            setSections([]);

        }

    };


    // =====================================================
    // DEACTIVATE
    // =====================================================

    const handleDeactivate = async (
        class_id
    ) => {

        try {

            setLoading(true);


            await axios.delete(

                `${API}/classes/${class_id}`

            );


            await Swal.fire({

                icon: "success",

                title: "Deactivated",

                text:
                    "Class deactivated successfully",

                timer: 1500,

                showConfirmButton: false

            });


            await loadData();


        } catch (error) {

            console.error(error);


            Swal.fire(

                "Error",

                error.response?.data?.message ||
                "Unable to deactivate class",

                "error"

            );

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // ACTIVATE
    // =====================================================

    const handleActivate = async (
        class_id
    ) => {

        try {

            setLoading(true);


            await axios.put(

                `${API}/classes/${class_id}/activate`

            );


            await Swal.fire({

                icon: "success",

                title: "Activated",

                text:
                    "Class activated successfully",

                timer: 1500,

                showConfirmButton: false

            });


            await loadData();


        } catch (error) {

            console.error(error);


            Swal.fire(

                "Error",

                error.response?.data?.message ||
                "Unable to activate class",

                "error"

            );

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // VISIBLE CLASSES
    // =====================================================

    const visibleClasses = classes.filter(
        item => {

            // =================================================
            // ADMIN / DEVELOPER
            // =================================================

            if (isAdmin) {

                return true;

            }


            // =================================================
            // NORMAL USER
            // =================================================

            return (

                Number(
                    item.campus_id
                ) === userCampusId

                &&

                Number(
                    item.section_id
                ) === userSectionId

            );

        }
    );


    // =====================================================
    // SEARCH + STATUS FILTER
    // =====================================================

    const filteredData =
        visibleClasses.filter(
            item => {

                const search =
                    searchText
                        .toLowerCase()
                        .trim();


                const matchesSearch =

                    item.name
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    item.code
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    item.campus_name
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    item.section_name
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    item.description
                        ?.toLowerCase()
                        .includes(search);


                const matchesStatus =

                    statusFilter === "all"

                    ||

                    (
                        statusFilter === "active"

                        &&

                        item.is_active === 1
                    )

                    ||

                    (
                        statusFilter === "inactive"

                        &&

                        item.is_active === 0
                    );


                return (

                    matchesSearch &&

                    matchesStatus

                );

            }
        );


    // =====================================================
    // TABLE COLUMNS
    // =====================================================

    const columns = [

        {
            title: "#",

            key: "serial",

            width: 60,

            render:
                (_, record, index) =>
                    index + 1

        },


        {
            title: "Campus",

            dataIndex: "campus_name",

            key: "campus_name",

            width: 180

        },


        {
            title: "Section",

            dataIndex: "section_name",

            key: "section_name",

            width: 150,

            render: (
                value
            ) => value || "-"

        },


        {
            title: "Class Name",

            dataIndex: "name",

            key: "name",

            sorter:
                (a, b) =>
                    (a.name || "")
                        .localeCompare(
                            b.name || ""
                        )

        },


        {
            title: "Code",

            dataIndex: "code",

            key: "code",

            width: 120

        },


        {
            title: "Description",

            dataIndex: "description",

            key: "description"

        },


        {
            title: "Status",

            dataIndex: "is_active",

            key: "is_active",

            width: 110,

            render: (
                value
            ) =>

                value === 1

                    ?

                    <Tag color="green">
                        ACTIVE
                    </Tag>

                    :

                    <Tag color="red">
                        INACTIVE
                    </Tag>

        },


        {
            title: "Created At",

            dataIndex: "created_at",

            key: "created_at",

            width: 180,

            render: (
                value
            ) => {

                if (!value)
                    return "";

                return new Date(
                    value
                ).toLocaleString();

            }

        },


        {
            title: "Action",

            key: "action",

            width: 190,

            render: (
                _,
                record
            ) => (

                <Space>

                    <Button

                        type="primary"

                        size="small"

                        icon={
                            <EditOutlined />
                        }

                        onClick={() =>
                            handleEdit(
                                record
                            )
                        }

                    >

                        Edit

                    </Button>


                    {
                        record.is_active === 1

                            ?

                            <Button

                                danger

                                size="small"

                                icon={
                                    <StopOutlined />
                                }

                                onClick={() =>
                                    handleDeactivate(
                                        record.class_id
                                    )
                                }

                            >

                                Deactivate

                            </Button>

                            :

                            <Button

                                type="primary"

                                size="small"

                                icon={
                                    <CheckOutlined />
                                }

                                onClick={() =>
                                    handleActivate(
                                        record.class_id
                                    )
                                }

                            >

                                Activate

                            </Button>

                    }

                </Space>

            )

        }

    ];


    // =====================================================
    // UI
    // =====================================================

    return (

        <div
            style={{
                padding: "20px"
            }}
        >

            {/* ================================================= */}
            {/* FORM */}
            {/* ================================================= */}

            <Card

                title={
                    editingId
                        ? "Update Class"
                        : "Class"
                }

                style={{
                    marginBottom: 20
                }}

            >

                <Form

                    form={form}

                    layout="vertical"

                    onFinish={
                        handleSubmit
                    }

                    initialValues={{

                        is_active: true

                    }}

                >

                    <div
                        style={{

                            display: "grid",

                            gridTemplateColumns:
                                "2fr 2fr 2fr 1fr 2fr 120px",

                            gap: "15px"

                        }}
                    >

                        {/* ================================================= */}
                        {/* CAMPUS */}
                        {/* ================================================= */}

                        <Form.Item

                            label="Campus"

                            name="campus_id"

                            rules={[
                                {
                                    required: true,

                                    message:
                                        "Please select campus"
                                }
                            ]}

                        >

                            <Select

                                placeholder=
                                    "Select Campus"

                                showSearch

                                optionFilterProp=
                                    "label"

                                disabled={
                                    !isAdmin
                                }

                                onChange={
                                    handleCampusChange
                                }

                                options={

                                    campuses
                                        .filter(
                                            item =>
                                                item.is_active ===
                                                    undefined

                                                ||

                                                item.is_active ===
                                                    1
                                        )
                                        .map(
                                            item => ({

                                                value:
                                                    Number(
                                                        item.campus_id ??
                                                        item.id
                                                    ),

                                                label:
                                                    `${item.name} (${item.code})`

                                            })
                                        )

                                }

                            />

                        </Form.Item>


                        {/* ================================================= */}
                        {/* SECTION */}
                        {/* ================================================= */}

                        <Form.Item

                            label="Section"

                            name="section_id"

                            rules={[
                                {
                                    required: true,

                                    message:
                                        "Please select section"
                                }
                            ]}

                        >

                            <Select

                                placeholder=
                                    "Select Section"

                                showSearch

                                optionFilterProp=
                                    "label"

                                disabled={
                                    !isAdmin
                                }

                                options={

                                    sections.map(
                                        item => ({

                                            value:
                                                Number(
                                                    item.section_id
                                                ),

                                            label:
                                                item.section_name

                                        })
                                    )

                                }

                            />

                        </Form.Item>


                        {/* ================================================= */}
                        {/* CLASS NAME */}
                        {/* ================================================= */}

                        <Form.Item

                            label="Class Name"

                            name="name"

                            rules={[
                                {
                                    required: true,

                                    message:
                                        "Please enter class name"
                                }
                            ]}

                        >

                            <Input

                                placeholder=
                                    "Enter class name"

                                onChange={
                                    (e) =>

                                        form.setFieldValue(

                                            "name",

                                            e.target.value
                                                .toUpperCase()

                                        )
                                }

                            />

                        </Form.Item>


                        {/* ================================================= */}
                        {/* CODE */}
                        {/* ================================================= */}

                        <Form.Item

                            label="Code"

                            name="code"

                            rules={[
                                {
                                    required: true,

                                    message:
                                        "Please enter class code"
                                }
                            ]}

                        >

                            <Input

                                placeholder="Code"

                                onChange={
                                    (e) =>

                                        form.setFieldValue(

                                            "code",

                                            e.target.value
                                                .toUpperCase()

                                        )
                                }

                            />

                        </Form.Item>


                        {/* ================================================= */}
                        {/* DESCRIPTION */}
                        {/* ================================================= */}

                        <Form.Item

                            label="Description"

                            name="description"

                        >

                            <Input

                                placeholder=
                                    "Description"

                                onChange={
                                    (e) =>

                                        form.setFieldValue(

                                            "description",

                                            e.target.value
                                                .toUpperCase()

                                        )
                                }

                            />

                        </Form.Item>


                        {/* ================================================= */}
                        {/* ACTIVE */}
                        {/* ================================================= */}

                        <Form.Item

                            label="Active"

                            name="is_active"

                            valuePropName="checked"

                        >

                            <Switch />

                        </Form.Item>

                    </div>


                    {/* ================================================= */}
                    {/* BUTTONS */}
                    {/* ================================================= */}

                    <Space>

                        <Button

                            type="primary"

                            htmlType="submit"

                            loading={loading}

                            icon={
                                <SaveOutlined />
                            }

                        >

                            {
                                editingId
                                    ? "Update"
                                    : "Save"
                            }

                        </Button>


                        {
                            editingId && (

                                <Button

                                    danger

                                    icon={
                                        <CloseOutlined />
                                    }

                                    onClick={
                                        handleCancel
                                    }

                                >

                                    Cancel

                                </Button>

                            )
                        }

                    </Space>

                </Form>

            </Card>


            {/* ================================================= */}
            {/* TABLE */}
            {/* ================================================= */}

            <Card
                title="Class List"
            >

                <div

                    style={{

                        display: "flex",

                        justifyContent:
                            "space-between",

                        marginBottom: 15,

                        gap: 10

                    }}

                >

                    <Input

                        prefix={
                            <SearchOutlined />
                        }

                        placeholder=
                            "Search class, code, campus, section..."

                        value={
                            searchText
                        }

                        onChange={
                            (e) =>
                                setSearchText(
                                    e.target.value
                                )
                        }

                        allowClear

                        style={{
                            width: 400
                        }}

                    />


                    <Select

                        value={
                            statusFilter
                        }

                        onChange={
                            setStatusFilter
                        }

                        style={{
                            width: 150
                        }}

                        options={[

                            {
                                value: "all",

                                label: "All"
                            },

                            {
                                value: "active",

                                label: "Active"
                            },

                            {
                                value: "inactive",

                                label: "Inactive"
                            }

                        ]}

                    />

                </div>


                <Table

                    rowKey="class_id"

                    columns={
                        columns
                    }

                    dataSource={
                        filteredData
                    }

                    loading={
                        loading
                    }

                    bordered

                    scroll={{
                        x: 1400
                    }}

                    pagination={{

                        pageSize: 10,

                        showSizeChanger: true,

                        pageSizeOptions: [
                            "5",
                            "10",
                            "20",
                            "50"
                        ],

                        showTotal:
                            (
                                total,
                                range
                            ) =>

                                `${range[0]}-${range[1]} of ${total} classes`

                    }}

                    rowClassName={
                        (record) =>

                            record.class_id ===
                            editingId

                                ? "editing-row"

                                : ""

                    }

                />

            </Card>

        </div>

    );

};


export default Class;
