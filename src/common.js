function Common() {
    this.customDataLayerName = null;
}

Common.prototype.buildMPID = function(event, user) {
    // Normally we expect event to contain the MPID, but in some cases
    // like onLoginComplete and other Identity aware functions,
    // we would need to pass in a user instead.

    var mpid = '';

    if (event && event.hasOwnProperty('MPID')) {
        mpid = event.MPID;
    } else if (user && user.hasOwnProperty('getMPID')) {
        mpid = user.getMPID();
    }

    return mpid;
};

Common.prototype.buildUserAttributes = function(event, user) {
    // Normally we expect event to contain the attributes, but in some cases
    // like onLoginComplete and other Identity aware functions,
    // we would need to pass in a user instead.
    var userAttributes = {};

    if (event && event.hasOwnProperty('UserAttributes')) {
        userAttributes = event.UserAttributes;
    } else if (user && user.hasOwnProperty('getAllUserAttributes')) {
        userAttributes = user.getAllUserAttributes();
    }

    return userAttributes;
};

Common.prototype.buildUserIdentities = function(event, user) {
    // Normally we expect event to contain the identities, but in some cases
    // like onLoginComplete and other Identity aware functions,
    // we would need to pass in a user instead.
    var userIdentities = {};

    if (event.hasOwnProperty('UserIdentities')) {
        event.UserIdentities.forEach(function(identity) {
            var identityKey = mParticle.IdentityType.getIdentityName(
                identity.Type
            );
            userIdentities[identityKey] = identity.Identity;
        });
    } else if (
        user.hasOwnProperty('getUserIdentities') &&
        user.getUserIdentities().userIdentities
    ) {
        userIdentities = user.getUserIdentities().userIdentities;
    }

    return userIdentities;
};
Common.prototype.buildConsentObject = function(event) {
    var gdpr = {};
    var consentState =
        event.ConsentState ||
        mParticle.Identity.getCurrentUser().getConsentState();

    if (
        consentState &&
        consentState.getGDPRConsentState &&
        consentState.getGDPRConsentState()
    ) {
        gdpr = consentState.getGDPRConsentState();
    }

    return {
        gdpr: gdpr
    };
};

Common.prototype.send = function(_attributes) {
    var payload = {};
    var mpData = {};
    var attributes = _attributes || {};
    var event = attributes.event || {};
    var user = attributes.user || {};

    var eventName = event.EventName || 'Custom Event';

    var mpUser = {
        mpid: this.buildMPID(event, user),
        consent_state: this.buildConsentObject(event),
        attributes: this.buildUserAttributes(event, user),
        identities: this.buildUserIdentities(event, user)
    };

    var mpEvent = {
        name: eventName,
        type: attributes.eventType || 'custom_event',
        attributes: event.EventAttributes || {}
    };

    payload.event = eventName;

    mpData = {
        device_application_stamp:
            event.DeviceId || mParticle.getDeviceId() || '',
        user: mpUser,
        event: mpEvent
    };

    payload.mp_data = mpData;

    if (attributes.eventPayload) {
        for (var payloadKey in attributes.eventPayload) {
            if (attributes.eventPayload.hasOwnProperty(payloadKey)) {
                payload[payloadKey] = attributes.eventPayload[payloadKey];
            }
        }
    }

    window[this.customDataLayerName].push(payload);
};

module.exports = Common;
