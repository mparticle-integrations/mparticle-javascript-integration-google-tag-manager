(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global['mp-google-tag-manager-kit'] = {}));
}(this, function (exports) { 'use strict';

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

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

	var common = Common;

	var ProductActionTypes = {
	    AddToCart: 10,
	    Click: 14,
	    Checkout: 12,
	    Impression: 22,
	    Purchase: 16,
	    Refund: 17,
	    RemoveFromCart: 11,
	    ViewDetail: 15
	};

	var PromotionType = {
	    PromotionClick: 19,
	    PromotionView: 18
	};

	function CommerceHandler(common) {
	    this.common = common || {};
	}
	CommerceHandler.prototype.buildAddToCart = function(event) {
	    return {
	        event: event,
	        eventType: 'commerce_event',
	        eventPayload: {
	            ecommerce: {
	                currencyCode: event.CurrencyCode || 'USD',
	                add: {
	                    products: buildProductsList(event.ProductAction.ProductList)
	                }
	            }
	        }
	    };
	};
	CommerceHandler.prototype.buildCheckout = function(event) {
	    return {
	        event: event,
	        eventType: 'commerce_event',
	        eventPayload: {
	            ecommerce: {
	                checkout: {
	                    actionField: {
	                        step: event.ProductAction.CheckoutStep,
	                        option: event.ProductAction.CheckoutOptions
	                    },
	                    products: buildProductsList(event.ProductAction.ProductList)
	                }
	            }
	        }
	    };
	};
	CommerceHandler.prototype.buildRemoveFromCart = function(event) {
	    return {
	        event: event,
	        eventType: 'commerce_event',
	        eventPayload: {
	            ecommerce: {
	                currencyCode: event.CurrencyCode || 'USD',
	                remove: {
	                    products: buildProductsList(event.ProductAction.ProductList)
	                }
	            }
	        }
	    };
	};
	CommerceHandler.prototype.buildImpression = function(event, impression) {
	    return {
	        event: event,
	        eventType: 'commerce_event',
	        eventPayload: {
	            ecommerce: {
	                currencyCode: event.CurrencyCode || 'USD',
	                impressions: buildProductsList(impression.ProductList)
	            }
	        }
	    };
	};
	CommerceHandler.prototype.buildProductClick = function(event) {
	    var actionField = {};

	    if (event.EventAttributes && event.EventAttributes.hasOwnProperty('list')) {
	        actionField['list'] = event.EventAttributes.list;
	    }

	    return {
	        event: event,
	        eventType: 'commerce_event',
	        eventPayload: {
	            ecommerce: {
	                click: {
	                    actionField: actionField,
	                    products: buildProductsList(event.ProductAction.ProductList)
	                }
	            }
	        }
	    };
	};
	CommerceHandler.prototype.buildProductViewDetail = function(event) {
	    var actionField = {};

	    if (event.EventAttributes && event.EventAttributes.hasOwnProperty('list')) {
	        actionField['list'] = event.EventAttributes.list;
	    }

	    return {
	        event: event,
	        eventType: 'commerce_event',
	        eventPayload: {
	            ecommerce: {
	                detail: {
	                    actionField: actionField,
	                    products: buildProductsList(event.ProductAction.ProductList)
	                }
	            }
	        }
	    };
	};
	CommerceHandler.prototype.buildPromoClick = function(event) {
	    return {
	        event: event,
	        eventType: 'commerce_event',
	        eventPayload: {
	            ecommerce: {
	                promoClick: {
	                    promotions: buildPromoList(
	                        event.PromotionAction.PromotionList
	                    )
	                }
	            }
	        }
	    };
	};
	CommerceHandler.prototype.buildPromoView = function(event) {
	    return {
	        event: event,
	        eventType: 'commerce_event',
	        eventPayload: {
	            ecommerce: {
	                promoView: {
	                    promotions: buildPromoList(
	                        event.PromotionAction.PromotionList
	                    )
	                }
	            }
	        }
	    };
	};
	CommerceHandler.prototype.buildPurchase = function(event) {
	    var productAction = event.ProductAction;
	    return {
	        event: event,
	        eventType: 'commerce_event',
	        eventPayload: {
	            ecommerce: {
	                purchase: {
	                    actionField: {
	                        id: productAction.TransactionId || '',
	                        affiliation: productAction.Affiliation || '',
	                        revenue: productAction.TotalAmount || '',
	                        tax: productAction.TaxAmount || '',
	                        shipping: productAction.ShippingAmount || '',
	                        coupon: productAction.CouponCode || ''
	                    },
	                    products: buildProductsList(productAction.ProductList)
	                }
	            }
	        }
	    };
	};
	CommerceHandler.prototype.buildRefund = function(event) {
	    // Full refunds don't require a product list on the GTM side
	    // Partial refunds would include the specific items being refunded
	    return {
	        event: event,
	        eventType: 'commerce_event',
	        eventPayload: {
	            ecommerce: {
	                refund: {
	                    actionField: {
	                        id: event.ProductAction.TransactionId || ''
	                    },
	                    products: buildProductsList(event.ProductAction.ProductList)
	                }
	            }
	        }
	    };
	};
	CommerceHandler.prototype.logCommerceEvent = function(event) {
	    var self = this;
	    switch (event.EventCategory) {
	        case ProductActionTypes.AddToCart:
	            var event = self.buildAddToCart(event);
	            break;
	        case ProductActionTypes.Checkout:
	            var event = self.buildCheckout(event);
	            break;
	        case ProductActionTypes.Click:
	            var event = self.buildProductClick(event);
	            break;
	        case ProductActionTypes.Impression:
	            try {
	                event.ProductImpressions.forEach(function(impression) {
	                    var impressionEvent = self.buildImpression(
	                        event,
	                        impression
	                    );
	                    self.common.send(impressionEvent);
	                });
	            } catch (error) {
	                console.log('error logging impressions', error);
	                return false;
	            }
	            return true;
	        case ProductActionTypes.Purchase:
	            var event = self.buildPurchase(event);
	            break;
	        case ProductActionTypes.Refund:
	            var event = self.buildRefund(event);
	            break;
	        case ProductActionTypes.RemoveFromCart:
	            var event = self.buildRemoveFromCart(event);
	            break;
	        case ProductActionTypes.ViewDetail:
	            var event = self.buildProductViewDetail(event);
	            break;
	        case PromotionType.PromotionClick:
	            var event = self.buildPromoClick(event);
	            break;
	        case PromotionType.PromotionView:
	            var event = self.buildPromoView(event);
	            break;
	        default:
	            console.error('Unknown Commerce Type', event);
	            return false;
	    }

	    self.common.send(event);
	    return true;
	};

	function parseProduct(_product) {
	    var product = {};

	    if (_product.Name) {
	        product.name = _product.Name;
	    }
	    if (_product.Sku) {
	        product.id = _product.Sku;
	    }
	    if (_product.Price) {
	        product.price = _product.Price;
	    }
	    if (_product.Brand) {
	        product.brand = _product.Brand;
	    }
	    if (_product.Category) {
	        product.category = _product.Category;
	    }
	    if (_product.Variant) {
	        product.variant = _product.Variant;
	    }
	    if (_product.Position) {
	        product.position = _product.Position;
	    }

	    return product;
	}

	function parsePromotion(_promotion) {
	    var promotion = {};

	    if (_promotion.Name) {
	        promotion.name = _promotion.Name;
	    }
	    if (_promotion.Id) {
	        promotion.id = _promotion.Id;
	    }
	    if (_promotion.Creative) {
	        promotion.creative = _promotion.Creative;
	    }
	    if (_promotion.Position) {
	        promotion.position = _promotion.Position;
	    }

	    return promotion;
	}

	function buildProductsList(products) {
	    var productsList = [];

	    products.forEach(function(product) {
	        productsList.push(parseProduct(product));
	    });

	    return productsList;
	}

	function buildPromoList(promotions) {
	    var promotionsList = [];

	    promotions.forEach(function(promotion) {
	        promotionsList.push(parsePromotion(promotion));
	    });

	    return promotionsList;
	}

	var commerceHandler = CommerceHandler;

	function EventHandler(common) {
	    this.common = common || {};
	}

	EventHandler.prototype.logEvent = function(event) {
	    this.common.send({
	        event: event
	    });

	    return true;
	};

	EventHandler.prototype.logError = function() {};

	EventHandler.prototype.logPageView = function(event) {
	    this.common.send({
	        event: event,
	        eventType: 'screen_view'
	    });

	    return true;
	};

	var eventHandler = EventHandler;

	/*
	The 'mParticleUser' is an object with methods get user Identities and set/get user attributes
	Partners can determine what userIds are available to use in their SDK
	Call mParticleUser.getUserIdentities() to return an object of userIdentities --> { userIdentities: {customerid: '1234', email: 'email@gmail.com'} }
	For more identity types, see http://docs.mparticle.com/developers/sdk/javascript/identity#allowed-identity-types
	Call mParticleUser.getMPID() to get mParticle ID
	For any additional methods, see http://docs.mparticle.com/developers/sdk/javascript/apidocs/classes/mParticle.Identity.getCurrentUser().html
	*/

	/*
	identityApiRequest has the schema:
	{
	  userIdentities: {
	    customerid: '123',
	    email: 'abc'
	  }
	}
	For more userIdentity types, see http://docs.mparticle.com/developers/sdk/javascript/identity#allowed-identity-types
	*/

	function IdentityHandler(common) {
	    this.common = common || {};
	}
	IdentityHandler.prototype.onUserIdentified = function(mParticleUser) {
	    this.common.send({
	        event: {
	            EventName: 'User Identified'
	        },
	        user: mParticleUser,
	    });
	};
	IdentityHandler.prototype.onIdentifyComplete = function(
	    mParticleUser,
	    identityApiRequest
	) {
	    this.common.send({
	        event: {
	            EventName: 'Identify Complete'
	        },
	        user: mParticleUser,
	    });
	};

	IdentityHandler.prototype.onLoginComplete = function(
	    mParticleUser,
	    identityApiRequest
	) {
	    this.common.send({
	        event: {
	            EventName: 'Login Complete'
	        },
	        user: mParticleUser,
	    });
	};
	IdentityHandler.prototype.onLogoutComplete = function(
	    mParticleUser,
	    identityApiRequest
	) {
	    this.common.send({
	        event: {
	            EventName: 'Logout Complete'
	        },
	        user: mParticleUser,
	    });
	};
	IdentityHandler.prototype.onModifyComplete = function(
	    mParticleUser,
	    identityApiRequest
	) {
	    this.common.send({
	        event: {
	            EventName: 'Modify Complete'
	        },
	        user: mParticleUser,
	    });
	};

	/*  In previous versions of the mParticle web SDK, setting user identities on
	    kits is only reachable via the onSetUserIdentity method below. We recommend
	    filling out `onSetUserIdentity` for maximum compatibility
	*/
	IdentityHandler.prototype.onSetUserIdentity = function(
	    forwarderSettings,
	    id,
	    type
	) {};

	var identityHandler = IdentityHandler;

	var initialization = {
	    name: 'GoogleTagManager',
	    moduleId: 140,
	    initForwarder: function(
	        settings,
	        testMode,
	        userAttributes,
	        userIdentities,
	        processEvent,
	        eventQueue,
	        isInitialized,
	        common
	    ) {
	        var containerId = sanitizeContainerId(settings.containerId);

	        if (!containerId) {
	            console.error(
	                'Container ID is not valid and is required for Google Tag Manager Integration'
	            );
	            isInitialized = false;
	            return false;
	        }

	        var includeContainer = settings.includeContainer || false;

	        var dataLayerName = sanitizeDataLayerName(settings.dataLayerName);
	        if (!dataLayerName) {
	            console.error(
	                'DataLayer Name is not valid. Please check that you have entered it correctly.'
	            );
	            isInitialized = false;
	            return false;
	        }

	        var previewUrl = sanitizePreviewUrl(settings.previewUrl);
	        if (!previewUrl && settings.previewUrl) {
	            console.warn(
	                'Invalid previewUrl detected. Please check that you have entered it correctly.'
	            );
	        }

	        common.customDataLayerName = dataLayerName;
	        window[common.customDataLayerName] =
	            window[common.customDataLayerName] || [];

	        if (testMode || !includeContainer) {
	            isInitialized = true;
	            return;
	        }

	        isInitialized = initializeContainer(
	            containerId,
	            common.customDataLayerName,
	            previewUrl
	        );
	    }
	};

	function initializeContainer(containerId, dataLayerName, previewUrl) {
	    var url = 'https://www.googletagmanager.com/gtm.js';

	    // If Settings contains previewUrl, we should tack that onto the gtm snippet
	    // so we can render the debugger and show the specific version of their tags
	    var queryParamsObj = queryParamsToObj(previewUrl);

	    if (previewUrl && queryParamsObj.id === containerId) {
	        url += '?' + parsePreviewUrl(previewUrl) + '&l=' + dataLayerName;
	    } else {
	        url += '?id=' + containerId;
	    }

	    url += '&l=' + dataLayerName;

	    loadSnippet(url, dataLayerName);

	    return true;
	}

	function loadSnippet(url, dataLayerName) {
	    window[dataLayerName].push({
	        'gtm.start': new Date().getTime(),
	        event: 'gtm.js'
	    });

	    var gTagScript = document.createElement('script');
	    gTagScript.type = 'text/javascript';
	    gTagScript.async = true;
	    gTagScript.src = url;
	    (
	        document.getElementsByTagName('head')[0] ||
	        document.getElementsByTagName('body')[0]
	    ).appendChild(gTagScript);
	}

	function parsePreviewUrl(_url) {
	    var url = _url || '';
	    return url.split('?')[1];
	}

	function queryParamsToObj(_url) {
	    var url = _url || '';
	    var queryParamsObj = {};
	    var queryParams = url.split('?');
	    if (!queryParams[1] || queryParams.length > 2) {
	        return {};
	    }

	    queryParams[1].split('&').forEach(function(paramStr) {
	        var param = paramStr.split('=');
	        queryParamsObj[param[0]] = param[1];
	    });

	    return queryParamsObj;
	}

	function sanitizeContainerId(_containerId) {
	    var containerId = _containerId || '';
	    return containerId.trim().match(/^[a-zA-Z0-9-_]+$/)
	        ? containerId.trim()
	        : '';
	}

	function sanitizeDataLayerName(_dataLayerName) {
	    var dataLayerName = _dataLayerName || '';
	    return dataLayerName.trim().match(/^[a-zA-Z0-9-_]+$/)
	        ? dataLayerName.trim()
	        : '';
	}

	function sanitizePreviewUrl(_previewUrl) {
	    var previewUrl = _previewUrl || '';
	    var regex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm;
	    return previewUrl.trim().match(regex) ? previewUrl.trim() : '';
	}

	var initialization_1 = initialization;

	var sessionHandler = {
	    onSessionStart: function(event) {},
	    onSessionEnd: function(event) {}
	};

	var sessionHandler_1 = sessionHandler;

	/*
	The 'mParticleUser' is an object with methods on it to get user Identities and set/get user attributes
	Partners can determine what userIds are available to use in their SDK
	Call mParticleUser.getUserIdentities() to return an object of userIdentities --> { userIdentities: {customerid: '1234', email: 'email@gmail.com'} }
	For more identity types, see http://docs.mparticle.com/developers/sdk/javascript/identity#allowed-identity-types
	Call mParticleUser.getMPID() to get mParticle ID
	For any additional methods, see http://docs.mparticle.com/developers/sdk/javascript/apidocs/classes/mParticle.Identity.getCurrentUser().html
	*/

	function UserAttributeHandler(common) {
	    this.common = common = {};
	}
	UserAttributeHandler.prototype.onRemoveUserAttribute = function(
	    key,
	    mParticleUser
	) {
	    this.common.send({
	        event: {
	            EventName: 'Remove User Attribute'
	        },
	        options: {
	            key: key
	        }
	    });
	};
	UserAttributeHandler.prototype.onSetUserAttribute = function(
	    key,
	    value,
	    mParticleUser
	) {
	    this.common.send({
	        event: {
	            EventName: 'Set User Attribute'
	        },
	        options: {
	            key: key,
	            value: value
	        }
	    });
	};
	UserAttributeHandler.prototype.onConsentStateUpdated = function(
	    oldState,
	    newState,
	    mParticleUser
	) {
	    this.common.send({
	        event: {
	            EventName: 'Consent State Update'
	        },
	        options: {
	            old_state: oldState,
	            new_state: newState
	        }
	    });
	};

	var userAttributeHandler = UserAttributeHandler;

	var webKitWrapper = createCommonjsModule(function (module) {
	// =============== REACH OUT TO MPARTICLE IF YOU HAVE ANY QUESTIONS ===============
	//
	//  Copyright 2018 mParticle, Inc.
	//
	//  Licensed under the Apache License, Version 2.0 (the "License");
	//  you may not use this file except in compliance with the License.
	//  You may obtain a copy of the License at
	//
	//      http://www.apache.org/licenses/LICENSE-2.0
	//
	//  Unless required by applicable law or agreed to in writing, software
	//  distributed under the License is distributed on an "AS IS" BASIS,
	//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	//  See the License for the specific language governing permissions and
	//  limitations under the License.









	(function (window) {
	    var name = initialization_1.name,
	        moduleId = initialization_1.moduleId,
	        MessageType = {
	            SessionStart: 1,
	            SessionEnd: 2,
	            PageView: 3,
	            PageEvent: 4,
	            CrashReport: 5,
	            OptOut: 6,
	            Commerce: 16
	        };

	    var constructor = function () {
	        var self = this,
	            isInitialized = false,
	            forwarderSettings,
	            reportingService,
	            eventQueue = [];

	        self.name = initialization_1.name;
	        self.moduleId = initialization_1.moduleId;
	        self.common = new common();

	        function initForwarder(settings, service, testMode, trackerId, userAttributes, userIdentities) {
	            forwarderSettings = settings;

	            if (window.mParticle.isTestEnvironment) {
	                reportingService = function() {
	                };
	            } else {
	                reportingService = service;
	            }

	            try {
	                initialization_1.initForwarder(settings, testMode, userAttributes, userIdentities, processEvent, eventQueue, isInitialized, self.common);
	                self.eventHandler = new eventHandler(self.common);
	                self.identityHandler = new identityHandler(self.common);
	                self.userAttributeHandler = new userAttributeHandler(self.common);
	                self.commerceHandler = new commerceHandler(self.common);

	                isInitialized = true;
	            } catch (e) {
	                console.log('Failed to initialize ' + name + ' - ' + e);
	            }
	        }

	        function processEvent(event) {
	            var reportEvent = false;
	            if (isInitialized) {
	                try {
	                    if (event.EventDataType === MessageType.SessionStart) {
	                        reportEvent = logSessionStart(event);
	                    } else if (event.EventDataType === MessageType.SessionEnd) {
	                        reportEvent = logSessionEnd(event);
	                    } else if (event.EventDataType === MessageType.CrashReport) {
	                        reportEvent = logError(event);
	                    } else if (event.EventDataType === MessageType.PageView) {
	                        reportEvent = logPageView(event);
	                    }
	                    else if (event.EventDataType === MessageType.Commerce) {
	                        reportEvent = logEcommerceEvent(event);
	                    }
	                    else if (event.EventDataType === MessageType.PageEvent) {
	                        reportEvent = logEvent(event);
	                    }
	                    if (reportEvent === true && reportingService) {
	                        reportingService(self, event);
	                        return 'Successfully sent to ' + name;
	                    }
	                    else {
	                        return 'Error logging event or event type not supported on forwarder ' + name;
	                    }
	                }
	                catch (e) {
	                    return 'Failed to send to ' + name + ' ' + e;
	                }
	            } else {
	                eventQueue.push(event);
	                return 'Can\'t send to forwarder ' + name + ', not initialized. Event added to queue.';
	            }
	        }

	        function logSessionStart(event) {
	            try {
	                sessionHandler_1.onSessionStart(event);
	                return true;
	            } catch (e) {
	                return {error: 'Error starting session on forwarder ' + name + '; ' + e};
	            }
	        }

	        function logSessionEnd(event) {
	            try {
	                sessionHandler_1.onSessionEnd(event);
	                return true;
	            } catch (e) {
	                return {error: 'Error ending session on forwarder ' + name + '; ' + e};
	            }
	        }

	        function logError(event) {
	            try {
	                self.eventHandler.logError(event);
	                return true;
	            } catch (e) {
	                return {error: 'Error logging error on forwarder ' + name + '; ' + e};
	            }
	        }

	        function logPageView(event) {
	            try {
	                self.eventHandler.logPageView(event);
	                return true;
	            } catch (e) {
	                return {error: 'Error logging page view on forwarder ' + name + '; ' + e};
	            }
	        }

	        function logEvent(event) {
	            try {
	                self.eventHandler.logEvent(event);
	                return true;
	            } catch (e) {
	                return {error: 'Error logging event on forwarder ' + name + '; ' + e};
	            }
	        }

	        function logEcommerceEvent(event) {
	            try {
	                self.commerceHandler.logCommerceEvent(event);
	                return true;
	            } catch (e) {
	                return {error: 'Error logging purchase event on forwarder ' + name + '; ' + e};
	            }
	        }

	        function setUserAttribute(key, value) {
	            if (isInitialized) {
	                try {
	                    self.userAttributeHandler.onSetUserAttribute(key, value, forwarderSettings);
	                    return 'Successfully set user attribute on forwarder ' + name;
	                } catch (e) {
	                    return 'Error setting user attribute on forwarder ' + name + '; ' + e;
	                }
	            } else {
	                return 'Can\'t set user attribute on forwarder ' + name + ', not initialized';
	            }
	        }

	        function removeUserAttribute(key) {
	            if (isInitialized) {
	                try {
	                    self.userAttributeHandler.onRemoveUserAttribute(key, forwarderSettings);
	                    return 'Successfully removed user attribute on forwarder ' + name;
	                } catch (e) {
	                    return 'Error removing user attribute on forwarder ' + name + '; ' + e;
	                }
	            } else {
	                return 'Can\'t remove user attribute on forwarder ' + name + ', not initialized';
	            }
	        }

	        function setUserIdentity(id, type) {
	            if (isInitialized) {
	                try {
	                    self.identityHandler.onSetUserIdentity(forwarderSettings, id, type);
	                    return 'Successfully set user Identity on forwarder ' + name;
	                } catch (e) {
	                    return 'Error removing user attribute on forwarder ' + name + '; ' + e;
	                }
	            } else {
	                return 'Can\'t call setUserIdentity on forwarder ' + name + ', not initialized';
	            }

	        }

	        function onUserIdentified(user) {
	            if (isInitialized) {
	                try {
	                    self.identityHandler.onUserIdentified(user);

	                    return 'Successfully called onUserIdentified on forwarder ' + name;
	                } catch (e) {
	                    return {error: 'Error calling onUserIdentified on forwarder ' + name + '; ' + e};
	                }
	            }
	            else {
	                return 'Can\'t set new user identities on forwader  ' + name + ', not initialized';
	            }
	        }

	        function onIdentifyComplete(user, filteredIdentityRequest) {
	            if (isInitialized) {
	                try {
	                    self.identityHandler.onIdentifyComplete(user, filteredIdentityRequest);

	                    return 'Successfully called onIdentifyComplete on forwarder ' + name;
	                } catch (e) {
	                    return {error: 'Error calling onIdentifyComplete on forwarder ' + name + '; ' + e};
	                }
	            }
	            else {
	                return 'Can\'t call onIdentifyCompleted on forwader  ' + name + ', not initialized';
	            }
	        }

	        function onLoginComplete(user, filteredIdentityRequest) {
	            if (isInitialized) {
	                try {
	                    self.identityHandler.onLoginComplete(user, filteredIdentityRequest);

	                    return 'Successfully called onLoginComplete on forwarder ' + name;
	                } catch (e) {
	                    return {error: 'Error calling onLoginComplete on forwarder ' + name + '; ' + e};
	                }
	            }
	            else {
	                return 'Can\'t call onLoginComplete on forwader  ' + name + ', not initialized';
	            }
	        }

	        function onLogoutComplete(user, filteredIdentityRequest) {
	            if (isInitialized) {
	                try {
	                    self.identityHandler.onLogoutComplete(user, filteredIdentityRequest);

	                    return 'Successfully called onLogoutComplete on forwarder ' + name;
	                } catch (e) {
	                    return {error: 'Error calling onLogoutComplete on forwarder ' + name + '; ' + e};
	                }
	            }
	            else {
	                return 'Can\'t call onLogoutComplete on forwader  ' + name + ', not initialized';
	            }
	        }

	        function onModifyComplete(user, filteredIdentityRequest) {
	            if (isInitialized) {
	                try {
	                    self.identityHandler.onModifyComplete(user, filteredIdentityRequest);

	                    return 'Successfully called onModifyComplete on forwarder ' + name;
	                } catch (e) {
	                    return {error: 'Error calling onModifyComplete on forwarder ' + name + '; ' + e};
	                }
	            }
	            else {
	                return 'Can\'t call onModifyComplete on forwader  ' + name + ', not initialized';
	            }
	        }

	        function setOptOut(isOptingOutBoolean) {
	            if (isInitialized) {
	                try {
	                    self.initialization.setOptOut(isOptingOutBoolean);

	                    return 'Successfully called setOptOut on forwarder ' + name;
	                } catch (e) {
	                    return {error: 'Error calling setOptOut on forwarder ' + name + '; ' + e};
	                }
	            }
	            else {
	                return 'Can\'t call setOptOut on forwader  ' + name + ', not initialized';
	            }
	        }

	        this.init = initForwarder;
	        this.process = processEvent;
	        this.setUserAttribute = setUserAttribute;
	        this.removeUserAttribute = removeUserAttribute;
	        this.onUserIdentified = onUserIdentified;
	        this.setUserIdentity = setUserIdentity;
	        this.onIdentifyComplete = onIdentifyComplete;
	        this.onLoginComplete = onLoginComplete;
	        this.onLogoutComplete = onLogoutComplete;
	        this.onModifyComplete = onModifyComplete;
	        this.setOptOut = setOptOut;
	    };

	    function getId() {
	        return moduleId;
	    }

	    function register(config) {
	        if (config.kits) {
	            config.kits[name] = {
	                constructor: constructor
	            };
	        }
	    }

	    if (!window || !window.mParticle || !window.mParticle.addForwarder) {
	        return;
	    }

	    window.mParticle.addForwarder({
	        name: name,
	        constructor: constructor,
	        getId: getId
	    });

	    module.exports = {
	        register: register
	    };
	})(window);
	});
	var webKitWrapper_1 = webKitWrapper.register;

	exports.default = webKitWrapper;
	exports.register = webKitWrapper_1;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
