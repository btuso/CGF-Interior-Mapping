let cameraGlobalPos = [0,0,0];
let cameraGlobalDir = [0,0,0];
let rotFromCameraU = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];

let posX = 0;
let posY = 0;
let posZ = 0;

function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY)
{
	var cy = Math.cos(rotationY);
	var sy = Math.sin(rotationY);
    var guinada =[ // Column major
		cy, 0, -1*sy, 0,
		0 , 1, 0    , 0,
		sy, 0, cy   , 0,
		0 , 0, 0    , 1
    ];

	var cx = Math.cos(rotationX);
	var sx = Math.sin(rotationX);
    var cabeceo =[ // Column major
		1, 0    , 0 , 0,
		0, cx   , sx, 0,
		0, -1*sx, cx, 0,
		0, 0    , 0 , 1
    ];	
	// obtiene la coordenada en espacio local pra una coordenada en espacio global, "para donde queda esta coordenada"
	var rotForObject = MatrixMult(cabeceo, guinada)  
	// obtiene la coordenada en espacio global para una coordenada en espacio local, "hacia donde estoy mirando"
    var rotFromCamera = MatrixMult(guinada, cabeceo) 


	// First person based movement, we ignore translationY so upwards movement is global instead of camera based
	var globalMovement = [translationX, 0, translationZ,1];
	var cameraMovement = MatrixVectorMult(rotFromCamera, globalMovement)	
	
	posX -= cameraMovement[0];
	// Elevation is based on global axis
	posY -= cameraMovement[1] - translationY; 
	posZ += cameraMovement[2];
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		posX, posY, posZ, 1
	];

//    var mv = MatrixMult(trans,rotForObject) // Original rotate around
	var mv = MatrixMult(rotForObject, trans) 


	// Camera updates temp
	cameraGlobalPos = [posX, posY, posZ];
	cameraCurrentDir = MatrixVectorMult(rotFromCamera, [0,0,-1,1]); // Calculate direction camera is facing
	rotFromCameraU = rotFromCamera;
	cameraGlobalDir = [cameraCurrentDir[0], cameraCurrentDir[1], cameraCurrentDir[2]]; 
	
	return mv;
}

printvect = (vec) => {
	console.log(vec[0], vec[1], vec[2], vec[3])
}

printmatrix = (mat) => {
	console.log(mat[0], mat[1], mat[2], mat[3])
	console.log(mat[4], mat[5], mat[6], mat[7])
	console.log(mat[8], mat[9], mat[10], mat[11])
	console.log(mat[12], mat[13], mat[14], mat[15])
}

// [COMPLETAR] Completar la implementación de esta clase.
class MeshDrawer
{
	// El constructor es donde nos encargamos de realizar las inicializaciones necesarias. 
	constructor()
	{
		// [COMPLETAR] inicializaciones
		
		// 1. Compilamos el programa de shaders
		this.prog   = InitShaderProgram( meshVS, meshFS );
		// 2. Obtenemos los IDs de las variables uniformes en los shaders
			// Vertex Shader
		this.mvp = gl.getUniformLocation( this.prog, 'mvp' );
		this.mv = gl.getUniformLocation( this.prog, 'mv' );
			// Fragment Shader
		this.height = gl.getUniformLocation( this.prog, 'height');
		this.cameraPos = gl.getUniformLocation( this.prog, 'cameraPos');
		this.cameraDir = gl.getUniformLocation( this.prog, 'globalCameraDir');
		this.rotFromCameraUniform = gl.getUniformLocation( this.prog, 'rotationFromCamera');


		// 3. Obtenemos los IDs de los atributos de los vértices en los shaders
		this.vertPos = gl.getAttribLocation( this.prog, 'pos' );

		// 4. Creamos los buffers
		this.vertbuffer = gl.createBuffer();
		// ...
		this.modelHeight = 0;
	}
	
	// Esta función se llama cada vez que el usuario carga un nuevo
	// archivo OBJ. En los argumentos de esta función llegan un areglo
	// con las posiciones 3D de los vértices, un arreglo 2D con las
	// coordenadas de textura y las normales correspondientes a cada 
	// vértice. Todos los items en estos arreglos son del tipo float. 
	// Los vértices y normales se componen de a tres elementos 
	// consecutivos en el arreglo vertPos [x0,y0,z0,x1,y1,z1,..] y 
	// normals [n0,n0,n0,n1,n1,n1,...]. De manera similar, las 
	// cooredenadas de textura se componen de a 2 elementos 
	// consecutivos y se  asocian a cada vértice en orden. 
	setMesh( vertPos, texCoords )
	{
		// [COMPLETAR] Actualizar el contenido del buffer de vértices y otros atributos..
		this.numTriangles = vertPos.length / 3;
		
		// 1. Binding y seteo del buffer de vértices
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// Get model height
		let min = vertPos[1];
		let max = vertPos[1];
		for (let i = 1; i < vertPos.length; i+=3) {
			min = vertPos[i] < min ? vertPos[i] : min;
			max = vertPos[i] > max ? vertPos[i] : max;
		}
		this.modelHeight = max - min;
	}
	// Esta función se llama para dibujar la malla de triángulos
	// El argumento es la matriz model-view-projection (matrixMVP),
	// la matriz model-view (matrixMV) que es retornada por 
	// GetModelViewProjection y la matriz de transformación de las 
	// normales (matrixNormal) que es la inversa transpuesta de matrixMV
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// [COMPLETAR] Completar con lo necesario para dibujar la colección de triángulos en WebGL
		
		// 1. Seleccionamos el shader
		gl.useProgram( this.prog );
	
		// 2. Setear uniformes con las matrices de transformaciones
		gl.uniformMatrix4fv( this.mvp, false, matrixMVP );
		gl.uniformMatrix4fv( this.mv, false, matrixMV );

		// 4. Habilitar atributos: vértices, normales, texturas
		// verts
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertbuffer );
		gl.enableVertexAttribArray( this.vertPos );
		gl.vertexAttribPointer( this.vertPos, 3, gl.FLOAT, false, 0, 0 ); 


		// 4. Flags
		gl.uniform1f(this.height, this.modelHeight);
		gl.uniform3fv(this.cameraPos, cameraGlobalPos);
		gl.uniform3fv(this.cameraDir, cameraGlobalDir);
		gl.uniformMatrix4fv(this.rotFromCameraUniform, false, rotFromCameraU);
		
		// Dibujamos
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles);

		
	}
	
}



// Vertex Shader
var meshVS = `
	attribute vec3 pos;

	uniform mat4 mvp;
	uniform mat4 mv;

	varying vec3 vertCoord;
	varying vec3 relativeCameraDir;

	uniform mat4 rotationFromCamera;

	void main()
	{ 
		vertCoord = pos;
		gl_Position = mvp * vec4(vec3(1,1,1) * pos,1);
		
		
		vec4 tempCameraDir = mvp * vec4(pos,1);
		tempCameraDir.z = tempCameraDir.z * - 1.0;
		tempCameraDir = normalize(tempCameraDir);
		tempCameraDir.w = 1.0;
		relativeCameraDir = vec3(rotationFromCamera * tempCameraDir);
	}
`;

var meshFS = `
	precision mediump float;

	
	uniform float height;

	// Interior Mapping
	varying vec3 vertCoord;
	varying vec3 relativeCameraDir;
	uniform vec3 globalCameraDir;
	uniform vec3 cameraPos; 


	void main()
	{		
	
		float floorHeight = 0.5;
		float floorWidth = 0.5;

		/*
			float currentCeiling = ceil(vertCoord.y / floorHeight);
			vec3 pointInCeilingPlane = vec3(0, currentCeiling * floorHeight, 0);
			vec3 floorNormal = vec3(0, 1, 0);
			float ceilingDistance = dot(pointInCeilingPlane - cameraPos, floorNormal) / dot(cameraDir, floorNormal);
			vec3 ceilingIntersection = ceilingDistance * cameraDir;

			// TODO maybe this should only be calculated when cameraDir is negative
			float currentFloor = ceil(vertCoord.y / floorHeight) - 1.0;
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

		float horizontalPlane = ceil(vertCoord.y / floorHeight) - floorOffset;
		vec3 pointInHorizontalPlane = vec3(0, horizontalPlane * floorHeight, 0);
		vec3 planeNormal = vec3(0, 1, 0);
		float horizontalPlaneDistance = dot(pointInHorizontalPlane - cameraPos, planeNormal) / dot(relativeCameraDir, planeNormal);
		vec3 horizontalIntersection = horizontalPlaneDistance * relativeCameraDir;

				
		float currentWall = ceil(vertCoord.x / floorWidth);
		vec3 pointInWallPlane = vec3(currentWall * floorWidth, 0, 0);
		vec3 wallNormal = vec3(1, 0, 0);
		float wallDistance = dot(pointInWallPlane - cameraPos, wallNormal) / dot(relativeCameraDir, wallNormal);
		vec3 wallIntersection = wallDistance * relativeCameraDir;
		




		 //gl_FragColor = vec4(abs(globalCameraDir.x),  abs(globalCameraDir.y), abs(globalCameraDir.z), 1);
		
		 
		gl_FragColor = vec4(0, 0,relativeCameraDir.y + globalCameraDir.y, 1);
		//gl_FragColor = vec4(0, vertCoord.x,0, 1);
		//gl_FragColor = vec4(0, 0, 0.7, 1);
		
	}
`;

