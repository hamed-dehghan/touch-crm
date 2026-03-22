// backend/src/migrations/20260320000000-add-in-progress-task-status.cjs
'use strict';

module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;

    // Locate the actual enum type name PostgreSQL generated for `tasks.status`.
    const [rows] = await sequelize.query(`
      SELECT t.typname AS enum_type_name
      FROM pg_type t
      JOIN pg_attribute a ON a.atttypid = t.oid
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'tasks'
        AND a.attname = 'status'
        AND t.typtype = 'e'
        AND n.nspname = current_schema()
      LIMIT 1
    `);

    const enumTypeName = rows?.[0]?.enum_type_name;
    if (!enumTypeName) {
      throw new Error('Unable to find enum type for tasks.status');
    }

    // PostgreSQL can add new enum values, but deleting enum values is not straightforward.
    // We only add `IN_PROGRESS` if it's missing.
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = ${sequelize.escape(enumTypeName)}
            AND e.enumlabel = 'IN_PROGRESS'
        ) THEN
          EXECUTE
            'ALTER TYPE ' || quote_ident(${sequelize.escape(enumTypeName)}) || ' ADD VALUE ' || quote_literal('IN_PROGRESS');
        END IF;
      END $$;
    `);
  },

  async down() {
    // No-op: removing enum values is not supported safely in PostgreSQL.
    return Promise.resolve();
  },
};

