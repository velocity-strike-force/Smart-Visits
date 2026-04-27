require('ts-node').register({
    project: require('path').join(__dirname, '../../tsconfig.json'),
    transpileOnly: true,
});

const { FeedbackHandler } = require('./FeedbackHandler');
const handler = new FeedbackHandler();

exports.handleFeedbackEndpoint = handler.handleFeedbackEndpoint.bind(handler);
