import { SlackPostVisitHandler } from "./SlackPostVisitHandler";

const handler = new SlackPostVisitHandler();
export const handleSlackPostVisitEndpoint =
    handler.handleSlackPostVisitEndpoint.bind(handler);
