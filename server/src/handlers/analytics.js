require('ts-node').register({
    project: require('path').join(__dirname, '../../tsconfig.json'),
    transpileOnly: true,
});

const { AnalyticsHandler } = require('./AnalyticsHandler');
const handler = new AnalyticsHandler();

exports.handleAnalyticsEndpoint = handler.handleAnalyticsEndpoint.bind(handler);
