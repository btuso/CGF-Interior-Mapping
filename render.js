let rendererCreated = false;

class RenderingSystem {

    constructor(window) {
        if (rendererCreated)
            throw Error('Rendering system is already initialized.');

        this._loadWebGL(window)
        rendererCreated = true;
    }

    _loadWebGL(window) {
        canvas = window.getElementById("canvas");
        // Prevent right click menu from showing up
        canvas.oncontextmenu = function() {return false;};
        // Allow canvas to handle keyboard events
	    canvas.tabIndex = 1000;
	    // Prevent white outline from showing on keypress
	    canvas.style.outline = "none";

        this.gl = canvas.getContext("webgl", {antialias: false, depth: true});	
        if (!this.gl) {
            alert("Imposible inicializar WebGL. Tu navegador quizás no lo soporte.");
            return;
        }
        
        // Inicializar color clear
        this.gl.clearColor(0,0,0,0);
        this.gl.enable(gl.DEPTH_TEST); 
        this._updateCanvasSize(canvas);
    }

    _updateCanvasSize(canvas) {
        // 1. Calculamos el nuevo tamaño del viewport
        canvas.style.width  = "100%";
        canvas.style.height = "100%";

        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width  = pixelRatio * canvas.clientWidth;
        canvas.height = pixelRatio * canvas.clientHeight;

        const width  = (canvas.width  / pixelRatio);
        const height = (canvas.height / pixelRatio);

        canvas.style.width  = width  + 'px';
        canvas.style.height = height + 'px';
        
        // 2. Lo seteamos en el contexto WebGL
        this.gl.viewport( 0, 0, canvas.width, canvas.height );
        this.canvasHeight = canvas.height;
        this.canvasWidth = canvas.width;
    }

    _ComputeProjectionMatrix( width, height, z, fov_angle=40 )
    {
        var r = width / height;
        //var n = (z - 1.74);
        const VIEW_DISTANCE = 20;
        var n = (z - VIEW_DISTANCE);
        const min_n = 0.001;
        if ( n < min_n ) n = min_n;
        //var f = (z + 1.74);
        var f = (z + VIEW_DISTANCE);;
        var fov = 3.145 * fov_angle / 180;
        var s = 1 / Math.tan( fov/2 );
        return [
            s/r, 0, 0           , 0,
            0  , s, 0           , 0,
            0  , 0, (n+f)/(f-n) , 1,
            0  , 0, -2*n*f/(f-n), 0
        ];
    }

    draw(z) {
        //TODO register camera and get Z from camera movement
        projectionMatrix = this.computeProjectionMatrix(this.canvasWidth, this.canvasHeight, z);

        var mv  = GetModelViewMatrix( transX, transY, transZ, rotX, rotY);
        var mvp = MatrixMult( perspectiveMatrix, mv );
    
        // 2. Limpiamos la escena
        this.gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
        
        // 3. Le pedimos a cada objeto que se dibuje a si mismo
        var nrmTrans = [ mv[0],mv[1],mv[2], mv[4],mv[5],mv[6], mv[8],mv[9],mv[10] ];
        meshDrawer.draw( mvp, mv, nrmTrans );
    }
};

// Called from index.html
function WindowResize()
{
    canvas = document.getElementById("canvas");
	Render._updateCanvasSize(canvas);
}