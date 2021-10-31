let rendererCreated = false;

const VIEW_DISTANCE = 80;

class RenderingSystem {

    constructor(document, window) {
        if (rendererCreated)
            throw Error('Rendering system is already initialized.');

        this.pixelRatio = window.devicePixelRatio || 1;
        let canvas = document.getElementById("canvas");
        this.gl = this._loadWebGL(canvas);
        this.canvasHeight = 0;
        this.canvasWidth = 0;
        this.updateCanvasSize(canvas);
        this._initializeShaders(this.gl);
        rendererCreated = true;
    }

    _loadWebGL(canvas) {
        // Prevent right click menu from showing up
        canvas.oncontextmenu = function() {return false;};
        // Allow canvas to handle keyboard events
	    canvas.tabIndex = 1000;
	    // Prevent white outline from showing on keypress
	    canvas.style.outline = "none";

        let gl = canvas.getContext("webgl", {antialias: false, depth: true});	
        if (!gl) {
            alert("Imposible inicializar WebGL. Tu navegador quizás no lo soporte.");
            return;
        }
        
        // Inicializar color clear
        gl.clearColor(0,0,0,0);
        gl.enable(gl.DEPTH_TEST); 
        return gl;
    }

    updateCanvasSize(canvas) {
        // 1. Calculamos el nuevo tamaño del viewport
        canvas.style.width  = "100%";
        canvas.style.height = "100%";

        canvas.width  = this.pixelRatio * canvas.clientWidth;
        canvas.height = this.pixelRatio * canvas.clientHeight;

        const width  = (canvas.width  / this.pixelRatio);
        const height = (canvas.height / this.pixelRatio);

        canvas.style.width  = width  + 'px';
        canvas.style.height = height + 'px';
        
        // 2. Lo seteamos en el contexto WebGL
        this.gl.viewport( 0, 0, canvas.width, canvas.height );
        this.canvasHeight = canvas.height;
        this.canvasWidth = canvas.width;
    }

    getScreenSize() {
        return { width: this.canvasWidth, height: this.canvasHeight };
    }

    _initializeShaders(gl) {
        Object.values(Shaders).forEach(shader => shader.init(gl));
    }

    draw(camera, sceneTree) {
        this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT );
        for (let node of sceneTree) {
            const shader = node.getShader();
            shader.setData(node.getShaderData());
            shader.setCamera(camera);
            shader.draw();
        }
    }

  
};
