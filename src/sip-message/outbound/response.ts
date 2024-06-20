import OutboundMessage from '.';
import responseCodes from '../response-codes';
import type InboundMessage from '../inbound';

class ResponseMessage extends OutboundMessage {
  // eslint-disable-next-line max-params
  public constructor(inboundMessage: InboundMessage, responseCode: number, headers = {}, body = '') {
    super(undefined, { ...headers }, body);
    this.subject = `SIP/2.0 ${responseCode} ${responseCodes[responseCode]}`;
    const keys = ['Via', 'From', 'To', 'Call-Id', 'CSeq'];
    for (const key of keys) {
      if (inboundMessage.headers[key]) {
        this.headers[key] = inboundMessage.headers[key];
      }
    }
  }
}

export default ResponseMessage;
