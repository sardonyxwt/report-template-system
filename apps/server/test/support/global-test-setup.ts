const TEST_TIMEOUT = 5 * 60 * 1000;

module.exports = () => {
  jest.setTimeout(TEST_TIMEOUT);
};
