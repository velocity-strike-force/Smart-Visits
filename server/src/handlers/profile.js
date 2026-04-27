require('ts-node').register({
    project: require('path').join(__dirname, '../../tsconfig.json'),
    transpileOnly: true,
});

const { ProfileHandler } = require('./ProfileHandler');
const handler = new ProfileHandler();

exports.handleProfileEndpoint = handler.handleProfileEndpoint.bind(handler);
