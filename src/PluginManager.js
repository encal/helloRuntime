/**
 * Created by wzm on 5/18/15.
 */

var PluginManager = cc.Class.extend({
    anySDKAgent: null,
    userPlugin: null,
    iapPlugin: null,
    socialPlugin: null,
    sharePlugin: null,
    agent: null,
    adsPlugn: null,

    userCallback: null,
    iapCallback: null,
    socialCallback: null,
    shareCallback: null,
    callbackList: null,

    ctor: function () {
        cc.log("===> PluginManager ctor");
        this.initAnySDK();
    },

    initAnySDK: function () {
        cc.log("===> steve PluginManager initAnySDK");
        anysdk.AgentManager.getInstance().loadALLPlugin();

        cc.log("=========  break point ==========");
        this.anySDKAgent = anysdk.AgentManager.getInstance();

        //获取用户插件，用户插件，用于登录，刷洗token等用户相关的操作
        this.userPlugin = this.anySDKAgent.getUserPlugin();

        //获取支付插件，支付插件，用于游戏内支付
        this.iapPlugin = this.anySDKAgent.getIAPPlugin();

        //获取社交插件，社交插件，在腾讯模式下，主要用于获取好友列表
        this.socialPlugin = this.anySDKAgent.getSocialPlugin();

        //获取分享插件，分享插件，主要用于唤起腾讯分享的界面进行分享操作
        this.sharePlugin = this.anySDKAgent.getSharePlugin();

        //获取广告插件
        this.adsPlugn = this.anySDKAgent.getAdsPlugin();

        this.callbackList = [];

        if (this.userPlugin){
            if(g_env == RUNTIME_ENV.LIEBAO)
                this.userPlugin.setActionListener(this.onLiebaoUserResult, this);
            else
                this.userPlugin.setActionListener(this.onUserResult, this);
        }

        if (this.sharePlugin)
            this.sharePlugin.setResultListener(this.onShareResult, this);

        if (this.socialPlugin)
            this.socialPlugin.setListener(this.onSocialResult, this);

        for (var key in this.iapPlugin) {
            var iap_plugin = this.iapPlugin[key];
            iap_plugin.setResultListener(this.onPayResult, this);
        }
        cc.log("init AnySDK success");
    },

    /**
     * 设置腾讯浏览器模式下的 token
     * @param tokenObj
     */
    x5_setToken: function (tokenObj) {
        cc.log("===> PluginManager x5_setToken");
        var param = anysdk.PluginParam.create(JSON.stringify(tokenObj));
        this.userPlugin.callFuncWithParam("x5_setToken", param);
        cc.stevelog("x5_setToken: " + JSON.stringify(tokenObj));
    },

    /**
     * 腾讯浏览器模式下获取token
     * @returns {*}
     */
    x5_getToken: function () {
        var ret = null;
        var tokenJsonStr = this.userPlugin.callStringFuncWithParam("x5_getToken");
        if (tokenJsonStr != "") {
            ret = JSON.parse(tokenJsonStr);
        }
        cc.log("x5_getToken: " + ret);
        return ret;
    },

    /**
     * 腾讯浏览器模式下清除token
     * @returns {*}
     */
    x5_cleanToken: function () {
        this.x5_setToken({"qbopenid": "", "refreshToken": ""});
    },

    /**
     * 当Token有效的时候，就直接refreshToken
     * @param param
     * @param callback
     */
    x5_refreshToken: function (param, callback) {
        this.userCallback = callback;
        this.userPlugin.callFuncWithParam("x5_refreshToken", anysdk.PluginParam.create(param));
    },

    /**
     * 腾讯浏览器模式下 验证token是否有效
     * @returns {*}
     */
    x5_isTokenValid: function (token) {
        return token && token["qbopenid"] && token["refreshToken"];
    },

    sendToDesktop: function (param, cb) {
        if (cb)
            this.userCallback = cb;
        switch (g_env) {
            case RUNTIME_ENV.TENCENT:
            case RUNTIME_ENV.WANBA:
                this.userPlugin.callFuncWithParam("x5_sendToDesktop", anysdk.PluginParam.create(param));
                break;
            case RUNTIME_ENV.LIEBAO:
            case RUNTIME_ENV.BAIDU:
                this.userPlugin.callFuncWithParam("sendToDesktop", anysdk.PluginParam.create(param));
                break;
        }
    },

    /**
     * 检查登录状态
     */
    isLogined: function () {
        cc.stevelog("******"+this.userPlugin.isLogined());
        return this.userPlugin.isLogined();
    },

    /**
     * 登录
     * @param param 登录参数
     * @param callback 回调
     */
    login: function (param, callback) {
        this.userCallback = callback;

        cc.log("before login:" + JSON.stringify(param));

        switch (g_env) {
            case RUNTIME_ENV.TENCENT:
                if (this.userPlugin.isFunctionSupported("x5_login"))
                    this.userPlugin.callFuncWithParam("x5_login", anysdk.PluginParam.create(param));
                else
                    cc.log("Oops, x5_login isn't supported!");
                break;
            case RUNTIME_ENV.LIEBAO:
            case RUNTIME_ENV.BAIDU:
                if (this.userPlugin.isFunctionSupported("loginWithParams"))
                    this.userPlugin.callFuncWithParam("loginWithParams", anysdk.PluginParam.create(param));
                else
                    cc.log("Oops, loginWithParams isn't supported!");
                break;
        }
    },

    /**
     * 注销
     * @param callback 回调
     */
    logout: function(callback) {
        this.userCallback = callback;
        cc.log("logout...");

        switch (g_env){
            case RUNTIME_ENV.TENCENT:
            case RUNTIME_ENV.WANBA:
                if (this.userPlugin.isFunctionSupported("logout"))
                    this.userPlugin.callFuncWithParam("logout");
                break;
            case RUNTIME_ENV.LIEBAO:
                cc.log("liebao doesn't need to log out");
                break;
        }
    },

    /**
     * 获取用户id
     * @returns {*|string|String}
     */
    getUserID: function () {
        return this.userPlugin.getUserID();
    },

    /**
     * 唤起腾讯分享界面
     * @param param 参数
     * @param cb 回调
     */
    share: function (param, cb) {
        if (cb) this.shareCallback = cb;
        this.sharePlugin.share(param);
    },

    /**
     * 支付
     * @param param 支付参数
     * @param callback 回调
     */
    pay: function (param, callback) {
        this.iapCallback = callback;
        anysdk.ProtocolIAP.resetPayState();
        cc.log("send info is "+JSON.stringify(param));
        for (var p in this.iapPlugin) {
            var iap_plugin = this.iapPlugin[p];
            cc.log("will pay for product");
            iap_plugin.payForProduct(param);
        }
    },

    /**
     * 获取qzone的用户信息 openAPI
     * @param param
     * @param cb
     */
    getPlayZoneUserInfo: function (param, cb) {
        // TODO: 服务端 serverUrl 需要配置成自己的服务端信息
        param += "&cmd=get_playzone_userinfo";
        var serverUrl = "http://182.254.218.250:8080/tencentDemo/WanbaService?" + param;
        cc.log("serverUrl = " + serverUrl);
        var xhr = cc.loader.getXMLHttpRequest();
        var self = this;
        xhr.open("GET", serverUrl);
        xhr.onreadystatechange = function () {
            var result = null;
            if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status <= 207)) {
                var httpStatus = xhr.statusText;
                result = xhr.responseText;
                cc.log("getPlayZoneUserInfo success: response:" + result);
            } else {
                cc.log("getPlayZoneUserInfo failure, status: " + xhr.status);
            }
            if (cb) {
                cb(result);
            }
        };
        xhr.send();
    },

    /**
     * 支付item
     * @param param
     * @param cb
     */
    payByOpenAPI: function (param, cb) {
        // TODO: 服务端serverUrl需要配置成自己的服务端信息
        param += "&cmd=buy_playzone_item";
        var serverUrl = "http://182.254.218.250:8080/tencentDemo/WanbaService?" + param;
        cc.log("serverUrl = " + serverUrl);
        var req = cc.loader.getXMLHttpRequest();
        var self = this;
        req.open("GET", serverUrl);
        req.onreadystatechange = function () {
            var result = null;
            if (req.readyState == 4 && (req.status >= 200 && req.status <= 207)) {
                var httpStatus = req.statusText;
                result = req.responseText;
                cc.log("payByOpenAPI success: response:" + result);
            } else {
                cc.log("payByOpenAPI failure, status: " + req.status);
            }
            if (cb) {
                cb(result);
            }
        };
        req.send();
    },

    /**
     * 获取好友信息
     * @param callback 回调
     */
    getFriendsList: function (callback) {
        this.socialCallback = callback;
        this.socialPlugin.callFuncWithParam("getFriendsInfo");
    },
    /**
     * 打开话题圈
     */
    openTopicCircle: function () {
        this.socialPlugin.callFuncWithParam("openTopicCircle");
    },

    /**
     * 显示广告
     * @param posId
     */
    showAds: function (posId) {
        var params = {};
        if(posId)
            params["posId"] = posId + "";

        this.adsPlugn.callFuncWithParam("showAds",anysdk.PluginParam.create(params));
    },

    /**
     * 扩展接口
     * @param posId
     */
    callFuncWithParam: function (funcName, params, cb, target) {
        if (this.userPlugin.isFunctionSupported("callThirdPartyFunction") && this.userPlugin.isFunctionSupported(funcName)) {
            var cbId = Date.now() + "";
            params.funcName = funcName;
            params.cbId = cbId;
            if (cb) {
                var callback = {
                    callback: cb,
                    target: target ? target : null,
                    funcName: funcName,
                    cbId: cbId
                };
                this.callbackList.push(callback);
            }
            this.userPlugin.callFuncWithParam("callThirdPartyFunction", anysdk.PluginParam.create(params));
        } else {
            cc.log("Oops, " + funcName + " isn't supported!");
        }
    },

    /**
     * 猎豹登录回调
     * @param ret
     * @param msg
     * @param info
     */
    onLiebaoUserResult: function (plugin, ret, msg) {
        cc.log("onLiebaoUserResult:plugin=" + plugin + " ret=" + ret + ", msg=" + msg);
        if (ret == 8000) {
            this.doCallback(ret, msg);
        } else {
            if (this.userCallback) {
                this.userCallback(plugin, ret, msg);
                this.userCallback = null;
            }
        }
    },

    /**
     * 登录回调
     * @param ret
     * @param msg
     * @param info
     */
    onUserResult: function (ret, msg, info) {
        cc.log("onUserResult: ret=" + ret + ", msg=" + msg + ", info=" + info);
        if (this.userCallback) {
            this.userCallback(ret, msg, info);
            this.userCallback = null;
        }
    },

    doCallback: function (ret, msg) {
        var message = JSON.parse(msg);
        var funcName = message.funcName;
        var cbId = message.cbId;
        cc.log("do callback message.msg is " + message.msg);
        for (var i = 0; i < this.callbackList.length; i++) {
            var callback = this.callbackList[i];
            if (callback.funcName == funcName && callback.cbId == cbId) {
                if (callback.target) {
                    callback.callback.call(callback.target, ret, message.msg);
                } else {
                    callback.callback(ret, message.msg);
                }
                this.removeCallbackFromList(i);
                return;
            }
        }
    },

    removeCallbackFromList: function (index) {
        this.callbackList.splice(index, 1);
    },

    /**
     * * 支付回调
     * @param ret
     * @param msg
     * @param info
     */
    onPayResult: function (ret, msg, info) {
        cc.log("onPayResult: ret=" + ret + ", msg=" + msg + ", info=" + info);
        if (this.iapCallback) {
            this.iapCallback(ret, msg, info);
            this.iapCallback = null;
        }
    },
    /**
     * 分享回调
     * @param ret
     * @param msg
     */
    onShareResult: function (ret, msg) {
        cc.log("onShareResult: ret=" + ret + ", msg=" + msg);
        if (this.shareCallback) {
            this.shareCallback(ret, msg);
            this.shareCallback = null;
        }
    },
    /**
     * 社交回调
     * @param ret
     * @param msg
     */
    onSocialResult: function (ret, msg) {
        cc.log("onSocialResult: ret=" + ret + ", msg=" + msg);
        if (this.socialCallback) {
            this.socialCallback(ret, msg);
            this.socialCallback = null;
        }
    }
});

if (g_env != undefined){
    var _pluginManager = null;
    var pluginManager = function () {
        if (_pluginManager == null) {
            _pluginManager = new PluginManager();
        }
        return _pluginManager;
    }();
}else{
    cc.log("Alert: not runtime mode");
}
