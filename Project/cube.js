var canvas;
var gl;

var NumVertices = 0;
var points = [];
var colors = [];
var pointers = [];
var cubes = [];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var matrixLocation;
var cubeM = 9;
var cameraX = 30;
var cameraY = 3;

var c = false;
var z = false;
var y = false;
var x = false;
var sh = false;
var shdown = false;
var zz = 2;
var xx = 0;
var yy = 1;

var index = [];
var lock = true;

var vBuffer;
var cBuffer;
var stack = [];
var sch = [];

function reverse() {
    //reserving one move
    if (stack.length > 0)
        sch.push(stack.pop(), stack.pop(), stack.pop());

}
function reverseAll() // calling reverse many times to reverse all move. 
{
    var l = stack.length / 3;
    for (var i = 0; i < l; i++) {
        reverse();
    }
    ;
}

function chaos(n) {
    //scramble the cube, by adding into the schedule queue iwth random parameters. 
    n = n * 10;
    var axis;
    var num;
    var command;
    for (var i = 0; i < n; i++) {
        axis = Math.floor((Math.random() * 3));
        num = Math.floor((Math.random() * cubeM));
        command = Math.floor((Math.random() * 2));
        schedule(axis, num, command);
        console.log(i);
    }

}

function face() //making the selection of face to be rotated relative to the perspective
//instead of based on absolute three dimension 
{
    //adjusting cameraX to be >0 and <360 degrees 
    if (cameraX > 360)
        cameraX = cameraX % 360;
    if (cameraX < 0)
        cameraX += 360;

    //adjusting axises relative to the perspective of user
    if (cameraX > 315 || cameraX < 45) {
        xx = 0;
        yy = 1;
        zz = 2;
    }
    ;if (cameraX > 45 && cameraX < 135) {
        xx = 0;
        yy = -2;
        zz = 1;
    }
    ;if (cameraX > 135 && cameraX < 225) {
        xx = 0;
        yy = -1;
        zz = -2;
    }
    ;if (cameraX > 225 && cameraX < 315) {
        xx = 0;
        yy = 2;
        zz = -1;
    }
    ;

}

function schedule(axis, num, command) {

    //sch means, schedule, used as a queue, of sequence of command 
    sch.push(axis, num, command);

    //recording instruction issued by user, used by the function "reverse" 
    stack.push(!command, num, axis);

}
function runner() {
    //the fuction that consume the schedule queue, and calling to rotate the face 
    //loack was used because you cannot rotate more face at once physically, and 
    // for animation purpose, it should only allow one rotatino at once, as mutual exclusive events.
    if (lock && (sch.length > 0)) {
        basicRotation(sch.shift(), sch.shift(), sch.shift());

    }
}
function basicRotation(axis, num, command) {
    // a function that manage face rotation

    //adjust for negative axis, due to the adjustment of user's perspective
    if (axis < 0) {
        num = cubeM - 1 - num;
        command = !command;
        axis = -axis;
    }
    ;
    //control of the direction of the rotatino
    var c = 1;
    if (command == 0)
        c = -c;

    //index: indicate the index of cubes that will be rotated 
    index = [];

    //the actual axis, "var axis" was only a control code
    var axis2;

    //initialize the indexs, and setting the axis2 .
    switch (axis) {
    case 1:
        num = num * cubeM * cubeM;
        for (var i = 0; i < cubeM * cubeM; i++) {
            index.push(num + i);
        }
        axis2 = [1, 0, 0];
        break;

    case 0:
        num = num * cubeM;
        for (var i = 0; i < cubeM; i++) {
            for (var j = 0; j < cubeM; j++) {
                index.push(cubeM * cubeM * j + i + num);
            }
        }
        ;axis2 = [0, 1, 0];
        break;
    case 2:

        for (var i = 0; i < cubeM * cubeM; i++) {

            index.push(i * cubeM + num);
        }

        ;axis2 = [0, 0, 1];
        break;
    }

    //function is entering critical section, locking the permission 
    lock = false;

    var frame = 9;
    // frames that will be calculated 
    if (cubeM > 7)
        // for cubeM >7, 8x8x8 and 9x9x9 cubes will have a significant drop in performance,
        frame = 3;
    // therefore lowering the frames

    var angle = 90 / frame;
    var delay = 450;

    //animating the rotation.
    for (var j = 0; j < frame; j++) {

        setTimeout(function() {
            for (var i = 0; i < cubeM * cubeM; i++) {

                cubes[pointers[index[i]]].rotate(angle * c, axis2);

                gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
            }
        }, delay / frame * (j + 1))

    }

    //unlocking the lock
    setTimeout(function() {
        lock = true
    }, delay);

    var s = Math.floor(cubeM / 2 - 1);
    // a variable used to locate cubes of the face that needed to be reallocate of pointers. 

    var index2 = [];

    //finding pointers that needed to reallocate 
    for (var i = 0; i < Math.floor(cubeM / 2); i++) {

        var w = cubeM - s * 2;
        //width of the square 

        //the lower horizontal line of the square 
        for (var x = 0; x < w; x++)
            index2.push(index[x + s * cubeM + s]);

        //the left vertical  line of the square 
        for (var y = 1; y < w; y++)
            index2.push(index[y * cubeM + s * cubeM + s + w - 1]);

        //the higher horizontal line of the square 
        for (var x = 1; x < w; x++)
            index2.push(index[-x + s * cubeM + s + w - 1 + (w - 1) * cubeM]);

        //the right vertical  line of the square 
        for (var y = 1; y < w - 1; y++)
            index2.push(index[-y * cubeM + s * cubeM + s + (w - 1) * cubeM]);

        //calling function to reallocate the pointers.
        pointRotate(index2, command);

        index2 = [];
        s--;
    }

}

function pointRotate(index2, c) {
    //reallocate the pointers, c is the direction of reallocation

    var s = index2.length / 4;

    var clone = index2.slice();
    var pointers2 = pointers.slice();

    if (c) {

        for (var i = s; i < index2.length + s; i++) {

            pointers[index2[(i - s) % (index2.length)]] = pointers2[clone[(i) % (index2.length)]]

        }

        return;
    }

    for (var i = 0; i < index2.length; i++) {

        pointers[index2[(i + s) % (index2.length)]] = pointers2[clone[(i)]];

    }

}

function reset() {
    //reseting everything to the initial state, except cubeM

    index = [];
    cameraX = 30;
    cameraY = 3;
    xx = 1;
    yy = 0;
    zz = 2;
    stack = [];
    sch = [];
    var npointers = [];
    var nNumVertices = 0;
    var npoints = [];
    var ncolors = [];
    var ncubes = [];
    for (var i = 0; i < cubeM * cubeM * cubeM; i++) {
        npointers.push(i);
    }

    var cube = new cubeModel();

    for (var i = 0; i < cubeM; i++) {
        for (var j = 0; j < cubeM; j++) {
            for (var k = 0; k < cubeM; k++) {

                nNumVertices += cube.NumVertices;

                cube.scale(1 / cubeM, 1 / cubeM, 1 / cubeM);
                cube.translate(-.5 + 1 / (2 * cubeM) + 1.00501 * i / cubeM, -.5 + 1 / (2 * cubeM) + 1.005 * j / cubeM, -.5 + 1 / (2 * cubeM) + 1.005 * k / cubeM);

                ncubes.push(cube);
                npoints = npoints.concat(cube.points);

                ncolors = ncolors.concat(cube.colors);
 
                cube = new cubeModel();
            }
        }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(npoints));
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(ncolors));
    pointers = npointers;
    NumVertices = nNumVertices;
    points = npoints;
    colors = ncolors;
    cubes = ncubes;
    cRotate();
}
;
window.onload = function init() {

    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    //initialize pointers 
    for (var i = 0; i < cubeM * cubeM * cubeM; i++) {
        pointers.push(i);
    }

    
    //initialize cubes 
    var cube = new cubeModel();
    for (var i = 0; i < cubeM; i++) {
        for (var j = 0; j < cubeM; j++) {
            for (var k = 0; k < cubeM; k++) {

                NumVertices += cube.NumVertices;

                //place the cube 
                cube.scale(1 / cubeM, 1 / cubeM, 1 / cubeM);
                cube.translate(-.5 + 1 / (2 * cubeM) + 1.00501 * i / cubeM, -.5 + 1 / (2 * cubeM) + 1.005 * j / cubeM, -.5 + 1 / (2 * cubeM) + 1.005 * k / cubeM);
                
                cubes.push(cube);
                this.points = this.points.concat(cube.points);
                this.colors = this.colors.concat(cube.colors);

                //getting the next cube 
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

    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.DYNAMIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.DYNAMIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    matrixLocation = gl.getUniformLocation(program, "u_matrix");

    //event listeners for rotatetions 
    window.addEventListener("keyup", function() {
        // console.log(event.keyCode);
        switch (event.keyCode) {
        case 67:  // key C
            c = false;
            break;

        case 16:  // key  shift 
            shdown = false;
            break;
        case 88:  // key x
            x = false;
            break;
        case 89: // key y
            y = false;
            break;
        case 90:   // key z
            z = false;
            break;
        }
    });

    window.addEventListener("keydown", function() {
   
        switch (event.keyCode) {
        case 67: // key  c 
            c = true;
            break;
        case 82:  // key r 
            if (shdown) {
                reverseAll();
                break;
            }
            reverse();
            break;
        case 187:
        case 107:
            // key "=" (on the left of backspace) and key + on the number pad 
            //increment the dimension of the cube 
            if (cubeM < 9) {
                cubeM++;
                reset();
            }

            break;
        case 189:
        case 109:
            // key "-" (on the left of backspace) and key - on the number pad 
            //decrement the dimension of the cube 
            if (cubeM > 2) {
                cubeM--;
                reset();
            }

            break;

        case 38:
        case 87:
            // key W and "arrow up"
            //rotate camera up

            if (cameraY - 1.5 < -19) {
                break;
            }
            cameraY -= 1.5;
            cRotate();

            break;
        case 40:
        case 83:
        // key S and "arrow down"
            //rotate camera down

            if (cameraY + 1.5 > 19) {
                break;
            }
            cameraY += 1.5;
            cRotate();

            break;
        case 37:
        case 65:
            // key A and "arrow left"
            //rotate left

            cameraX += 5;

            cRotate();
            break;
        case 39:
        case 68:
             // key D and "arrow right"
            //rotate right

            cameraX -= 5;

            cRotate();
            break;

        case 16://key shift 
            shdown = true;
            sh = !sh;
            break;

        case 49:
        case 97:
         //key 1 and 1 on number pad
         //used to rotate faces, randomlize the cube, and adjust perspective 
            if (x) {
                if (1 > cubeM)
                    break;
                this.schedule(xx, 0, sh);
                // basicRotation(1, 0, sh);
                break;
            }
            if (y) {
                if (1 > cubeM)
                    break;
                this.schedule(yy, 0, sh);
                break;
            }
            if (z) {
                if (1 > cubeM)
                    break;
                this.schedule(zz, 0, sh);
                break;
            }
            if (c) {
                this.chaos(1);
                break;
            }
            //  }
            if (x || y || z) {
                break;
            }
            cameraX = -45;
            cameraY = 6.5;
            cRotate();
            break;
        case 50:
        case 98:
           //key 2 and 2 on number pad
         //used to rotate faces, randomlize the cube, and adjust perspective
            if (c) {
                this.chaos(2);
                break;
            }
            if (x) {
                if (2 > cubeM)
                    break;
                this.schedule(xx, 1, sh);
                break;
            }
            if (y) {
                if (2 > cubeM)
                    break;
                this.schedule(yy, 1, sh);
                break;
            }
            if (z) {
                if (2 > cubeM)
                    break;
                this.schedule(zz, 1, sh);
                break;
            }
            // }
            if (x || y || z) {
                break;
            }
            cameraY = -18;
            cRotate();

            break;
        case 51:
        case 99:
         //key 3 and 3 on number pad
         //used to rotate faces, randomlize the cube, and adjust perspective
            if (c) {
                this.chaos(3);
                break;
            }
            

            if (x) {
                if (3 > cubeM)
                    break;
                this.schedule(xx, 2, sh);
                break;
            }
            if (y) {
                if (3 > cubeM)
                    break;
                this.schedule(yy, 2, sh);
                break;
            }
            if (z) {
                if (3 > cubeM)
                    break;
                this.schedule(zz, 2, sh);
                break;
            }
      
            if (x || y || z) {
                break;
            }
            cameraX = 45;
            cameraY = 6.5;
            cRotate();
            break;
        case 52:
        case 100:
        //key 4 and 4 on number pad
         //used to rotate faces, randomlize the cube, and adjust perspective
            if (c) {
                this.chaos(4);
                break;
            }
            // if (lock) {

            if (x) {
                if (4 > cubeM)
                    break;
                this.schedule(xx, 3, sh);
                break;
            }
            if (y) {
                if (4 > cubeM)
                    break;
                this.schedule(yy, 3, sh);
                break;
            }
            if (z) {
                if (4 > cubeM)
                    break;
                this.schedule(zz, 3, sh);
                break;
            }
            //  }
            if (x || y || z) {
                break;
            }
            //rotate right 3
            cameraX = -105;
            cameraY = 2;
            cRotate();
            break;
        case 53:
        case 101:
        //key 5 and 5 on number pad
         //used to rotate faces, randomlize the cube, and adjust perspective
            if (c) {
                this.chaos(5);
                break;
            }
            //   if (lock) {

            if (x) {
                if (5 > cubeM)
                    break;
                this.schedule(xx, 4, sh);
                break;
            }
            if (y) {
                if (5 > cubeM)
                    break;
                this.schedule(yy, 4, sh);
                break;
            }
            if (z) {
                if (5 > cubeM)
                    break;
                this.schedule(zz, 4, sh);
                break;
            }
            // }
            if (x || y || z) {
                break;
            }
            //rotate 
            if (cameraX != -10)
                cameraX = -10;
            else
                cameraX = 170;

            cameraY = 2;

            cRotate();
            break;
        case 54:
        case 102:
        //key 6 and 6 on number pad
         //used to rotate faces, randomlize the cube, and adjust perspective
            if (c) {
                this.chaos(6);
                break;
            }
            //if (lock) {

            if (x) {
                if (6 > cubeM)
                    break;
                this.schedule(xx, 5, sh);
                break;
            }
            if (y) {
                if (6 > cubeM)
                    break;
                this.schedule(yy, 5, sh);
                break;
            }
            if (z) {
                if (6 > cubeM)
                    break;
                this.schedule(zz, 5, sh);
                break;
            }
            // }
            if (x || y || z) {
                break;
            }
            //rotate down
            cameraX = 75;
            cameraY = 2;
            cRotate();
            break;
        case 55:
        case 103:
        //key 7 and 7 on number pad
         //used to rotate faces, randomlize the cube, and adjust perspective
            if (c) {
                this.chaos(7);
                break;
            }
            // if (lock) {

            if (x) {
                if (7 > cubeM)
                    break;
                this.schedule(xx, 6, sh);
                break;
            }
            if (y) {
                if (7 > cubeM)
                    break;
                this.schedule(yy, 6, sh);
                break;
            }
            if (z) {
                if (7 > cubeM)
                    break;
                this.schedule(zz, 6, sh);
                break;
            }
            // }
            if (x || y || z) {
                break;
            }
            //rotate down
            cameraX = -135;
            cameraY = 6.5;
            cRotate();
            break;
        case 56:
        case 104:
        //key 8 and 8 on number pad
         //used to rotate faces, randomlize the cube, and adjust perspective
            if (c) {
                this.chaos(8);
                break;
            }
            //  if (lock) {

            if (x) {
                if (8 > cubeM)
                    break;
                this.schedule(xx, 07, sh);
                break;
            }
            if (y) {
                if (8 > cubeM)
                    break;
                this.schedule(yy, 7, sh);
                break;
            }
            if (z) {
                if (8 > cubeM)
                    break;
                this.schedule(zz, 7, sh);
                break;
            }
            //   }
            if (x || y || z) {
                break;
            }
            //rotate down

            cameraY = 18;
            cRotate();
            break;
        case 57:
        case 105:
        //key 9 and 9 on number pad
         //used to rotate faces, randomlize the cube, and adjust perspective
            if (c) {
                this.chaos(9);
                break;
            }
            //  if (lock) {

            if (x) {
                if (9 > cubeM)
                    break;
                this.schedule(xx, 8, sh);
                break;
            }
            if (y) {
                if (9 > cubeM)
                    break;
                this.schedule(yy, 8, sh);
                break;
            }
            if (z) {
                if (9 > cubeM)
                    break;
                this.schedule(zz, 8, sh);
                break;
            }
            // }
            if (x || y || z) {
                break;
            }
            //rotate down
            cameraX = -225;
            cameraY = 6.5;
            cRotate();
            break;
        case 27:
            //reset key:esc

            reset();
            break;
        case 88:
            x = true;
            break;
        case 89:
            y = true;
            break;
        case 90:
            z = true;
            break;
        }
    });

    //initialize the cube to dimension of 2
    z = false;
    y = false;
    x = false;
    cubeM = 2;
    reset();
    cRotate();
    // basicRotation(0);
    render();
}
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
    runner(); // consume and run the next animation
    setTimeout(requestAnimFrame(render), 100);
}

// Converts from degrees to radians. from:http://cwestblog.com/2012/11/12/javascript-degree-and-radian-conversion/
Math.radians = function(degrees) {
    return degrees * Math.PI / 180;
}
;

// Converts from radians to degrees.from :http://cwestblog.com/2012/11/12/javascript-degree-and-radian-conversion/
Math.degrees = function(radians) {
    return radians * 180 / Math.PI;
}
;

function cRotate() {
    //based on :https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 4;
    var zFar = 40;
    var projectionMatrix = m4.perspective(Math.radians(30), aspect, zNear, zFar);

    //look at origin
    var fPosition = [0, 0, 0];

    // Use matrix math to compute a position on a circle where
    // the camera is
    var cameraMatrix = m4.yRotation(Math.radians(cameraX));

   

    cameraMatrix = m4.translate(cameraMatrix, 0, cameraY, -5);
    var cameraPosition = [cameraMatrix[12], cameraMatrix[13], cameraMatrix[14], ];

    var up = [0, 1, 0];

    // Compute the camera's matrix using look at.
    var cameraMatrix = m4.lookAt(cameraPosition, fPosition, up);

    // Make a view matrix from the camera matrix
    var viewMatrix = m4.inverse(cameraMatrix);

    // Compute a view projection matrix
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    var matrix = m4.translate(viewProjectionMatrix, 0, 0, 0);

    // Set the matrix.
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    //adjust for axis rotated for every camera perspective change 
    face();

};

var m4 = {
    //from :https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html

    lookAt: function(cameraPosition, target, up) {
        var zAxis = normalize(subtractVectors(cameraPosition, target));
        var xAxis = cross(up, zAxis);
        var yAxis = cross(zAxis, xAxis);

        return [xAxis[0], xAxis[1], xAxis[2], 0, yAxis[0], yAxis[1], yAxis[2], 0, zAxis[0], zAxis[1], zAxis[2], 0, cameraPosition[0], cameraPosition[1], cameraPosition[2], 1, ];
    },

    perspective: function(fieldOfViewInRadians, aspect, near, far) {
        var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
        var rangeInv = 1.0 / (near - far);

        return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (near + far) * rangeInv, -1, 0, 0, near * far * rangeInv * 2, 0];
    },

    projection: function(width, height, depth) {
        // Note: This matrix flips the Y axis so 0 is at the top.
        return [2 / width, 0, 0, 0, 0, -2 / height, 0, 0, 0, 0, 2 / depth, 0, -1, 1, 0, 1, ];
    },

    multiply: function(a, b) {
        var a00 = a[0 * 4 + 0];
        var a01 = a[0 * 4 + 1];
        var a02 = a[0 * 4 + 2];
        var a03 = a[0 * 4 + 3];
        var a10 = a[1 * 4 + 0];
        var a11 = a[1 * 4 + 1];
        var a12 = a[1 * 4 + 2];
        var a13 = a[1 * 4 + 3];
        var a20 = a[2 * 4 + 0];
        var a21 = a[2 * 4 + 1];
        var a22 = a[2 * 4 + 2];
        var a23 = a[2 * 4 + 3];
        var a30 = a[3 * 4 + 0];
        var a31 = a[3 * 4 + 1];
        var a32 = a[3 * 4 + 2];
        var a33 = a[3 * 4 + 3];
        var b00 = b[0 * 4 + 0];
        var b01 = b[0 * 4 + 1];
        var b02 = b[0 * 4 + 2];
        var b03 = b[0 * 4 + 3];
        var b10 = b[1 * 4 + 0];
        var b11 = b[1 * 4 + 1];
        var b12 = b[1 * 4 + 2];
        var b13 = b[1 * 4 + 3];
        var b20 = b[2 * 4 + 0];
        var b21 = b[2 * 4 + 1];
        var b22 = b[2 * 4 + 2];
        var b23 = b[2 * 4 + 3];
        var b30 = b[3 * 4 + 0];
        var b31 = b[3 * 4 + 1];
        var b32 = b[3 * 4 + 2];
        var b33 = b[3 * 4 + 3];

        return [b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30, b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31, b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32, b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33, b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30, b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31, b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32, b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33, b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30, b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31, b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32, b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33, b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30, b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31, b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32, b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33, ];
    },

    translation: function(tx, ty, tz) {
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1, ];
    },

    xRotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, ];
    },

    yRotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1, ];
    },

    zRotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);

        return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, ];
    },

    scaling: function(sx, sy, sz) {
        return [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1, ];
    },

    translate: function(m, tx, ty, tz) {
        return m4.multiply(m, m4.translation(tx, ty, tz));
    },

    xRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.xRotation(angleInRadians));
    },

    yRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.yRotation(angleInRadians));
    },

    zRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.zRotation(angleInRadians));
    },

    scale: function(m, sx, sy, sz) {
        return m4.multiply(m, m4.scaling(sx, sy, sz));
    },

    inverse: function(m) {
        var m00 = m[0 * 4 + 0];
        var m01 = m[0 * 4 + 1];
        var m02 = m[0 * 4 + 2];
        var m03 = m[0 * 4 + 3];
        var m10 = m[1 * 4 + 0];
        var m11 = m[1 * 4 + 1];
        var m12 = m[1 * 4 + 2];
        var m13 = m[1 * 4 + 3];
        var m20 = m[2 * 4 + 0];
        var m21 = m[2 * 4 + 1];
        var m22 = m[2 * 4 + 2];
        var m23 = m[2 * 4 + 3];
        var m30 = m[3 * 4 + 0];
        var m31 = m[3 * 4 + 1];
        var m32 = m[3 * 4 + 2];
        var m33 = m[3 * 4 + 3];
        var tmp_0 = m22 * m33;
        var tmp_1 = m32 * m23;
        var tmp_2 = m12 * m33;
        var tmp_3 = m32 * m13;
        var tmp_4 = m12 * m23;
        var tmp_5 = m22 * m13;
        var tmp_6 = m02 * m33;
        var tmp_7 = m32 * m03;
        var tmp_8 = m02 * m23;
        var tmp_9 = m22 * m03;
        var tmp_10 = m02 * m13;
        var tmp_11 = m12 * m03;
        var tmp_12 = m20 * m31;
        var tmp_13 = m30 * m21;
        var tmp_14 = m10 * m31;
        var tmp_15 = m30 * m11;
        var tmp_16 = m10 * m21;
        var tmp_17 = m20 * m11;
        var tmp_18 = m00 * m31;
        var tmp_19 = m30 * m01;
        var tmp_20 = m00 * m21;
        var tmp_21 = m20 * m01;
        var tmp_22 = m00 * m11;
        var tmp_23 = m10 * m01;

        var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) - (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
        var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) - (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
        var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) - (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
        var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) - (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

        var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

        return [d * t0, d * t1, d * t2, d * t3, d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) - (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)), d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) - (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)), d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) - (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)), d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) - (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)), d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) - (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)), d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) - (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)), d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) - (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)), d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) - (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)), d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) - (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)), d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) - (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)), d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) - (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)), d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) - (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02))];
    },

    vectorMultiply: function(v, m) {
        var dst = [];
        for (var i = 0; i < 4; ++i) {
            dst[i] = 0.0;
            for (var j = 0; j < 4; ++j)
                dst[i] += v[j] * m[j * 4 + i];
        }
        return dst;
    },

};
function subtractVectors(a, b) {
    //from :https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function normalize(v) {
    //from :https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html
    var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // make sure we don't divide by 0.
    if (length > 0.00001) {
        return [v[0] / length, v[1] / length, v[2] / length];
    } else {
        return [0, 0, 0];
    }
}

function cross(a, b) {
    //from :https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
