import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Stellar Prediction Market API',
    version: '1.0.0',
    description: 'API for interacting with the Stellar Prediction Market contract',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
            example: 'Error message',
          },
        },
      },
      GenesisStartResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Genesis round started successfully',
          },
          data: {
            type: 'object',
            properties: {
              transactionHash: {
                type: 'string',
                example: 'abc123...',
              },
              epoch: {
                type: 'string',
                example: '1',
              },
            },
          },
        },
      },
      GenesisLockResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Genesis round locked successfully',
          },
          data: {
            type: 'object',
            properties: {
              transactionHash: {
                type: 'string',
                example: 'abc123...',
              },
              epoch: {
                type: 'string',
                example: '1',
              },
            },
          },
        },
      },
      RoundInfo: {
        type: 'object',
        properties: {
          epoch: {
            type: 'string',
            example: '1',
          },
          startTimestamp: {
            type: 'string',
            example: '1699999999',
          },
          lockTimestamp: {
            type: 'string',
            example: '1700000099',
          },
          closeTimestamp: {
            type: 'string',
            example: '1700000199',
          },
          lockPrice: {
            type: 'string',
            example: '1000000',
          },
          closePrice: {
            type: 'string',
            example: '1050000',
          },
          totalAmount: {
            type: 'string',
            example: '10000000000',
          },
          bullAmount: {
            type: 'string',
            example: '6000000000',
          },
          bearAmount: {
            type: 'string',
            example: '4000000000',
          },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
