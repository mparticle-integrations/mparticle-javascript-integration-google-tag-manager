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

module.exports = initialization;
