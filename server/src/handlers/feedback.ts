import { FeedbackHandler } from "./FeedbackHandler";

const handler = new FeedbackHandler();
export const handleFeedbackEndpoint = handler.handleFeedbackEndpoint.bind(handler);
