
class InteriorShader {

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
        this.rotationFromCamera = gl.getUniformLocation(this.program, 'rotationFromCamera' );
        
		this.vertexPostion = gl.getAttribLocation( this.program, 'vertex_position' );
		this.vertexBuffer = gl.createBuffer();
        this.initialized = true;
    };

    setData(bufferData) {
        this.numberOfVertices = bufferData.length / 3;
        // update the buffers        
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(bufferData), this.gl.STATIC_DRAW);
    };

    setCamera(camera){
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
        // obtiene la coordenada en espacio global para una coordenada en espacio local, "hacia donde estoy mirando"
        this.rotationFromCameraMatrix = MatrixMult(yawTransform, pitchTransform);
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
        this.gl.uniformMatrix4fv( this.rotationFromCamera, false, this.rotationFromCameraMatrix );

		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.vertexBuffer );
		this.gl.enableVertexAttribArray( this.vertexPostion );
		this.gl.vertexAttribPointer( this.vertexPostion, 3, this.gl.FLOAT, false, 0, 0 ); 

		this.gl.drawArrays( this.gl.TRIANGLES, 0, this.numberOfVertices);
    };

    _VertexShader = `
        attribute vec3 vertex_position;

        uniform mat4 mvp;
        uniform mat4 rotationFromCamera;

        varying vec3 vertexCoord;
        varying vec3 vertexRelativeCameraDir;

        void main()
        { 
            vertexCoord = vertex_position;
            gl_Position = mvp * vec4(vec3(1,1,1) * vertex_position,1);
            
            // This contains the direction of the vertex from the camera's POV in camera space
            vec4 vertexDir = mvp * vec4(vertex_position, 1);
            vertexDir.z = vertexDir.z * - 1.0;
            vertexDir = normalize(vertexDir);
            vertexDir.w = 1.0;

            // This contains the direction of the vertex from the camera's POV in world space relative to the camera, with the camera pointing towards -Z axis.
            // We will combine it with the direction the camera is pointing at in world space, in order to find out where each vertex is in world space.
            vertexRelativeCameraDir = vec3(rotationFromCamera * vertexDir);
        }
    `;

    _FragmentShader = `
        precision mediump float;

        
        uniform float height;

        // Interior Mapping
        varying vec3 vertexCoord;
        varying vec3 vertexRelativeCameraDir;

        uniform vec3 globalCameraDir;
        uniform vec3 cameraPos; 

        void main()
        {		
        
            float floorHeight = 0.5;
            float floorWidth = 0.5;

            /*
                float currentCeiling = ceil(vertexCoord.y / floorHeight);
                vec3 pointInCeilingPlane = vec3(0, currentCeiling * floorHeight, 0);
                vec3 floorNormal = vec3(0, 1, 0);
                float ceilingDistance = dot(pointInCeilingPlane - cameraPos, floorNormal) / dot(cameraDir, floorNormal);
                vec3 ceilingIntersection = ceilingDistance * cameraDir;

                // TODO maybe this should only be calculated when cameraDir is negative
                float currentFloor = ceil(vertexCoord.y / floorHeight) - 1.0;
                vec3 pointInFloorPlane = vec3(0, currentFloor * floorHeight, 0);
                float floorDistance = dot(pointInFloorPlane - cameraPos, floorNormal) / dot(cameraDir, floorNormal);
                vec3 floorIntersection = floorDistance * cameraDir;
            */
            
            vec3 horizontalColor = vec3(1, 0, 0); // debug color
            float floorOffset = 0.0;
            if (globalCameraDir.y < 0.0) {
                // If we're looking downwards then we're looking at the floor, not the ceiling
                floorOffset = 1.0;
                horizontalColor = vec3(0, 0, 1); // debug color
            }

            float horizontalPlane = ceil(vertexCoord.y / floorHeight) - floorOffset;
            vec3 pointInHorizontalPlane = vec3(0, horizontalPlane * floorHeight, 0);
            vec3 planeNormal = vec3(0, 1, 0);
            float horizontalPlaneDistance = dot(pointInHorizontalPlane - cameraPos, planeNormal) / dot(vertexRelativeCameraDir, planeNormal);
            vec3 horizontalIntersection = horizontalPlaneDistance * vertexRelativeCameraDir;

                    
            float currentWall = ceil(vertexCoord.x / floorWidth);
            vec3 pointInWallPlane = vec3(currentWall * floorWidth, 0, 0);
            vec3 wallNormal = vec3(1, 0, 0);
            float wallDistance = dot(pointInWallPlane - cameraPos, wallNormal) / dot(vertexRelativeCameraDir, wallNormal);
            vec3 wallIntersection = wallDistance * vertexRelativeCameraDir;
            




            //gl_FragColor = vec4(abs(globalCameraDir.x),  abs(globalCameraDir.y), abs(globalCameraDir.z), 1);
            
            
            gl_FragColor = vec4(0, 0,vertexRelativeCameraDir.y + globalCameraDir.y, 1);            
        }
    `; 
}