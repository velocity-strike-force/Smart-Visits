import { AnalyticsHandler } from "./AnalyticsHandler";

const handler = new AnalyticsHandler();
export const handleAnalyticsEndpoint = handler.handleAnalyticsEndpoint.bind(handler);
