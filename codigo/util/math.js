// Multiplica 2 matrices column major y devuelve B*A, lo que equivale a A*B en matrices row major.
// Los argumentos y el resultado son arreglos que representan matrices en orden column-major
// Por propiedades de matrices, (A*B)^t = B^t * A^t. Al estar en column major tomamos A = A^t y B = B^t, luego invertimos el orden de multiplicacion.
function MatrixMult( A, B )
{
	var C = [];
	for ( var i=0; i<4; ++i ) 
	{
		for ( var j=0; j<4; ++j ) 
		{
			var v = 0;
			for ( var k=0; k<4; ++k ) 
			{
				v += A[j+4*k] * B[k+4*i];
			}

			C.push(v);
		}
	}
	return C;
}
// Multiplica 2 matrices y devuelve A*u.
// Los matriz se espera en orden column-major, el vector esperado y el resultado son vectores comunes
function MatrixVectorMult (A, u) {
	var C = [];
	for ( var j=0; j<4; ++j ) 
	{
		var v = 0;
		for ( var k=0; k<4; ++k ) 
		{
			v += A[j+4*k] * u[k];
		}

		C.push(v);
	}
	return C;
}
