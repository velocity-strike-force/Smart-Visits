require('ts-node').register({
    project: require('path').join(__dirname, '../../tsconfig.json'),
    transpileOnly: true,
});

const { VisitHandler } = require('./VisitHandler');
const handler = new VisitHandler();

exports.handleVisitEndpoint = handler.handleVisitEndpoint.bind(handler);
