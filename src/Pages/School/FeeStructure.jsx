import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import {
    Button,
    Card,
    Col,
    Form,
    InputNumber,
    Row,
    Select,
    Space,
    Table,
    Tag
} from "antd";

import {
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    SaveOutlined
} from "@ant-design/icons";

const API = "/api";

const FeeStructure = () => {

    const [form] = Form.useForm();

    // ======================================================
    // LOGGED IN USER
    // IMPORTANT: useMemo prevents new object on every render
    // ======================================================

    const loggedInUser = useMemo(() => {
        try {
            return JSON.parse(
                localStorage.getItem("user") || "null"
            );
        } catch (error) {
            console.error("USER LOCAL STORAGE ERROR:", error);
            return null;
        }
    }, []);

    const userCampusId = Number(
        loggedInUser?.campus_id || 0
    );

    const userSectionId = Number(
        loggedInUser?.section_id || 0
    );

    const userSectionName =
        loggedInUser?.section_name || "";

    const userRole = String(
        loggedInUser?.role || ""
    ).toUpperCase();

    const isAdmin =
        userRole === "SUPER_ADMIN" ||
        userRole === "CAMPUS_ADMIN" ||
        Number(loggedInUser?.is_developer) === 1;


    // ======================================================
    // DATA
    // ======================================================

    const [academicYears, setAcademicYears] = useState([]);
    const [campuses, setCampuses] = useState([]);
    const [allClasses, setAllClasses] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [feeHeads, setFeeHeads] = useState([]);

    const [rows, setRows] = useState([]);

    // ======================================================
    // LOADING
    // ======================================================

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // ======================================================
    // EDITING
    // ======================================================

    const [editing, setEditing] = useState(false);


    // ======================================================
    // INITIAL LOAD
    // ======================================================

    useEffect(() => {
        initializePage();
    }, []);


    // ======================================================
    // INITIALIZE EVERYTHING
    // ======================================================

    const initializePage = async () => {

        try {

            setLoading(true);

            const [
                academicResponse,
                campusResponse,
                classResponse,
                feeHeadResponse
            ] = await Promise.all([

                axios.get(`${API}/academic-years`),

                axios.get(`${API}/campuses`),

                axios.get(`${API}/classes`),

                axios.get(`${API}/fee-heads`)
            ]);


            // ==================================================
            // ACADEMIC YEARS
            // ==================================================

            const academicData =
                Array.isArray(academicResponse.data)
                    ? academicResponse.data
                    : [];

            setAcademicYears(academicData);


            // ==================================================
            // CAMPUSES
            // ==================================================

            const campusData =
                Array.isArray(campusResponse.data)
                    ? campusResponse.data
                    : [];

            setCampuses(campusData);


            // ==================================================
            // CLASSES
            // ==================================================

            const classData =
                Array.isArray(classResponse.data)
                    ? classResponse.data
                    : [];

            setAllClasses(classData);


            // ==================================================
            // FEE HEADS
            // ==================================================

            const feeHeadData =
                Array.isArray(feeHeadResponse.data)
                    ? feeHeadResponse.data
                    : [];

            setFeeHeads(feeHeadData);


            // ==================================================
            // DEFAULT ACADEMIC YEAR
            // ==================================================

            let defaultAcademicYear = null;

            /*
                Try common current/default fields.
            */

            defaultAcademicYear =
                academicData.find(item =>
                    Number(item.is_current) === 1
                ) ||

                academicData.find(item =>
                    Number(item.current) === 1
                ) ||

                academicData.find(item =>
                    Number(item.is_active) === 1
                ) ||

                academicData[0];


            if (defaultAcademicYear) {

                form.setFieldValue(
                    "academic_year_id",
                    Number(
                        defaultAcademicYear.academic_year_id
                    )
                );
            }


            // ==================================================
            // NORMAL USER
            // ==================================================

            if (!isAdmin) {

                // ----------------------------------------------
                // CAMPUS
                // ----------------------------------------------

                if (userCampusId) {

                    form.setFieldValue(
                        "campus_id",
                        userCampusId
                    );
                }


                // ----------------------------------------------
                // SECTION
                // ----------------------------------------------

                if (userSectionId) {

                    form.setFieldValue(
                        "section_id",
                        userSectionId
                    );
                }


                // ----------------------------------------------
                // LOAD SECTION
                // ----------------------------------------------

                if (userCampusId) {

                    await loadSections(
                        userCampusId
                    );
                }


                // ----------------------------------------------
                // FILTER CLASSES
                // ----------------------------------------------

                const filteredClasses =
                    filterClassData(
                        classData,
                        userCampusId,
                        userSectionId
                    );

                setClasses(filteredClasses);
            }


            // ==================================================
            // ADMIN
            // ==================================================

            else {

                /*
                    Admin starts with:

                    Campus = empty
                    Section = empty
                    Class = all classes
                */

                setClasses(classData);
                setSections([]);
            }

        } catch (error) {

            console.error(
                "FEE STRUCTURE INITIAL LOAD ERROR:",
                error
            );

            Swal.fire(
                "Error",
                "Failed to load Fee Structure data.",
                "error"
            );

        } finally {

            setLoading(false);
        }
    };


    // ======================================================
    // FILTER CLASS DATA
    // ======================================================

    const filterClassData = (
        sourceClasses,
        campusId,
        sectionId
    ) => {

        if (!campusId || !sectionId) {
            return [];
        }

        return sourceClasses.filter(item =>

            Number(item.campus_id) ===
                Number(campusId)

            &&

            Number(item.section_id) ===
                Number(sectionId)
        );
    };


    // ======================================================
    // LOAD SECTIONS
    // ======================================================

    const loadSections = async (
        campusId = null
    ) => {

        try {

            const params = {};

            if (
                campusId !== null &&
                campusId !== undefined &&
                campusId !== ""
            ) {

                params.campus_id =
                    Number(campusId);
            }

            const response =
                await axios.get(
                    `${API}/sections`,
                    { params }
                );

            const data =
                Array.isArray(response.data)
                    ? response.data
                    : [];

            setSections(data);

            return data;

        } catch (error) {

            console.error(
                "SECTIONS ERROR:",
                error
            );

            setSections([]);

            Swal.fire(
                "Error",
                "Failed to load Sections",
                "error"
            );

            return [];
        }
    };


    // ======================================================
    // CAMPUS CHANGE
    // ======================================================

    const handleCampusChange = async (
        campusId
    ) => {

        // Clear dependent fields

        form.setFieldsValue({
            section_id: undefined,
            class_id: undefined
        });

        setSections([]);
        setClasses([]);
        setRows([]);
        setEditing(false);


        if (!campusId) {

            if (isAdmin) {

                setClasses(allClasses);

                await loadSections();
            }

            return;
        }


        // ==================================================
        // ADMIN
        // ==================================================

        if (isAdmin) {

            const selectedCampusClasses =
                allClasses.filter(item =>

                    Number(item.campus_id) ===
                        Number(campusId)
                );

            setClasses(
                selectedCampusClasses
            );

            await loadSections(
                campusId
            );

            return;
        }


        // ==================================================
        // NORMAL USER
        // ==================================================

        if (
            Number(campusId) !==
            Number(userCampusId)
        ) {

            return;
        }


        form.setFieldValue(
            "section_id",
            userSectionId
        );


        await loadSections(
            userCampusId
        );


        const filteredClasses =
            filterClassData(
                allClasses,
                userCampusId,
                userSectionId
            );

        setClasses(
            filteredClasses
        );
    };


    // ======================================================
    // SECTION CHANGE
    // ======================================================

    const handleSectionChange = (
        sectionId
    ) => {

        form.setFieldValue(
            "class_id",
            undefined
        );

        setRows([]);
        setEditing(false);


        if (!sectionId) {

            const campusId =
                form.getFieldValue(
                    "campus_id"
                );


            if (campusId) {

                const campusClasses =
                    allClasses.filter(item =>

                        Number(item.campus_id) ===
                            Number(campusId)
                    );

                setClasses(
                    campusClasses
                );

            } else {

                setClasses(
                    allClasses
                );
            }

            return;
        }


        // ==================================================
        // ADMIN
        // ==================================================

        if (isAdmin) {

            const campusId =
                form.getFieldValue(
                    "campus_id"
                );


            let filtered =
                allClasses.filter(item =>

                    Number(item.section_id) ===
                        Number(sectionId)
                );


            if (campusId) {

                filtered =
                    filtered.filter(item =>

                        Number(item.campus_id) ===
                            Number(campusId)
                    );
            }


            setClasses(
                filtered
            );

            return;
        }


        // ==================================================
        // NORMAL USER
        // ==================================================

        if (
            Number(sectionId) !==
            Number(userSectionId)
        ) {

            return;
        }


        const filteredClasses =
            filterClassData(
                allClasses,
                userCampusId,
                userSectionId
            );

        setClasses(
            filteredClasses
        );
    };


    // ======================================================
    // CLASS CHANGE
    // ======================================================

    const handleClassChange = (
        classId
    ) => {

        setRows([]);
        setEditing(false);

        if (!classId) {
            return;
        }
    };


    // ======================================================
    // ADD FEE ROW
    // ======================================================

    const addFeeRow = () => {

        const feeHeadId =
            form.getFieldValue(
                "fee_head_id"
            );

        const amount =
            form.getFieldValue(
                "amount"
            );


        if (!feeHeadId) {

            Swal.fire(
                "Required",
                "Please select Fee Head",
                "warning"
            );

            return;
        }


        if (
            amount === undefined ||
            amount === null ||
            Number(amount) < 0
        ) {

            Swal.fire(
                "Required",
                "Please enter a valid amount",
                "warning"
            );

            return;
        }


        const feeHead =
            feeHeads.find(item =>

                Number(item.fee_head_id) ===
                    Number(feeHeadId)
            );


        const duplicate =
            rows.some(row =>

                Number(row.fee_head_id) ===
                    Number(feeHeadId)
            );


        if (duplicate) {

            Swal.fire(
                "Already Added",
                "This Fee Head is already in the structure.",
                "warning"
            );

            return;
        }


        const newRow = {

            key: Date.now(),

            fee_head_id:
                Number(feeHeadId),

            fee_head_name:
                feeHead?.fee_head_name || "",

            amount:
                Number(amount)
        };


        setRows([
            ...rows,
            newRow
        ]);


        form.setFieldsValue({

            fee_head_id:
                undefined,

            amount:
                undefined
        });
    };


    // ======================================================
    // REMOVE ROW
    // ======================================================

    const removeRow = (
        key
    ) => {

        setRows(
            rows.filter(
                row =>
                    row.key !== key
            )
        );
    };


    // ======================================================
    // TOTAL
    // ======================================================

    const totalAmount =
        rows.reduce(
            (
                total,
                row
            ) =>
                total +
                Number(
                    row.amount || 0
                ),
            0
        );


    // ======================================================
    // LOAD EXISTING STRUCTURE
    // ======================================================

    const loadStructure = async () => {

        const academicYearId =
            form.getFieldValue(
                "academic_year_id"
            );

        const campusId =
            form.getFieldValue(
                "campus_id"
            );

        const classId =
            form.getFieldValue(
                "class_id"
            );

        const sectionId =
            form.getFieldValue(
                "section_id"
            );


        if (
            !academicYearId ||
            !campusId ||
            !classId ||
            !sectionId
        ) {

            Swal.fire(
                "Required",
                "Please select Academic Year, Campus, Class and Section",
                "warning"
            );

            return;
        }


        try {

            setLoading(true);


            const response =
                await axios.get(
                    `${API}/fee-structures/${academicYearId}/${campusId}/${classId}/${sectionId}`
                );


            const data =
                Array.isArray(
                    response.data
                )
                    ? response.data
                    : [];


            if (
                data.length === 0
            ) {

                setRows([]);
                setEditing(false);

                Swal.fire(
                    "No Structure",
                    "No fee structure exists for this selection.",
                    "info"
                );

                return;
            }


            setRows(
                data.map(
                    (
                        item,
                        index
                    ) => ({

                        key:
                            item.fee_structure_id ||
                            index,

                        fee_head_id:
                            Number(
                                item.fee_head_id
                            ),

                        fee_head_name:
                            item.fee_head_name,

                        amount:
                            Number(
                                item.amount || 0
                            )
                    })
                )
            );


            setEditing(true);

        } catch (error) {

            console.error(
                "LOAD STRUCTURE ERROR:",
                error
            );

            Swal.fire(
                "Error",
                error?.response?.data?.message ||
                "Failed to load Fee Structure",
                "error"
            );

        } finally {

            setLoading(false);
        }
    };


    // ======================================================
    // SAVE / UPDATE
    // ======================================================

    const saveStructure = async () => {

        const academicYearId =
            form.getFieldValue(
                "academic_year_id"
            );

        const campusId =
            form.getFieldValue(
                "campus_id"
            );

        const classId =
            form.getFieldValue(
                "class_id"
            );

        const sectionId =
            form.getFieldValue(
                "section_id"
            );


        if (!academicYearId) {

            Swal.fire(
                "Required",
                "Please select Academic Year",
                "warning"
            );

            return;
        }


        if (!campusId) {

            Swal.fire(
                "Required",
                "Please select Campus",
                "warning"
            );

            return;
        }


        if (!classId) {

            Swal.fire(
                "Required",
                "Please select Class",
                "warning"
            );

            return;
        }


        if (!sectionId) {

            Swal.fire(
                "Required",
                "Please select Section",
                "warning"
            );

            return;
        }


        if (
            rows.length === 0
        ) {

            Swal.fire(
                "Required",
                "Please add at least one Fee Head",
                "warning"
            );

            return;
        }


        const result =
            await Swal.fire({

                title:
                    editing
                        ? "Update Fee Structure?"
                        : "Save Fee Structure?",

                text:
                    `Total Amount: ${totalAmount.toFixed(2)}`,

                icon: "question",

                showCancelButton: true,

                confirmButtonText:
                    editing
                        ? "Update"
                        : "Save",

                cancelButtonText:
                    "Cancel"
            });


        if (
            !result.isConfirmed
        ) {

            return;
        }


        try {

            setSaving(true);


            const payload = {

                academic_year_id:
                    Number(
                        academicYearId
                    ),

                campus_id:
                    Number(
                        campusId
                    ),

                class_id:
                    Number(
                        classId
                    ),

                section_id:
                    Number(
                        sectionId
                    ),

                rows:
                    rows.map(
                        row => ({

                            fee_head_id:
                                Number(
                                    row.fee_head_id
                                ),

                            amount:
                                Number(
                                    row.amount
                                )
                        })
                    )
            };


            console.log(
                "FEE STRUCTURE PAYLOAD:",
                payload
            );


            if (editing) {

                await axios.put(

                    `${API}/fee-structures/${academicYearId}/${campusId}/${classId}/${sectionId}`,

                    payload
                );

            } else {

                await axios.post(

                    `${API}/fee-structures`,

                    payload
                );
            }


            await Swal.fire(

                editing
                    ? "Updated"
                    : "Saved",

                editing
                    ? "Fee Structure updated successfully."
                    : "Fee Structure saved successfully.",

                "success"
            );


            setEditing(true);

        } catch (error) {

            console.error(
                "SAVE STRUCTURE ERROR:",
                error
            );

            Swal.fire(
                "Error",
                error?.response?.data?.message ||
                "Failed to save Fee Structure",
                "error"
            );

        } finally {

            setSaving(false);
        }
    };


    // ======================================================
    // CLEAR
    // ======================================================

    const clearForm = async () => {

        form.resetFields();

        setRows([]);
        setEditing(false);


        // ==================================================
        // NORMAL USER
        // ==================================================

        if (!isAdmin) {

            form.setFieldsValue({

                academic_year_id:
                    academicYears.find(item =>
                        Number(item.is_current) === 1
                    )?.academic_year_id
                    ||
                    academicYears.find(item =>
                        Number(item.current) === 1
                    )?.academic_year_id
                    ||
                    academicYears.find(item =>
                        Number(item.is_active) === 1
                    )?.academic_year_id
                    ||
                    academicYears[0]?.academic_year_id,

                campus_id:
                    userCampusId,

                section_id:
                    userSectionId,

                class_id:
                    undefined
            });


            const filteredClasses =
                filterClassData(
                    allClasses,
                    userCampusId,
                    userSectionId
                );

            setClasses(
                filteredClasses
            );


            await loadSections(
                userCampusId
            );

        }

        // ==================================================
        // ADMIN
        // ==================================================

        else {

            const defaultYear =
                academicYears.find(item =>
                    Number(item.is_current) === 1
                ) ||

                academicYears.find(item =>
                    Number(item.current) === 1
                ) ||

                academicYears.find(item =>
                    Number(item.is_active) === 1
                ) ||

                academicYears[0];


            if (defaultYear) {

                form.setFieldValue(
                    "academic_year_id",
                    Number(
                        defaultYear.academic_year_id
                    )
                );
            }


            setClasses(allClasses);
            setSections([]);
        }
    };


    // ======================================================
    // TABLE COLUMNS
    // ======================================================

    const columns = [

        {
            title: "#",
            width: 60,

            render: (
                _,
                __,
                index
            ) =>
                index + 1
        },

        {
            title: "Fee Head",
            dataIndex: "fee_head_name"
        },

        {
            title: "Amount",
            dataIndex: "amount",

            align: "right",

            render: value =>
                Number(
                    value || 0
                ).toLocaleString(
                    undefined,
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                )
        },

        {
            title: "Action",
            width: 100,

            render: (
                _,
                record
            ) => (

                <Button
                    danger
                    icon={
                        <DeleteOutlined />
                    }
                    onClick={() =>
                        removeRow(
                            record.key
                        )
                    }
                >
                    Remove
                </Button>
            )
        }
    ];


    // ======================================================
    // UI
    // ======================================================

    return (

        <div
            style={{
                padding: 20
            }}
        >

            <Card
                title="Fee Structure"
                bordered
            >

                <Form
                    form={form}
                    layout="vertical"
                >

                    {/* ==================================================
                        SELECTION
                    ================================================== */}

                    <Row gutter={16}>

                        {/* ACADEMIC YEAR */}

                        <Col
                            xs={24}
                            md={6}
                        >

                            <Form.Item
                                name="academic_year_id"
                                label="Academic Year"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select Academic Year"
                                    }
                                ]}
                            >

                                <Select
                                    placeholder="Select Academic Year"
                                    showSearch
                                    optionFilterProp="label"
                                    options={
                                        academicYears.map(
                                            item => ({
                                                value:
                                                    Number(
                                                        item.academic_year_id
                                                    ),

                                                label:
                                                    item.year_name
                                            })
                                        )
                                    }
                                />

                            </Form.Item>

                        </Col>


                        {/* CAMPUS */}

                        <Col
                            xs={24}
                            md={6}
                        >

                            <Form.Item
                                name="campus_id"
                                label="Campus"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select Campus"
                                    }
                                ]}
                            >

                                <Select
                                    placeholder="Select Campus"
                                    showSearch
                                    optionFilterProp="label"

                                    disabled={
                                        !isAdmin
                                    }

                                    onChange={
                                        handleCampusChange
                                    }

                                    options={
                                        campuses.map(
                                            item => ({
                                                value:
                                                    Number(
                                                        item.campus_id
                                                    ),

                                                label:
                                                    item.name
                                            })
                                        )
                                    }
                                />

                            </Form.Item>

                        </Col>


                        {/* SECTION */}

                        <Col
                            xs={24}
                            md={6}
                        >

                            <Form.Item
                                name="section_id"
                                label="Section"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select Section"
                                    }
                                ]}
                            >

                                <Select
                                    placeholder="Select Section"
                                    showSearch
                                    optionFilterProp="label"

                                    disabled={
                                        !isAdmin
                                    }

                                    onChange={
                                        handleSectionChange
                                    }

                                    options={

                                        isAdmin

                                            ? sections.map(
                                                item => ({
                                                    value:
                                                        Number(
                                                            item.section_id
                                                        ),

                                                    label:
                                                        item.section_name
                                                })
                                            )

                                            : [
                                                {
                                                    value:
                                                        userSectionId,

                                                    label:
                                                        userSectionName ||
                                                        `Section ${userSectionId}`
                                                }
                                            ]
                                    }
                                />

                            </Form.Item>

                        </Col>


                        {/* CLASS */}

                        <Col
                            xs={24}
                            md={6}
                        >

                            <Form.Item
                                name="class_id"
                                label="Class"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select Class"
                                    }
                                ]}
                            >

                                <Select
                                    placeholder="Select Class"
                                    showSearch
                                    optionFilterProp="label"

                                    onChange={
                                        handleClassChange
                                    }

                                    options={
                                        classes.map(
                                            item => ({
                                                value:
                                                    Number(
                                                        item.class_id
                                                    ),

                                                label:
                                                    item.name
                                            })
                                        )
                                    }
                                />

                            </Form.Item>

                        </Col>

                    </Row>


                    {/* ==================================================
                        LOAD / CLEAR
                    ================================================== */}

                    <Row
                        justify="end"
                        style={{
                            marginBottom: 15
                        }}
                    >

                        <Space>

                            <Button
                                icon={
                                    <EditOutlined />
                                }
                                loading={
                                    loading
                                }
                                onClick={
                                    loadStructure
                                }
                            >
                                Load Structure
                            </Button>

                            <Button
                                onClick={
                                    clearForm
                                }
                            >
                                Clear
                            </Button>

                        </Space>

                    </Row>


                    {/* ==================================================
                        ADD FEE HEAD
                    ================================================== */}

                    <Card
                        type="inner"
                        title="Add Fee Head"
                        style={{
                            marginTop: 10,
                            marginBottom: 20
                        }}
                    >

                        <Row gutter={16}>

                            <Col
                                xs={24}
                                md={10}
                            >

                                <Form.Item
                                    name="fee_head_id"
                                    label="Fee Head"
                                >

                                    <Select
                                        placeholder="Select Fee Head"
                                        showSearch
                                        optionFilterProp="label"

                                        options={
                                            feeHeads.map(
                                                item => ({
                                                    value:
                                                        Number(
                                                            item.fee_head_id
                                                        ),

                                                    label:
                                                        item.fee_head_name
                                                })
                                            )
                                        }
                                    />

                                </Form.Item>

                            </Col>


                            <Col
                                xs={24}
                                md={10}
                            >

                                <Form.Item
                                    name="amount"
                                    label="Amount"
                                >

                                    <InputNumber
                                        style={{
                                            width: "100%"
                                        }}

                                        min={0}
                                        precision={2}
                                        controls={false}
                                        placeholder="Enter Amount"
                                    />

                                </Form.Item>

                            </Col>


                            <Col
                                xs={24}
                                md={4}
                                style={{
                                    display: "flex",
                                    alignItems: "end",
                                    paddingBottom: 24
                                }}
                            >

                                <Button
                                    type="primary"
                                    icon={
                                        <PlusOutlined />
                                    }
                                    onClick={
                                        addFeeRow
                                    }
                                    block
                                >
                                    Add
                                </Button>

                            </Col>

                        </Row>

                    </Card>


                    {/* ==================================================
                        TABLE
                    ================================================== */}

                    <Table
                        rowKey="key"
                        bordered
                        loading={loading}
                        dataSource={rows}
                        columns={columns}
                        pagination={false}
                    />


                    {/* ==================================================
                        TOTAL
                    ================================================== */}

                    <Row
                        justify="end"
                        style={{
                            marginTop: 20
                        }}
                    >

                        <Col>

                            <Tag
                                color="blue"
                                style={{
                                    fontSize: 16,
                                    padding: "8px 15px"
                                }}
                            >

                                Total Fee:{" "}

                                {totalAmount.toLocaleString(
                                    undefined,
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }
                                )}

                            </Tag>

                        </Col>

                    </Row>


                    {/* ==================================================
                        SAVE / UPDATE
                    ================================================== */}

                    <Row
                        justify="end"
                        style={{
                            marginTop: 20
                        }}
                    >

                        <Space>

                            <Button
                                onClick={
                                    clearForm
                                }
                            >
                                Clear
                            </Button>

                            <Button
                                type="primary"
                                icon={
                                    <SaveOutlined />
                                }
                                loading={
                                    saving
                                }
                                onClick={
                                    saveStructure
                                }
                            >
                                {
                                    editing
                                        ? "Update Structure"
                                        : "Save Structure"
                                }
                            </Button>

                        </Space>

                    </Row>

                </Form>

            </Card>

        </div>
    );
};

export default FeeStructure;
