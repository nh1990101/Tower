import { _decorator, Animation, Component, Node, RigidBody } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlaneController')
export class PlaneController extends Component {
    start() {
       
        const animation = this.node.getComponent(Animation);
        if (animation && animation.defaultClip) {
            animation.play()
            // const { defaultClip } = animation;                        
            // defaultClip.events = [
            //     {
            //         frame: 0.5, // 第 0.5 秒时触发事件
            //         func: 'onTriggered', // 事件触发时调用的函数名称
            //         params: [ 0 ], // 向 `func` 传递的参数
            //     }
            // ];                                         

            // animation.clips = animation.clips;                        
        }
    }

    update(deltaTime: number) {
        
    }
}


