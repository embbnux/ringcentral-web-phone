import type WebPhone from "../index.js";
import CallSession from "./index.js";
declare class OutboundCallSession extends CallSession {
    constructor(webPhone: WebPhone);
    call(callee: string, callerId?: string, options?: {
        headers?: Record<string, string>;
    }): Promise<boolean>;
    cancel(): Promise<void>;
}
export default OutboundCallSession;
