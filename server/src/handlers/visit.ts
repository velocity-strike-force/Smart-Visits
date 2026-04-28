import { VisitHandler } from "./VisitHandler";

const handler = new VisitHandler();
export const handleVisitEndpoint = handler.handleVisitEndpoint.bind(handler);
