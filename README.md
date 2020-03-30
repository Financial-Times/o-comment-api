# o-comment-api [![Build Status](https://travis-ci.org/Financial-Times/o-comment-api.svg?branch=master)](https://travis-ci.org/Financial-Times/o-comment-api)

**Deprecated: See [o-comments](https://github.com/Financial-Times/o-comments/).**

A JavaScript API that provides a simple abstraction of the FT's commenting APIs.

This modules communicates with backend services:

- Session User Data Service (SUDS) - Provides the authentication and metadata required to use the Livefyre comment widget. Also allows a user's preferences to be modified
- Comment Creation Service (CCS) - Allows the creation and retrieval of comments for FT content

## Contents

 * <a href="#prereq">Prerequisites</a>
 * <a href="#configuration">Global configuration</a>
     * <a href="#confdecl">Declaratively</a>
     * <a href="#confimper">Imperatively</a>
 * <a href="#api">API</a>
     * <a href="#data">Data</a>
     * <a href="#caching">Caching</a>
     * <a href="#logging">Logging</a>
 * <a href="#browser">Browser support</a>
 * <a href="#core">Core/enhanced experience</a>

## <div id="prereq"></div> Prerequisites

* Your content must either be available in the Content API or available on a blogs URL in order for commenting to work. (See Moderation for why)
* You must be on an FT.com domain or sub-domain for authentication to work


## <div id="configuration"></div> Global configuration
This module uses global configuration. These are related to Livefyre and the connection details to the backend services.

The default configuration is the production one:

```json
{
    "suds": {
        "baseUrl": "//session-user-data.webservices.ft.com",
        "endpoints": {
            "livefyre": {
                "init": "/v1/livefyre/init",
            },
            "user": {
                "updateUser": "/v1/user/updateuser",
                "getAuth": "/v1/user/getauth"
            }
        }
    },
    "ccs": {
        "baseUrl": "http://comment-creation-service.webservices.ft.com",
        "endpoints": {
            "getComments": "/v1/getComments",
            "postComment": "/v1/postComment"
        }
    },
    "cacheConfig": {
        "authBaseName": "comments-prod-auth-",
        "initBaseName": "comments-prod-init-"
    },
    "livefyre": {
        "networkName": "ft"
    }
}
```

In order to change to the settings of the TEST environment, then this configuration should be used:

```json
{
    "suds": {
        "baseUrl": "//test.session-user-data.webservices.ft.com"
    },
    "ccs": {
        "baseUrl": "http://test.comment-creation-service.webservices.ft.com"
    },
    "cacheConfig": {
        "authBaseName": "comments-test-auth-",
        "initBaseName": "comments-test-init-"
    },
    "livefyre": {
        "networkName": "ft-1"
    }
}
```


There are two ways for changing the environment:

### <div id="confdecl"></div> Declaratively
In order to change the configuration, you can add a script tag in your page source with the format in the example below:

```html
<script data-o-comment-api-config type="application/json">
    {
        "suds": {
            "baseUrl": "//test.session-user-data.webservices.ft.com"
        },
        "ccs": {
            "baseUrl": "http://test.comment-creation-service.webservices.ft.com"
        },
        "cacheConfig": {
            "authBaseName": "comments-test-auth-",
            "initBaseName": "comments-test-init-"
        },
        "livefyre": {
            "networkName": "ft-1"
        }
    }
</script>
```

This configuration will be loaded on the `o.DOMContentLoaded` event.

### <div id="confimper"></div> Imperatively
##### oCommentApi.setConfig(config)
The configuration can be changed be using the `setConfig` static method. Calling this method with an object will merge the current configuration with the object specified (deep merge, primitive type values of the same key will be overwritten).

Example:

```javascript
oCommentApi.setConfig({
    "suds": {
        "baseUrl": "//test.session-user-data.webservices.ft.com"
    },
    "ccs": {
        "baseUrl": "http://test.comment-creation-service.webservices.ft.com"
    },
    "cacheConfig": {
        "authBaseName": "comments-test-auth-",
        "initBaseName": "comments-test-init-"
    },
    "livefyre": {
        "networkName": "ft-1"
    }
});
```

*As on the event `o.DOMContentLoaded` the widgets declared in the DOM are automatically initialized, it is preferred to call this function **before** the `o.DOMContentLoaded` event is triggered.*


## <div id="api"></div> API
### <div id="data"></div> Data APIs
#### oCommentApi.api.getLivefyreInitConfig

This method communicates directly with the 'livefyre/init' endpoint of SUDS. It accepts a configuration object and a callback as paramaters. A Livefyre object is passed into the callback (both init and auth fields).

##### Configuration
###### Mandatory fields:

- elId: ID of the HTML element in which the widget should be loaded
- articleId: ID of the article, any string
- url: canonical URL of the page
- title: Title of the page

###### Optional fields:

- stream_type: livecomments, livechat, liveblog
- force: has effect in combination with cache enabled. If set to true, the data won't be readed from the cache even if a valid entry exists, but it will force the call to the backend services.
- section: Override the default mapping based on URL or CAPI with an explicit mapping. Section parameter should be a valid FT metadata term (Primary section)
- tags: Tags which will be added to the collection in Livefyre


##### Example

```javascript
oCommentApi.api.getLivefyreInitConfig({
    elId: 'dom-id',
    articleId: 'art15123',
    url: 'http://example.com/article/art15123',
    title: 'Article title'
}, function (err, data) {
    if (err) {
        throw err;
    }

    // do something with the data
});
```

##### Sample response

Successful request:

```javascript
{
    "init": {
        "app": "main",
        "articleId": "4ec7810a-797f-11e1-8fad-00144feab49a",
        "el": "livefyre-app-ft-4ec7810a-797f-11e1-8fad-00144feab49a",
        "siteId": "304428",
        "collectionMeta": "eyJhbGciOiJIUzI1NiJ9.eyJjaGVja3N1bSI6ImYyYjViZDgyNjIxMWQ1ZDg4ZmI1ZjllYWUyZTI1NDcxIiwiYXJ0aWNsZUlkIjoiNGVjNzgxMGEtNzk3Zi0xMWUxLThmYWQtMDAxNDRmZWFiNDlhIiwidGl0bGUiOiJMaXZlZnlyZSB0ZXN0IHBhZ2UgLSBGVC5jb20iLCJ1cmwiOiJodHRwOi8vd3d3LmZ0LmNvbS9jbXMvcy8wLzRlYzc4MTBhLTc5N2YtMTFlMS04ZmFkLTAwMTQ0ZmVhYjQ5YS5odG1sIiwidHlwZSI6ImxpdmVjb21tZW50cyIsInN0cmVhbV90eXBlIjoibGl2ZWNvbW1lbnRzIiwidGFncyI6WyJzZWN0aW9ucy5Db21wYW5pZXMiLCJzZWN0aW9ucy5GaW5hbmNpYWxzIiwic2VjdGlvbnMuRmluYW5jaWFsIFNlcnZpY2VzIiwic2VjdGlvbnMuVVMgXHUwMDI2IENhbmFkaWFuIENvbXBhbmllcyJdfQ.VexpwSe72aPB-CEDxiyFT4QDjFEh3PGHgkkVjiHXhXY",
        "checksum": "f2b5bd826211d5d88fb5f9eae2e25471",
        "disableAvatars":true
    },
    "auth": {
        "token": "eyJhbGciOiJIUzI1NiJ9.eyJkb21haW4iOiJmdC1pbnQtMC5meXJlLmNvIiwiZXhwaXJlcyI6MTQwMTgxMDI3NDI2MywidXNlcl9pZCI6Ijg5NDg3NDM5IiwiZGlzcGxheV9uYW1lIjoicm9saSJ9.u2ko_UkQkkFwL20RvfMnGmi9ZPXxsnUuxWH5MnAoeyI",
        "expires": 1401810274263,
        "displayName": "pseudonym",
        "settings": {
            "emailcomments": "hourly"
            "emailreplies": "immediately"
            "emaillikes": "never"
            "emailautofollow": "off"
        }
    }
}
```


If the article based on the articleId and the article's metadata cannot be classified to an internal section of Livefyre:

```javascript
{
    "init": {
        "unclassifiedArticle": true
    }
}
```



**For examples of the auth object please see the `getUserData` method.**


For more information on the possible init fields of Livefyre, please visit: http://docs.livefyre.com/developers/reference/livefyre-js/#conv-config-object

For more information on auth tokens, please visit: http://docs.livefyre.com/developers/user-auth/remote-profiles/ and http://docs.livefyre.com/developers/getting-started/tokens/auth/

For more information on user settings, please visit: http://docs.livefyre.com/product/features/user-options/email-notifications/#UserEmailOptions and http://docs.livefyre.com/developers/user-auth/remote-profiles/#ping-for-pull



#### api.getUserData
This method gets the authentication data and user settings. This data is needed for actions that require the user to be authenticated.

##### Configuration
###### Optional fields:

- force: has effect in combination with cache enabled. If force set to true, the data won't be readed from the cache even if a valid entry exists, but it will force the call to the webservice to happen.


##### Example

Normal access, without forcing:

```javascript
oCommentApi.api.getUserData(function (err, data) {
    if (err) {
        throw err;
    }

    // do something with the data
});
```


With force set to true:

```javascript
oCommentApi.api.getUserData({
    force: true
},
function (err, data) {
    if (err) {
        throw err;
    }

    // do something with the data
});
```


##### Sample response

User is logged in, successful request:

```javascript
{
    "token": "eyJhbGciOiJIUzI1NiJ9.eyJkb21haW4iOiJmdC1pbnQtMC5meXJlLmNvIiwiZXhwaXJlcyI6MTQwMTgxMDI3NDI2MywidXNlcl9pZCI6Ijg5NDg3NDM5IiwiZGlzcGxheV9uYW1lIjoicm9saSJ9.u2ko_UkQkkFwL20RvfMnGmi9ZPXxsnUuxWH5MnAoeyI",
    "expires": 1401810274263,
    "displayName": "pseudonym",
    "settings": {
        "emailcomments": "hourly"
        "emailreplies": "immediately"
        "emaillikes": "never"
        "emailautofollow": "off"
    }
}
```


User is not logged in or the user's session is expired:

```javascript
null
```


User is logged in, but doesn't have a pseudonym set:

```javascript
{
    pseudonym: false
}
```


The authentication service that SUDS is using is down:

```javascript
{
    serviceUp: false
}
```

#### api.updateUser
Updates the user's details in both Livefyre and FT Membership systems (DAM).

##### Data needed

- pseudonym: user's display name. This name is displayed on each comment the user posts.
- emailcomments, emailreplies, emaillikes: available values that this service uses: 'never', 'immediately', 'hourly'.
- emailautofollow: available values: 'on' and 'off'.

For more details on the email options visit http://answers.livefyre.com/product/features/user-options/email-notifications/#UserEmailOptions

All fields are optional, but there should be provided at least one.

##### Example

```javascript
oCommentApi.api.updateUser({
    pseudonym: 'my name',
    emailcomments: 'hourly',
    emailreplies: 'immediately',
    emaillikes: 'never'
},
function (err, data) {
    if (err) {
        throw err;
    }

    // do something with the data
});
```


##### Sample response

Successful response:

```javascript
{
    status: "ok"
}
```


Response with an error:

```javascript
{
    status: "error",
    error: "Error message."
}
```

#### api.getComments
Gets the comments of an article together with collection ID, max event ID (used in Livefyre's system when streaming new data) and authentication data.

##### Configuration
###### Mandatory fields:

- articleId: ID of the article, any string
- url: canonical URL of the page
- title: Title of the page

###### Optional

- section: Override the default mapping based on URL or CAPI with an explicit mapping. Section parameter should be a valid FT metadata term (Primary section)
- tags: Tags which will be added to the collection in Livefyre
- stream: if streaming should be initialized automatically

##### Example

```javascript
oCommentApi.api.getComments({
    articleId: 'art15123',
    url: 'http://example.com/article/art15123',
    title: 'Article title'
}, function (err, data) {
    if (err) {
        throw err;
    }

    // do something with the data
});
```

##### Sample response

```javascript
{
    "collection": {
        "unclassified": false,
        "collectionId": "91440735",
        "lastEvent": 1411541039265900,
        "comments": [{
            "parentId": "",
            "author": {
                "displayName": "roli main",
                "tags": ["FT"],
                "type": 1
            },
            "content": "<p>comment</p>",
            "timestamp": 1411541039,
            "commentId": "216743299",
            "visibility": 1
        }],
        "totalPages": "6"
    }
}
```


##### Automatic streaming
If `stream: true` is set, the same callback will be used to generate streaming events.

The response will be in the following form:

```javascript
{
    "stream": {{streaming object}}
}
```

**For more information about the `streaming object` mentioned above, see the `Streaming` section**


#### api.postComment
This is a method with which a comment can be posted to an article's collection.

##### Configuration
###### Mandatory fields

- collectionId: ID of the collection. It can be obtained using the getComments function.
- commentBody: Content of the comment.


```javascript
oCommentApi.api.postComment({
    collectionId: 1525234,
    commentBody: "This is a comment"
}, function (err, data) {
    if (err) {
        throw err;
    }

    // do something with the data
});
```

##### Sample response

Successful response:

```javascript
{
    "success": true,
    "status": "ok",
    "code": "200",
    "invalidSession": false,
    "errorMessage": null,
    "bodyHtml": "<p>post comment</p>",
    "commentId": "215819761",
    "createdAt": 1411370210
}
```

Response with an error:

```javascript
{
    "success": false,
    "status": null,
    "code": null,
    "invalidSession": false,
    "errorMessage": "As good as it may be, you can't post the same comment twice.",
    "bodyHtml": null,
    "commentId": null,
    "createdAt": 0
}
```


#### api.deleteComment

This is a method with which a comment can be posted to an article's collection.

##### Configuration
###### Mandatory fields

- collectionId: ID of the collection. It can be obtained using the getComments function.
- commentId: ID of the comment.


```javascript
oCommentApi.api.deleteComment({
    collectionId: 1525234,
    commentId: 16482
}, function (err, data) {
    if (err) {
        throw err;
    }

    // do something with the data
});
```

##### Sample response

Successful response:

```javascript
{
    "success": true,
    "invalidSession": false,
    "errorMessage": null
}
```

Response with an error:

```javascript
{
    "success": false,
    "invalidSession": false,
    "errorMessage": "You don't have permission to delete this comment."
}
```


#### api.stream.create
If you want to get any changes in real-time, you can create a streaming channel.

In order to do that, you should call the following function:

```javascript
api.stream.create(collectionId, {
    callback: function (data) {},
    lastEventId: 5132356345234
});
```

Configuration options:
 - collectionId: ID of the Livefyre collection
 - callback: this will be called each time something happens (e.g. new comment, a comment is deleted, etc.)
 - lastEventId: the last event ID from which to fetch new events. This can be obtained by using api.getComments

*Note: For optimization purposes, if a stream already exists for a given collectionId, that stream will be reused, and the provided callback will be added to the callback list of that stream.*

*Limitation: lastEventId is not considered if a stream already exists for a given collectionId.*

#### api.stream.destroy
If a stream is not needed anymore, it can be destroyed.

```javascript
api.stream.destroy(collectionId);

api.stream.destroy(collectionId, {
    callback: existingCallbackReference
});

api.stream.destroy(collectionId, existingCallbackReference);
```

The only mandatory parameter is collectionId.
There are two possibilities:
 - a callback is specified: the callback is removed from the existing stream. If there are no more callbacks attached to the stream, the stream is terminated.
 - a callback is not specified: the stream is terminated with all the callbacks attached to it.


##### Sample responses

###### New comment

```javascript
{
    comment: {
        parentId: "1468854",
        author: {
            displayName: "user1",
            tags: ["FT"],
            type: 1
        },
        content: "<p>this is a test comment</p>",
        timestamp: 1426860385,
        commentId: "284661456",
        visibility: 1
    }
}
```

###### Comment updated

```javascript
{
    comment: {
        updated: true,
        commentId: "284661456",
        content: "<p>this is a test comment updated</p>"
    }
}
```

###### Comment deleted

```javascript
{
    comment: {
        deleted: true,
        commentId: "284661456"
    }
}
```

###### Posting new comments enabled/disabled

```javascript
{
    collection: {
        commentsEnabled: true
    }
}
```


### <div id="caching"></div> Caching
An optional cache is available to store information in the browser, data like article metadata (information which is needed for Livefyre), user authentication details, Livefyre tokens. If the cache is not enabled, these information will be fetched from the backend services on each request.

#### Enable caching
In order to enable caching, you should set some module level configuration (any approach mentioned in the 'Global configuration' chapter works):

Example:

```javascript
oCommentApi.setConfig({
    "cache": true
});
```

#### Clear the cache
The cache layer uses sessionStorage API to store data. While this is cleared automatically each time the browser is closed, there could be some situations the cache should be cleared explicity.

The cache layer provides a public clear method which will delete all o-comments-api related cache entries from the sessionStorage.

```javascript
oCommentApi.cache.clear();
```

There's a possibility to clear just the auth or Livefyre init cache:

```javascript
oCommentApi.cache.clearAuth();
```

```javascript
oCommentApi.cache.clearLivefyreInit();
```

### <div id="logging"></div> Logging
Logging can be enabled for debugging purposes. It logs using the global 'console' if available (if not, nothing happens and it degrades gracefully).
By default logging is disabled.

##### oChat.enableLogging()
This method enables logging of the module.

##### oChat.disableLogging()
This method disables logging of the module.

##### oChat.setLoggingLevel(level)
This method sets the logging level. This could be a number from 0 to 4 (where 0 is debug, 4 is error), or a string from the available methods of 'console' (debug, log, info, warn, error).
Default is 3 (warn).

## <div id="browser"></div> Browser support
Works in accordance with our [support policy](https://docs.google.com/a/ft.com/document/d/1dX92MPm9ZNY2jqFidWf_E6V4S6pLkydjcPmk5F989YI/edit)

## <div id="core"></div> Core/Enhanced Experience
Works only in enhanced experience, or with the polyfill service on older browsers.
