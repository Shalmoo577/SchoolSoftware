import React, { useEffect, useState } from "react";
import {
    useSearchParams,
    useParams
} from "react-router-dom";

import axios from "axios";
import dayjs from "dayjs";

import {
    Spin,
    Button,
    message
} from "antd";

import {
    PrinterOutlined,
    ArrowLeftOutlined
} from "@ant-design/icons";

import "./StudentFeeVoucher.css";


const StudentFeeVoucher = () => {

    const { studentFeeId } = useParams();

    const [searchParams] =
        useSearchParams();


    // =========================================================
    // PRINT ALL CHECK
    // =========================================================

    const isPrintAll =
        window.location.pathname ===
        "/student-fee-voucher-all";


    // =========================================================
    // PRINT ALL FILTERS
    // =========================================================

    const campusId =
        searchParams.get("campus_id");

    const academicYearId =
        searchParams.get("academic_year_id");

    const classId =
        searchParams.get("class_id");

    const sectionId =
        searchParams.get("section_id");

    const feeMonth =
        searchParams.get("fee_month");


    // =========================================================
    // STATES
    // =========================================================

    const [loading, setLoading] =
        useState(true);

    const [voucher, setVoucher] =
        useState(null);

    const [vouchers, setVouchers] =
        useState([]);

    const [company, setCompany] =
        useState({});


    // =========================================================
    // LOAD SINGLE VOUCHER
    // =========================================================

    const loadVoucher = async () => {

        try {

            setLoading(true);


            if (!studentFeeId) {

                message.error(
                    "Student Fee ID is missing"
                );

                return;
            }


            const [
                voucherRes,
                companyRes
            ] = await Promise.all([

                axios.get(
                    `/api/student-fee-voucher/${studentFeeId}`
                ),

                axios.get(
                    "/api/company-profile"
                )

            ]);


            setVoucher(
                voucherRes.data || null
            );


            setCompany(
                companyRes.data || {}
            );


        } catch (error) {

            console.error(
                "Single Voucher Error:",
                error
            );


            message.error(
                error.response?.data?.message ||
                "Unable to load fee voucher"
            );


        } finally {

            setLoading(false);

        }

    };


    // =========================================================
    // LOAD ALL VOUCHERS
    // =========================================================

    const loadVouchers = async () => {

        try {

            setLoading(true);


            // =================================================
            // VALIDATE FILTERS
            // =================================================

            if (
                !campusId ||
                !academicYearId ||
                !classId ||
                !sectionId ||
                !feeMonth
            ) {

                message.error(
                    "Required print filters are missing"
                );

                return;
            }


            // =================================================
            // GET FILTERED STUDENT FEES
            // =================================================

            const feesResponse =
                await axios.get(
                    "/api/student-fee-vouchers-all",
                    {
                        params: {

                            campus_id:
                                campusId,

                            academic_year_id:
                                academicYearId,

                            class_id:
                                classId,

                            section_id:
                                sectionId,

                            fee_month:
                                feeMonth

                        }
                    }
                );


            const fees =
                feesResponse.data?.fees || [];


            // =================================================
            // NO DATA
            // =================================================

            if (fees.length === 0) {

                message.warning(
                    "No fee vouchers found for selected filters"
                );

                setVouchers([]);

                return;
            }


            // =================================================
            // LOAD COMPLETE VOUCHER DATA
            // =================================================

            const voucherResponses =
                await Promise.all(

                    fees.map(
                        fee =>

                            axios.get(
                                `/api/student-fee-voucher/${fee.student_fee_id}`
                            )

                    )

                );


            const completeVouchers =
                voucherResponses.map(
                    response =>
                        response.data
                );


            // =================================================
            // COMPANY PROFILE
            // =================================================

            const companyResponse =
                await axios.get(
                    "/api/company-profile"
                );


            setCompany(
                companyResponse.data || {}
            );


            // =================================================
            // SET VOUCHERS
            // =================================================

            setVouchers(
                completeVouchers
            );


        } catch (error) {

            console.error(
                "Print All Voucher Error:",
                error
            );


            message.error(
                error.response?.data?.message ||
                "Unable to load fee vouchers"
            );


        } finally {

            setLoading(false);

        }

    };


    // =========================================================
    // LOAD DATA
    // =========================================================

    useEffect(() => {

        if (isPrintAll) {

            loadVouchers();

        } else {

            loadVoucher();

        }

    }, [isPrintAll]);


    // =========================================================
    // AUTO PRINT
    // =========================================================

    useEffect(() => {

        const hasData =
            isPrintAll
                ? vouchers.length > 0
                : !!voucher;


        if (
            !loading &&
            hasData
        ) {

            const timer =
                setTimeout(() => {

                    window.print();

                }, 800);


            return () =>
                clearTimeout(timer);

        }

    }, [
        loading,
        vouchers,
        voucher,
        isPrintAll
    ]);


    // =========================================================
    // FORMAT DATE
    // =========================================================

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }

        return dayjs(date).format(
            "DD-MM-YYYY"
        );

    };


    // =========================================================
    // FORMAT MONTH
    // =========================================================

    const formatMonth = (date) => {

        if (!date) {
            return "-";
        }

        return dayjs(date).format(
            "MMMM YYYY"
        );

    };


    // =========================================================
    // MONEY
    // =========================================================

    const money = (value) => {

        return Number(
            value || 0
        ).toLocaleString(
            "en-PK",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

    };


    // =========================================================
    // VOUCHER COPY
    // =========================================================

    const VoucherCopy = ({
        voucher,
        copyName
    }) => {

        const fee =
            voucher?.fee || {};


        const details =
            voucher?.details || [];


        const previousFees =
            voucher?.previousFees || [];


        const previousBalance =
            Number(
                voucher?.previousBalance || 0
            );


        const currentBalance =
            Number(
                fee.net_amount || 0
            ) -
            Number(
                fee.paid_amount || 0
            );


        const grandBalance =
            previousBalance +
            currentBalance;


        return (

            <div className="fee-voucher-copy">

                {/* =================================================
                    COPY HEADER
                ================================================= */}

                <div className="copy-label">

                    {copyName}

                </div>


                {/* =================================================
                    COMPANY HEADER
                ================================================= */}

                <div className="company-header">

                    {company.logo && (

                        <img
                            src={
                                company.logo.startsWith(
                                    "http"
                                )
                                    ? company.logo
                                    : `http://localhost:5000/${company.logo}`
                            }
                            alt="School Logo"
                            className="company-logo"
                        />

                    )}


                    <div className="company-info">

                        <h1>

                            {
                                company.company_name ||
                                "SCHOOL / COMPANY NAME"
                            }

                        </h1>


                        {company.address && (

                            <div>

                                {company.address}

                            </div>

                        )}


                        <div className="company-contact">

                            {company.phone && (

                                <span>

                                    Phone:
                                    {" "}
                                    {company.phone}

                                </span>

                            )}


                            {company.email && (

                                <span>

                                    Email:
                                    {" "}
                                    {company.email}

                                </span>

                            )}


                            {company.website && (

                                <span>

                                    {company.website}

                                </span>

                            )}

                        </div>

                    </div>

                </div>


                {/* =================================================
                    TITLE
                ================================================= */}

                <div className="voucher-title">

                    FEE CHALLAN

                </div>


                {/* =================================================
                    STUDENT INFORMATION
                ================================================= */}

                <div className="student-info">


                    <div className="info-row">

                        <div>

                            <strong>
                                Challan No:
                            </strong>

                            <span>

                                {
                                    fee.challan_no ||
                                    "-"
                                }

                            </span>

                        </div>


                        <div>

                            <strong>
                                Fee Month:
                            </strong>

                            <span>

                                {
                                    formatMonth(
                                        fee.fee_month
                                    )
                                }

                            </span>

                        </div>

                    </div>


                    <div className="info-row">

                        <div>

                            <strong>
                                Student Name:
                            </strong>

                            <span>

                                {
                                    fee.student_name ||
                                    "-"
                                }

                            </span>

                        </div>


                        <div>

                            <strong>
                                Admission No:
                            </strong>

                            <span>

                                {
                                    fee.admission_no ||
                                    "-"
                                }

                            </span>

                        </div>

                    </div>


                    <div className="info-row">

                        <div>

                            <strong>
                                Father Name:
                            </strong>

                            <span>

                                {
                                    fee.father_name ||
                                    "-"
                                }

                            </span>

                        </div>


                        <div>

                            <strong>
                                Class:
                            </strong>

                            <span>

                                {
                                    fee.class_name ||
                                    "-"
                                }

                            </span>

                        </div>

                    </div>


                    <div className="info-row">

                        <div>

                            <strong>
                                Section:
                            </strong>

                            <span>

                                {
                                    fee.section_name ||
                                    "-"
                                }

                            </span>

                        </div>


                        <div>

                            <strong>
                                Academic Year:
                            </strong>

                            <span>

                                {
                                    fee.academic_year ||
                                    "-"
                                }

                            </span>

                        </div>

                    </div>


                    <div className="info-row">

                        <div>

                            <strong>
                                Issue Date:
                            </strong>

                            <span>

                                {
                                    formatDate(
                                        fee.issue_date
                                    )
                                }

                            </span>

                        </div>


                        <div>

                            <strong>
                                Due Date:
                            </strong>

                            <span>

                                {
                                    formatDate(
                                        fee.due_date
                                    )
                                }

                            </span>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    CURRENT MONTH FEE
                ================================================= */}

                <div className="section-heading">

                    CURRENT MONTH FEE

                </div>


                <table className="fee-table">

                    <thead>

                        <tr>

                            <th
                                style={{
                                    width: "8%"
                                }}
                            >
                                #
                            </th>

                            <th>
                                Description
                            </th>

                            <th
                                style={{
                                    width: "23%"
                                }}
                            >
                                Amount
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {details.length > 0 ? (

                            details.map(
                                (
                                    item,
                                    index
                                ) => (

                                    <tr
                                        key={
                                            item.student_fee_detail_id
                                        }
                                    >

                                        <td className="center">

                                            {
                                                index + 1
                                            }

                                        </td>


                                        <td>

                                            {
                                                item.fee_description ||
                                                item.fee_head_name ||
                                                "-"
                                            }

                                        </td>


                                        <td className="amount">

                                            {
                                                money(
                                                    item.amount
                                                )
                                            }

                                        </td>

                                    </tr>

                                )

                            )

                        ) : (

                            <tr>

                                <td
                                    colSpan="3"
                                    className="center"
                                >

                                    No fee details

                                </td>

                            </tr>

                        )}


                        {/* TOTAL */}

                        <tr>

                            <td
                                colSpan="2"
                                className="right"
                            >

                                Total

                            </td>

                            <td className="amount">

                                {
                                    money(
                                        fee.total_amount
                                    )
                                }

                            </td>

                        </tr>


                        {/* DISCOUNT */}

                        <tr>

                            <td
                                colSpan="2"
                                className="right"
                            >

                                Discount

                            </td>

                            <td className="amount">

                                {
                                    money(
                                        fee.discount_amount
                                    )
                                }

                            </td>

                        </tr>


                        {/* FINE */}

                        <tr>

                            <td
                                colSpan="2"
                                className="right"
                            >

                                Fine / Late Fee

                            </td>

                            <td className="amount">

                                {
                                    money(
                                        fee.fine_amount
                                    )
                                }

                            </td>

                        </tr>


                        {/* NET */}

                        <tr className="net-row">

                            <td
                                colSpan="2"
                                className="right"
                            >

                                <strong>
                                    NET PAYABLE
                                </strong>

                            </td>

                            <td className="amount">

                                <strong>

                                    {
                                        money(
                                            fee.net_amount
                                        )
                                    }

                                </strong>

                            </td>

                        </tr>

                    </tbody>

                </table>


                {/* =================================================
                    PREVIOUS OUTSTANDING
                ================================================= */}

                {previousFees.length > 0 && (

                    <>

                        <div
                            className={
                                "section-heading previous-heading"
                            }
                        >

                            PREVIOUS OUTSTANDING

                        </div>


                        <table className="fee-table">

                            <thead>

                                <tr>

                                    <th>
                                        Month
                                    </th>

                                    <th>
                                        Challan No
                                    </th>

                                    <th>
                                        Balance
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {previousFees.map(
                                    item => (

                                        <tr
                                            key={
                                                item.student_fee_id
                                            }
                                        >

                                            <td>

                                                {
                                                    formatMonth(
                                                        item.fee_month
                                                    )
                                                }

                                            </td>


                                            <td>

                                                {
                                                    item.challan_no
                                                }

                                            </td>


                                            <td className="amount">

                                                {
                                                    money(
                                                        item.balance
                                                    )
                                                }

                                            </td>

                                        </tr>

                                    )
                                )}


                                <tr className="previous-total">

                                    <td
                                        colSpan="2"
                                        className="right"
                                    >

                                        Previous Balance

                                    </td>

                                    <td className="amount">

                                        <strong>

                                            {
                                                money(
                                                    previousBalance
                                                )
                                            }

                                        </strong>

                                    </td>

                                </tr>

                            </tbody>

                        </table>

                    </>

                )}


                {/* =================================================
                    TOTAL PAYABLE
                ================================================= */}

                <div className="payment-summary">


                    <div className="summary-line">

                        <span>
                            Current Fee:
                        </span>

                        <strong>

                            {
                                money(
                                    fee.net_amount
                                )
                            }

                        </strong>

                    </div>


                    <div className="summary-line">

                        <span>
                            Previous Balance:
                        </span>

                        <strong>

                            {
                                money(
                                    previousBalance
                                )
                            }

                        </strong>

                    </div>


                    <div className="grand-total">

                        <span>
                            TOTAL PAYABLE:
                        </span>

                        <strong>

                            {
                                money(
                                    grandBalance
                                )
                            }

                        </strong>

                    </div>

                </div>


                {/* =================================================
                    PAYMENT
                ================================================= */}

                <div className="payment-info">

                    <div>

                        <strong>
                            Payment Date:
                        </strong>

                        <span>
                            __________________
                        </span>

                    </div>


                    <div>

                        <strong>
                            Payment Method:
                        </strong>

                        <span>
                            __________________
                        </span>

                    </div>

                </div>


                {/* =================================================
                    SIGNATURES
                ================================================= */}

                <div className="signature-area">

                    <div>

                        <div className="signature-line"></div>

                        <strong>
                            Bank / Cashier Stamp
                        </strong>

                    </div>


                    <div>

                        <div className="signature-line"></div>

                        <strong>
                            Authorized Signature
                        </strong>

                    </div>

                </div>


                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="voucher-footer">

                    Please keep this challan for your record.

                </div>

            </div>

        );

    };


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <div className="voucher-loading">

                <Spin size="large" />

            </div>

        );

    }


    // =========================================================
    // SINGLE VOUCHER NO DATA
    // =========================================================

    if (
        !isPrintAll &&
        !voucher
    ) {

        return (

            <div className="voucher-error">

                <h3>
                    Fee voucher not found.
                </h3>


                <Button
                    icon={
                        <ArrowLeftOutlined />
                    }
                    onClick={() =>
                        window.history.back()
                    }
                >
                    Back
                </Button>

            </div>

        );

    }


    // =========================================================
    // PRINT ALL NO DATA
    // =========================================================

    if (
        isPrintAll &&
        vouchers.length === 0
    ) {

        return (

            <div className="voucher-error">

                <h3>
                    No fee vouchers found.
                </h3>


                <Button
                    icon={
                        <ArrowLeftOutlined />
                    }
                    onClick={() =>
                        window.history.back()
                    }
                >
                    Back
                </Button>

            </div>

        );

    }


    // =========================================================
    // PAGE
    // =========================================================

    return (

        <div className="voucher-page">


            {/* =================================================
                SCREEN BUTTONS
            ================================================= */}

            <div className="voucher-actions no-print">

                <Button
                    icon={
                        <ArrowLeftOutlined />
                    }
                    onClick={() =>
                        window.history.back()
                    }
                >

                    Back

                </Button>


                <Button
                    type="primary"
                    icon={
                        <PrinterOutlined />
                    }
                    onClick={() =>
                        window.print()
                    }
                >

                    {isPrintAll
                        ? "Print All Vouchers"
                        : "Print Voucher"
                    }

                </Button>

            </div>


            {/* =================================================
                VOUCHERS
            ================================================= */}

            {isPrintAll ? (

                vouchers.map(
                    (
                        currentVoucher,
                        index
                    ) => (

                        <div
                            className={
                                "fee-voucher-page all-voucher-page"
                            }
                            key={
                                currentVoucher
                                    ?.fee
                                    ?.student_fee_id ||
                                index
                            }
                        >

                            {/* STUDENT COPY */}

                            <VoucherCopy
                                voucher={
                                    currentVoucher
                                }
                                copyName={
                                    "STUDENT COPY"
                                }
                            />


                            <div className="cut-line">

                                ✂ CUT HERE

                            </div>


                            {/* SCHOOL COPY */}

                            <VoucherCopy
                                voucher={
                                    currentVoucher
                                }
                                copyName={
                                    "SCHOOL COPY"
                                }
                            />


                            <div className="cut-line">

                                ✂ CUT HERE

                            </div>


                            {/* BANK COPY */}

                            <VoucherCopy
                                voucher={
                                    currentVoucher
                                }
                                copyName={
                                    "BANK COPY"
                                }
                            />

                        </div>

                    )

                )

            ) : (

                <div className="fee-voucher-page">


                    {/* STUDENT COPY */}

                    <VoucherCopy
                        voucher={voucher}
                        copyName={
                            "STUDENT COPY"
                        }
                    />


                    <div className="cut-line">

                        ✂ CUT HERE

                    </div>


                    {/* SCHOOL COPY */}

                    <VoucherCopy
                        voucher={voucher}
                        copyName={
                            "SCHOOL COPY"
                        }
                    />


                    <div className="cut-line">

                        ✂ CUT HERE

                    </div>


                    {/* BANK COPY */}

                    <VoucherCopy
                        voucher={voucher}
                        copyName={
                            "BANK COPY"
                        }
                    />

                </div>

            )}

        </div>

    );

};


export default StudentFeeVoucher;