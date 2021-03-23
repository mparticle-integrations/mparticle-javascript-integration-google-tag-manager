/* eslint-disable no-undef*/
describe('GoogleTagManager Forwarder', function() {
    // -------------------DO NOT EDIT ANYTHING BELOW THIS LINE-----------------------
    var MessageTypes = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            AppStateTransition: 10,
            Profile: 14,
            Commerce: 16
        },
        ReportingService = function() {
            var self = this;

            this.id = null;
            this.event = null;

            this.cb = function(forwarder, event) {
                self.id = forwarder.id;
                self.event = event;
            };

            this.reset = function() {
                this.id = null;
                this.event = null;
            };
        },
        reportService = new ReportingService();

    // -------------------DO NOT EDIT ANYTHING ABOVE THIS LINE-----------------------
    // -------------------START EDITING BELOW:-----------------------
    // -------------------mParticle stubs - Add any additional stubbing to our methods as needed-----------------------
    mParticle.getDeviceId = function() {
        return '1234567890';
    };
    mParticle.Identity = {
        getCurrentUser: function() {
            return {
                getMPID: function() {
                    return '123';
                },
                getConsentState: function() {
                    return {
                        gdpr: {}
                    };
                }
            };
        }
    };
    // -------------------START EDITING BELOW:-----------------------
    var GoogleTagManagerMockForwarder = function() {
        var self = this;

        // create properties for each type of event you want tracked, see below for examples
        this.trackCustomEventCalled = false;
        this.logPurchaseEventCalled = false;
        this.initializeCalled = false;

        this.trackCustomName = null;
        this.logPurchaseName = null;
        this.apiKey = null;
        this.appId = null;
        this.userId = null;
        this.userAttributes = {};
        this.userIdField = null;

        this.eventProperties = [];
        this.purchaseEventProperties = [];

        // stub your different methods to ensure they are being called properly
        this.initialize = function(appId, apiKey) {
            self.initializeCalled = true;
            self.apiKey = apiKey;
            self.appId = appId;
        };

        this.stubbedTrackingMethod = function(name, eventProperties) {
            self.trackCustomEventCalled = true;
            self.trackCustomName = name;
            self.eventProperties.push(eventProperties);
            // Return true to indicate event should be reported
            return true;
        };

        this.stubbedUserAttributeSettingMethod = function(userAttributes) {
            self.userId = id;
            userAttributes = userAttributes || {};
            if (Object.keys(userAttributes).length) {
                for (var key in userAttributes) {
                    if (userAttributes[key] === null) {
                        delete self.userAttributes[key];
                    } else {
                        self.userAttributes[key] = userAttributes[key];
                    }
                }
            }
        };

        this.stubbedUserLoginMethod = function(id) {
            self.userId = id;
        };
    };

    var mockDataLayer;
    var mockUser;

    before(function() {
        // mParticle.config = {
        //     workspaceToken: 'fubar',
        //     minWebviewBridgeVersion: 1
        // };
        // mParticle.init('test');
        // TODO: Should be defined at the top.
        // TODO: Find out what these are for
        // Maybe mock data?
        // mParticle.EventType = EventType;
        // mParticle.ProductActionType = ProductActionType;
        // mParticle.PromotionType = PromotionActionType;
        // mParticle.IdentityType = IdentityType;
        // mParticle.CommerceEventType = CommerceEventType;
        // mParticle.eCommerce = {};
        // mParticle.eCommerce.expandCommerceEvent = expandCommerceEvent;
    });

    beforeEach(function() {
        window.GoogleTagManagerMockForwarder = new GoogleTagManagerMockForwarder();
        // Include any specific settings that is required for initializing your SDK here
        var sdkSettings = {
            containerId: 'GTM-1138',
            // containerId: 'GTM-N6PZ7B2',
            dataLayerName: 'mparticle_data_layer'
        };
        mParticle.forwarder.init(sdkSettings, reportService.cb, true);

        mockDataLayer = window.mparticle_data_layer || [];

        mockUser = {
            getMPID: function() {
                return '8675309';
            },
            getAllUserAttributes: function() {
                return {
                    something: 'some attribute'
                };
            },
            getUserIdentities: function() {
                return {
                    userIdentities: {
                        customerid: '2324',
                        email: 'testuser@mparticle.com'
                    }
                };
            }
        };
    });

    afterEach(function() {
        window = {};
        window.mparticle_data_layer = [];
        mParticle.forwarders = [];
    });

    describe('Basic Events', function() {
        it('should log event', function(done) {
            mParticle.forwarder.process({
                EventDataType: MessageTypes.PageEvent,
                EventName: 'Test Event',
                EventAttributes: {
                    label: 'label',
                    value: 200,
                    category: 'category'
                }
            });

            var expectedEvent = {
                event: 'Test Event',
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'Test Event',
                        type: 'custom_event',
                        attributes: {
                            label: 'label',
                            value: 200,
                            category: 'category'
                        }
                    },
                    user: {
                        mpid: '',
                        attributes: {},
                        identities: {},
                        consent_state: {
                            gdpr: {}
                        }
                    }
                }
            };

            mockDataLayer.length.should.equal(1);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });

        it('should log page view', function(done) {
            mParticle.forwarder.process({
                EventDataType: MessageTypes.PageView,
                EventName: 'Test PageView',
                EventAttributes: {
                    attr1: 'test1',
                    attr2: 'test2'
                }
            });
            var expectedEvent = {
                event: 'Test PageView',
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'Test PageView',
                        type: 'screen_view',
                        attributes: {
                            attr1: 'test1',
                            attr2: 'test2'
                        }
                    },

                    user: {
                        mpid: '',
                        attributes: {},
                        identities: {},
                        consent_state: {
                            gdpr: {}
                        }
                    }
                }
            };

            mockDataLayer.length.should.equal(1);
            mockDataLayer[0].should.match(expectedEvent);

            done();
        });
    });
    describe('DataLayer', function() {
        it('should reject invalid custom dataLayer names ', function(done) {
            window.faultyForwarder = new GoogleTagManagerMockForwarder();
            // Include any specific settings that is required for initializing your SDK here
            var sdkSettings = {
                containerId: 'foo',
                dataLayerName: '$$$'
            };

            mParticle.forwarder.init(sdkSettings, reportService.cb, true);

            brokenDataLayer = window['$$$'];

            (brokenDataLayer === undefined).should.equal(true);
            done();
        });

        it('should implement a shared custom dataLayer', function(done) {
            // Expected behavior:
            // If two GTM Forwarders are sharing the same dataLayer name,
            // we should expect events to be duplicated in the dataLayer

            window.firstGTMForwarder = new GoogleTagManagerMockForwarder();
            window.secondGTMForwarder = new GoogleTagManagerMockForwarder();
            // Include any specific settings that is required for initializing your SDK here
            var sdkSettings1 = {
                containerId: 'GTM-1138',
                dataLayerName: 'shared_mock_data_layer'
            };

            var sdkSettings2 = {
                containerId: 'GTM-4311',
                dataLayerName: 'shared_mock_data_layer'
            };
            mParticle.forwarder.init(sdkSettings1, reportService.cb, true);
            mParticle.forwarder.init(sdkSettings2, reportService.cb, true);

            mParticle.forwarder.process({
                EventDataType: MessageTypes.PageEvent,
                EventName: 'Shared Event'
            });

            var expectedEvent = {
                event: 'Shared Event'
            };

            // Duplicate shared events is expected
            window.shared_mock_data_layer.should.be.defined;
            window.shared_mock_data_layer.length.should.equal(2);

            // Make sure both events are the same
            window.shared_mock_data_layer[0].should.match(expectedEvent);
            window.shared_mock_data_layer[1].should.match(expectedEvent);

            done();
        });

        it('should implement a unique dataLayer', function(done) {
            window.anotherGTMForwarder = new GoogleTagManagerMockForwarder();
            // Include any specific settings that is required for initializing your SDK here
            var sdkSettings = {
                containerId: 'GTM-1138',
                dataLayerName: 'another_mock_data_layer'
            };
            mParticle.forwarder.init(sdkSettings, reportService.cb, true);

            mParticle.forwarder.process({
                EventDataType: MessageTypes.PageEvent,
                EventName: 'Custom Event'
            });

            var expectedEvent = {
                event: 'Custom Event'
            };

            window.another_mock_data_layer.should.be.defined;
            window.another_mock_data_layer.length.should.equal(1);
            window.another_mock_data_layer[0].should.match(expectedEvent);

            done();
        });

        it('should allow multiple GTM containers', function(done) {
            window.firstGTMForwarder = new GoogleTagManagerMockForwarder();
            window.secondGTMForwarder = new GoogleTagManagerMockForwarder();
            // Include any specific settings that is required for initializing your SDK here
            var sdkSettings1 = {
                containerId: 'GTM-1138',
                dataLayerName: 'first_mock_data_layer'
            };

            var sdkSettings2 = {
                containerId: 'GTM-4311',
                dataLayerName: 'second_mock_data_layer'
            };
            mParticle.forwarder.init(sdkSettings1, reportService.cb, true);
            mParticle.forwarder.init(sdkSettings2, reportService.cb, true);

            mParticle.forwarder.process({
                EventDataType: MessageTypes.PageEvent,
                EventName: 'Shared Event'
            });

            var expectedEvent = {
                event: 'Shared Event'
            };

            window.first_mock_data_layer.should.be.defined;
            window.second_mock_data_layer.should.be.defined;

            window.first_mock_data_layer.length.should.equal(1);
            window.first_mock_data_layer[0].should.match(expectedEvent);

            window.second_mock_data_layer.length.should.equal(1);
            window.second_mock_data_layer[0].should.match(expectedEvent);

            done();
        });
    });

    describe('Identity', function() {
        it('should contain user attributes and identites', function(done) {
            var fakeEvent = {
                EventName: 'Test User Action',
                EventDataType: MessageTypes.PageEvent,
                UserAttributes: {
                    something: 'some attribute'
                },
                UserIdentities: [
                    {
                        Identity: '2324',
                        Type: 1
                    },
                    {
                        Identity: 'testuser@mparticle.com',
                        Type: 7
                    }
                ],
                EventAttributes: {
                    testable: true,
                    another_attribute: 'maybe'
                },
                DeviceId: '1234567890',
                MPID: '8675309'
            };

            var expectedEvent = {
                event: 'Test User Action',
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'Test User Action',
                        attributes: {
                            testable: true,
                            another_attribute: 'maybe'
                        }
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {
                            something: 'some attribute'
                        },
                        identities: {
                            customerid: '2324',
                            email: 'testuser@mparticle.com'
                        }
                    }
                }
            };

            mParticle.forwarder.process(fakeEvent);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);

            done();
        });

        it('should trigger login complete', function(done) {
            mParticle.forwarder.onLoginComplete(mockUser);

            var expectedEvent = {
                event: 'Login Complete',
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'Login Complete',
                        type: 'custom_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {
                            something: 'some attribute'
                        },
                        identities: {
                            customerid: '2324',
                            email: 'testuser@mparticle.com'
                        }
                    }
                }
            };

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });

        it('should trigger logout complete', function(done) {
            mParticle.forwarder.onLogoutComplete(mockUser);

            var expectedEvent = {
                event: 'Logout Complete',
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'Logout Complete',
                        type: 'custom_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {
                            something: 'some attribute'
                        },
                        identities: {
                            customerid: '2324',
                            email: 'testuser@mparticle.com'
                        }
                    }
                }
            };

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });

        it('should trigger modify complete', function(done) {
            mParticle.forwarder.onModifyComplete(mockUser);

            var expectedEvent = {
                event: 'Modify Complete',
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'Modify Complete',
                        type: 'custom_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {
                            something: 'some attribute'
                        },
                        identities: {
                            customerid: '2324',
                            email: 'testuser@mparticle.com'
                        }
                    }
                }
            };

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });

        it('should trigger user identified', function(done) {
            mParticle.forwarder.onUserIdentified(mockUser);

            var expectedEvent = {
                event: 'User Identified',
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'User Identified',
                        type: 'custom_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {
                            something: 'some attribute'
                        },
                        identities: {
                            customerid: '2324',
                            email: 'testuser@mparticle.com'
                        }
                    }
                }
            };

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger identify complete', function(done) {
            mParticle.forwarder.onIdentifyComplete(mockUser);

            var expectedEvent = {
                event: 'Identify Complete',
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'Identify Complete',
                        type: 'custom_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {
                            something: 'some attribute'
                        },
                        identities: {
                            customerid: '2324',
                            email: 'testuser@mparticle.com'
                        }
                    }
                }
            };

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
    });
    describe('eCommerce', function() {
        it('should add custom product attributes', function (done) {
            var event = {
                EventName: 'eCommerce - AddToCart',
                EventCategory: mParticle.CommerceEventType.ProductAddToCart,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                EventAttributes: null,
                DeviceId: '1234567890',
                MPID: '8675309',
                CurrencyCode: null,
                ProductAction: {
                    ProductActionType: 1,
                    ProductList: [
                        {
                            Name: 'Some Product',
                            Sku: '12312123',
                            Price: '112.22',
                            Quantity: 1,
                            Brand: 'Omni Consumer Products',
                            Variant: 'cheaper',
                            Position: 'featured',
                            CouponCode: 'SALE2019',
                            TotalAmount: 112.22,
                            Attributes: {
                                is_personalization_available: true,
                                location: 'test_package',
                                campaign: 'test_campaign'
                            }
                        }
                    ]
                }
            };

            var expectedEvent = {
                event: 'eCommerce - AddToCart',
                ecommerce: {
                    currencyCode: 'USD',
                    add: {
                        products: [
                            {
                                name: 'Some Product',
                                id: '12312123',
                                price: '112.22',
                                quantity: 1,
                                brand: 'Omni Consumer Products',
                                variant: 'cheaper',
                                position: 'featured',
                                coupon_code: 'SALE2019',
                                total_amount: 112.22,
                                attributes: {
                                    is_personalization_available: true,
                                    location: 'test_package',
                                    campaign: 'test_campaign'
                                }
                            }
                        ]
                    }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - AddToCart',
                        type: 'commerce_event',
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };

            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger product impressions', function(done) {
            var event = {
                EventName: 'eCommerce - Impression',
                EventCategory: mParticle.CommerceEventType.ProductImpression,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [
                    {
                        Identity: '2324',
                        Type: 1
                    },
                    {
                        Identity: 'testuser@mparticle.com',
                        Type: 7
                    }
                ],
                DeviceId: '1234567890',
                MPID: '8675309',
                ProductImpressions: [
                    {
                        ProductImpressionList: 'Test Impression',
                        ProductList: [
                            {
                                Name: 'Headphones',
                                Sku: '44556',
                                Price: '12.23',
                                Quantity: 1,
                                TotalAmount: 12.23,
                                Attributes: null
                            },
                            {
                                Name: 'Pizza',
                                Sku: '809808',
                                Price: '23.00',
                                Quantity: 1,
                                TotalAmount: 23,
                                Attributes: null
                            },
                            {
                                Name: 'Drums',
                                Sku: '0202200202',
                                Price: '320.12',
                                Quantity: 1,
                                TotalAmount: 320.12,
                                Attributes: null
                            },
                            {
                                Name: 'Bass',
                                Sku: '100100101',
                                Price: '1204.02',
                                Quantity: 1,
                                TotalAmount: 1204.02,
                                Attributes: null
                            },
                            {
                                Name: 'Spaceboy',
                                Sku: '1',
                                Price: '111.11',
                                Quantity: 1,
                                TotalAmount: 111.11,
                                Attributes: null
                            }
                        ]
                    }
                ]
            };

            var expectedEvent = {
                event: 'eCommerce - Impression',
                ecommerce: {
                    currencyCode: 'USD',
                    impressions: [
                        { name: 'Headphones', id: '44556', price: '12.23' },
                        { name: 'Pizza', id: '809808', price: '23.00' },
                        { name: 'Drums', id: '0202200202', price: '320.12' },
                        { name: 'Bass', id: '100100101', price: '1204.02' },
                        { name: 'Spaceboy', id: '1', price: '111.11' }
                    ]
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - Impression',
                        type: 'commerce_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {
                            customerid: '2324',
                            email: 'testuser@mparticle.com'
                        }
                    }
                }
            };

            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger product clicks', function(done) {
            var event = {
                EventName: 'eCommerce - Click',
                EventCategory: mParticle.CommerceEventType.ProductClick,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                EventAttributes: {
                    list: 'featured'
                },
                DeviceId: '1234567890',
                MPID: '8675309',
                CurrencyCode: null,
                ProductAction: {
                    ProductActionType: 5,
                    ProductList: [
                        {
                            Name: 'Headphones',
                            Sku: '44556',
                            Price: '12.23',
                            Quantity: 8,
                            Position: 0,
                            TotalAmount: 97.84,
                            Attributes: null
                        }
                    ]
                }
            };

            var expectedEvent = {
                event: 'eCommerce - Click',
                ecommerce: {
                    click: {
                        actionField: {
                            list: 'featured'
                        },
                        products: [
                            {
                                name: 'Headphones',
                                id: '44556',
                                price: '12.23'
                            }
                        ]
                    }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - Click',
                        type: 'commerce_event',
                        attributes: {
                            list: 'featured'
                        }
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };

            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger add to cart', function(done) {
            var event = {
                EventName: 'eCommerce - AddToCart',
                EventCategory: mParticle.CommerceEventType.ProductAddToCart,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                EventAttributes: null,
                DeviceId: '1234567890',
                MPID: '8675309',
                CurrencyCode: null,
                ProductAction: {
                    ProductActionType: 1,
                    ProductList: [
                        {
                            Name: 'Some Product',
                            Sku: '12312123',
                            Price: '112.22',
                            Quantity: 1,
                            TotalAmount: 112.22,
                            Attributes: null
                        }
                    ]
                }
            };

            var expectedEvent = {
                event: 'eCommerce - AddToCart',
                ecommerce: {
                    currencyCode: 'USD',
                    add: {
                        products: [
                            {
                                name: 'Some Product',
                                id: '12312123',
                                price: '112.22'
                            }
                        ]
                    }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - AddToCart',
                        type: 'commerce_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };

            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger remove from cart', function(done) {
            var event = {
                EventName: 'eCommerce - RemoveFromCart',
                EventCategory:
                    mParticle.CommerceEventType.ProductRemoveFromCart,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                EventAttributes: null,
                DeviceId: '1234567890',
                MPID: '8675309',
                CurrencyCode: null,
                ProductAction: {
                    ProductActionType: 1,
                    ProductList: [
                        {
                            Name: 'Some Product',
                            Sku: '12312123',
                            Price: '112.22',
                            Quantity: 1,
                            TotalAmount: 112.22,
                            Attributes: null
                        }
                    ]
                }
            };

            var expectedEvent = {
                event: 'eCommerce - RemoveFromCart',
                ecommerce: {
                    currencyCode: 'USD',
                    remove: {
                        products: [
                            {
                                name: 'Some Product',
                                id: '12312123',
                                price: '112.22'
                            }
                        ]
                    }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - RemoveFromCart',
                        type: 'commerce_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };

            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger promotion impressions', function(done) {
            var event = {
                EventName: 'eCommerce - PromotionView',
                EventCategory: mParticle.CommerceEventType.PromotionView,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                DeviceId: '1234567890',
                MPID: '8675309',
                PromotionAction: {
                    PromotionActionType: mParticle.PromotionType.PromotionView,
                    PromotionList: [
                        {
                            Id: 'FREE_SHIPPING',
                            Creative: 'skyscraper',
                            Name: 'Free Shipping Promo',
                            Position: 'slot2'
                        }
                    ]
                }
            };

            var expectedEvent = {
                event: 'eCommerce - PromotionView',
                ecommerce: {
                    promoView: {
                        promotions: [
                            {
                                id: 'FREE_SHIPPING',
                                creative: 'skyscraper',
                                name: 'Free Shipping Promo',
                                position: 'slot2'
                            }
                        ]
                    }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - PromotionView',
                        type: 'commerce_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };

            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger promotion clicks', function(done) {
            var event = {
                EventName: 'eCommerce - PromotionClick',
                EventCategory: mParticle.CommerceEventType.PromotionClick,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                Store: {},
                EventAttributes: null,
                DeviceId: '1234567890',
                MPID: '8675309',
                ConsentState: null,
                PromotionAction: {
                    PromotionActionType: mParticle.PromotionType.PromotionClick,
                    PromotionList: [
                        {
                            Id: 'FREE_SHIPPING',
                            Creative: 'skyscraper',
                            Name: 'Free Shipping Promo',
                            Position: 'slot2'
                        }
                    ]
                }
            };

            var expectedEvent = {
                event: 'eCommerce - PromotionClick',
                ecommerce: {
                    promoClick: {
                        promotions: [
                            {
                                id: 'FREE_SHIPPING',
                                creative: 'skyscraper',
                                name: 'Free Shipping Promo',
                                position: 'slot2'
                            }
                        ]
                    }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - PromotionClick',
                        type: 'commerce_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };
            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger checkout with steps', function(done) {
            var event = {
                EventName: 'eCommerce - Checkout',
                EventCategory: mParticle.CommerceEventType.ProductCheckout,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                DeviceId: '1234567890',
                MPID: '8675309',
                ConsentState: null,
                CurrencyCode: null,
                ProductAction: {
                    ProductActionType: 3,
                    CheckoutStep: 13,
                    ProductList: [
                        {
                            Name: 'Headphones',
                            Sku: '44556',
                            Price: '12.23',
                            Quantity: 1,
                            TotalAmount: 12.23,
                            Attributes: null
                        },
                        {
                            Name: 'Pizza',
                            Sku: '809808',
                            Price: '23.00',
                            Quantity: 1,
                            TotalAmount: 23,
                            Attributes: null
                        },
                        {
                            Name: 'Clash Vinyl',
                            Sku: '00202001',
                            Price: '12.99',
                            Quantity: 1,
                            TotalAmount: 12.99,
                            Attributes: null
                        },
                        {
                            Name: 'Drums',
                            Sku: '0202200202',
                            Price: '320.12',
                            Quantity: 1,
                            TotalAmount: 320.12,
                            Attributes: null
                        },
                        {
                            Name: 'Bass',
                            Sku: '100100101',
                            Price: '1204.02',
                            Quantity: 1,
                            TotalAmount: 1204.02,
                            Attributes: null
                        },
                        {
                            Name: 'Spaceboy Action Figure',
                            Sku: '1',
                            Price: '111.11',
                            Quantity: 1,
                            TotalAmount: 111.11,
                            Attributes: null
                        }
                    ]
                }
            };
            var expectedEvent = {
                event: 'eCommerce - Checkout',
                ecommerce: {
                    checkout: {
                        actionField: {
                            step: 13
                        },
                        products: [
                            {
                                name: 'Headphones',
                                id: '44556',
                                price: '12.23'
                            },
                            {
                                name: 'Pizza',
                                id: '809808',
                                price: '23.00'
                            },
                            {
                                name: 'Clash Vinyl',
                                id: '00202001',
                                price: '12.99'
                            },
                            {
                                name: 'Drums',
                                id: '0202200202',
                                price: '320.12'
                            },
                            {
                                name: 'Bass',
                                id: '100100101',
                                price: '1204.02'
                            },
                            {
                                name: 'Spaceboy Action Figure',
                                id: '1',
                                price: '111.11'
                            }
                        ]
                    }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - Checkout',
                        type: 'commerce_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };
            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger checkout with options', function (done) {
            var event = {
                EventName: 'eCommerce - CheckoutOption',
                EventCategory: mParticle.CommerceEventType.ProductCheckoutOption,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                DeviceId: '1234567890',
                MPID: '8675309',
                ConsentState: null,
                CurrencyCode: null,
                ProductAction: {
                    ProductActionType: 4,
                    CheckoutStep: 42,
                    CheckoutOptions: 'salmon mousse',
                    ProductList: [
                        {
                            Name: 'Headphones',
                            Sku: '44556',
                            Price: '12.23',
                            Quantity: 1,
                            TotalAmount: 12.23,
                            Attributes: null
                        },
                        {
                            Name: 'Pizza',
                            Sku: '809808',
                            Price: '23.00',
                            Quantity: 1,
                            TotalAmount: 23,
                            Attributes: null
                        },
                        {
                            Name: 'Clash Vinyl',
                            Sku: '00202001',
                            Price: '12.99',
                            Quantity: 1,
                            TotalAmount: 12.99,
                            Attributes: null
                        },
                        {
                            Name: 'Drums',
                            Sku: '0202200202',
                            Price: '320.12',
                            Quantity: 1,
                            TotalAmount: 320.12,
                            Attributes: null
                        },
                        {
                            Name: 'Bass',
                            Sku: '100100101',
                            Price: '1204.02',
                            Quantity: 1,
                            TotalAmount: 1204.02,
                            Attributes: null
                        },
                        {
                            Name: 'Spaceboy Action Figure',
                            Sku: '1',
                            Price: '111.11',
                            Quantity: 1,
                            TotalAmount: 111.11,
                            Attributes: null
                        }
                    ]
                }
            };
            var expectedEvent = {
                event: 'eCommerce - CheckoutOption',
                ecommerce: {
                    checkout_option: {
                        actionField: {
                            step: 42,
                            option: 'salmon mousse'
                        },
                        products: [
                            {
                                name: 'Headphones',
                                id: '44556',
                                price: '12.23'
                            },
                            {
                                name: 'Pizza',
                                id: '809808',
                                price: '23.00'
                            },
                            {
                                name: 'Clash Vinyl',
                                id: '00202001',
                                price: '12.99'
                            },
                            {
                                name: 'Drums',
                                id: '0202200202',
                                price: '320.12'
                            },
                            {
                                name: 'Bass',
                                id: '100100101',
                                price: '1204.02'
                            },
                            {
                                name: 'Spaceboy Action Figure',
                                id: '1',
                                price: '111.11'
                            }
                        ]
                    }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - CheckoutOption',
                        type: 'commerce_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };

            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger purchases', function(done) {
            var event = {
                EventName: 'eCommerce - Purchase',
                EventCategory: mParticle.CommerceEventType.ProductPurchase,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                EventAttributes: null,
                DeviceId: '1234567890',
                MPID: '8675309',
                ConsentState: null,
                CurrencyCode: null,
                ProductAction: {
                    ProductActionType: 7,
                    ProductList: [
                        {
                            Name: 'Headphones',
                            Sku: '44556',
                            Price: '12.23',
                            Quantity: 1,
                            TotalAmount: 12.23,
                            Attributes: null
                        },
                        {
                            Name: 'Pizza',
                            Sku: '809808',
                            Price: '23.00',
                            Quantity: 1,
                            TotalAmount: 23,
                            Attributes: null
                        },
                        {
                            Name: 'Clash',
                            Sku: '00202001',
                            Price: '12.99',
                            Quantity: 1,
                            TotalAmount: 12.99,
                            Attributes: null
                        },
                        {
                            Name: 'Drums',
                            Sku: '200202',
                            Price: '320.12',
                            Quantity: 1,
                            TotalAmount: 320.12,
                            Attributes: null
                        },
                        {
                            Name: 'Bass',
                            Sku: '100100101',
                            Price: '1204.02',
                            Quantity: 1,
                            TotalAmount: 1204.02,
                            Attributes: null
                        },
                        {
                            Name: 'Spaceboy',
                            Sku: '1',
                            Price: '111.11',
                            Quantity: 1,
                            TotalAmount: 111.11,
                            Attributes: null
                        }
                    ],
                    TransactionId: 'T12345',
                    Affiliation: 'Online Store',
                    CouponCode: 'SUMMER_SALE',
                    TotalAmount: '35.43',
                    ShippingAmount: '5.99',
                    TaxAmount: '4.90'
                }
            };
            var expectedEvent = {
                event: 'eCommerce - Purchase',
                ecommerce: {
                    purchase: {
                        actionField: {
                            id: 'T12345',
                            affiliation: 'Online Store',
                            revenue: '35.43',
                            tax: '4.90',
                            shipping: '5.99',
                            coupon: 'SUMMER_SALE'
                        },
                        products: [
                            { name: 'Headphones', id: '44556', price: '12.23' },
                            { name: 'Pizza', id: '809808', price: '23.00' },
                            { name: 'Clash', id: '00202001', price: '12.99' },
                            { name: 'Drums', id: '200202', price: '320.12' },
                            { name: 'Bass', id: '100100101', price: '1204.02' },
                            { name: 'Spaceboy', id: '1', price: '111.11' }
                        ]
                    }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - Purchase',
                        type: 'commerce_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };
            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger full refunds', function(done) {
            var event = {
                EventName: 'eCommerce - Refund',
                EventCategory: mParticle.CommerceEventType.ProductRefund,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                EventAttributes: null,
                DeviceId: '1234567890',
                MPID: '8675309',
                ConsentState: null,
                CurrencyCode: null,
                ProductAction: {
                    ProductActionType: 8,
                    ProductList: [],
                    TransactionId: 'T12345'
                }
            };
            var expectedEvent = {
                event: 'eCommerce - Refund',
                ecommerce: {
                    refund: { actionField: { id: 'T12345' }, products: [] }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - Refund',
                        type: 'commerce_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };
            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
        it('should trigger partial refunds', function(done) {
            var event = {
                EventName: 'eCommerce - Refund',
                EventCategory: mParticle.CommerceEventType.ProductRefund,
                EventDataType: MessageTypes.Commerce,
                UserAttributes: {},
                UserIdentities: [],
                EventAttributes: null,
                DeviceId: '1234567890',
                MPID: '8675309',
                ConsentState: null,
                CurrencyCode: null,
                ProductAction: {
                    ProductActionType: 8,
                    ProductList: [
                        {
                            Name: 'Headphones',
                            Sku: '44556',
                            Price: '12.23',
                            Quantity: 1,
                            TotalAmount: 12.23,
                            Attributes: null
                        },
                        {
                            Name: 'Pizza',
                            Sku: '809808',
                            Price: '23.00',
                            Quantity: 1,
                            TotalAmount: 23,
                            Attributes: null
                        },
                        {
                            Name: 'Clash Vinyl',
                            Sku: '00202001',
                            Price: '12.99',
                            Quantity: 1,
                            TotalAmount: 12.99,
                            Attributes: null
                        }
                    ],
                    TransactionId: 'T12345'
                }
            };
            var expectedEvent = {
                event: 'eCommerce - Refund',
                ecommerce: {
                    refund: {
                        actionField: { id: 'T12345' },
                        products: [
                            { name: 'Headphones', id: '44556', price: '12.23' },
                            { name: 'Pizza', id: '809808', price: '23.00' },
                            {
                                name: 'Clash Vinyl',
                                id: '00202001',
                                price: '12.99'
                            }
                        ]
                    }
                },
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'eCommerce - Refund',
                        type: 'commerce_event',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        consent_state: {
                            gdpr: {}
                        },
                        attributes: {},
                        identities: {}
                    }
                }
            };

            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
    });
    describe('Consent', function() {
        it('should consolidate consent information', function(done) {
            var event = {
                EventName: 'Test User Action',
                EventDataType: MessageTypes.PageEvent,
                UserAttributes: {},
                UserIdentities: [],
                EventAttributes: null,
                DeviceId: '1234567890',
                MPID: '8675309',
                ConsentState: {
                    getGDPRConsentState: function() {
                        return {
                            some_consent: {
                                Consented: true,
                                Timestamp: 1557935884509,
                                ConsentDocument: 'fake_consent_document',
                                Location: 'This is fake',
                                HardwareId: '123456'
                            }
                        };
                    }
                }
            };
            var expectedEvent = {
                event: 'Test User Action',
                mp_data: {
                    device_application_stamp: '1234567890',
                    event: {
                        name: 'Test User Action',
                        attributes: {}
                    },
                    user: {
                        mpid: '8675309',
                        attributes: {},
                        identities: [],
                        consent_state: {
                            gdpr: {
                                some_consent: {
                                    Consented: true,
                                    Timestamp: 1557935884509,
                                    ConsentDocument: 'fake_consent_document',
                                    Location: 'This is fake',
                                    HardwareId: '123456'
                                }
                            }
                        }
                    }
                }
            };

            mParticle.forwarder.process(event);

            mockDataLayer.length.should.greaterThan(0);
            mockDataLayer[0].should.match(expectedEvent);
            done();
        });
    });
});
