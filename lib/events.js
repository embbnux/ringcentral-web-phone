"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Events = void 0;
/** @ignore */
exports.Events = {
    Transport: {
        Connecting: 'connecting',
        Connected: 'connected',
        Disconnecting: 'disconnecting',
        Disconnected: 'disconnected',
        ConnectionAttemptFailure: 'wsConnectionError',
        ConnectionFailure: 'transportError',
        SwitchBackToMainProxy: 'switchBackProxy',
        Closed: 'closed'
    },
    UserAgent: {
        Registered: 'registered',
        Unregistered: 'unregistered',
        RegistrationFailed: 'registrationFailed',
        InviteSent: 'inviteSent',
        Invite: 'invite',
        ProvisionUpdate: 'provisionUpdate',
        Started: 'started',
        Stopped: 'stopped'
    },
    Session: {
        Accepted: 'accepted',
        Progress: 'progress',
        Muted: 'muted',
        Unmuted: 'unmuted',
        Establishing: 'establishing',
        Established: 'established',
        Terminating: 'terminating',
        Terminated: 'terminated',
        UpdateReceived: 'updateReceived',
        MoveToRcv: 'moveToRcv',
        QOSPublished: 'qos-published',
        RTPStat: 'rtpStat',
        UserMediaFailed: 'userMediaFailed'
    }
};
//# sourceMappingURL=events.js.map