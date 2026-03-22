import { describe, expect, test } from 'bun:test';
import { Op } from 'sequelize';
import {
  conditionFromProductFilterToken,
  parseProductFiltersQuery,
  parseProductListOrder,
  whereFragmentsFromProductFilters,
} from './productFilter.utils.js';

describe('parseProductFiltersQuery', () => {
  test('empty', () => {
    expect(parseProductFiltersQuery(undefined)).toEqual([]);
    expect(parseProductFiltersQuery('')).toEqual([]);
  });
  test('valid JSON array', () => {
    const raw =
      '[{"key":"productName","operator":"contains","value":"book"},{"key":"price","operator":">","value":"1000"}]';
    expect(parseProductFiltersQuery(raw)).toEqual([
      { key: 'productName', operator: 'contains', value: 'book' },
      { key: 'price', operator: '>', value: '1000' },
    ]);
  });
  test('invalid JSON', () => {
    expect(parseProductFiltersQuery('not-json')).toEqual([]);
  });
});

describe('conditionFromProductFilterToken', () => {
  test('productName contains', () => {
    const c = conditionFromProductFilterToken({
      key: 'productName',
      operator: 'contains',
      value: 'test',
    });
    expect(c).toBeTruthy();
    expect(c).toHaveProperty('productName');
  });
  test('price comparison', () => {
    const c = conditionFromProductFilterToken({
      key: 'price',
      operator: '>=',
      value: '50000',
    });
    expect(c).toEqual({ price: { [Op.gte]: 50000 } });
  });
});

describe('whereFragmentsFromProductFilters', () => {
  test('skips invalid tokens', () => {
    const frags = whereFragmentsFromProductFilters([
      { key: 'price', operator: '=', value: 'bad' },
      { key: 'price', operator: '=', value: '100' },
    ]);
    expect(frags.length).toBe(1);
  });
});

describe('parseProductListOrder', () => {
  test('defaults to createdAt desc', () => {
    expect(parseProductListOrder({})).toEqual([['createdAt', 'DESC']]);
  });
  test('whitelisted field', () => {
    expect(parseProductListOrder({ sortBy: 'price', sortOrder: 'asc' })).toEqual([['price', 'ASC']]);
  });
  test('rejects unknown field', () => {
    expect(parseProductListOrder({ sortBy: 'hacked', sortOrder: 'asc' })).toEqual([['createdAt', 'DESC']]);
  });
});
