import React, {useRef, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./School.css";

import {
    Form,
    Select,
    Button,
    Table,
    Space,
    Card,
    Input,
    Tag,
    Popconfirm,
    Row,
    Col
} from "antd";

import {
    SaveOutlined,
    EditOutlined,
    DeleteOutlined,
    CloseOutlined,
    PrinterOutlined,
    FilePdfOutlined,
    SearchOutlined,
    ReloadOutlined
} from "@ant-design/icons";


const Timetable = () => {

    const API = "/api";

    const [form] = Form.useForm();

    // =====================================================
    // API RESPONSE HELPERS
    // =====================================================
    // Different school APIs may return either:
    //   [ ... ]
    // or:
    //   { data: [ ... ] }
    // or:
    //   { success: true, periods: [ ... ] }
    // Keep every state as an ARRAY so .map()/.find() always work.
    const getArray = (response, keys = []) => {
        const body = response?.data;

        if (Array.isArray(body)) return body;

        if (Array.isArray(body?.data)) return body.data;

        for (const key of keys) {
            if (Array.isArray(body?.[key])) {
                return body[key];
            }
        }

        return [];
    };

    const user = JSON.parse(localStorage.getItem("user") || "null");

    const isAdmin =
        user?.role === "SUPER_ADMIN" ||
        user?.role === "CAMPUS_ADMIN" ||
        Number(user?.is_developer) === 1;

    const [sections, setSections] = useState([]);
    const formTopRef = useRef(null);
    const [campuses, setCampuses] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [timetables, setTimetables] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(false);

    const [editingId, setEditingId] = useState(null);

    const [searchText, setSearchText] = useState("");

    const [selectedCampus, setSelectedCampus] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null);

    const [selectedClass, setSelectedClass] = useState(null);

    const [selectedYear, setSelectedYear] = useState("2026-2027");

    // Current period selected in the form
    const selectedPeriodNo = Form.useWatch("period_no", form);

    // =====================================================
    // PERIOD TYPE
    // =====================================================

    const getPeriodType = (period) => {

        const type = String(
            period?.period_type || period?.type || ""
        ).toUpperCase();

        if (type === "BREAK") return "BREAK";
        if (type === "ACTIVITY") return "ACTIVITY";
        if (type === "CLASS") return "CLASS";

        // Backward compatibility if old period data uses title
        const title = String(
            period?.title || ""
        ).toUpperCase();

        if (title.includes("BREAK")) return "BREAK";
        if (title.includes("ACTIVITY")) return "ACTIVITY";

        return "CLASS";
    };

    const selectedFormPeriod = Array.isArray(periods)
        ? periods.find(
            p =>
                String(p.period_no) ===
                String(selectedPeriodNo)
        )
        : null;

    const selectedPeriodType = getPeriodType(
        selectedFormPeriod
    );


    // =====================================================
    // PERIODS
    // =====================================================

    // const periods = [

    //     {
    //         period_no: 1,
    //         start_time: "08:00",
    //         end_time: "08:30"
    //     },

    //     {
    //         period_no: 2,
    //         start_time: "08:30",
    //         end_time: "09:00"
    //     },

    //     {
    //         period_no: 3,
    //         start_time: "09:00",
    //         end_time: "09:30"
    //     },

    //     {
    //         period_no: 4,
    //         start_time: "09:45",
    //         end_time: "10:15"
    //     },

    //     {
    //         period_no: 5,
    //         start_time: "10:15",
    //         end_time: "10:45"
    //     },

    //     {
    //         period_no: 6,
    //         start_time: "11:00",
    //         end_time: "11:30"
    //     },

    //     {
    //         period_no: 7,
    //         start_time: "11:30",
    //         end_time: "12:00"
    //     },

    //     {
    //         period_no: 8,
    //         start_time: "12:00",
    //         end_time: "12:30"
    //     }

    // ];


    // =====================================================
    // DAYS
    // =====================================================

    const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
    ];


    // =====================================================
    // LOAD ALL DATA
    // =====================================================

const loadData = async () => {

        try {

            setLoading(true);

            const scopeParams = isAdmin
                ? {}
                : {
                    campus_id: user?.campus_id,
                    section_id: user?.section_id
                };

            const [
                periodResponse,
                campusResponse,
                sectionResponse,
                classResponse,
                subjectResponse,
                teacherResponse,
                timetableResponse
            ] = await Promise.all([

                // PERIODS
                axios.get(`${API}/periods`, {
                    params: {
                        user_id: user?.user_id,

                        ...(isAdmin
                            ? {}
                            : {
                                campus_id: user?.campus_id,
                                section_id: user?.section_id
                            })
                    }
                }),

                // CAMPUSES
                axios.get(`${API}/campuses`),

                // SECTIONS
                axios.get(`${API}/sections`, {
                    params: isAdmin
                        ? {}
                        : {
                            campus_id: user?.campus_id
                        }
                }),

                // CLASSES
                axios.get(`${API}/classes`, {
                    params: scopeParams
                }),

                // SUBJECTS
                axios.get(`${API}/subjects`),

                // TEACHERS
                // Normal users are scoped to their login assignment.
                // Admin can load the teacher list without forcing a campus/section.
                axios.get(`${API}/teachers`, {
                    params: isAdmin
                        ? {
                            user_id: user?.user_id
                        }
                        : {
                            user_id: user?.user_id,
                            campus_id: user?.campus_id,
                            section_id: user?.section_id
                        }
                }),

                // TIMETABLE
                axios.get(`${API}/timetables`, {
                    params: {
                        user_id: user?.user_id,

                        ...(isAdmin
                            ? {}
                            : {
                                campus_id: user?.campus_id,
                                section_id: user?.section_id
                            })
                    }
                })
            ]);

            // IMPORTANT:
            // /api/periods returns { success, periods, count }
            const periodData = getArray(periodResponse, [
                "periods",
                "rows"
            ]).sort(
                (a, b) => Number(a.period_no) - Number(b.period_no)
            );

            setPeriods(periodData);

            setCampuses(
                getArray(campusResponse, [
                    "campuses",
                    "rows"
                ])
            );

            setSections(
                getArray(sectionResponse, [
                    "sections",
                    "rows"
                ])
            );

            setClasses(
                getArray(classResponse, [
                    "classes",
                    "rows"
                ])
            );

            setSubjects(
                getArray(subjectResponse, [
                    "subjects",
                    "rows"
                ])
            );

            setTeachers(
                getArray(teacherResponse, [
                    "teachers",
                    "rows"
                ])
            );

            setTimetables(
                getArray(timetableResponse, [
                    "timetables",
                    "rows"
                ])
            );

            if (!isAdmin) {

                setSelectedCampus(user?.campus_id || null);
                setSelectedSection(user?.section_id || null);

                form.setFieldsValue({
                    campus_id: user?.campus_id,
                    section_id: user?.section_id,
                    academic_year: selectedYear
                });
            }

        } catch (error) {

            console.error(
                "Timetable Load Error:",
                error.response?.data || error
            );

            Swal.fire(
                "Error",
                error.response?.data?.message ||
                "Unable to load timetable data",
                "error"
            );

        } finally {

            setLoading(false);

        }

    };
    useEffect(() => {

        if (user?.user_id) {
            loadData();
        }

    }, [user?.user_id]);

    useEffect(() => {

        if (!isAdmin && user?.campus_id && user?.section_id) {
            setSelectedCampus(user.campus_id);
            setSelectedSection(user.section_id);

            form.setFieldsValue({
                campus_id: user.campus_id,
                section_id: user.section_id
            });
        }

    }, [isAdmin, user?.campus_id, user?.section_id]);


    // =====================================================
    // PERIOD OPTIONS
    // =====================================================

    const periodOptions = [...periods]
        .sort(
            (a, b) =>
                Number(a.period_no) - Number(b.period_no)
        )
        .map((period) => {

            const type = getPeriodType(period);

            return {
                value: period.period_no,
                label:
                    `${period.title || type} - ` +
                    `${period.start_time || ""} - ${period.end_time || ""}`
            };
        });


    // =====================================================
    // SAVE / UPDATE
    // =====================================================

    const handleSubmit = async (values) => {

        try {

            setLoading(true);


            const selectedPeriod =
                periods.find(
                    p =>
                        String(p.period_no) ===
                        String(values.period_no)
                );

            if (!selectedPeriod) {
                throw new Error("Selected period was not found");
            }

            const periodType = getPeriodType(selectedPeriod);

            const data = {

                user_id: user?.user_id,

                campus_id:
                    values.campus_id,

                section_id:
                    values.section_id,

                class_id:
                    values.class_id,

                // CLASS = subject + teacher
                // BREAK = neither subject nor teacher
                // ACTIVITY = activity_name only
                subject_id:
                    periodType === "CLASS"
                        ? values.subject_id
                        : null,

                teacher_id:
                    periodType === "CLASS"
                        ? values.teacher_id
                        : null,

                activity_name:
                    periodType === "ACTIVITY"
                        ? (
                            values.activity_name?.trim() ||
                            selectedPeriod.activity_name ||
                            selectedPeriod.title ||
                            "ACTIVITY"
                        )
                        : null,

                day:
                    values.day,

                period_no:
                    values.period_no,

                start_time:
                    selectedPeriod.start_time,

                end_time:
                    selectedPeriod.end_time,

                academic_year:
                    values.academic_year

            };


            if (editingId) {

                await axios.put(

                    `/api/timetables/${editingId}`,

                    data

                );


                await Swal.fire({

                    icon: "success",

                    title: "Updated",

                    text:
                        "Timetable updated successfully",

                    timer: 1500,

                    showConfirmButton: false

                });

            }

            else {

                await axios.post(

                    "/api/timetables",

                    data

                );


                await Swal.fire({

                    icon: "success",

                    title: "Saved",

                    text:
                        "Timetable saved successfully",

                    timer: 1500,

                    showConfirmButton: false

                });

            }


            form.resetFields();

            form.setFieldsValue({
                academic_year: selectedYear,
                campus_id: !isAdmin ? user?.campus_id : undefined,
                section_id: !isAdmin ? user?.section_id : undefined
            });

            if (!isAdmin) {
                setSelectedCampus(user?.campus_id || null);
                setSelectedSection(user?.section_id || null);
            }

            setSelectedClass(null);
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

    const handleEdit = async (record) => {

        setEditingId(record.timetable_id);

        setSelectedCampus(record.campus_id);
        setSelectedSection(record.section_id);
        setSelectedClass(record.class_id);

        if (record.campus_id && record.section_id) {
            await loadTeachers(record.campus_id, record.section_id);
        }

        form.setFieldsValue({

            campus_id:
                record.campus_id,

            section_id:
                record.section_id,

            class_id:
                record.class_id,

            subject_id:
                record.subject_id,

            teacher_id:
                record.teacher_id,

            activity_name:
                record.activity_name || "",

            day:
                record.day,

            period_no:
                record.period_no,

            academic_year:
                record.academic_year ||
                selectedYear

        });


          setTimeout(() => {

            formTopRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start"
            
        });

    }, 100);


    };


    // =====================================================
    // CANCEL
    // =====================================================

    const handleCancel = () => {

        form.resetFields();

        form.setFieldsValue({
            academic_year: selectedYear,
            campus_id: !isAdmin ? user?.campus_id : undefined,
            section_id: !isAdmin ? user?.section_id : undefined
        });

        if (!isAdmin) {
            setSelectedCampus(user?.campus_id || null);
            setSelectedSection(user?.section_id || null);
        }

        setSelectedClass(null);
        setEditingId(null);

    };


    // =====================================================
    // DELETE
    // =====================================================

    const handleDelete = async (timetable_id) => {

        try {

            setLoading(true);


            await axios.delete(

                `/api/timetables/${timetable_id}`,

                {
                    params: {
                        user_id: user?.user_id
                    }
                }

            );


            await Swal.fire({

                icon: "success",

                title: "Deleted",

                text:
                    "Timetable deleted successfully",

                timer: 1500,

                showConfirmButton: false

            });


            loadData();


        } catch (error) {

            console.error(error);

            Swal.fire(

                "Error",

                error.response?.data?.message ||
                "Unable to delete timetable",

                "error"

            );

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // FILTER
    // =====================================================

    const filteredData = useMemo(() => {

        const search =
            searchText
                .toLowerCase()
                .trim();


        return timetables.filter(
            item => {

                const matchesSearch =

                    item.class_name
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    item.subject_name
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    item.teacher_name
                        ?.toLowerCase()
                        .includes(search)

                    ||

                    item.day
                        ?.toLowerCase()
                        .includes(search);


                const matchesCampus =

                    !selectedCampus ||

                    String(item.campus_id ?? item.id) ===
                    String(selectedCampus);


                const matchesSection =
                    !selectedSection ||
                    String(item.section_id) ===
                    String(selectedSection);

                const matchesClass =
                    !selectedClass ||
                    String(item.class_id ?? item.id) ===
                    String(selectedClass);

                return (
                    matchesSearch &&
                    matchesCampus &&
                    matchesSection &&
                    matchesClass
                );

            }
        );

    }, [
        timetables,
        searchText,
        selectedCampus,
        selectedSection,
        selectedClass
    ]);


    // =====================================================
    // TEACHERS BY CAMPUS + SECTION
    // =====================================================

    const loadTeachers = async (campus_id, section_id) => {

        if (!campus_id || !section_id) {
            setTeachers([]);
            return;
        }

        try {
            const response = await axios.get(
                "/api/teachers",
                {
                    params: {
                        user_id: user?.user_id,
                        campus_id,
                        section_id
                    }
                }
            );

            setTeachers(
                getArray(response, [
                    "teachers",
                    "rows"
                ])
            );

        } catch (error) {
            console.error(
                "Teachers Error:",
                error.response?.data || error
            );
            setTeachers([]);
        }
    };


    // =====================================================
    // SECTION / CLASS CASCADING
    // =====================================================

    const handleCampusChange = async (value) => {

        setSelectedCampus(value);
        setSelectedSection(null);
        setSelectedClass(null);
        setTeachers([]);

        form.setFieldsValue({
            campus_id: value,
            section_id: undefined,
            class_id: undefined
        });

        try {
            const response = await axios.get(
                "/api/sections",
                {
                    params: { campus_id: value }
                }
            );

            setSections(
                getArray(response, [
                    "sections",
                    "rows"
                ])
            );
            setClasses([]);

        } catch (error) {
            console.error(
                "Sections Error:",
                error.response?.data || error
            );
            setSections([]);
            setClasses([]);
        }
    };

    const handleSectionChange = async (value) => {

        setSelectedSection(value);
        setSelectedClass(null);

        form.setFieldsValue({
            section_id: value,
            class_id: undefined
        });

        try {
            const response = await axios.get(
                "/api/classes",
                {
                    params: {
                        campus_id: form.getFieldValue("campus_id"),
                        section_id: value
                    }
                }
            );

            setClasses(
                getArray(response, [
                    "classes",
                    "rows"
                ])
            );

            await loadTeachers(
                form.getFieldValue("campus_id"),
                value
            );

        } catch (error) {
            console.error(
                "Classes Error:",
                error.response?.data || error
            );
            setClasses([]);
        }
    };

    const sectionOptions = sections
        .filter(item =>
            item.is_active === undefined ||
            item.is_active === 1
        )
        .filter(item =>
            !selectedCampus ||
            String(item.campus_id) === String(selectedCampus)
        )
        .map(item => ({
            value: item.section_id ?? item.id,
            label: item.section_name ?? item.name
        }));

    const classOptions = classes
        .filter(item =>
            item.is_active === undefined ||
            item.is_active === 1
        )
        .filter(item =>
            !selectedCampus ||
            String(item.campus_id) === String(selectedCampus)
        )
        .filter(item =>
            !selectedSection ||
            String(item.section_id) === String(selectedSection)
        )
        .map(item => ({
            value: item.class_id ?? item.id,
            label: `${item.name}${item.code ? ` (${item.code})` : ""}`
        }));


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

            dataIndex:
                "campus_name",

            key:
                "campus_name"
        },

        {
            title: "Class",

            dataIndex:
                "class_name",

            key:
                "class_name"
        },

        {
            title: "Section",

            key: "section_name",

            render: (_, record) =>
                record.section_name || record.section || "—"
        },

        {
            title: "Day",

            dataIndex:
                "day",

            key:
                "day"
        },

        {
            title: "Period",

            key:
                "period",

            render:
                (_, record) => (

                    <Tag color="blue">

                        {record.period_no}

                    </Tag>

                )
        },

        {
            title: "Time",

            key:
                "time",

            render:
                (_, record) => (

                    `${record.start_time} - ${record.end_time}`

                )
        },

        {
            title: "Subject",

            dataIndex:
                "subject_name",

            key:
                "subject_name",

            render:
                value => (

                    <Tag color="green">

                        {value}

                    </Tag>

                )
        },

        {
            title: "Teacher",

            dataIndex:
                "teacher_name",

            key:
                "teacher_name"
        },

        {
            title: "Action",

            key:
                "action",

            width: 170,

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
                                handleEdit(record)
                            }

                        >

                            Edit

                        </Button>


                        <Popconfirm

                            title=
                                "Delete this timetable?"

                            description=
                                "This timetable entry will be deleted."

                            okText="Yes"

                            cancelText="No"

                            onConfirm={() =>
                                handleDelete(
                                    record.timetable_id
                                )
                            }

                        >

                            <Button

                                danger

                                size="small"

                                icon={
                                    <DeleteOutlined />
                                }

                            >

                                Delete

                            </Button>

                        </Popconfirm>

                    </Space>

                )
        }

    ];


    // =====================================================
    // TIMETABLE GRID DATA
    // =====================================================

    const getTimetableEntry = (
        day,
        period
    ) => {

        return filteredData.find(

            item =>

                item.day === day &&

                Number(item.period_no) ===
                Number(period)

        );

    };


    // =====================================================
    // CLASS NAME
    // =====================================================

    const selectedClassName =

        classes.find(
            item =>
                String(item.class_id ?? item.id) === String(selectedClass)
        )?.name || "CLASS TIMETABLE";


    // =====================================================
    // PRINT
    // =====================================================

    const handlePrint = () => {
        // Create a separate print window containing ONLY the timetable.
        // This avoids Ant Design/Card/page CSS affecting the print.
        if (!selectedClass) {
            Swal.fire(
                "Select Class",
                "Please select a class before printing the timetable.",
                "warning"
            );
            return;
        }

        const escapeHtml = (value) =>
            String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

        const sectionName =
            sections.find(
                item =>
                    String(item.section_id ?? item.id) ===
                    String(selectedSection)
            )?.section_name ||
            sections.find(
                item =>
                    String(item.section_id ?? item.id) ===
                    String(selectedSection)
            )?.name ||
            "—";

        const getPrintEntry = (day, periodNo) =>
            filteredData.find(
                item =>
                    String(item.day) === String(day) &&
                    Number(item.period_no) === Number(periodNo)
            );

        const headerCells = days
            .map(day => `<th>${escapeHtml(day)}</th>`)
            .join("");

        const rows = periods
            .map(period => {
                const type = getPeriodType(period);

                const cells = days
                    .map(day => {
                        const entry = getPrintEntry(
                            day,
                            period.period_no
                        );

                        let content = "—";

                        if (type === "BREAK") {
                            content = `<span class="break">BREAK</span>`;
                        } else if (type === "ACTIVITY") {
                            content = `
                                <div class="activity">
                                    ${escapeHtml(
                                        entry?.activity_name ||
                                        period.activity_name ||
                                        period.title ||
                                        "ACTIVITY"
                                    )}
                                </div>
                            `;
                        } else if (entry) {
                            content = `
                                <div class="subject">
                                    ${escapeHtml(entry.subject_name || "—")}
                                </div>
                                <div class="teacher">
                                    ${escapeHtml(entry.teacher_name || "—")}
                                </div>
                            `;
                        }

                        return `<td>${content}</td>`;
                    })
                    .join("");

                return `
                    <tr>
                        <td class="time">
                            <strong>
                                ${escapeHtml(period.start_time)}
                                -
                                ${escapeHtml(period.end_time)}
                            </strong>
                        </td>
                        ${cells}
                    </tr>
                `;
            })
            .join("");

        const printWindow = window.open(
            "",
            "_blank",
            "width=1400,height=900"
        );

        if (!printWindow) {
            Swal.fire(
                "Print Blocked",
                "Please allow pop-ups for this site and try again.",
                "warning"
            );
            return;
        }

        printWindow.document.open();
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8" />
                <title>${escapeHtml(selectedClassName)} Timetable</title>

                <style>
                    @page {
                        size: A4 landscape;
                        margin: 7mm;
                    }

                    * {
                        box-sizing: border-box;
                    }

                    html,
                    body {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        background: #fff;
                        font-family: Arial, Helvetica, sans-serif;
                    }

                    .page {
                        width: 100%;
                        padding: 0;
                    }

                    .heading {
                        text-align: center;
                        margin-bottom: 5px;
                    }

                    .heading h1 {
                        margin: 0;
                        font-size: 19px;
                        line-height: 1.1;
                    }

                    .heading h2 {
                        margin: 2px 0;
                        font-size: 13px;
                        line-height: 1.1;
                    }

                    .heading .info {
                        font-size: 9px;
                        line-height: 1.15;
                        margin-top: 1px;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        table-layout: fixed;
                        page-break-inside: avoid;
                    }

                    th,
                    td {
                        border: 1px solid #222;
                        text-align: center;
                        vertical-align: middle;
                        padding: 2px 3px;
                    }

                    th {
                        height: 22px;
                        background: #f0f0f0;
                        font-size: 9px;
                        font-weight: 700;
                    }

                    td {
                        height: 38px;
                        font-size: 8px;
                        line-height: 1.05;
                        overflow: hidden;
                    }

                    th:first-child,
                    td:first-child {
                        width: 16%;
                    }

                    .time {
                        font-size: 8px;
                        white-space: nowrap;
                    }

                    .subject {
                        font-size: 8.5px;
                        font-weight: 700;
                        line-height: 1.05;
                    }

                    .teacher {
                        margin-top: 2px;
                        font-size: 7.5px;
                        line-height: 1.05;
                    }

                    .activity {
                        font-size: 8.5px;
                        font-weight: 700;
                    }

                    .break {
                        font-size: 8px;
                        font-weight: 700;
                    }

                    @media print {
                        html,
                        body {
                            width: 100%;
                            height: auto;
                            overflow: visible;
                        }

                        .page {
                            width: 100%;
                        }

                        table,
                        tr {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                    }
                </style>
            </head>

            <body>
                <div class="page">
                    <div class="heading">
                        <h1>SCHOOL TIMETABLE</h1>
                        <h2>CLASS: ${escapeHtml(selectedClassName)}</h2>
                        <div class="info">
                            SECTION: ${escapeHtml(sectionName)}
                            &nbsp;&nbsp; | &nbsp;&nbsp;
                            ACADEMIC YEAR: ${escapeHtml(selectedYear)}
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>TIME</th>
                                ${headerCells}
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();

        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();

                setTimeout(() => {
                    printWindow.close();
                }, 500);
            }, 300);
        };
    };


    // =====================================================
    // PDF
    // =====================================================

    const handlePDF = async () => {

        try {

            // A class must be selected before creating the PDF.
            if (!selectedClass) {

                Swal.fire(
                    "Select Class",
                    "Please select a class before generating the timetable PDF.",
                    "warning"
                );

                return;
            }


            const html2pdf =
                (await import("html2pdf.js"))
                    .default;


            const element =
                document.getElementById(
                    "print-timetable"
                );


            // A4 landscape + compact content so the complete timetable
            // stays on ONE page.
            const options = {

                margin: [5, 5, 5, 5],

                filename:
                    `${selectedClassName}_Timetable.pdf`,

                image: {
                    type: "jpeg",
                    quality: 0.98
                },

                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    scrollX: 0,
                    scrollY: 0
                },

                pagebreak: {
                    mode: ["avoid-all"]
                },

                jsPDF: {
                    unit: "mm",
                    format: "a4",
                    orientation: "landscape",
                    compress: true
                }

            };


            await html2pdf()
                .set(options)
                .from(element)
                .save();


        } catch (error) {

            console.error(error);

            Swal.fire(

                "Error",

                "Unable to generate PDF",

                "error"

            );

        }

    };


    // =====================================================
    // UI
    // =====================================================

    // Compact PDF styling is kept here so the timetable fits
    // on one A4 landscape page.
    const printTableStyle = `
        @page {
            size: A4 landscape;
            margin: 5mm;
        }

        @media print {

            html,
            body {
                width: 100% !important;
                height: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                background: #fff !important;
            }

            body * {
                visibility: hidden !important;
            }

            #print-timetable,
            #print-timetable * {
                visibility: visible !important;
            }

            #print-timetable {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
                background: #fff !important;
                box-sizing: border-box !important;
            }

         #print-timetable .ant-table-wrapper,
#print-timetable .ant-spin-nested-loading,
#print-timetable .ant-spin-container,
#print-timetable .ant-table,
#print-timetable .ant-table-container,
#print-timetable .ant-table-content,
#print-timetable .ant-table-body {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    max-height: none !important;
    min-height: 0 !important;
    overflow: visible !important;
}

/* Ant Design scroll table ko print mein normal table bana do */
#print-timetable .ant-table-body {
    display: block !important;
}

#print-timetable .ant-table-body table {
    width: 100% !important;
    table-layout: fixed !important;
}

#print-timetable .ant-table-header {
    overflow: visible !important;
}

#print-timetable .ant-table-content > table {
    width: 100% !important;
    table-layout: fixed !important;
}

            #print-timetable .ant-table {
                font-size: 9px !important;
                table-layout: fixed !important;
            }

            #print-timetable .ant-table table {
                width: 100% !important;
                table-layout: fixed !important;
            }

            #print-timetable .ant-table-thead > tr > th {
                padding: 4px 3px !important;
                font-size: 9px !important;
                line-height: 1.05 !important;
                white-space: nowrap !important;
                height: 22px !important;
            }

            #print-timetable .ant-table-tbody > tr > td {
                padding: 3px 3px !important;
                font-size: 8.5px !important;
                line-height: 1.05 !important;
                height: 28px !important;
                white-space: normal !important;
                word-break: normal !important;
            }

            #print-timetable .ant-table-cell {
                overflow: hidden !important;
            }

            #print-timetable h2 {
                font-size: 18px !important;
                margin: 0 0 2px 0 !important;
            }

            #print-timetable h3 {
                font-size: 13px !important;
                margin: 1px 0 !important;
            }

            #print-timetable > div:first-child {
                margin-bottom: 4px !important;
            }

            /* Do not print browser-only controls/buttons if any are inside. */
            #print-timetable .no-print,
            #print-timetable button,
            #print-timetable .ant-pagination {
                display: none !important;
            }

            /* Prevent a row from being split across printed pages. */
            #print-timetable tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
        }
    `;

    const pdfTableStyle = `
        #print-timetable .ant-table {
            font-size: 9px;
        }

        #print-timetable .ant-table-thead > tr > th {
            padding: 5px 4px !important;
            font-size: 9px;
            line-height: 1.1;
            white-space: nowrap;
        }

        #print-timetable .ant-table-tbody > tr > td {
            padding: 4px 3px !important;
            font-size: 9px;
            line-height: 1.1;
            height: 34px;
        }

        #print-timetable .ant-table-container {
            overflow: visible !important;
        }
    `;

    return (

        <div
            style={{
                padding: "20px"
            }}
        >

            <style>{pdfTableStyle}</style>
            <style>{printTableStyle}</style>

            {/* ================================================= */}
            {/* FORM */}
            {/* ================================================= */}

            <Card
            

                title={
                    editingId
                        ? "Update Timetable"
                        : "Create Timetable"
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
                        academic_year: "2026-2027",
                        campus_id: !isAdmin ? user?.campus_id : undefined,
                        section_id: !isAdmin ? user?.section_id : undefined
                    }}

                >

                    <Row gutter={16}>

                        {/* CAMPUS */}

                        <Col
                            xs={24}
                            sm={12}
                            md={6}
                        >

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
                                    placeholder="Select Campus"
                                    showSearch
                                    optionFilterProp="label"
                                    disabled={!isAdmin}
                                    onChange={handleCampusChange}
                                    options={
                                        campuses
                                            .filter(item =>
                                                item.is_active === undefined ||
                                                item.is_active === 1
                                            )
                                            .filter(item =>
                                                isAdmin ||
                                                String(item.campus_id ?? item.id) ===
                                                String(user?.campus_id)
                                            )
                                            .map(item => ({
                                                value: item.campus_id ?? item.id,
                                                label:
                                                    `${item.name}${item.code ? ` (${item.code})` : ""}`
                                            }))
                                    }
                                />

                            </Form.Item>

                        </Col>


                        {/* SECTION */}

                        <Col
                            xs={24}
                            sm={12}
                            md={6}
                        >

                            <Form.Item
                                label="Section"
                                name="section_id"
                                rules={[
                                    {
                                        required: true,
                                        message: "Please select section"
                                    }
                                ]}
                            >

                                <Select
                                    placeholder="Select Section"
                                    showSearch
                                    optionFilterProp="label"
                                    disabled={!isAdmin}
                                    onChange={handleSectionChange}
                                    options={sectionOptions}
                                />

                            </Form.Item>

                        </Col>

                        {/* CLASS */}

                        <Col
                            xs={24}
                            sm={12}
                            md={6}
                        >

<Form.Item
    label="Class"
    name="class_id"
    rules={[
        {
            required: true,
            message: "Please select class"
        }
    ]}
>
    <Select
                                    placeholder="Select Class"
                                    showSearch
                                    optionFilterProp="label"
                                    onChange={(value) => {
                                        setSelectedClass(value);
                                        form.setFieldValue("class_id", value);
                                    }}
                                    options={classOptions}
                                />
</Form.Item>


                        </Col>


                        {/* DAY */}

                        <Col
                            xs={24}
                            sm={12}
                            md={4}
                        >

                            <Form.Item

                                label="Day"

                                name="day"

                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select day"
                                    }
                                ]}

                            >

                                <Select

                                    placeholder=
                                        "Select Day"

                                    options={

                                        days.map(
                                            day => ({
                                                value:
                                                    day,

                                                label:
                                                    day
                                            })
                                        )

                                    }

                                />

                            </Form.Item>

                        </Col>


                        {/* PERIOD */}

                        <Col
                            xs={24}
                            sm={12}
                            md={8}
                        >

                            <Form.Item

                                label="Period"

                                name="period_no"

                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select period"
                                    }
                                ]}

                            >

                                <Select

                                    placeholder=
                                        "Select Period"

                                    options={
                                        periodOptions
                                    }

                                    onChange={(value) => {

                                        const period = periods.find(
                                            p =>
                                                String(p.period_no) ===
                                                String(value)
                                        );

                                        const type = getPeriodType(period);

                                        if (type !== "CLASS") {
                                            form.setFieldsValue({
                                                subject_id: undefined,
                                                teacher_id: undefined
                                            });
                                        }

                                        if (type !== "ACTIVITY") {
                                            form.setFieldValue(
                                                "activity_name",
                                                undefined
                                            );
                                        }
                                    }}

                                />

                            </Form.Item>

                        </Col>

                    </Row>


                    <Row gutter={16}>

                        {/* SUBJECT / ACTIVITY / BREAK */}

                        {selectedPeriodType === "CLASS" && (
                            <Col
                                xs={24}
                                sm={12}
                                md={8}
                            >

                                <Form.Item
                                    label="Subject"
                                    name="subject_id"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                "Please select subject"
                                        }
                                    ]}
                                >

                                    <Select
                                        placeholder="Select Subject"
                                        showSearch
                                        optionFilterProp="label"
                                        options={
                                            subjects
                                                .filter(
                                                    item =>
                                                        item.is_active === undefined ||
                                                        item.is_active === 1
                                                )
                                                .map(item => ({
                                                    value:
                                                        item.subject_id ?? item.id,
                                                    label:
                                                        `${item.name} (${item.code})`
                                                }))
                                        }
                                    />

                                </Form.Item>

                            </Col>
                        )}


                        {/* TEACHER */}

                        {selectedPeriodType === "CLASS" && (
                            <Col
                                xs={24}
                                sm={12}
                                md={8}
                            >

                                <Form.Item
                                    label="Teacher"
                                    name="teacher_id"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                "Please select teacher"
                                        }
                                    ]}
                                >

                                    <Select
                                        placeholder="Select Teacher"
                                        showSearch
                                        optionFilterProp="label"
                                        options={
                                            teachers.map(item => ({
                                                value:
                                                    item.teacher_id ?? item.id,
                                                label:
                                                    item.name
                                            }))
                                        }
                                    />

                                </Form.Item>

                            </Col>
                        )}


                        {/* ACTIVITY */}

                        {selectedPeriodType === "ACTIVITY" && (
                            <Col
                                xs={24}
                                sm={12}
                                md={8}
                            >

                                <Form.Item
                                    label="Activity"
                                    name="activity_name"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                "Please enter activity"
                                        }
                                    ]}
                                >

                                    <Input
                                        placeholder="Enter Activity"
                                    />

                                </Form.Item>

                            </Col>
                        )}


                        {/* BREAK */}

                        {selectedPeriodType === "BREAK" && (
                            <Col
                                xs={24}
                                sm={12}
                                md={8}
                            >

                                <div
                                    style={{
                                        marginTop: 30,
                                        padding: "8px 12px",
                                        borderRadius: 4,
                                        background: "#fff7e6",
                                        border: "1px solid #ffd591",
                                        fontWeight: 600
                                    }}
                                >
                                    BREAK — No subject or teacher required
                                </div>

                            </Col>
                        )}


                        {/* ACADEMIC YEAR */}

                        <Col
                            xs={24}
                            sm={12}
                            md={8}
                        >

                            <Form.Item

                                label="Academic Year"

                                name="academic_year"

                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please enter academic year"
                                    }
                                ]}

                            >

                                <Input

                                    placeholder=
                                        "2026-2027"

                                />

                            </Form.Item>

                        </Col>

                    </Row>


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
            {/* TIMETABLE FILTER */}
            {/* ================================================= */}

            <Card

                title="Timetable"

                style={{
                    marginBottom: 20
                }}

                extra={

                    <Space>

                        <Button

                            icon={
                                <ReloadOutlined />
                            }

                            onClick={
                                loadData
                            }

                        >

                            Refresh

                        </Button>


                        <Button

                            icon={
                                <PrinterOutlined />
                            }

                            onClick={
                                handlePrint
                            }

                        >

                            Print

                        </Button>


                        <Button

                            type="primary"

                            danger

                            icon={
                                <FilePdfOutlined />
                            }

                            onClick={
                                handlePDF
                            }

                        >

                            PDF

                        </Button>

                    </Space>

                }

            >

                <Row
                    gutter={16}
                    style={{
                        marginBottom: 20
                    }}
                >

                    {/* CAMPUS FILTER */}

                    <Col
                        xs={24}
                        sm={8}
                    >

                        <Select
                            allowClear={isAdmin}
                            showSearch
                            optionFilterProp="label"
                            placeholder="Filter Campus"
                            disabled={!isAdmin}
                            style={{ width: "100%" }}
                            value={selectedCampus}
                            onChange={(value) => {
                                setSelectedCampus(value);
                                setSelectedSection(null);
                                setSelectedClass(null);
                            }}
                            options={
                                campuses
                                    .filter(item =>
                                        isAdmin ||
                                        String(item.campus_id ?? item.id) ===
                                        String(user?.campus_id)
                                    )
                                    .map(item => ({
                                        value: item.campus_id ?? item.id,
                                        label: item.name
                                    }))
                            }
                        />

                    </Col>


                    {/* SECTION FILTER */}

                    <Col
                        xs={24}
                        sm={8}
                    >

                        <Select
                            allowClear={isAdmin}
                            showSearch
                            optionFilterProp="label"
                            placeholder="Filter Section"
                            disabled={!isAdmin}
                            style={{ width: "100%" }}
                            value={selectedSection}
                            onChange={(value) => {
                                setSelectedSection(value);
                                setSelectedClass(null);
                            }}
                            options={sectionOptions}
                        />

                    </Col>

                    {/* CLASS FILTER */}

                    <Col
                        xs={24}
                        sm={8}
                    >

                        <Select

                            allowClear

                            showSearch

                            optionFilterProp="label"

                            placeholder=
                                "Filter Class"

                            style={{
                                width: "100%"
                            }}

                            value={
                                selectedClass
                            }

                            onChange={
                                setSelectedClass
                            }

                            options={

                                classes.map(
                                    item => ({
                                        value:
                                            item.class_id ?? item.id,

                                        label:
                                            `${item.name}${item.code ? ` (${item.code})` : ""}`
                                    })
                                )

                            }

                        />

                    </Col>


                    {/* SEARCH */}

                    <Col
                        xs={24}
                        sm={8}
                    >

                        <Input

                            prefix={
                                <SearchOutlined />
                            }

                            placeholder=
                                "Search timetable..."

                            value={
                                searchText
                            }

                            onChange={e =>
                                setSearchText(
                                    e.target.value
                                )
                            }

                            allowClear

                        />

                    </Col>

                </Row>


                {/* ================================================= */}
                {/* PRINT AREA */}
                {/* ================================================= */}

                <div
                    id="print-timetable"
                    style={{
                        width: "100%",
                        boxSizing: "border-box",
                        background: "#fff",
                        padding: "8px",
                        overflow: "hidden"
                    }}
                >

                    <div
                        style={{
                            textAlign: "center",
                            marginBottom: 8
                        }}
                    >

                        <h2
                            style={{
                                margin: 0,
                                fontSize: 22,
                                lineHeight: 1.2
                            }}
                        >
                            SCHOOL TIMETABLE
                        </h2>

                        <h3
                            style={{
                                margin: "3px 0",
                                fontSize: 16,
                                lineHeight: 1.2
                            }}
                        >
                            CLASS: {selectedClassName}
                        </h3>

                        <div
                            style={{
                                fontSize: 11,
                                lineHeight: 1.2
                            }}
                        >
                            SECTION: {
                                sections.find(
                                    item =>
                                        String(item.section_id ?? item.id) ===
                                        String(selectedSection)
                                )?.section_name ||
                                sections.find(
                                    item =>
                                        String(item.section_id ?? item.id) ===
                                        String(selectedSection)
                                )?.name ||
                                "—"
                            }
                        </div>

                        <div
                            style={{
                                fontSize: 11,
                                lineHeight: 1.2
                            }}
                        >
                            Academic Year: {selectedYear}
                        </div>

                    </div>


                    {/* ================================================= */}
                    {/* GRID */}
                    {/* ================================================= */}

                    <Table

                        className="pdf-timetable-table"

                        bordered

                        pagination={false}

                        dataSource={[...periods].sort(
                            (a, b) =>
                                Number(a.period_no) -
                                Number(b.period_no)
                        )}

                        rowKey="period_no"

                      

                        columns={[

                            {
                                title:
                                    "Time",

                                key:
                                    "time",

                                width: 150,

                                render:
                                    (_, period) => (

                                        <strong>

                                            {period.start_time}
                                            {" - "}
                                            {period.end_time}

                                        </strong>

                                    )

                            },

                            ...days.map(
                                day => ({

                                    title:
                                        day,

                                    key:
                                        day,

                                    align:
                                        "center",

                                    render:
                                        (_, period) => {

                                            const entry =
                                                getTimetableEntry(
                                                    day,
                                                    period.period_no
                                                );


                                            const periodType =
                                                getPeriodType(period);

                                            return (

                                                <div
                                                    style={{
                                                        minHeight: 55,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        flexDirection: "column"
                                                    }}
                                                >

                                                    {periodType === "BREAK" ? (

                                                        <Tag color="orange">
                                                            BREAK
                                                        </Tag>

                                                    ) : periodType === "ACTIVITY" ? (

                                                        <>
                                                            <div
                                                                style={{
                                                                    fontWeight: "bold",
                                                                    color: "#722ed1"
                                                                }}
                                                            >
                                                                {entry?.activity_name ||
                                                                    period.activity_name ||
                                                                    period.title ||
                                                                    "ACTIVITY"}
                                                            </div>
                                                        </>

                                                    ) : entry ? (

                                                        <>

                                                            <div
                                                                style={{
                                                                    fontWeight: "bold",
                                                                    color: "#1677ff"
                                                                }}
                                                            >
                                                                {entry.subject_name || "—"}
                                                            </div>

                                                            <div
                                                                style={{
                                                                    fontSize: 12,
                                                                    color: "#555"
                                                                }}
                                                            >
                                                                {entry.teacher_name || "—"}
                                                            </div>

                                                        </>

                                                    ) : (

                                                        <span
                                                            style={{
                                                                color: "#aaa"
                                                            }}
                                                        >
                                                            —
                                                        </span>

                                                    )}

                                                </div>

                                            );

                                        }

                                })

                            )

                        ]}

                        components={{

                            body: {

                                row:
                                    ({ children, ...props }) => {

                                        const periodNo =
                                            props["data-row-key"];


                                        return (
                                            <tr
                                                {...props}
                                            >
                                                {children}
                                            </tr>
                                        );

                                    }

                            }

                        }}

                    />

                </div>

            </Card>


            {/* ================================================= */}
            {/* RECORD LIST */}
            {/* ================================================= */}

            <Card
                title="Timetable Entries"
            >

               <Table
    rowKey="timetable_id"

    columns={columns}

    dataSource={filteredData}

    loading={loading}

    bordered

    scroll={{
        x: 1300
    }}

    pagination={{
        pageSize: pageSize,

        showSizeChanger: true,

        pageSizeOptions: ["5", "10", "20", "50"],

        onShowSizeChange: (_, size) => {
            setPageSize(size);
        },

        showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} records`,
    }}
/>

            </Card>

        </div>

    );

};


export default Timetable;
