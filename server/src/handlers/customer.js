require('ts-node').register({
    project: require('path').join(__dirname, '../../tsconfig.json'),
    transpileOnly: true,
});

const { CustomerHandler } = require('./CustomerHandler');
const handler = new CustomerHandler();

exports.handleCustomerEndpoint = handler.handleCustomerEndpoint.bind(handler);
