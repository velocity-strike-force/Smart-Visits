import { ProfileHandler } from "./ProfileHandler";

const handler = new ProfileHandler();
export const handleProfileEndpoint = handler.handleProfileEndpoint.bind(handler);
