/**
 * Created by stevejokes on 10/23/15.
 */

winSize = cc.director.getWinSize();

var LoginLayer = cc.Layer.extend({
    sprite:null,
    ctor:function () {
        this._super();

        var size = cc.winSize;

        // title label
        var titleLabel = new cc.LabelTTF("Login", "Arial", 38);
        titleLabel.setPosition( size.width/2, size.height/2 + 200);
        this.addChild(titleLabel, 5);

        if(g_env == RUNTIME_ENV.LIEBAO){
            cc.stevelog("set liebao short cut");
            var shortCutInfo = {
                "Title": "helloRuntime",
                "DetailUrl": "http://xad.ksmobile.com/dLebVd",
                "PicUrl": "http://h5res.kx7p.com/ttgcqrt/icon120.png"
            };

            var param = {
                "value": JSON.stringify(shortCutInfo)
            };

            pluginManager.callFuncWithParam("save_shortcut_info", param, function (ret, data) {
                cc.log("save_shortcut_info" + "返回结果是：" + data);
            }.bind(this));
        }

        /**
         * - 根据不同的渠道环境启用不同的登录方式
         * 1. qq 浏览器尝试自动登录
         * 2. 玩吧使用 qZone 的信息直接登录
         * 3. 其他渠道正常显示登录按钮
         */
        switch (g_env){
            case RUNTIME_ENV.TENCENT:
                // 获取 sig info 尝试直接登陆
                this.getSigInfo();
                break;
            case RUNTIME_ENV.WANBA:
                // 玩吧直接调用登录接口，qZone 就会返回 qbopenid, qbopenkey
                this.qZoneAutoLogin();
                break;
            case RUNTIME_ENV.LIEBAO:
                if(cc.sys.localStorage.getItem("liebaoToken"))
                    this.liebaoLogin();
                else
                    this.showLoginMenu();

                break;
            case RUNTIME_ENV.BAIDU:
            case RUNTIME_ENV.SIMULATE:
                // 显示登录按钮, 让用户授权登录
                this.showLoginMenu();
                break;
        }

        return true;
    },

    showLoginMenu: function () {

        var loginItemList = [];

        switch (g_env){
            case RUNTIME_ENV.TENCENT:
                var qqLoginLabel = new cc.LabelTTF("QQ登录", "Arial", 38);
                var qqLoginItem = new cc.MenuItemLabel( qqLoginLabel, this.qqLogin, this );
                qqLoginItem.setTag(LoginActionTYPES.QQ);
                loginItemList.push(qqLoginItem);

                var wechatLoginLabel = new cc.LabelTTF("微信登录", "Arial", 38);
                var wechatLoginItem = new cc.MenuItemLabel( wechatLoginLabel, this.wechatLogin, this );
                wechatLoginItem.setTag(LoginActionTYPES.WECHAT);
                loginItemList.push(wechatLoginItem);

                break;
            case RUNTIME_ENV.LIEBAO:
                var liebaoLoginLabel = new cc.LabelTTF("猎豹登录", "Arial", 38);
                var liebaoLoginItem = new cc.MenuItemLabel( liebaoLoginLabel, this.liebaoLogin, this );
                liebaoLoginItem.setTag(LoginActionTYPES.LIEBAO);
                loginItemList.push(liebaoLoginItem);
                break;
            case RUNTIME_ENV.BAIDU:
                var baiduLoginLabel = new cc.LabelTTF("百度登录", "Arial", 38);
                var baiduLoginItem = new cc.MenuItemLabel( baiduLoginLabel, this.baiduLogin, this );
                baiduLoginItem.setTag(LoginActionTYPES.BAIDU);
                loginItemList.push(baiduLoginItem);
                break;
            case RUNTIME_ENV.WANBA:
                // 玩吧不需要玩家主动登陆
                cc.stevelog("this shouldn't happen");
                break;
            case RUNTIME_ENV.SIMULATE:
                // 模拟器跳过登录界面自动登录, 主要用于前期检查游戏是否能正常跑在 runtime 上

                var simuLoginLabel = new cc.LabelTTF("模拟器直接登录", "Arial", 38);
                var simuLoginItem = new cc.MenuItemLabel( simuLoginLabel, function () {
                    this.showGameEntry();
                }, this );
                simuLoginItem.setTag(LoginActionTYPES.DIRECT);
                loginItemList.push(simuLoginItem);
                break;
        }
        var exitLabel = new cc.LabelTTF("Exit", "Arial", 38);
        var exitItem = new cc.MenuItemLabel( exitLabel, this.exitGame, this );
        exitItem.setTag(LoginActionTYPES.DIRECT);
        loginItemList.push(exitItem);

        cc.stevelog(loginItemList);
        var menu = new cc.Menu(loginItemList);
        menu.setPosition( winSize.width/2, winSize.height/2 );
        menu.alignItemsVerticallyWithPadding(10);
        menu.setTag(MenuTag.LOGIN_MENU);
        this.addChild(menu);
        this.removeChildByTag(MenuTag.GAME_ENTRY_MENU);
    },

    /**
    * 腾讯登录流程
    * 1.去自己服务端获取appid、appsig、appsigdata三个参数做登录使用
    * 2.获取下refreshToken，判断token是否有效
    * 3.如果token有效，就直接调用refreshToken接口，避免用户多次授权登录
    * 4.如果token无效，那么调用x5登录接口，授权登录
    */
    getSigInfo: function () {
        cc.stevelog("get sigInfo");

        // TODO: 获取本地存储的 token 判断token是否有效
        var req = cc.loader.getXMLHttpRequest();
        req.open("GET", GAME_SERVER_ADDRESS + "/x5/get_login_info");
        req.onreadystatechange = function () {
            if (req.readyState == 4 && (req.status >= 200 && req.status <= 207)) {
                var httpStatus = req.statusText;
                var response = req.responseText;
                cc.log("getLoginInfo success: response:" + response);

                // 保存 sigInfo
                this.sigInfo = JSON.parse(response);

                // 获取token
                var token = pluginManager.x5_getToken();

                // 判断token是否有效
                cc.stevelog("check token");
                if (pluginManager.x5_isTokenValid(token)) {
                    cc.stevelog("token is good");

                    //token有效，调用refreshToken的方法，不需要用户进行授权登录
                    var appid = this.sigInfo["appid"];
                    var appsig = this.sigInfo["appsig"];
                    var param = {
                        "appid": appid,
                        "appsig": appsig,
                        "qbopenid": token["qbopenid"],
                        "refreshToken": token["refreshToken"]
                    };
                    pluginManager.x5_refreshToken(param, this.loginCallback.bind(this));
                } else {
                    // token无效，调用登录接口，让用户授权登录
                    cc.stevelog("token is invalid, please login");
                    this.showLoginMenu();
                }
            } else {
                cc.log("getLoginInfo failure, status: " + req.status);
                cc.stevelog("获取appsig等信息失败，请重试");
            }
        }.bind(this);
        req.send();
    },

    qqLogin: function () {
        cc.stevelog("qq browser login with qq");

        var appid = this.sigInfo["appid"];
        var appsig = this.sigInfo["appsig"];
        var appsigData = this.sigInfo["appsigdata"];
        var param = {
            "appid": appid,
            "appsig": appsig,
            "loginType": "qq",
            "appsigData": appsigData
        };
        pluginManager.login(param, this.loginCallback.bind(this));
    },

    wechatLogin: function () {
        cc.stevelog("qq browser login with weChat");

        var appid = this.sigInfo["appid"];
        var appsig = this.sigInfo["appsig"];
        var appsigData = this.sigInfo["appsigdata"];
        var param = {
            "appid": appid,
            "appsig": appsig,
            "loginType": "wx",
            "appsigData": appsigData
        };
        pluginManager.login(param, this.loginCallback.bind(this));
    },

    qZoneAutoLogin: function () {
        cc.stevelog("qZoneAutoLogin");

        var param = {
            "appid": "1",   //这几个参数可以随意传，但是不能为空
            "appsig": "2",
            "loginType": "wx",
            "appsigData": "3"
        };
        pluginManager.login(param, this.loginCallback.bind(this));
    },

    liebaoLogin: function () {
        cc.stevelog("liebao login");

        var liebaoToken = cc.sys.localStorage.getItem("liebaoToken");
        var token = liebaoToken ? liebaoToken : "meaninglessNotNullString";
        var param = {
            "token": token
        };
        pluginManager.login(param, this.loginCallback.bind(this));
    },

    baiduLogin: function () {
        cc.stevelog("baidu login");
        var param = {
            "forceLogin": "false",  // 是否需要每次重新登录
            "confirmLogin": "false" // 是否让用户选择继续使用该账号或切换账户
        };
        pluginManager.login(param, this.loginCallback.bind(this));
    },

    logout: function(sender){
        cc.stevelog("logout");
        switch (g_env){
            case RUNTIME_ENV.TENCENT:
                pluginManager.logout(this.loginCallback.bind(this));
                break;
            case RUNTIME_ENV.LIEBAO:
            case RUNTIME_ENV.BAIDU:
                break;
        }

    },

    showGameEntry: function(){
        var gameEntryLabel = new cc.LabelTTF("进入游戏", "Arial", 38);
        var gameEntryItem = new cc.MenuItemLabel( gameEntryLabel, function(){
            cc.director.pushScene(new gameScene1());
        }, this );
        gameEntryItem.setTag(LoginActionTYPES.DIRECT);

        var logoutLabel = new cc.LabelTTF("退出登录", "Arial", 38);
        var logoutItem= new cc.MenuItemLabel( logoutLabel, this.logout, this );
        logoutItem.setTag(LoginActionTYPES.LOGOUT);

        if(g_env == RUNTIME_ENV.TENCENT)
            var gameEntryMenu = new cc.Menu(gameEntryItem, logoutItem);
        else
            var gameEntryMenu = new cc.Menu(gameEntryItem);

        gameEntryMenu.setPosition( winSize.width * 3 / 4, winSize.height * 3 / 4);
        gameEntryMenu.alignItemsVerticallyWithPadding(10);
        gameEntryMenu.setTag(MenuTag.GAME_ENTRY_MENU);
        this.addChild(gameEntryMenu);
        this.removeChildByTag(MenuTag.LOGIN_MENU);
    },


    loginCallback: function (plugin, code, msg) {
        cc.log("on user result action.");
        cc.log("msg:" + msg);
        cc.log("code:" + code);

        switch (code){
            case UserActionResultCode.kInitSuccess:
                cc.stevelog("登录初始化成功");
                break;
            case UserActionResultCode.kInitFail:
                cc.stevelog("登录初始化失败");
                break;
            case UserActionResultCode.kLoginSuccess:
                cc.stevelog("登录成功");

                var msgObj = JSON.parse(msg);

                switch (g_env){
                    case RUNTIME_ENV.LIEBAO:
                        // 本地保存 Token 信息
                        cc.sys.localStorage.setItem("liebaoToken",msgObj.cp.token);
                        break;
                    case RUNTIME_ENV.TENCENT:
                        // 本地保存 Token 信息
                        pluginManager.x5_setToken({
                            "qbopenid": msgObj["qbopenid"],
                            "refreshToken": msgObj["refreshToken"],
                            "loginType": msgObj["loginType"]
                        });

                        /*msg = {
                            "avatarurl": "http://q4.qlogo.cn/g?b=qq&k=ewymv77fkeibnfnobxasiccw&s=640&t=1415510615",
                            "expire": 7200,
                            "logintype": "qq",
                            "msg": "ok",
                            "nickname": "\u4e00\u679a\u4ee3\u7801\u72d7",
                            "qbopenid": "io3moskfrm7na2ivhajxweqgz1go5iuuds5_zdpukdbbs1uvhmqg7g",
                            "qbopenkey": "vbnbes2jlyqeytzfdcbbrjgpplwwn2_wdagtp7i_t7bxjtfkdrlidwyq6xdsm81iuqkrwfpw_ht_zyqrtlnoe11ooezkynpqb3upmu2tbmtpw9glqlyluez-yip1t0hhy8e0ngn44jy",
                            "refreshtoken": "p6twbmwpwyflccy7tfziynoeupmkw_8bjxwzrvxbmihzdnor8rl59jykcti0ka52hykylctcg8cczn20fiproikto1gwiunhvuzlshgtvnp776jzpjvgfg",
                            "result": 0
                        }*/


                        // TODO: 腾讯用户登录游戏, CP 要保存 qbopenid 和 iconURL 到服务端以使用朋友圈功能
                        var req = cc.loader.getXMLHttpRequest();

                        u_qbopenid = encodeURIComponent(msgObj["qbopenid"]);
                        u_avatarUrl= encodeURIComponent(msgObj["avatarUrl"]);
                        u_nickName = encodeURIComponent(msgObj["nickName"]);
                        arg = "qbopenid="+u_qbopenid+"&avatarUrl="+u_avatarUrl+"&nickName="+u_nickName;

                        req.open("GET", GAME_SERVER_ADDRESS + "/x5/save_user_info" + "?" + arg);
                        req.onreadystatechange = function () {
                            if (req.readyState == 4 && (req.status >= 200 && req.status <= 207)) {
                                var httpStatus = req.statusText;
                                var response = req.responseText;
                                cc.log("saveUserInfo success: response:" + response);
                            } else {
                                cc.log("saveUserInfo failure, status: " + req.status);
                            }
                        }.bind(this);
                        req.send();
                        break;
                    case RUNTIME_ENV.BAIDU:
                    case RUNTIME_ENV.WANBA:
                        // just keep userInfo is ok
                        break;
                }

                // 登录完成, 保存用户信息
                cc.sys.localStorage.setItem("userInfo", msg);


                this.showGameEntry();
                break;
            case UserActionResultCode.kLoginFail:
                cc.stevelog("登录失败");
                break;
            case UserActionResultCode.kLoginCancel:
                cc.stevelog("登录被取消");
                break;
            case UserActionResultCode.kLogoutSuccess:
                cc.stevelog("注销成功");
                pluginManager.x5_cleanToken();
                this.showLoginMenu();
                break;
            case UserActionResultCode.kLogoutFail:
                cc.stevelog("注销失败");
                pluginManager.x5_cleanToken();
                this.showGameEntry();
                break;
            case UserActionResultCode.kRefreshTokenSuccess:
                cc.stevelog("刷新token成功");
                this.showGameEntry();
                break;
            case UserActionResultCode.kRefreshTokenFail:
                cc.stevelog("刷新token失败");
                pluginManager.x5_cleanToken();
                this.showLoginMenu();
                break;
            case UserActionResultCode.kSendToDesktopSuccess:
                cc.stevelog("发送桌面快捷方式成功");
                break;
            case UserActionResultCode.kSendToDesktopFail:
                cc.stevelog("发送桌面快捷方式失败消");
                break;
            default :
                cc.stevelog("未知返回码:" + code);
        }
    },

    exitGame: function () {
        switch (g_env){
            case RUNTIME_ENV.LIEBAO:
            case RUNTIME_ENV.BAIDU:
                cc.stevelog("not allow game exit, please exit by sdk");
                break;
            default:
                cc.director.end();
                // cc.game.exitGame();
                break;
        }
    }
});

var LoginScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new LoginLayer();
        this.addChild(layer);
    }
});

