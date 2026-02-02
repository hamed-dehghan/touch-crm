// backend/src/db/migrate.js
import { Umzug, SequelizeStorage } from 'umzug';
import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import path from 'path';
import sequelize from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const umzug = new Umzug({
  migrations: {
    glob: path.join(__dirname, '../migrations/*.js'),
    resolve: ({ name, path: migrationPath }) => {
      return {
        name,
        up: async () => {
          const migration = await import(migrationPath);
          await migration.default.up(sequelize.getQueryInterface(), Sequelize);
        },
        down: async () => {
          const migration = await import(migrationPath);
          await migration.default.down(sequelize.getQueryInterface(), Sequelize);
        },
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

const command = process.argv[2];

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    switch (command) {
      case 'up':
        console.log('Running migrations...');
        const upResult = await umzug.up();
        console.log('Migrations executed:', upResult.map((m) => m.name));
        break;

      case 'down':
        console.log('Reverting last migration...');
        const downResult = await umzug.down();
        console.log('Migration reverted:', downResult.map((m) => m.name));
        break;

      case 'down:all':
        console.log('Reverting all migrations...');
        const downAllResult = await umzug.down({ to: 0 });
        console.log('Migrations reverted:', downAllResult.map((m) => m.name));
        break;

      case 'pending':
        const pending = await umzug.pending();
        console.log('Pending migrations:', pending.map((m) => m.name));
        break;

      case 'executed':
        const executed = await umzug.executed();
        console.log('Executed migrations:', executed.map((m) => m.name));
        break;

      default:
        console.log('Usage: node migrate.js [up|down|down:all|pending|executed]');
        process.exit(1);
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

run();
