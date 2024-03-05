function EventHandler(common) {
    this.common = common || {};
}

EventHandler.prototype.maybeSendConsentUpdateToGoogle = function (event) {
    // If consent payload is empty,
    // we never sent an initial default consent state
    // so we shouldn't send an update.
    if (this.common.consentPayloadAsString && this.common.consentMappings) {
        var eventConsentState = this.common.consentHandler.getEventConsentState(
            event.ConsentState
        );

        if (!this.common.isEmpty(eventConsentState)) {
            var updatedConsentPayload =
                this.common.consentHandler.generateConsentStatePayloadFromMappings(
                    eventConsentState,
                    this.common.consentMappings
                );

            var eventConsentAsString = JSON.stringify(updatedConsentPayload);

            if (eventConsentAsString !== this.common.consentPayloadAsString) {
                this.common.sendConsent('update', updatedConsentPayload);
                this.common.consentPayloadAsString = eventConsentAsString;
            }
        }
    }
};

EventHandler.prototype.logEvent = function (event) {
    this.maybeSendConsentUpdateToGoogle(event);
    this.common.send({
        event: event,
    });

    return true;
};

EventHandler.prototype.logError = function() {};

EventHandler.prototype.logPageView = function (event) {
    this.maybeSendConsentUpdateToGoogle(event);
    this.common.send({
        event: event,
        eventType: 'screen_view'
    });

    return true;
};

module.exports = EventHandler;
