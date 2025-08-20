export function mockError(initialValue: { statusCode?: number } = {}) {
  return {
    statusCode: 500,
    message: 'First error message.',
    errors: [
      {
        code: 'SyntaxError',
        message: 'First error message.',
      },
      {
        code: 'SemanticError',
        message: 'Second error message.',
      },
    ],

    ...initialValue,
  };
}
