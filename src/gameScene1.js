/**
 * Created by stevejokes on 10/23/15.
 */

var gameLayer1 = cc.Layer.extend({
    sprite:null,
    winSize:cc.winSize,

    ctor:function () {
        this._super();

        var label = new cc.LabelTTF("game scene 1", "Arial", 58);
        // position the label on the center of the screen
        label.x = winSize.width / 2;
        label.y = winSize.height / 2 + 200;
        // add the label as a child to this layer
        this.addChild(label, 5);

        this.initFunctionList();
        return true;
    },

    initFunctionList:function(){
        var functionList = [];

        var payLabel = new cc.LabelTTF("支付", "Arial", 30);
        var payItem = new cc.MenuItemLabel( payLabel, this.pay, this );
        payItem.setTag(SDKFunctionTYPES.PAY);

        var shareLabel = new cc.LabelTTF("分享", "Arial", 30);
        var shareItem = new cc.MenuItemLabel( shareLabel, this.share, this );
        shareItem.setTag(SDKFunctionTYPES.SHARE);

        var send2DeskLabel = new cc.LabelTTF("发送至桌面", "Arial", 30);
        var send2DeskItem = new cc.MenuItemLabel( send2DeskLabel, this.send2Desk, this );
        send2DeskItem.setTag(SDKFunctionTYPES.SEND_TO_DESKTOP);

        var friendsLabel = new cc.LabelTTF("好友列表", "Arial", 30);
        var friendsLabelItem = new cc.MenuItemLabel( friendsLabel, this.friends, this );
        friendsLabelItem.setTag(SDKFunctionTYPES.FRIENDS);

        var forumLabel = new cc.LabelTTF("话题圈", "Arial", 30);
        var forumItem = new cc.MenuItemLabel( forumLabel, this.openForum, this );
        forumItem.setTag(SDKFunctionTYPES.FORUM);

        var adsLabel = new cc.LabelTTF("显示广告", "Arial", 30);
        var adsItem = new cc.MenuItemLabel( adsLabel, this.showAds, this );
        adsItem.setTag(SDKFunctionTYPES.ADS);

        var backLabel = new cc.LabelTTF("返回登录框", "Arial", 30);
        var backItem = new cc.MenuItemLabel( backLabel, this.back, this );
        backItem.setTag(GameActionTYPES.EXIT);

        switch(g_env){
            case RUNTIME_ENV.TENCENT:
                functionList.push(payItem, shareItem, send2DeskItem, friendsLabelItem, forumItem, backItem);
                break;
            case RUNTIME_ENV.WANBA:
                functionList.push(payItem, shareItem, send2DeskItem, backItem);
                break;
            case RUNTIME_ENV.BAIDU:
                functionList.push(payItem, shareItem, send2DeskItem, backItem);
                break;
            case RUNTIME_ENV.LIEBAO:
                functionList.push(payItem, send2DeskItem, adsItem, backItem);
                break;
            default:
                break;
        }

        // menu
        var menu = new cc.Menu(functionList);
        menu.setPosition(
            winSize.width/2,
            winSize.height/2
        );
        menu.alignItemsVerticallyWithPadding(8);
        this.addChild(menu);
    },

    pay: function(){
        cc.stevelog("pay");
    },

    share: function(){
        cc.stevelog("share");
        if(g_env == RUNTIME_ENV.LIEBAO){
            cc.stevelog("liebao doesn't have share");
            return true;
        }

        if (pluginManager.sharePlugin) {
            switch (g_env){
                case RUNTIME_ENV.TENCENT:
                case RUNTIME_ENV.WANBA:
                    
                    var info = {
                        // 分享标题
                        title: "hello runtime", 
                        titleUrl: "http://game.html5.qq.com/h5Detail.html?gameId=2466856218", //

                        // 分享此内容的来源
                        site: "hello runtime", 
                        siteUrl: "http://game.html5.qq.com/h5Detail.html?gameId=2466856218",

                        // 分享的文本
                        text: "hello runtime", 

                        // 用户对这条分享的评论
                        comment: "无",  

                        // 描述
                        description: "hello runtime",

                        imageTitle: "hello runtime",
                        imageUrl: "http://res.imtt.qq.com/game_list/cocos.jpg"
                    };
                    break;
                case RUNTIME_ENV.BAIDU:
                    var info = {
                        title: "hello runtime",
                        titleUrl: "http://game.html5.qq.com/h5Detail.html?gameId=2466856218",
                        imageUrl: "http://res.imtt.qq.com/game_list/cocos.jpg"
                    };
                    break;
            }

            cc.stevelog("share info:" + info + ", " + info["site"]);

            pluginManager.share(info, function (ret, msg) {
                cc.log("share result, resultcode:" + ret + ", msg: " + msg);
                switch (ret) {
                    case ShareResultCode.kShareSuccess:
                        cc.stevelog("分享成功");
                        break;
                    case ShareResultCode.kShareFail:
                        cc.stevelog("分享失败");
                        break;
                    case ShareResultCode.kShareCancel:
                        cc.stevelog("分享取消");
                        break;
                    case ShareResultCode.kShareNetworkError:
                        cc.stevelog("分享网络错误");
                        break;
                    default:
                        cc.stevelog("未知返回码:" + ret);
                        break;
                }
            }.bind(this));
        }
    },

    send2Desk: function(){
        cc.stevelog("send2Desk");
    },

    friends: function(){
        cc.stevelog("friends");
    },
    
    openForum: function(){
        cc.stevelog("openForum");
    },

    showAds: function(){
        cc.stevelog("showAds");
    },

    back: function () {
        cc.stevelog("back");
        cc.director.popScene();
    }
});

var gameScene1 = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new gameLayer1();
        this.addChild(layer);
    }
});
