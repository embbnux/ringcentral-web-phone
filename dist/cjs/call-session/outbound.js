"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const request_js_1 = __importDefault(require("../sip-message/outbound/request.js"));
const index_js_1 = __importDefault(require("./index.js"));
const utils_js_1 = require("../utils.js");
class OutboundCallSession extends index_js_1.default {
    constructor(webPhone, callee) {
        super(webPhone);
        this.direction = "outbound";
        this.localPeer = `<sip:${webPhone.sipInfo.username}@${webPhone.sipInfo.domain}>;tag=${this.id}`;
        this.remotePeer = `<sip:${callee}@${webPhone.sipInfo.domain}>`;
    }
    async call(callee, callerId, options) {
        const offer = await this.rtcPeerConnection.createOffer({
            iceRestart: true,
        });
        await this.rtcPeerConnection.setLocalDescription(offer);
        // wait for ICE gathering to complete
        await new Promise((resolve) => {
            this.rtcPeerConnection.onicecandidate = (event) => {
                if (event.candidate === null) {
                    resolve(true);
                }
            };
            setTimeout(() => resolve(false), 3000);
        });
        const inviteMessage = new request_js_1.default(`INVITE sip:${callee}@${this.webPhone.sipInfo.domain} SIP/2.0`, {
            "Call-Id": this.callId,
            Contact: `<sip:${utils_js_1.fakeEmail};transport=wss>;expires=60`,
            From: this.localPeer,
            To: this.remotePeer,
            Via: `SIP/2.0/WSS ${utils_js_1.fakeDomain};branch=${(0, utils_js_1.branch)()}`,
            "Content-Type": "application/sdp",
        }, this.rtcPeerConnection.localDescription.sdp);
        if (callerId) {
            inviteMessage.headers["P-Asserted-Identity"] =
                `sip:${callerId}@${this.webPhone.sipInfo.domain}`;
        }
        if (options?.headers) {
            for (const [key, value] of Object.entries(options.headers)) {
                inviteMessage.headers[key] = value;
            }
        }
        const inboundMessage = await this.webPhone.sipClient.request(inviteMessage);
        if (inboundMessage.subject.startsWith("SIP/2.0 403 ")) {
            // for exmaple, webPhone.sipRegister(0) has been called
            return;
        }
        const proxyAuthenticate = inboundMessage.headers["Proxy-Authenticate"];
        const nonce = proxyAuthenticate.match(/, nonce="(.+?)"/)[1];
        const newMessage = inviteMessage.fork();
        newMessage.headers["Proxy-Authorization"] = (0, utils_js_1.generateAuthorization)(this.webPhone.sipInfo, nonce, "INVITE");
        const progressMessage = await this.webPhone.sipClient.request(newMessage);
        this.sipMessage = progressMessage;
        this.state = "ringing";
        this.localPeer = progressMessage.headers.From;
        this.remotePeer = progressMessage.headers.To;
        this.emit("ringing");
        // wait for the call to be answered
        // by SIP server design, this happens immediately, even if the callee has not received the INVITE
        return new Promise((resolve) => {
            const answerHandler = async (message) => {
                if (message.headers.CSeq === this.sipMessage.headers.CSeq) {
                    this.webPhone.sipClient.off("inboundMessage", answerHandler);
                    // outbound call failed, for example, invalid number
                    // or emergency address is not configured properly
                    if (message.subject !== "SIP/2.0 200 OK") {
                        this.state = "failed";
                        this.emit("failed", message.subject);
                        const index = this.webPhone.callSessions.findIndex((callSession) => callSession.callId === message.headers["Call-Id"]);
                        if (index !== -1) {
                            this.webPhone.callSessions.splice(index, 1);
                        }
                        this.dispose();
                        resolve(false);
                        return;
                    }
                    this.state = "answered";
                    this.emit("answered");
                    this.rtcPeerConnection.setRemoteDescription({
                        type: "answer",
                        sdp: message.body,
                    });
                    const ackMessage = new request_js_1.default(`ACK ${(0, utils_js_1.extractAddress)(this.remotePeer)} SIP/2.0`, {
                        "Call-Id": this.callId,
                        From: this.localPeer,
                        To: this.remotePeer,
                        Via: this.sipMessage.headers.Via,
                        CSeq: this.sipMessage.headers.CSeq.replace(" INVITE", " ACK"),
                    });
                    await this.webPhone.sipClient.reply(ackMessage);
                    resolve(true);
                }
            };
            this.webPhone.sipClient.on("inboundMessage", answerHandler);
        });
    }
    async cancel() {
        const requestMessage = new request_js_1.default(`CANCEL ${(0, utils_js_1.extractAddress)(this.remotePeer)} SIP/2.0`, {
            "Call-Id": this.callId,
            From: this.localPeer,
            To: (0, utils_js_1.withoutTag)(this.remotePeer),
            Via: this.sipMessage.headers.Via,
            CSeq: this.sipMessage.headers.CSeq.replace(" INVITE", " CANCEL"),
        });
        await this.webPhone.sipClient.request(requestMessage);
    }
}
exports.default = OutboundCallSession;
