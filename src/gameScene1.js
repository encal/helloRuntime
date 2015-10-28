/**
 * Created by stevejokes on 10/23/15.
 */

var gameLayer1 = cc.Layer.extend({
    sprite:null,
    ctor:function () {
        this._super();

        var size = cc.winSize;

        var label = new cc.LabelTTF("game scene 1", "Arial", 58);
        // position the label on the center of the screen
        label.x = size.width / 2;
        label.y = size.height / 2 + 200;
        // add the label as a child to this layer
        this.addChild(label, 5);

        // menu setting
        var exitLabel = new cc.LabelTTF("exit", "Arial", 38);
        var exitItem = new cc.MenuItemLabel( exitLabel, this.exitCall, this );
        exitItem.setTag(GameActionTYPES.EXIT);

        // menu
        var menu = new cc.Menu(exitItem);
        menu.setPosition(
            winSize.width/2,
            winSize.height/2
        );
        menu.alignItemsVerticallyWithPadding(10);
        this.addChild(menu);

        return true;
    },

    exitCall: function () {
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
