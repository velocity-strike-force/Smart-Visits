require('ts-node').register({
    project: require('path').join(__dirname, '../../tsconfig.json'),
    transpileOnly: true,
});

const { SignupHandler } = require('./SignupHandler');
const handler = new SignupHandler();

exports.handleSignupEndpoint = handler.handleSignupEndpoint.bind(handler);
