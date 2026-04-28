import { SignupHandler } from "./SignupHandler";

const handler = new SignupHandler();
export const handleSignupEndpoint = handler.handleSignupEndpoint.bind(handler);
