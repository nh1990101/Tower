import { _decorator, Color, Component, Label, Node, RichText, Sprite } from 'cc';
import { LocalStorage } from './LocalStorage';
const { ccclass, property } = _decorator;

@ccclass('ReGameWin')
export class ReGameWin extends Component {
    @property(Label)
    public tittle: Label;
    @property(RichText)
    public rt_content: RichText;
    @property(Node)
    public win: Node;
    @property(Sprite)
    public mask: Sprite;
    private _callBack0: Function;
    private _callBack1: Function;
    private bgColor: Color = new Color(0, 0, 0, 50)
    start() {
        this.bgColor = this.mask.color.clone();
    }

    update(deltaTime: number) {

    }
    setWinBgShow(bol: boolean) {
        this.win.active = bol;
        var color = this.bgColor.clone();
        if (!bol) {
            color.a = 0;
        }
        this.mask.color = color
    }
    hideBg(){
        this.setWinBgShow(false)
    }
    closeWin() {
        this.node.active = false;
    }
    showWin(numFloor: number, doubleHit: number, score: number, call0: Function, call1: Function) {
        this.node.active = true;
        this.setWinBgShow(true)
        var max = LocalStorage.getItem("maxFloor")
        var tittle = ""
        if (numFloor > Number(max)) {
            tittle = "新纪录"
        } else {
            tittle = "再接再厉"
        }
        var content = `高楼层数：${numFloor}层\n最高连击：${doubleHit}\n金币：${score}`
        this.tittle.string = tittle;
        this.rt_content.string = content;
        this._callBack0 = call0;
        this._callBack1 = call1;
    }
    onClickAgain() {
        if (this._callBack0) {
            this._callBack0();
        }
        this.closeWin();
    }
    onClickAdvi() {
        console.log("观看广告并获得复活")
        if (this._callBack1) {
            this._callBack1();
        }
        this.closeWin();
    }
}


