/**
 * Created by stevejokes on 10/23/15.
 */


var gameLayer2 = cc.Layer.extend({
    sprite:null,
    ctor:function () {
        this._super();

        var size = cc.winSize;

        var label = new cc.LabelTTF("game scene 2", "Arial", 58);
        // position the label on the center of the screen
        label.x = size.width / 2;
        label.y = size.height / 2 + 200;
        // add the label as a child to this layer
        this.addChild(label, 5);

        return true;
    }
});

var gameScene2 = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new gameLayer2();
        this.addChild(layer);
    }
});