import { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';

interface IranCityRow {
  province: string;
  city: string;
}

/**
 * @swagger
 * /api/v1/locations/iran:
 *   get:
 *     summary: Get Iran provinces and cities as tree
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Locations fetched successfully
 */
export const getIranLocationsTree = async (_req: Request, res: Response): Promise<void> => {
  const rows = await sequelize.query<IranCityRow>(
    `
      SELECT province, city
      FROM iran_cities
      ORDER BY province ASC, city ASC
    `,
    { type: QueryTypes.SELECT }
  );

  const byProvince = new Map<string, string[]>();
  for (const row of rows) {
    const list = byProvince.get(row.province) ?? [];
    list.push(row.city);
    byProvince.set(row.province, list);
  }

  const tree = [...byProvince.entries()].map(([province, cities]) => ({
    province,
    cities,
  }));

  res.status(200).json({
    success: true,
    data: {
      locations: tree,
    },
  });
};

