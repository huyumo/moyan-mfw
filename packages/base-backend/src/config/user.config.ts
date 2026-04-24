export default () => ({
  defaultPassword: {
    type: process.env.ADMIN_DEFAULT_PASSWORD_TYPE || 'fixed',
    value: process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123',
  },
});
