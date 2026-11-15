import { Request } from "express";
import { totalmem } from "node:os";

interface BuildQueryOptions {
  userId: Number;
  allowSortFields: string[];
  dateField?: "created_at" | "date";
}

export function buildListQuery(req: Request, options: BuildQueryOptions) {
  const { userId, allowSortFields, dateField = "created_at" } = options;

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const requestedSort = req.query.sortBy as string;
  const sortBy = allowSortFields.includes(requestedSort)
    ? requestedSort
    : "created_at";
  const order =
    (req.query.order as string)?.toLowerCase() === "asc" ? "asc" : "desc";

  const where: any = {
    user_id: userId,
  };

  if (req.query.categoryId) {
    where.categoryId = Number(req.query.categoryId);
  }

  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;

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

export function formatPaginationResponse<T>(
  data: T[],
  totalItems: number,
  page: number,
  limit: number,
) {
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
