module.exports = {
  extends: [
    'blockabc/typescript'
  ],
  rules: {
    '@typescript-eslint/indent': [0], // a temporary fix, for decorators' indent
    '@typescript-eslint/naming-convention': [0], // a temporary fix, for api result.
  },
}
