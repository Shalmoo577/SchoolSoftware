import React, {
    useEffect,
    useState,
    useMemo
} from "react";

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


const Teacher = () => {

    const [form] = Form.useForm();
const user = JSON.parse(
    localStorage.getItem("user")
);

const campusId = user?.campus_id;
const sectionId = user?.section_id;

    const [teachers, setTeachers] =
        useState([]);


    const [loading, setLoading] =
        useState(false);


    const [editingId, setEditingId] =
        useState(null);


    const [searchText, setSearchText] =
        useState("");


    const [statusFilter, setStatusFilter] =
        useState("all");


    // =====================================================
    // LOAD TEACHERS
    // =====================================================

    const loadTeachers = async () => {

        try {

            setLoading(true);

            const response =
                await axios.get(
                    "/api/teachers",
                 {
                params: {
                    campus_id: campusId,
                    section_id: sectionId
                }
            }
                );


            setTeachers(
                response.data
            );


        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                error.response?.data?.message ||
                "Unable to load teachers",
                "error"
            );

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {

 if (campusId && sectionId) {
        loadTeachers();
    }

}, [campusId, sectionId]);


    // =====================================================
    // SAVE / UPDATE
    // =====================================================

    const handleSubmit = async (
        values
    ) => {

        try {

            setLoading(true);


            const data = {

                  campus_id: campusId,
                    section_id: sectionId,
                name:
                    values.name
                        ?.trim()
                        .toUpperCase(),

                code:
                    values.code
                        ?.trim()
                        .toUpperCase(),

                phone:
                    values.phone
                        ?.trim(),

                email:
                    values.email
                        ?.trim()
                        .toLowerCase(),

                designation:
                    values.designation
                        ?.trim()
                        .toUpperCase(),

                is_active:
                    values.is_active !== false

            };


            // =========================================
            // UPDATE
            // =========================================

            if (editingId) {

                await axios.put(

                    `/api/teachers/${editingId}`,

                    data

                );


                await Swal.fire({

                    icon: "success",

                    title: "Updated",

                    text:
                        "Teacher updated successfully",

                    timer: 1500,

                    showConfirmButton: false

                });

            }


            // =========================================
            // SAVE
            // =========================================

            else {

                await axios.post(

                    "/api/teachers",

                    data

                );


                await Swal.fire({

                    icon: "success",

                    title: "Saved",

                    text:
                        "Teacher saved successfully",

                    timer: 1500,

                    showConfirmButton: false

                });

            }


            form.resetFields();


            form.setFieldValue(
                "is_active",
                true
            );


            setEditingId(null);


            await loadTeachers();


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

    const handleEdit = (
        record
    ) => {

        setEditingId(
            record.teacher_id
        );


        form.setFieldsValue({

            name:
                record.name || "",

            code:
                record.code || "",

            phone:
                record.phone || "",

            email:
                record.email || "",

            designation:
                record.designation || "",

            is_active:
                record.is_active === 1

        });


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    };


    // =====================================================
    // CANCEL
    // =====================================================

    const handleCancel = () => {

        form.resetFields();


        form.setFieldValue(
            "is_active",
            true
        );


        setEditingId(null);

    };


    // =====================================================
    // DEACTIVATE
    // =====================================================

    const handleDeactivate = async (
        teacher_id
    ) => {

        try {

            setLoading(true);


            await axios.delete(

                `/api/teachers/${teacher_id}`

            );


            await Swal.fire({

                icon: "success",

                title: "Deactivated",

                text:
                    "Teacher deactivated successfully",

                timer: 1500,

                showConfirmButton: false

            });


            await loadTeachers();


        } catch (error) {

            console.error(error);

            Swal.fire(

                "Error",

                error.response?.data?.message ||
                "Unable to deactivate teacher",

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
        teacher_id
    ) => {

        try {

            setLoading(true);


            await axios.put(

                `/api/teachers/${teacher_id}/activate`

            );


            await Swal.fire({

                icon: "success",

                title: "Activated",

                text:
                    "Teacher activated successfully",

                timer: 1500,

                showConfirmButton: false

            });


            await loadTeachers();


        } catch (error) {

            console.error(error);

            Swal.fire(

                "Error",

                error.response?.data?.message ||
                "Unable to activate teacher",

                "error"

            );

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // SEARCH + STATUS FILTER
    // =====================================================

    const filteredData =
        useMemo(() => {

            const search =
                searchText
                    .toLowerCase()
                    .trim();


            return teachers.filter(
                item => {

                    const matchesSearch =

                        item.name
                            ?.toLowerCase()
                            .includes(search)

                        ||

                        item.code
                            ?.toLowerCase()
                            .includes(search)

                        ||

                        item.phone
                            ?.toLowerCase()
                            .includes(search)

                        ||

                        item.email
                            ?.toLowerCase()
                            .includes(search)

                        ||

                        item.designation
                            ?.toLowerCase()
                            .includes(search);


                    const matchesStatus =

                        statusFilter === "all"

                        ||

                        (
                            statusFilter ===
                            "active"

                            &&
                            item.is_active ===
                            1
                        )

                        ||

                        (
                            statusFilter ===
                            "inactive"

                            &&
                            item.is_active ===
                            0
                        );


                    return (

                        matchesSearch &&

                        matchesStatus

                    );

                }
            );

        }, [
            teachers,
            searchText,
            statusFilter
        ]);


    // =====================================================
    // TABLE
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
            title: "Teacher Name",

            dataIndex: "name",

            key: "name",

            sorter: (a, b) =>
                a.name.localeCompare(
                    b.name
                )
        },


        {
            title: "Code",

            dataIndex: "code",

            key: "code",

            width: 110
        },


        {
            title: "Phone",

            dataIndex: "phone",

            key: "phone",

            width: 150
        },


        {
            title: "Email",

            dataIndex: "email",

            key: "email"
        },


        {
            title: "Designation",

            dataIndex:
                "designation",

            key:
                "designation",

            width: 160
        },


        {
            title: "Status",

            dataIndex:
                "is_active",

            key:
                "is_active",

            width: 110,

            render: value =>

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

            dataIndex:
                "created_at",

            key:
                "created_at",

            width: 180,

            render: value => {

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

            width: 210,

            render:
                (_, record) => (

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


                        {record.is_active ===
                        1 ? (

                            <Button

                                danger

                                size="small"

                                icon={
                                    <StopOutlined />
                                }

                                onClick={() => {

                                    Swal.fire({

                                        title:
                                            "Deactivate teacher?",

                                        text:
                                            "The teacher will not be deleted.",

                                        icon:
                                            "warning",

                                        showCancelButton:
                                            true,

                                        confirmButtonText:
                                            "Yes",

                                        cancelButtonText:
                                            "No"

                                    }).then(
                                        result => {

                                            if (
                                                result.isConfirmed
                                            ) {

                                                handleDeactivate(
                                                    record.teacher_id
                                                );

                                            }

                                        }
                                    );

                                }}

                            >

                                Deactivate

                            </Button>

                        ) : (

                            <Button

                                type="primary"

                                size="small"

                                icon={
                                    <CheckOutlined />
                                }

                                onClick={() =>
                                    handleActivate(
                                        record.teacher_id
                                    )
                                }

                            >

                                Activate

                            </Button>

                        )}

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
                        ? "Update Teacher"
                        : "Teacher"
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
                                "2fr 1fr 1.5fr 2fr",

                            gap: "15px"

                        }}
                    >

                        {/* NAME */}

                        <Form.Item

                            label="Teacher Name"

                            name="name"

                            rules={[
                                {
                                    required: true,

                                    message:
                                        "Please enter teacher name"
                                }
                            ]}

                        >

                            <Input

                                placeholder=
                                    "Enter teacher name"

                                onChange={
                                    e =>
                                        form.setFieldValue(
                                            "name",
                                            e.target.value
                                                .toUpperCase()
                                        )
                                }

                            />

                        </Form.Item>


                        {/* CODE */}

                        <Form.Item

                            label="Teacher Code"

                            name="code"

                            rules={[
                                {
                                    required: true,

                                    message:
                                        "Please enter teacher code"
                                }
                            ]}

                        >

                            <Input

                                placeholder=
                                    "T001"

                                onChange={
                                    e =>
                                        form.setFieldValue(
                                            "code",
                                            e.target.value
                                                .toUpperCase()
                                        )
                                }

                            />

                        </Form.Item>


                        {/* PHONE */}

                        <Form.Item

                            label="Phone"

                            name="phone"

                        >

                            <Input
                                placeholder=
                                    "03001234567"
                            />

                        </Form.Item>


                        {/* EMAIL */}

                        <Form.Item

                            label="Email"

                            name="email"

                            rules={[
                                {
                                    type:
                                        "email",

                                    message:
                                        "Enter valid email"
                                }
                            ]}

                        >

                            <Input

                                placeholder=
                                    "teacher@example.com"

                            />

                        </Form.Item>

                    </div>


                    <div
                        style={{

                            display: "grid",

                            gridTemplateColumns:
                                "2fr 1fr",

                            gap: "15px"

                        }}
                    >

                        {/* DESIGNATION */}

                        <Form.Item

                            label="Designation"

                            name="designation"

                        >

                            <Select

                                allowClear

                                placeholder=
                                    "Select designation"

                                options={[
                                    {
                                        value:
                                            "TEACHER",

                                        label:
                                            "Teacher"
                                    },
                                    {
                                        value:
                                            "SENIOR TEACHER",

                                        label:
                                            "Senior Teacher"
                                    },
                                    {
                                        value:
                                            "JUNIOR TEACHER",

                                        label:
                                            "Junior Teacher"
                                    },
                                    {
                                        value:
                                            "COORDINATOR",

                                        label:
                                            "Coordinator"
                                    },
                                    {
                                        value:
                                            "HEAD TEACHER",

                                        label:
                                            "Head Teacher"
                                    }
                                ]}

                            />

                        </Form.Item>


                        {/* ACTIVE */}

                        <Form.Item

                            label="Active"

                            name="is_active"

                            valuePropName=
                                "checked"

                        >

                            <Switch />

                        </Form.Item>

                    </div>


                    {/* BUTTONS */}

                    <Space>

                        <Button

                            type="primary"

                            htmlType="submit"

                            loading={
                                loading
                            }

                            icon={
                                <SaveOutlined />
                            }

                        >

                            {editingId
                                ? "Update"
                                : "Save"}

                        </Button>


                        {editingId && (

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

                        )}

                    </Space>

                </Form>

            </Card>


            {/* ================================================= */}
            {/* LIST */}
            {/* ================================================= */}

            <Card
                title="Teacher List"
            >

                {/* SEARCH */}

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
                            "Search teacher, code, phone..."

                        value={
                            searchText
                        }

                        onChange={
                            e =>
                                setSearchText(
                                    e.target.value
                                )
                        }

                        allowClear

                        style={{
                            width: 350
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
                                value:
                                    "all",

                                label:
                                    "All"
                            },
                            {
                                value:
                                    "active",

                                label:
                                    "Active"
                            },
                            {
                                value:
                                    "inactive",

                                label:
                                    "Inactive"
                            }
                        ]}

                    />

                </div>


                <Table

                    rowKey="teacher_id"

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
                        x: 1300
                    }}

                    pagination={{

                        pageSize:
                            10,

                        showSizeChanger:
                            true,

                        pageSizeOptions:
                            [
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
                                `${range[0]}-${range[1]} of ${total} teachers`

                    }}

                    rowClassName={
                        record =>
                            record.teacher_id ===
                            editingId
                                ? "editing-row"
                                : ""
                    }

                />

            </Card>

        </div>
    );
};


export default Teacher;
