<script>
var canvas;
var gl;

var NumVertices = 0;

var points = [];
var colors = [];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var theta = [0, 0, 0];

var thetaLoc;

var cubeM = 3;
var rotateV = 5;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    var cube = new cubeModel();

    for (var i = 0; i < cubeM; i++) {
        for (var j = 0; j < cubeM; j++) {
            for (var k = 0; k < cubeM; k++) {
                console.log(i);
                NumVertices += 36;
                //cube.scale(1/2,1/2,1/2);
                cube.scale(1 / cubeM, 1 / cubeM, 1 / cubeM);
                cube.translate(-.5 + 1 / (2 * cubeM) + 1.1 * i / cubeM, -.5 + 1 / (2 * cubeM) + 1.1 * j / cubeM, -.5 + 1 / (2 * cubeM) + 1.1 * k / cubeM);
                //  cube.translate(-1+(1/cubeM)/2,0,0);

                this.points = this.points.concat(cube.points);

                this.colors = this.colors.concat(cube.colors);

                cube = new cubeModel();
            }
        }
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    thetaLoc = gl.getUniformLocation(program, "theta");

    //event listeners for rotatetions 

   
    window.addEventListener("keydown", function() {
console.log(event.keyCode);
        switch (event.keyCode) {

        case 38: case 87:
            //rotate up
            theta[0] +=rotateV;
            break;
       case 40: case 83:
            //rotate down
            theta[0] -=rotateV;
            break;
        case 37: case 65:
            //rotate left
            theta[1] +=rotateV;
            break;
        case 39: case 68:
            //rotate right
            theta[1] -=rotateV;
            break;
        }
    });

    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    theta[axis] += 0.0;
    gl.uniform3fv(thetaLoc, theta);

    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);

    requestAnimFrame(render);
}
</script>
