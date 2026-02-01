// backend/src/seeders/20240101000003-seed-role-permissions.js
export default {
  async up(queryInterface) {
    // Get role IDs
    const [roles] = await queryInterface.sequelize.query(
      "SELECT id, role_name FROM roles WHERE role_name IN ('Sales Representative', 'Sales Manager', 'Administrator')"
    );

    const roleMap = {};
    roles.forEach((role) => {
      roleMap[role.role_name] = role.id;
    });

    // Get permission IDs
    const [permissions] = await queryInterface.sequelize.query(
      'SELECT id, action_code FROM permissions'
    );

    const permissionMap = {};
    permissions.forEach((perm) => {
      permissionMap[perm.action_code] = perm.id;
    });

    const rolePermissions = [];

    // Sales Representative permissions
    const salesRepPermissions = [
      'customers:create',
      'customers:read_own',
      'customers:update_own',
      'worklogs:create',
      'worklogs:read_own',
      'tasks:read_own',
      'tasks:update_status_own',
      'orders:create',
      'projects:read_own',
    ];

    salesRepPermissions.forEach((actionCode) => {
      if (permissionMap[actionCode]) {
        rolePermissions.push({
          role_id: roleMap['Sales Representative'],
          permission_id: permissionMap[actionCode],
          created_at: new Date(),
        });
      }
    });

    // Sales Manager permissions (includes all Sales Rep permissions)
    const salesManagerPermissions = [
      ...salesRepPermissions,
      'customers:read_all',
      'customers:update_all',
      'customers:delete',
      'worklogs:read_all',
      'tasks:create',
      'tasks:assign',
      'tasks:read_all',
      'campaigns:create',
      'campaigns:execute',
      'promotions:create',
      'promotions:update',
      'reports:read_all',
    ];

    salesManagerPermissions.forEach((actionCode) => {
      if (permissionMap[actionCode]) {
        rolePermissions.push({
          role_id: roleMap['Sales Manager'],
          permission_id: permissionMap[actionCode],
          created_at: new Date(),
        });
      }
    });

    // Administrator permissions (all permissions)
    permissions.forEach((perm) => {
      rolePermissions.push({
        role_id: roleMap['Administrator'],
        permission_id: perm.id,
        created_at: new Date(),
      });
    });

    await queryInterface.bulkInsert('role_permissions', rolePermissions);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('role_permissions', null, {});
  },
};
