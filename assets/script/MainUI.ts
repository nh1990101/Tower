import { _decorator, Color, Component, EditBox, find, Label, Node, ProgressBar, Tween, tween, Vec3 } from 'cc';
import { GameController } from './GameController';
import { GameConfig } from './GameConfig';
const { ccclass, property } = _decorator;

@ccclass('MainUI')
export class MainUI extends Component {
    @property(Label)
    public lb_floorNum: Label;
    @property(Label)
    public lb_money: Label;
    @property(Label)
    public lb_guide: Label;
    @property(Node)
    public cameraUI: Node;
    @property(Node)
    public moneyIcon: Node;
    @property(Node)
    public continute: Node;
    @property(Node)
    public fingerIcon: Node;
    @property(ProgressBar)
    public continueBar: ProgressBar;
    @property(Label)
    public lb_continueRate: Label;
    @property(Node)
    public GM: Node;
    @property(Node)
    public btnFloorIdx: Node;
    @property(Node)
    public beginUI: Node;
    @property(Node)
    public finger: Node;
    @property(Node)
    public hp: Node;

    @property(EditBox)
    public ti_floorIdx: EditBox;


    public gameCtrl: GameController;

    @property(Label)
    public lb_selectObj: Label;
    @property(Label)
    public lb_notice: Label;
    @property(EditBox)
    public ti_selectX: EditBox;
    @property(EditBox)
    public ti_selectY: EditBox;
    @property(EditBox)
    public ti_selectZ: EditBox;

    private _selectNode: Node;
    private myTw: Tween<Color>;
    private twBar: Tween<ProgressBar>;
    private twFinger: Tween<Node>;
    public rate: number = 1;
    public money: number = 0;
    public maxRate = 0;
    public numFloor = 0;
    public maxHp: number = 0;
    public curHp: number = 0;
    start() {
        this.lb_floorNum.string = "x0";


    }

    update(deltaTime: number) {

    }
    public initData() {
        this.rate = 1;
        this.money = 0;
        this.maxRate = 0;
        this.numFloor = 0;
        this.setFloorNum(0);
        this.watchState(false)
        this.setHp(GameConfig.config.maxHp, GameConfig.config.maxHp)
        this.addMoney(0);
        if (this.twBar) {
            this.twBar.stop();
        }
        this.hideContinue();
        this.hideGuide();
    }
    public setupGameCtrl(gameCtrl: GameController) {
        this.gameCtrl = gameCtrl;
    }
    onClickMenu() {
        console.log("菜单弹出")
    }
    public setFloorNum(num: number) {
        this.numFloor = num;
        this.lb_floorNum.string = "x" + num;
    }
    public gotoFloorIdx() {
        var idx = Number(this.ti_floorIdx.textLabel.string);
        if (idx > 1) {
            this.gameCtrl.createFloorList(idx);
        }
    }
    public setSelectObj(node: Node) {
        this._selectNode = node;
        var pos = node.worldPosition;
        this.lb_selectObj.string = node.name;
        this.ti_selectX.string = pos.x + "";
        this.ti_selectY.string = pos.y + "";
        this.ti_selectZ.string = pos.z + "";
    }
    public setSelectObjPos() {
        var pos = new Vec3(Number(this.ti_selectX.string), Number(this.ti_selectY.string), Number(this.ti_selectZ.string))
        if (this._selectNode) {
            this._selectNode.setWorldPosition(pos)
        }
    }
    public addHP(value: number): number {
        this.setHp(++this.curHp)
        return this.curHp;
    }
    public subHp(value: number = 1): number {
        this.setHp(--this.curHp)
        return this.curHp;
    }
    private setHp(cur: number, max?: number) {
        this.curHp = cur;
        if (max) {
            this.maxHp = max;
        }
        for (var i = 0; i < this.maxHp; i++) {
            var hp = this.hp.getChildByName(`heart${i}`)
            if (hp) {

                hp.active = i < cur;

            }
        }
    }
    public showNotice(bol: boolean) {
        this.lb_notice.enabled = bol;
        var color = this.lb_notice.color.clone();
        this.beginUI.active = !bol
        if (bol) {
            // color.a = 0;
            // this.lb_notice.al = color;
            this.myTw = tween(color).to(0.2, { a: 0 }, {
                onUpdate: (target, radio) => {

                    this.lb_notice.color = color;
                }
            }).to(0.2, { a: 255 }, {
                onUpdate: (target, radio) => {

                    this.lb_notice.color = color;
                }
            }).union().repeatForever().start();
            // tw.repeatForever(tw)
        } else {
            this.myTw.stop();
            color.a = 255;
            this.lb_notice.color = color
        }
    }
    public onClickEvent(touch, event) {
        this.gameCtrl.onClickMainUI(touch, event)
    }
    public addMoney(num: number) {
        this.money += (num >> 0);
        this.lb_money.string = this.money.toFixed(0) + ""
    }
    public showContinue() {
        this.continute.active = true;
        if (this.twBar) {
            this.twBar.stop();
        }
        this.rate++;
        this.continueBar.progress = 1;
        this.lb_continueRate.string = "x" + this.rate;
        tween(this.lb_continueRate.node).to(0.2, { scale: new Vec3(2, 2, 2) }).to(0.2, { scale: Vec3.ONE })
        this.twBar = tween(this.continueBar).to(GameConfig.config.continuteCountTime, { progress: 0 }).call(this.finishContinue.bind(this)).start();
    }
    public hideContinue() {
        this.continute.active = false;
        if (this.twBar) {
            this.twBar.stop();
        }
    }
    public finishContinue() {
        this.hideContinue();
        this.addMoney(GameConfig.config.perFloorScore * this.rate)
        if (this.maxRate < this.rate) {
            this.maxRate = this.rate;
        }
        this.rate = 1;
    }
    public showGuide(text: string, action: number) {
        this.finger.active = true;
        if (this.twFinger) {
            this.twFinger.stop();
        }
        this.fingerIcon.setPosition(Vec3.ZERO)
        this.lb_guide.string = text;
        if (action == 1) {
            this.twFinger = tween(this.fingerIcon).to(0.3, { position: new Vec3(-20, -20, 0) }).to(0.3, { position: new Vec3(0, 0, 0) }).union().repeatForever().start();
        } else {
            this.twFinger = tween(this.fingerIcon).to(0.3, { position: new Vec3(100, 0, 0) }).to(0.3, { position: new Vec3(0, 0, 0) }).union().repeatForever().start();
        }
    }
    public hideGuide() {
        if (this.twFinger) {
            this.twFinger.stop();
        }
        this.finger.active = false;
    }
    public watchState(bol: boolean) {
        this.cameraUI.active = bol;
    }
}


