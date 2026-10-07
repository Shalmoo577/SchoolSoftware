import axios from "axios";

const API_URL = "/api";


/* =========================================================
   NORMALIZE PAGE KEY
========================================================= */

const normalizePageKey = (value) => {

    return String(value || "")
        .trim()
        .toLowerCase();

};


/* =========================================================
   GET USER PERMISSIONS
========================================================= */

export const getUserPermissions = async (userId) => {

    try {

        const response = await axios.get(
            `${API_URL}/permissions/${userId}`
        );

        return Array.isArray(response.data)
            ? response.data
            : [];

    } catch (error) {

        console.error(
            "Permission Load Error:",
            error
        );

        return [];
    }
};


/* =========================================================
   FIND PAGE PERMISSION
========================================================= */

export const getPagePermission = (
    permissions,
    pageKey
) => {

    if (!Array.isArray(permissions)) {
        return null;
    }

    return permissions.find(
        (item) =>
            normalizePageKey(item?.page_key) ===
            normalizePageKey(pageKey)
    ) || null;
};


/* =========================================================
   VIEW
========================================================= */

export const hasViewPermission = (
    permissions,
    pageKey
) => {

    const permission =
        getPagePermission(
            permissions,
            pageKey
        );

    return (
        permission &&
        Number(permission.can_view) === 1
    );
};


/* =========================================================
   ADD
========================================================= */

export const hasAddPermission = (
    permissions,
    pageKey
) => {

    const permission =
        getPagePermission(
            permissions,
            pageKey
        );

    return (
        permission &&
        Number(permission.can_add) === 1
    );
};


/* =========================================================
   EDIT
========================================================= */

export const hasEditPermission = (
    permissions,
    pageKey
) => {

    const permission =
        getPagePermission(
            permissions,
            pageKey
        );

    return (
        permission &&
        Number(permission.can_edit) === 1
    );
};


/* =========================================================
   DELETE
========================================================= */

export const hasDeletePermission = (
    permissions,
    pageKey
) => {

    const permission =
        getPagePermission(
            permissions,
            pageKey
        );

    return (
        permission &&
        Number(permission.can_delete) === 1
    );
};


/* =========================================================
   PRINT
========================================================= */

export const hasPrintPermission = (
    permissions,
    pageKey
) => {

    const permission =
        getPagePermission(
            permissions,
            pageKey
        );

    return (
        permission &&
        Number(permission.can_print) === 1
    );
};