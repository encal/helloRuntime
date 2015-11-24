/**
 * Created by stevejokes on 10/23/15.
 */

var ItemList = cc.Layer.extend({
    infoList: null,
    type: null,
    ctor: function (type, list) {
        this._super();
        this.type = type;
        this.infoList = list;
    },
    onEnter: function () {
        this._super();
        this.createTableView();
    },
    createTableView: function () {
        var bg = new cc.Scale9Sprite(res.list_bg, cc.rect(0, 0, 96, 100), cc.rect(30, 30, 36, 40));
        bg.setContentSize(cc.size(400, 450));
        this.addChild(bg);

        bg.setPosition(cc.pAdd(cc.visibleRect.center, cc.p(0, -30)));

        var closeLabel = new cc.LabelTTF("返回", "Arial", 30);
        var closeButton = new cc.MenuItemLabel(closeLabel, function () {
            this.removeFromParent();
        }, this);

        closeButton.setScale(0.6);

        var menu = new cc.Menu(closeButton);
        menu.setAnchorPoint(cc.p(0, 0));
        menu.setPosition(cc.p(0, 0));
        closeButton.setPosition(400, 440);

        bg.addChild(menu);

        var tableView = new cc.TableView(this, cc.size(340, 390));
        tableView.setDirection(cc.SCROLLVIEW_DIRECTION_VERTICAL);
        tableView.setPosition(cc.p(30, 30));
        tableView.setAnchorPoint(cc.p(0, 0));
        tableView.setDelegate(this);

        bg.addChild(tableView);
        tableView.reloadData();
    },

    tableCellAtIndex: function (table, idx) {
        var index = idx.toFixed(0);
        var cell = table.dequeueCell();
        if (!cell) {
            if (this.type == "friends") {
                cell = new FriendItem(this.getInfo(index));
            } else {
                cell = new PayItem(this.getInfo(index));
            }
        }
        return cell;
    },

    getInfo: function (index) {
        return this.infoList[index];
    },
    numberOfCellsInTableView: function (table) {
        return this.infoList.length;
    },
    tableCellTouched: function (table, cell) {
        cc.log("cell touched at index: " + cell.getIdx());
    },
    tableCellSizeForIndex: function (table, idx) {
        return cc.size(340, 85);
    }
});

var FriendItem = cc.TableViewCell.extend({
    info: null,
    ctor: function (info) {
        this._super();
        this.info = info;
    },
    onEnter: function () {
        this._super();
        this.setContentSize(cc.size(340, 80));
        this.init(this.info.iconUrl, this.info.nickName);
    },
    init: function (iconUrl, nickName) {
        var layer = new cc.LayerColor();
        layer.setColor(cc.color(227, 227, 227));
        layer.setContentSize(340, 80);
        layer.setPosition(cc.p(0, 0));
        layer.setAnchorPoint(cc.p(0, 0));

        var name = new cc.LabelTTF(nickName, "Arial", 20);
        name.setColor(cc.color(0, 0, 0));
        name.setPosition(cc.p(150, 40));
        layer.addChild(name);

        this.addChild(layer);

        var icon = new cc.Sprite(res.default_photo);
        icon.setAnchorPoint(cc.p(0, 0));
        layer.addChild(icon);
        icon.setPosition(cc.p(10, 10));
        cc.loader.loadImg(iconUrl, {width: 60, height: 60}, function (error, texture) {
            if (!error) {
                icon.initWithTexture(texture);
                icon.setAnchorPoint(cc.p(0, 0));
            }
        });
    }
});

var PayItem = cc.TableViewCell.extend({
    info: null,
    ctor: function (info) {
        this._super();
        this.info = info;
    },
    onEnter: function () {
        this._super();
        this.setContentSize(cc.size(340, 80));
        this.init(this.info.iconUrl, this.info.payInfo);
    },
    init: function (iconUrl, payInfo) {
        var layer = new cc.LayerColor();
        layer.setColor(cc.color(77, 255, 250));
        layer.setContentSize(340, 80);
        var name = new cc.LabelTTF(payInfo + "Q米", "Arial", 20);
        name.setColor(cc.color(0, 0, 0));
        layer.addChild(name);
        layer.setPosition(cc.p(0, 0));
        layer.setAnchorPoint(cc.p(0, 0));
        this.addChild(layer);

        name.setPosition(cc.p(120, 40));

        switch (g_env){
            case RUNTIME_ENV.TENCENT:
                var button = new cc.MenuItemImage(res.buy_normal, res.buy_pressed, this.pay(null));
                break;
            case RUNTIME_ENV.WANBA:
                var button = new cc.MenuItemImage(res.buy_normal, res.buy_pressed, function () {
                    toastUtils.showLoading("获取 playzone_userinfo ");

                    var userInfo = this.getUserInfo();
                    var param = "openid=" + userInfo.qbopenid +
                                "&openkey=" + userInfo.qbopenkey;

                    pluginManager.getPlayZoneUserInfo(param, function (rdata) {
                        toastUtils.hideLoading();

                        var data = JSON.parse(rdata);
                        if (data.code == 0) {
                            var msg = data.data[0];
                            if (msg.score >= 1) {   //够支付
                                toastUtils.showLoading("调用OpenAPI支付");

                                var payParam = param + "&itemid=3564";
                                pluginManager.payByOpenAPI(payParam, this.paySuccessCb.bind(this));

                            } else {                //不够支付
                                this.pay(data.is_vip ? "1" : "0");
                            }
                        }
                    }.bind(this));
                }, this);
                break;
            default :
                var button = new cc.MenuItemImage(res.buy_normal, res.buy_pressed, this.qqBrowserPay());
                break;
        }

        var menu = new cc.Menu(button);

        button.setPosition(cc.p(layer.width - button.width / 2 - 20, 40));
        menu.setPosition(cc.p(0, 0));
        menu.setAnchorPoint(cc.p(0, 0));

        layer.addChild(menu);

        if (cc.sys.isNative) {
            var icon = new cc.Sprite(res.default_photo);
            icon.setAnchorPoint(cc.p(0, 0));
            layer.addChild(icon);
            icon.setPosition(cc.p(10, 10));
            cc.loader.loadImg(iconUrl, {width: 60, height: 60}, function (error, texture) {
                if (!error) {
                    icon.initWithTexture(texture);
                    icon.setAnchorPoint(cc.p(0, 0));
                }
            });
        }
    },


    pay : function (isvip) {
        var productId = this.getOrderId();
        var userId = pluginManager.getUserID();

        switch (g_env){
            case RUNTIME_ENV.TENCENT:
                var ext = this.getOrderId() + "_" + userId;
                break;
            case RUNTIME_ENV.WANBA:
                var ext = JSON.stringify({orderId: productId + "_" + userId, isGameVip: isvip + ""});
                break;
        }

        var info = {
            Product_Price: (this.info.payInfo / 10) + "",
            Product_Id: productId + "",
            Product_Name: "gold",
            Server_Id: "13",
            Product_Count: "1",
            Role_Id: userId + "",
            Role_Name: "asd",
            EXT: ext
        };

        pluginManager.pay(info, function (ret, msg, info) {
            toastUtils.hideLoading();
            switch (ret){
                case PayResultCode.kPaySuccess:
                    Utils.showToast("支付成功");
                    if(g_env == RUNTIME_ENV.WANBA){
                        var userInfo = this.getUserInfo();
                        var param = "openid=" + userInfo.qbopenid +
                            "&openkey=" + userInfo.qbopenkey + "itemid=3564";

                        pluginManager.payByOpenAPI(param, this.paySuccessCb.bind(this));
                    }

                    break;
                case PayResultCode.kPayFail:
                    Utils.showToast("支付失败"); break;
                case PayResultCode.kPayCancel:
                    Utils.showToast("支付被取消"); break;
                case PayResultCode.kPayNeedLoginAgain:
                    Utils.showToast("需要重新登陆"); break;
            }
        }.bind(this));
    },

    getOrderId: function () {
        //todo please connect your game server to create an orderId
        return Date.now();
    }
});
