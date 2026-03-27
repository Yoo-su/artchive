import { SelectQueryBuilder } from 'typeorm';

import { BookSaleSortBy, QueryBookSaleDto } from '../dtos/query-book-sale.dto';
import { UsedBookSale } from '../entities/used-book-sale.entity';

export const applyCommonFilters = (
  queryBuilder: SelectQueryBuilder<UsedBookSale>,
  queryDto: QueryBookSaleDto,
) => {
  const { search, city, district, minPrice, maxPrice, status } = queryDto;

  if (search) {
    queryBuilder.andWhere(
      '(sale.title LIKE :search OR sale.content LIKE :search OR book.title LIKE :search OR book.author LIKE :search)',
      { search: `%${search}%` },
    );
  }

  if (city) {
    queryBuilder.andWhere('sale.city = :city', { city });
  }
  if (district) {
    queryBuilder.andWhere('sale.district = :district', { district });
  }

  if (minPrice !== undefined) {
    queryBuilder.andWhere('sale.price >= :minPrice', { minPrice });
  }
  if (maxPrice !== undefined) {
    queryBuilder.andWhere('sale.price <= :maxPrice', { maxPrice });
  }

  if (status && status.length > 0) {
    const statusArray = Array.isArray(status) ? status : [status];
    queryBuilder.andWhere('sale.status IN (:...status)', {
      status: statusArray,
    });
  }
};

export const applyLocationFilter = (
  queryBuilder: SelectQueryBuilder<UsedBookSale>,
  queryDto: QueryBookSaleDto,
) => {
  const { lat, lng, radius } = queryDto;

  if (lat && lng) {
    const searchRadius = radius || 5000;

    queryBuilder.addSelect(
      'earth_distance(ll_to_earth(:lat, :lng), ll_to_earth(sale.latitude, sale.longitude))',
      'distance',
    );

    queryBuilder.andWhere(
      'earth_distance(ll_to_earth(:lat, :lng), ll_to_earth(sale.latitude, sale.longitude)) <= :radius',
      { lat, lng, radius: searchRadius },
    );
  }
};

export const applySorting = (
  queryBuilder: SelectQueryBuilder<UsedBookSale>,
  sortBy: BookSaleSortBy,
  sortOrder: 'ASC' | 'DESC',
  lat?: number,
  lng?: number,
) => {
  if (lat && lng && sortBy === BookSaleSortBy.DISTANCE) {
    queryBuilder.orderBy('distance', 'ASC');
  } else if (sortBy !== BookSaleSortBy.DISTANCE) {
    // 기본 정렬
    queryBuilder.orderBy(`sale.${sortBy}`, sortOrder);
  }
  // 2차 정렬: ID 역순 (최신순) - 동률 처리 및 커서 기반 페이지네이션의 안정성 확보
  queryBuilder.addOrderBy('sale.id', 'DESC');
};

export interface CursorData {
  value: string | number;
  id: number;
}

export const decodeCursor = (cursor: string): CursorData => {
  try {
    const json = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(json) as CursorData;
  } catch {
    throw new Error('Invalid cursor format');
  }
};

export const encodeCursor = (data: CursorData): string => {
  return Buffer.from(JSON.stringify(data)).toString('base64');
};

export const applyCursorFilter = (
  queryBuilder: SelectQueryBuilder<UsedBookSale>,
  queryDto: QueryBookSaleDto,
) => {
  const {
    cursor,
    sortBy = BookSaleSortBy.CREATED_AT,
    sortOrder = 'DESC',
    lat,
    lng,
  } = queryDto;

  if (!cursor) return;

  const cursorData = decodeCursor(cursor);
  const { value, id } = cursorData;

  // CREATED_AT의 경우 ID 기반 비교 사용 (ID가 생성 시간 순서와 일치)
  if (sortBy === BookSaleSortBy.CREATED_AT) {
    queryBuilder.andWhere('sale.id < :cursorId', { cursorId: id });
    return;
  }

  // DISTANCE의 경우 lat/lng가 필수
  if (sortBy === BookSaleSortBy.DISTANCE) {
    if (!lat || !lng) {
      // lat/lng가 없으면 거리순 커서 사용 불가, ID 기반 fallback
      queryBuilder.andWhere('sale.id < :cursorId', { cursorId: id });
      return;
    }
    // 거리순은 전체 earth_distance 표현식 사용 (별칭이 WHERE에서 사용 불가)
    const distanceExpr =
      'earth_distance(ll_to_earth(:lat, :lng), ll_to_earth(sale.latitude, sale.longitude))';
    queryBuilder.andWhere(
      `(${distanceExpr} > :cursorValue OR (${distanceExpr} = :cursorValue AND sale.id < :cursorId))`,
      { cursorValue: value, cursorId: id, lat, lng },
    );
    return;
  }

  // PRICE 정렬
  const column = `sale.${sortBy}`;
  const operator = sortOrder === 'DESC' ? '<' : '>';

  queryBuilder.andWhere(
    `(${column} ${operator} :cursorValue OR (${column} = :cursorValue AND sale.id < :cursorId))`,
    { cursorValue: value, cursorId: id },
  );
};
