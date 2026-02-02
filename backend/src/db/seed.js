// backend/src/db/seed.js
import { Umzug, SequelizeStorage } from 'umzug';
import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import path from 'path';
import sequelize from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const umzug = new Umzug({
  migrations: {
    glob: path.join(__dirname, '../seeders/*.js'),
    resolve: ({ name, path: seederPath }) => {
      return {
        name,
        up: async () => {
          const seeder = await import(seederPath);
          await seeder.default.up(sequelize.getQueryInterface(), Sequelize);
        },
        down: async () => {
          const seeder = await import(seederPath);
          await seeder.default.down(sequelize.getQueryInterface(), Sequelize);
        },
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'SequelizeSeedMeta' }),
  logger: console,
});

const command = process.argv[2];

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    switch (command) {
      case 'up':
        console.log('Running seeders...');
        const upResult = await umzug.up();
        console.log('Seeders executed:', upResult.map((m) => m.name));
        break;

      case 'down':
        console.log('Reverting last seeder...');
        const downResult = await umzug.down();
        console.log('Seeder reverted:', downResult.map((m) => m.name));
        break;

      case 'down:all':
        console.log('Reverting all seeders...');
        const downAllResult = await umzug.down({ to: 0 });
        console.log('Seeders reverted:', downAllResult.map((m) => m.name));
        break;

      case 'pending':
        const pending = await umzug.pending();
        console.log('Pending seeders:', pending.map((m) => m.name));
        break;

      case 'executed':
        const executed = await umzug.executed();
        console.log('Executed seeders:', executed.map((m) => m.name));
        break;

      default:
        console.log('Usage: node seed.js [up|down|down:all|pending|executed]');
        process.exit(1);
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeder error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

run();
