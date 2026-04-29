import { ReferenceDataHandler } from "./ReferenceDataHandler";

const handler = new ReferenceDataHandler();
export const handleReferenceDataEndpoint =
    handler.handleReferenceDataEndpoint.bind(handler);
