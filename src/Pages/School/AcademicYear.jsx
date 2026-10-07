
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import './AcademicYear.css'

import {
    Form,
    Input,
    DatePicker,
    Button,
    Table,
    Space,
    Tag,
    Popconfirm
} from "antd";

import "./AcademicYear.css";

const API = "/api";

const AcademicYear = () => {

    const [form] = Form.useForm();

    const [years, setYears] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);


    // =====================================================
    // LOAD ACADEMIC YEARS
    // =====================================================
    const loadYears = async () => {

        try {

            setLoading(true);

            const response = await axios.get(
                `${API}/academic-years`
            );

            setYears(response.data);

        } catch (error) {

            console.error(
                "LOAD ACADEMIC YEARS ERROR:",
                error
            );

            Swal.fire(
                "Error",
                "Failed to load academic years",
                "error"
            );

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // INITIAL LOAD
    // =====================================================
    useEffect(() => {

        loadYears();

    }, []);


    // =====================================================
    // SAVE / UPDATE
    // =====================================================
    const handleSubmit = async (values) => {

        try {

            setSaving(true);

            const data = {
                year_name: values.year_name
                    ?.trim()
                    .toUpperCase(),

                start_date:
                    values.start_date
                        ? values.start_date.format("YYYY-MM-DD")
                        : null,

                end_date:
                    values.end_date
                        ? values.end_date.format("YYYY-MM-DD")
                        : null
            };


            // =============================================
            // UPDATE
            // =============================================
            if (editingId) {

                await axios.put(
                    `${API}/academic-years/${editingId}`,
                    data
                );

                await Swal.fire(
                    "Updated",
                    "Academic year updated successfully",
                    "success"
                );

            }

            // =============================================
            // ADD
            // =============================================
            else {

                await axios.post(
                    `${API}/academic-years`,
                    data
                );

                await Swal.fire(
                    "Saved",
                    "Academic year saved successfully",
                    "success"
                );
            }


            resetForm();

            loadYears();

        } catch (error) {

            console.error(
                "SAVE ACADEMIC YEAR ERROR:",
                error
            );

            Swal.fire(
                "Error",
                error.response?.data?.message ||
                "Failed to save academic year",
                "error"
            );

        } finally {

            setSaving(false);
        }
    };


    // =====================================================
    // EDIT
    // =====================================================
    const handleEdit = (record) => {

        setEditingId(record.academic_year_id);

        form.setFieldsValue({

            year_name: record.year_name,

            start_date: record.start_date
                ? dayjs(record.start_date)
                : null,

            end_date: record.end_date
                ? dayjs(record.end_date)
                : null
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };


    // =====================================================
    // RESET
    // =====================================================
    const resetForm = () => {

        form.resetFields();

        setEditingId(null);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };


    // =====================================================
    // MAKE CURRENT
    // =====================================================
    const makeCurrent = async (record) => {

        const result = await Swal.fire({

            title: "Change Academic Year?",

            text:
                `Make ${record.year_name} the current academic year?`,

            icon: "question",

            showCancelButton: true,

            confirmButtonText: "Yes, Make Current",

            cancelButtonText: "Cancel"
        });


        if (!result.isConfirmed) {
            return;
        }


        try {

            await axios.put(
                `${API}/academic-years/${record.academic_year_id}/current`
            );


            await Swal.fire(
                "Updated",
                `${record.year_name} is now the current academic year`,
                "success"
            );


            loadYears();

        } catch (error) {

            console.error(
                "MAKE CURRENT ERROR:",
                error
            );

            Swal.fire(
                "Error",
                error.response?.data?.message ||
                "Failed to change academic year",
                "error"
            );
        }
    };


    // =====================================================
    // TABLE COLUMNS
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
            title: "Academic Year",
            dataIndex: "year_name",
            key: "year_name",

            render: (text) => (
                <strong>{text}</strong>
            )
        },

        {
            title: "Start Date",
            dataIndex: "start_date",
            key: "start_date",

            render: (date) =>
                date
                    ? dayjs(date).format("DD-MM-YYYY")
                    : "-"
        },

        {
            title: "End Date",
            dataIndex: "end_date",
            key: "end_date",

            render: (date) =>
                date
                    ? dayjs(date).format("DD-MM-YYYY")
                    : "-"
        },

        {
            title: "Status",
            dataIndex: "is_current",
            key: "is_current",

            render: (isCurrent) => (

                isCurrent === 1

                    ? (
                        <Tag color="green">
                            CURRENT
                        </Tag>
                    )

                    : (
                        <Tag color="default">
                            INACTIVE
                        </Tag>
                    )
            )
        },

        {
            title: "Action",
            key: "action",

            render: (_, record) => (

                <Space>

                    <Button
                        type="primary"
                        size="small"
                        onClick={() =>
                            handleEdit(record)
                        }
                    >
                        Edit
                    </Button>


                    {record.is_current === 1 ? (

                        <Tag color="green">
                            Current
                        </Tag>

                    ) : (

                        <Button
                            size="small"
                            onClick={() =>
                                makeCurrent(record)
                            }
                        >
                            Make Current
                        </Button>
                    )}

                </Space>
            )
        }
    ];


    return (

        <div className="academic-year-page">

            {/* ==========================================
                FORM
            =========================================== */}

            <div className="academic-year-form-card">

                <h2>
                    {editingId
                        ? "Edit Academic Year"
                        : "Add Academic Year"}
                </h2>


                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >

                    <div className="academic-year-form-row">

                        {/* YEAR */}

                        <Form.Item
                            label="Academic Year"
                            name="year_name"

                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Please enter academic year"
                                }
                            ]}
                        >

                            <Input
                                placeholder="Example: 2026-27"
                                maxLength={20}
                                onChange={(e) => {

                                    form.setFieldValue(
                                        "year_name",
                                        e.target.value.toUpperCase()
                                    );

                                }}
                            />

                        </Form.Item>


                        {/* START DATE */}

                        <Form.Item
                            label="Start Date"
                            name="start_date"

                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Please select start date"
                                }
                            ]}
                        >

                            <DatePicker
                                format="DD-MM-YYYY"
                                style={{
                                    width: "100%"
                                }}
                            />

                        </Form.Item>


                        {/* END DATE */}

                        <Form.Item
                            label="End Date"
                            name="end_date"

                            rules={[
                                {
                                    required: true,
                                    message:
                                        "Please select end date"
                                }
                            ]}
                        >

                            <DatePicker
                                format="DD-MM-YYYY"
                                style={{
                                    width: "100%"
                                }}
                            />

                        </Form.Item>

                    </div>


                    {/* BUTTONS */}

                    <div className="academic-year-buttons">

                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={saving}
                        >
                            {editingId
                                ? "Update"
                                : "Save"}
                        </Button>


                        <Button
                            onClick={resetForm}
                        >
                            Reset
                        </Button>

                    </div>

                </Form>

            </div>


            {/* ==========================================
                TABLE
            =========================================== */}

            <div className="academic-year-table-card">

                <h2>
                    Academic Years
                </h2>


                <Table
                    rowKey="academic_year_id"

                    columns={columns}

                    dataSource={years}

                    loading={loading}

                    bordered

                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true
                    }}

                    scroll={{
                        x: 900
                    }}
                />

            </div>

        </div>
    );
};

export default AcademicYear;
