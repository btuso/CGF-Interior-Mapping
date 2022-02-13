let menuCreated = false;

class MenuSystem {

    constructor(document) {
        if (menuCreated)
            throw Error('Menu system is already initialized.');
        
        
        this.pointerLocked = true;
        this.canvas = document.getElementById("canvas");
    };

    update(delta) {
        if (Input.mouseWasClicked() && this.pointerLocked == false) {
            this.canvas.requestPointerLock();
        }


        this.pointerLocked = document.pointerLockElement === canvas;
    };

    shouldBeRendered() {
        return false;
    };
}
