import { OutlookIntegrationHandler } from "./OutlookIntegrationHandler";

const handler = new OutlookIntegrationHandler();
export const handleOutlookIntegrationEndpoint =
    handler.handleOutlookIntegrationEndpoint.bind(handler);
