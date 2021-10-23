let inputCreated = false;

class InputSystem {

    constructor(window, inputMapping) {
        if (inputCreated)
            throw Error('Input system is already initialized.');

        if (!window)
            throw Error('Window must be valid when creating Input system.');
        
        if (!inputMapping)
            throw Error('Input mapping must be defined when creating Input system.')

        this.currentMousePosition = {};
        this.mouseX = 0;
        this.mouseY = 0;

        this.currentInput = this._createInputState(inputMapping);
        this._registerKeys(window, inputMapping);
        this._registerMouseMovement(window, this.currentMousePosition);
        this._exportActions(inputMapping);
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
   
    _exportActions = (inputMapping) => {
        const actions = Object.keys(inputMapping);
        for (let action of actions) {
            this['IS_' + action] = () => this.currentInput[action];
        }
    };

    _registerMouseMovement = (window, currentMousePosition) => {
        window.onmousemove = function(e) 
		{
            currentMousePosition.x = e.clientX;
			currentMousePosition.y = e.clientY;
		}
    };

    pollInputs = () => {
        if (this.currentMousePosition.x == null) {
            // Mouse hasn't been moved yet
            return;
        }
        
        if (this.previousMousePosition == null) {
            this.previousMousePosition = { ...this.currentMousePosition };
        }
        this.mouseX = this.currentMousePosition.x - this.previousMousePosition.x;
        this.mouseY = this.currentMousePosition.y - this.previousMousePosition.y;
        this.previousMousePosition = { ...this.currentMousePosition };
    };

    mouseXMovement = () => {
        return this.mouseX;
    };
    
    mouseYMovement = () => {
        return this.mouseY;
    };
};





