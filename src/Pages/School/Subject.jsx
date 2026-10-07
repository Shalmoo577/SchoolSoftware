import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import './School.css';

import {
    Form,
    Input,
    Button,
    Table,
    Space,
    Card,
    Select,
    Switch,
    Tag,
    Popconfirm
} from "antd";

import {
    SaveOutlined,
    EditOutlined,
    CloseOutlined,
    SearchOutlined,
    StopOutlined,
    CheckOutlined
} from "@ant-design/icons";


const Subject = () => {

    const [form] = Form.useForm();

    const [subjects, setSubjects] = useState([]);

    const [loading, setLoading] = useState(false);

    const [editingId, setEditingId] = useState(null);

    const [searchText, setSearchText] = useState("");

    const [statusFilter, setStatusFilter] = useState("all");


    // =====================================================
    // LOAD SUBJECTS
    // =====================================================

    const loadSubjects = async () => {

        try {

            setLoading(true);

            const response = await axios.get(
                "/api/subjects"
            );

            setSubjects(response.data);

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "Unable to load subjects",
                "error"
            );

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {

        loadSubjects();

    }, []);


    // =====================================================
    // SAVE / UPDATE
    // =====================================================

    const handleSubmit = async (values) => {

        try {

            setLoading(true);


            const data = {

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


            // UPDATE

            if (editingId) {

                await axios.put(
                    `/api/subjects/${editingId}`,
                    data
                );


                await Swal.fire({

                    icon: "success",

                    title: "Updated",

                    text: "Subject updated successfully",

                    timer: 1500,

                    showConfirmButton: false

                });

            }


            // SAVE

            else {

                await axios.post(
                    "/api/subjects",
                    data
                );


                await Swal.fire({

                    icon: "success",

                    title: "Saved",

                    text: "Subject saved successfully",

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

            loadSubjects();


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

    const handleEdit = (record) => {

        setEditingId(record.subject_id);


        form.setFieldsValue({

            name: record.name || "",

            code: record.code || "",

            description:
                record.description || "",

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

    const handleDeactivate = async (subject_id) => {

        try {

            setLoading(true);

            await axios.delete(
                `/api/subjects/${subject_id}`
            );


            Swal.fire({

                icon: "success",

                title: "Deactivated",

                text: "Subject deactivated successfully",

                timer: 1500,

                showConfirmButton: false

            });


            loadSubjects();


        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                error.response?.data?.message ||
                "Unable to deactivate subject",
                "error"
            );

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // ACTIVATE
    // =====================================================

    const handleActivate = async (subject_id) => {

        try {

            setLoading(true);

            await axios.put(
                `/api/subjects/${subject_id}/activate`
            );


            Swal.fire({

                icon: "success",

                title: "Activated",

                text: "Subject activated successfully",

                timer: 1500,

                showConfirmButton: false

            });


            loadSubjects();


        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                error.response?.data?.message ||
                "Unable to activate subject",
                "error"
            );

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // SEARCH + FILTER
    // =====================================================

    const filteredData = subjects.filter((item) => {

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
    });


    // =====================================================
    // TABLE
    // =====================================================

    const columns = [

        {
            title: "#",

            key: "serial",

            width: 60,

            render: (_, record, index) =>
                index + 1
        },


        {
            title: "Subject Name",

            dataIndex: "name",

            key: "name",

            sorter: (a, b) =>
                a.name.localeCompare(b.name)
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

            render: (value) =>

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

            render: (value) => {

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

            width: 180,

            render: (_, record) => (

                <Space>

                    <Button
                        type="primary"
                        size="small"
                        icon={
                            <EditOutlined />
                        }
                        onClick={() =>
                            handleEdit(record)
                        }
                    >
                        Edit
                    </Button>


                    {record.is_active === 1 ? (

                        <Popconfirm

                            title="Deactivate this subject?"

                            description={
                                "The subject will not be deleted."
                            }

                            okText="Yes"

                            cancelText="No"

                            onConfirm={() =>
                                handleDeactivate(
                                    record.subject_id
                                )
                            }

                        >

                            <Button
                                danger
                                size="small"
                                icon={
                                    <StopOutlined />
                                }
                            >
                                Deactivate
                            </Button>

                        </Popconfirm>

                    ) : (

                        <Popconfirm

                            title="Activate this subject?"

                            okText="Yes"

                            cancelText="No"

                            onConfirm={() =>
                                handleActivate(
                                    record.subject_id
                                )
                            }

                        >

                            <Button
                                type="primary"
                                size="small"
                                icon={
                                    <CheckOutlined />
                                }
                            >
                                Activate
                            </Button>

                        </Popconfirm>

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
                        ? "Update Subject"
                        : "Subject"
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
                                "2fr 1fr 3fr 120px",

                            gap: "15px"
                        }}
                    >

                        {/* NAME */}

                        <Form.Item

                            label="Subject Name"

                            name="name"

                            rules={[
                                {
                                    required: true,

                                    message:
                                        "Please enter subject name"
                                }
                            ]}

                        >

                            <Input

                                placeholder={
                                    "Enter subject name"
                                }

                                onChange={(e) =>

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

                            label="Code"

                            name="code"

                            rules={[
                                {
                                    required: true,

                                    message:
                                        "Please enter subject code"
                                }
                            ]}

                        >

                            <Input

                                placeholder="Code"

                                onChange={(e) =>

                                    form.setFieldValue(

                                        "code",

                                        e.target.value
                                            .toUpperCase()

                                    )
                                }

                            />

                        </Form.Item>


                        {/* DESCRIPTION */}

                        <Form.Item

                            label="Description"

                            name="description"

                        >

                            <Input

                                placeholder={
                                    "Description"
                                }

                                onChange={(e) =>

                                    form.setFieldValue(

                                        "description",

                                        e.target.value
                                            .toUpperCase()

                                    )
                                }

                            />

                        </Form.Item>


                        {/* ACTIVE */}

                        <Form.Item

                            label="Active"

                            name="is_active"

                            valuePropName="checked"

                        >

                            <Switch />

                        </Form.Item>

                    </div>


                    {/* BUTTONS */}

                    <Space>

                        <Button

                            type="primary"

                            htmlType="submit"

                            loading={loading}

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
            {/* TABLE */}
            {/* ================================================= */}

            <Card title="Subject List">

                {/* SEARCH / FILTER */}

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

                        placeholder={
                            "Search subject, code..."
                        }

                        value={
                            searchText
                        }

                        onChange={(e) =>
                            setSearchText(
                                e.target.value
                            )
                        }

                        allowClear

                        style={{
                            width: 300
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

                    rowKey="subject_id"

                    columns={columns}

                    dataSource={
                        filteredData
                    }

                    loading={loading}

                    bordered

                    scroll={{
                        x: 1100
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
                            (total, range) =>
                                `${range[0]}-${range[1]} of ${total} subjects`

                    }}

                    rowClassName={
                        (record) =>
                            record.subject_id === editingId
                                ? "editing-row"
                                : ""
                    }

                />

            </Card>

        </div>
    );
};


export default Subject;