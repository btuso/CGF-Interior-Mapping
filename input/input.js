let inputCreated = false;

const MOUSE_SENSITIVITY = 2.5;

class InputSystem {

    constructor(window, inputMapping, screenSize) {
        if (inputCreated)
            throw Error('Input system is already initialized.');

        if (!window)
            throw Error('Window must be valid when creating Input system.');
        
        if (!inputMapping)
            throw Error('Input mapping must be defined when creating Input system.')

        this.mouseClick = { currentlyClicking: false, clickedInLastFrame: false };
        this.currentMouseMovement = { x: 0, y: 0 };
        this.mouseX = 0;
        this.mouseY = 0;

        this.currentInput = this._createInputState(inputMapping);
        this._registerKeys(window, inputMapping);
        this._registerMouseMovement(window, this.currentMouseMovement);
        this._registerMouseClick(window, this.mouseClick);
        this._exportActions(inputMapping);
        this.screenSize = screenSize;
        inputCreated = true;
    };

    _createInputState = (inputMapping) => {
        const state = {};
        const actions = Object.keys(inputMapping);
        for (let action of actions) {
            state[action] = false;
        }
        return state;
    };

    _registerKeys = (window, inputMapping) => {
        window.onkeydown  = (keyDown) => {
            const triggeredMappings = this._getInputMappingForKey(inputMapping, keyDown.key);
            triggeredMappings.forEach(mapping => this.currentInput[mapping] = true);
        };
    
        window.onkeyup  = (keyUp) => {
            const triggeredMappings = this._getInputMappingForKey(inputMapping, keyUp.key);
            triggeredMappings.forEach(mapping => this.currentInput[mapping] = false);
        }
    };
    
    _getInputMappingForKey = (inputMapping, key) => {
        const mappings = [];
        const actions = Object.keys(inputMapping);
        for (let action of actions) {
            if (inputMapping[action].includes(key)) {
                mappings.push(action);
            }
        }
        return mappings;    
    };
   
    _registerMouseMovement = (window, currentMouseMovement) => {
        window.onmousemove = function(e) 
		{
            currentMouseMovement.x += e.movementX;
            currentMouseMovement.y -= e.movementY;
		}
    };
    
    _registerMouseClick = (window, mouseClick) => {
        window.onmousedown  = function(e) 
		{
            mouseClick.clickedInLastFrame = true;
		}
    };

    pollInputs = () => {
        this.mouseX = this.currentMouseMovement.x;
        this.mouseY = this.currentMouseMovement.y;
        this.currentMouseMovement.x = 0;
        this.currentMouseMovement.y = 0;
        
        this.mouseClick.currentlyClicking = this.mouseClick.clickedInLastFrame;
        this.mouseClick.clickedInLastFrame = false;
    };

    mouseXMovement = () => {
        return this.mouseX / this.screenSize.width * MOUSE_SENSITIVITY;
    };
    
    mouseYMovement = () => {
        return this.mouseY / this.screenSize.height * MOUSE_SENSITIVITY;
    };

    mouseWasClicked = () => {
        return this.mouseClick.currentlyClicking;
    };

    updateScreenSize(width, height) {
        this.currentMouseMovement.x = 0;
        this.currentMouseMovement.y = 0;
        this.screenSize = { width, height };
    };

    _exportActions = (inputMapping) => {
        const actions = Object.keys(inputMapping);
        for (let action of actions) {
            this['IS_' + action] = () => this.currentInput[action];
        }
    };

};





