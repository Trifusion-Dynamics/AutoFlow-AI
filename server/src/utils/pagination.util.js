/**
 * Pagination utilities supporting both offset-based and cursor-based pagination.
 */

// ── Offset-based pagination (existing) ──────────────────────────

export function parsePaginationParams(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  
  return { page, limit };
}

export function getPaginationMeta(total, page, limit) {
  const pages = Math.ceil(total / limit);
  
  return {
    total,
    page,
    limit,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
}

export function getPrismaSkipTake(page, limit) {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
}

// ── Cursor-based pagination (new) ───────────────────────────────

/**
 * Encode a cursor from an item's id and createdAt.
 */
export function encodeCursor(item) {
  if (!item || !item.id) return null;
  const payload = {
    id: item.id,
    createdAt: item.createdAt ? item.createdAt.toISOString() : new Date().toISOString(),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Decode a base64 cursor back to { id, createdAt }.
 */
export function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    const json = Buffer.from(cursor, 'base64').toString('utf-8');
    const parsed = JSON.parse(json);
    return {
      id: parsed.id,
      createdAt: new Date(parsed.createdAt),
    };
  } catch {
    return null;
  }
}

/**
 * Parse cursor pagination params from query string.
 * 
 * Supports: ?cursor=xxx&limit=20&direction=next
 * Falls back to offset pagination if no cursor is provided.
 */
export function parseCursorParams(query) {
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const direction = query.direction === 'prev' ? 'prev' : 'next';
  const cursor = query.cursor ? decodeCursor(query.cursor) : null;
  const useCursor = !!query.cursor;

  return { cursor, limit, direction, useCursor };
}

/**
 * Build cursor pagination meta from a result set.
 */
export function getCursorPaginationMeta(items, limit, total = null) {
  if (!items || items.length === 0) {
    return {
      total: total || 0,
      limit,
      hasNext: false,
      hasPrev: false,
      nextCursor: null,
      prevCursor: null,
    };
  }

  const hasNext = items.length === limit;
  const lastItem = items[items.length - 1];
  const firstItem = items[0];

  return {
    ...(total !== null && { total }),
    limit,
    hasNext,
    hasPrev: !!firstItem, // simplified — true if we have items
    nextCursor: hasNext ? encodeCursor(lastItem) : null,
    prevCursor: encodeCursor(firstItem),
  };
}

/**
 * Build Prisma cursor query from parsed cursor params.
 */
export function getPrismaCursorQuery(cursorParams) {
  const { cursor, limit, direction } = cursorParams;

  if (!cursor) {
    return { take: limit, orderBy: { createdAt: 'desc' } };
  }

  return {
    take: limit,
    skip: 1, // Skip the cursor item itself
    cursor: { id: cursor.id },
    orderBy: { createdAt: direction === 'prev' ? 'asc' : 'desc' },
  };
}
