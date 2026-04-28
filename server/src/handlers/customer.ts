import { CustomerHandler } from "./CustomerHandler";

const handler = new CustomerHandler();
export const handleCustomerEndpoint = handler.handleCustomerEndpoint.bind(handler);
