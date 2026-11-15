"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildListQuery = buildListQuery;
exports.formatPaginationResponse = formatPaginationResponse;
function buildListQuery(req, options) {
    const { userId, allowSortFields, dateField = "created_at" } = options;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const requestedSort = req.query.sortBy;
    const sortBy = allowSortFields.includes(requestedSort)
        ? requestedSort
        : "created_at";
    const order = req.query.order?.toLowerCase() === "asc" ? "asc" : "desc";
    const where = {
        user_id: userId,
    };
    if (req.query.categoryId) {
        where.categoryId = Number(req.query.categoryId);
    }
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    if (startDate || endDate) {
        where[dateField] = {};
        if (startDate) {
            where[dateField].gte = new Date(`${startDate}T00:00:00.000Z`);
        }
        if (endDate) {
            where[dateField].lte = new Date(`${endDate}T23:59:59.999Z`);
        }
    }
    return {
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        pagination: { page, limit },
    };
}
function formatPaginationResponse(data, totalItems, page, limit) {
    const totalPages = Math.ceil(totalItems / limit);
    return {
        data,
        meta: {
            totalItems,
            totalPages,
            currentPage: page,
            itemsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
}
