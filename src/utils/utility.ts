interface PaginationOutput {
    totalItems: number;
    currentCount: number;
    itemsPerPage: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    totalPages: number;
}

export const setPaginationData = (
    totalCount: number,
    itemsPerPage: number,
    currentCount: number,
    currentPage: number,
): PaginationOutput => {
    const hasMoreItems = (totalCount || 0) - (itemsPerPage || 0) * (currentPage || 0);
    const totalPages = Math.ceil((totalCount || 0) / (itemsPerPage || 0)) || 0;

    const paginateObj: PaginationOutput = {
        totalItems: totalCount || 0,
        currentCount: currentCount || 0,
        itemsPerPage: itemsPerPage || 0,
        currentPage: currentPage || 0,
        hasNextPage: hasMoreItems > 0,
        hasPreviousPage: currentPage > 1,
        totalPages: totalPages,
    };
    return paginateObj;
};

export const toFloat = (value: any): number => {
    if (value === undefined || value === 0) {
        return 0;
    }

    const parsedValue = parseFloat(value);

    // Check if the parsed value is a valid number
    if (isNaN(parsedValue)) {
        return 0;
    }

    return parsedValue;
};

export const isEmptyString = (value: any): boolean => {
    return typeof value === 'string' && value.trim() === '';
};
