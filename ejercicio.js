
let cameraPosYeah = [0,0,0];

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


	// First person based movement
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

//    var mv = MatrixMult(trans,rot) // Original rotate around
	var mv = MatrixMult(rotForObject, trans) 

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
		this.mn = gl.getUniformLocation( this.prog, 'mn' );
		this.lightDir = gl.getUniformLocation( this.prog, 'lightDir');
		this.alpha = gl.getUniformLocation( this.prog, 'alpha');
		this.height = gl.getUniformLocation( this.prog, 'height');
		this.cameraPos = gl.getUniformLocation( this.prog, 'cameraPos');

			// Flags
		this.showTextureFlag = gl.getUniformLocation(this.prog, 'showTexture');

		// 3. Obtenemos los IDs de los atributos de los vértices en los shaders
		this.vertPos = gl.getAttribLocation( this.prog, 'pos' );
		this.texCoords = gl.getAttribLocation( this.prog, 'coord' );
		this.normals = gl.getAttribLocation( this.prog, 'normals' );

		// 4. Creamos los buffers
		this.vertbuffer = gl.createBuffer();
		this.texbuffer = gl.createBuffer();
		this.normalbuffer = gl.createBuffer();
		// ...
		this.lightDirVector = [0, 0, 0];
		this.shininess = 1;
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
	setMesh( vertPos, texCoords, normals )
	{
		// [COMPLETAR] Actualizar el contenido del buffer de vértices y otros atributos..
		this.numTriangles = vertPos.length / 3 / 3;
		
		// 1. Binding y seteo del buffer de vértices
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// 2. Binding y seteo del buffer de coordenadas de textura	
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
	  	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		// 3. Binding y seteo del buffer de normales	
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
	  	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

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
		gl.uniformMatrix3fv( this.mn, false, matrixNormal );

		// 4. Habilitar atributos: vértices, normales, texturas
		// verts
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertbuffer );
		gl.vertexAttribPointer( this.vertPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vertPos );
		// textures
		gl.bindBuffer( gl.ARRAY_BUFFER, this.texbuffer );
		gl.vertexAttribPointer( this.texCoords, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.texCoords );
		// normals
		gl.bindBuffer( gl.ARRAY_BUFFER, this.normalbuffer );
		gl.vertexAttribPointer( this.normals, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.normals );

		// 4. Flags
		gl.uniform1i(this.showTextureFlag, this.show);
		gl.uniform3fv(this.lightDir, this.lightDirVector);
		gl.uniform1f(this.alpha, this.shininess);
		gl.uniform1f(this.height, this.modelHeight);
		gl.uniform3fv(this.cameraPos, cameraPosYeah);
		
		// Dibujamos
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles * 3 );

		
	}
	
	// Esta función se llama para setear una textura sobre la malla
	// El argumento es un componente <img> de html que contiene la textura. 
	setTexture( img )
	{
		// [COMPLETAR] Binding de la textura
		const textura = gl.createTexture();
		gl.bindTexture( gl.TEXTURE_2D, textura);
		gl.texImage2D( gl.TEXTURE_2D, // Textura 2D
			0, // Mipmap nivel 0
			gl.RGB, // formato (en GPU)
			gl.RGB, // formato del input
			gl.UNSIGNED_BYTE, // tipo
			img // arreglo o <img>
		);
		
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.activeTexture( gl.TEXTURE0 );
		gl.bindTexture( gl.TEXTURE_2D, textura);

		var sampler = gl.getUniformLocation(this.prog, 'texGPU' );
		gl.useProgram(this.prog );
		gl.uniform1i (sampler, 0 );

		// Mostrar la textura por default cuando se carga una si no se toco el checkbox
		if (this.show== null){
			this.show = true;
		}
	}
		
        // Esta función se llama cada vez que el usuario cambia el estado del checkbox 'Mostrar textura'
	// El argumento es un boleano que indica si el checkbox está tildado
	showTexture( show )
	{
		this.show = show;
	}
	
	// Este método se llama al actualizar la dirección de la luz desde la interfaz
	setLightDir( x, y, z )
	{		
		this.lightDirVector = [x, y, z];
	}
		
	// Este método se llama al actualizar el brillo del material 
	setShininess( shininess )
	{		
		// [COMPLETAR] Setear variables uniformes en el fragment shader para especificar el brillo.
		this.shininess = shininess;
	}
}



// [COMPLETAR] Calcular iluminación utilizando Blinn-Phong.

// Recordar que: 
// Si declarás las variables pero no las usás, es como que no las declaraste
// y va a tirar error. Siempre va punto y coma al finalizar la sentencia. 
// Las constantes en punto flotante necesitan ser expresadas como x.y, 
// incluso si son enteros: ejemplo, para 4 escribimos 4.0.

// Vertex Shader
var meshVS = `
	attribute vec3 pos;
	attribute vec2 coord;
	attribute vec3 normals;

	uniform mat4 mvp;
	uniform mat4 mv;

	varying vec2 texCoord;
	varying vec3 normCoord;

	varying vec3 vertCoord;
	varying vec3 cameraDir;

	void main()
	{ 
		texCoord = coord;
		normCoord = normals;

		vertCoord = pos;
		cameraDir = vec3(mvp * vec4(pos,1));
		gl_Position = mvp * vec4(vec3(1,1,1) * pos,1);
	}
`;

// Fragment Shader
// Algunas funciones útiles para escribir este shader:
// Dot product: https://thebookofshaders.com/glossary/?search=dot
// Normalize:   https://thebookofshaders.com/glossary/?search=normalize
// Pow:         https://thebookofshaders.com/glossary/?search=pow

var meshFS = `
	precision mediump float;

	uniform mat3 mn;
	uniform sampler2D texGPU;
	uniform bool showTexture;

	uniform vec3 lightDir;
	uniform float alpha;

	uniform float height;

	varying vec2 texCoord;
	varying vec3 normCoord;

	// Interior Mapping
	varying vec3 vertCoord;
	varying vec3 cameraDir;
	uniform vec3 cameraPos; // TODO calculate from mv matrix?

	void main()
	{		
	
		float floorHeight = 0.5;
		
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
		
/*
		vec3 floorNormal = vec3(0, 1, 0);
		float currentFloor = ceil(vertCoord.y / floorHeight);
		if (cameraDir.y < 0.0) {
			currentFloor -= 1.0;
		}

		vec3 pointInFloorPlane = vec3(0, currentFloor * floorHeight, 0);
		float floorDistance = dot(pointInFloorPlane - cameraPos, floorNormal) / dot(cameraDir, floorNormal);
		vec3 floorIntersection = floorDistance * cameraDir;
*/
		
		float currentWall = ceil(vertCoord.x / floorHeight);
		vec3 pointInWallPlane = vec3(currentWall * floorHeight, 0, 0);
		vec3 wallNormal = vec3(1, 0, 0);
		float wallDistance = dot(pointInWallPlane - cameraPos, wallNormal) / dot(cameraDir, wallNormal);
		vec3 wallIntersection = wallDistance * cameraDir;
		

		if (distance(floorIntersection, cameraPos) < distance(ceilingIntersection, cameraPos)) {
		//if (cameraDir.y < 0.0) {
			gl_FragColor = vec4(0, 0, 1, 1) / (currentFloor+1.0);	
		} else {
			gl_FragColor = vec4(0, 1, 0, 1) / (currentFloor+1.0);	
		}

		//gl_FragColor = vec4(cameraPos.z, 0, 0, 1);
		//gl_FragColor = vec4(vertCoord.x, 0, vertCoord.z, 1);
		//gl_FragColor = vec4(cameraDir.x, cameraDir.y, 0, 1);	
		





		vec3 cameraSpaceVert = cameraDir;

		gl_FragColor = vec4(abs(cameraDir.x), 0, abs(cameraDir.y), 1);
		
	}
`;

