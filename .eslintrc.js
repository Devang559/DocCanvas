module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['**/setupTests.js'],
      env: { jest: true },
    },
  ],
};
