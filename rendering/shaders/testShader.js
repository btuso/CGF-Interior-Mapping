
class TestShader {

    constructor() {
        // WebGl is not yet loaded when the shader objects are created
        // they will be initialized later
        this.initialized = false;
        this.gl = null; 
    };

    init(gl) {
        if (this.initialized)
            throw Error('Shader is already initialized');

        this.gl = gl;
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, this._VertexShader);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, this._FragmentShader);
        this.program = createProgram(gl, vertexShader, fragmentShader);
        
        // create buffers and uniforms
        this.mvp = gl.getUniformLocation(this.program, 'mvp' );
        
        this.worldTransformUniform = gl.getUniformLocation(this.program, 'worldTransform' );
		this.vertexPostion = gl.getAttribLocation( this.program, 'vertexPosition' );
		this.vertexBuffer = gl.createBuffer();
        this.initialized = true;
    };

    setData(objectData) {
        const vertices = objectData.vertices;
        this.numberOfVertices = vertices.length / 3;
        // update the buffers        
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

        this.worldTransformMatrix =  [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            objectData.position[0], objectData.position[1], -objectData.position[2], 1
        ];
    };

    setCamera(camera){
        // create and set mvp matrix
        const { yaw, pitch } = camera.getRotation();
        const [ translationX, translationY, translationZ ] = camera.getPosition();

        var yCos = Math.cos(-1 * yaw);
        var ySin = Math.sin(-1 * yaw);
        var yawTransform = [ // Column major
            yCos,  0, -1*ySin, 0,
              0 ,  1,    0   , 0,
            ySin,  0,   yCos , 0,
              0 ,  0,    0   , 1
        ];
    
        var pCos = Math.cos(pitch);
        var pSin = Math.sin(pitch);
        var pitchTransform = [ // Column major
            1,    0   ,  0  , 0,
            0,   pCos , pSin, 0,
            0, -1*pSin, pCos, 0,
            0,    0   ,  0  , 1
        ];	
        // obtiene la coordenada en espacio local pra una coordenada en espacio global, "para donde queda esta coordenada"
        var rotForObject = MatrixMult(pitchTransform, yawTransform);
    
        var translationTransform = [ // Column major
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            -translationX, -translationY, translationZ, 1
        ];
    
        var mv = MatrixMult(rotForObject, translationTransform);

        const { width, height } = Render.getScreenSize();
        var projectionMatrix = this._ComputeProjectionMatrix(width, height, translationZ);

        this.mvpMatrix = MatrixMult( projectionMatrix, mv);
    };

    _ComputeProjectionMatrix( width, height, zDistance, fov_angle=40 )
    {
        var r = width / height;
        var n = (zDistance - VIEW_DISTANCE);
        const min_n = 0.001;
        if ( n < min_n ) n = min_n;
        var f = (zDistance + VIEW_DISTANCE);;
        var fov = 3.145 * fov_angle / 180;
        var s = 1 / Math.tan( fov/2 );
        return [
            s/r, 0, 0           , 0,
            0  , s, 0           , 0,
            0  , 0, (n+f)/(f-n) , 1,
            0  , 0, -2*n*f/(f-n), 0
        ];
    }

    draw() {
		this.gl.useProgram( this.program );		

        this.gl.uniformMatrix4fv( this.mvp, false, this.mvpMatrix );
        this.gl.uniformMatrix4fv(this.worldTransformUniform, false, this.worldTransformMatrix);

		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.vertexBuffer );
		this.gl.enableVertexAttribArray( this.vertexPostion );
		this.gl.vertexAttribPointer( this.vertexPostion, 3, this.gl.FLOAT, false, 0, 0 ); 

		this.gl.drawArrays( this.gl.TRIANGLES, 0, this.numberOfVertices);
    };

    _VertexShader = `
        attribute vec3 vertexPosition;
        uniform mat4 mvp;
        uniform mat4 worldTransform;

        void main()
        { 
            gl_Position = mvp * worldTransform * vec4(vertexPosition,1);
        }
    `;

    _FragmentShader = `
        precision mediump float;

        void main()
        {		
            gl_FragColor = vec4(0.5, 0.5, 0.5, 1);
        }
    `; 
}