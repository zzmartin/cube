"use strict";

function cubeModel() {
    var result = {};

    var NumVertices = 0;
    var points = new Array();
    var colors = new Array();
    var vertices = new Array(vec4(-0.5, -0.5, 0.5, 1.0),vec4(-0.5, 0.5, 0.5, 1.0),vec4(0.5, 0.5, 0.5, 1.0),vec4(0.5, -0.5, 0.5, 1.0),vec4(-0.5, -0.5, -0.5, 1.0),vec4(-0.5, 0.5, -0.5, 1.0),vec4(0.5, 0.5, -0.5, 1.0),vec4(0.5, -0.5, -0.5, 1.0));
    //vertice of the base of the cube: all of them are BLACK

    var vertices2 = new Array();
    //vetices of the colors, another layer above the BLACK cube 

    var vertexColors = [[0.0, 0.0, 0.0, 1.0], // black

    [0.0, 0.0, 1.0, .8], // blue
    [1.0, 0.0, 1.0, 0.8], // magenta
    [1.0, 1.0, 0.0, 0.8], // yellow
    [0.0, 1.0, 0.0, .8], // green
    [1.0, 0.0, 0.0, .8], // red
    [1.0, 1.0, 1.0, .8], // white

    [0.0, 1.0, 1.0, .8]// cyan
    ];

    colorCube();
    result.points = points;
    result.colors = colors;

    result.NumVertices = NumVertices;
    result.translate = translate;
    result.scale = scale;
    result.rotate = rotate;

    return result;

    function colorCube() {
        quad(1, 0, 3, 2);
        quad(2, 3, 7, 6);
        quad(3, 0, 4, 7);
        quad(6, 5, 1, 2);
        quad(4, 5, 6, 7);
        quad(5, 4, 0, 1);
    }

    function quad(a, b, c, d) {

        // We need to parition the quad into two triangles in order for
        // WebGL to be able to render it.  In this case, we create two
        // triangles from the quad indices

        //vertex color assigned by the index of the vertex

        var indices = [a, b, c, a, c, d];

        for (var i = 0; i < indices.length; ++i) {
            NumVertices++;
            points.push(vertices[indices[i]]);
            //colors.push( vertexColors[indices[i]] );

            // for the base of BLACK cube 
            colors.push(vertexColors[0]);

        }

        edges(a, b, c, d);  // calling function to add color on top of the black cube 
    }
    function center(a, b, c, d) { //return the mid point of the four points 
        var m = mix(a, b, .5);
        var m1 = mix(c, d, .5);
        return mix(m, m1, .5);

    }
    function edges(a, b, c, d) {
        var destination = [];
        var origin = vec4(0, 0, 0, 1);
        var indices = [a, b, c, d];

        //pushing the points outwards from the origin, resulting a bigger square 
        for (var i = 0; i < indices.length; ++i) {
            // NumVertices++;
            destination.push(mix(origin, vertices[indices[i]], 1.01));
        }


        //finding the mid points of the bigger squire 
        var midPoint = center(destination[0], destination[1], destination[2], destination[3]);
        
      // pulling the vetices towards the midpoint, resulting a layer covering the base black cube.
        var location = [];
        for (var i = 0; i < indices.length; ++i) {
            // NumVertices++;
            location.push(mix(midPoint, destination[i], .9));
        }

        for (var i = 0; i < 4; ++i) {
            vertices2.push(location[i]);
        }

        var length = vertices2.length;
        length = length - 4;

        indices = [0, 1, 2, 0, 2, 3];
        for (var i = 0; i < indices.length; ++i) {
            NumVertices++;

            points.push(vertices2[indices[i] + length]);
            //colors.push( vertexColors[indices[i]] );

            // for solid colored faces use 
            colors.push(vertexColors[a]);

        }
    }

    function translate(dx, dy, dz) //from skgCubeModel, lecture 2/22
    {
        for (var i = 0; i < 8; i++) {
            vertices[i][0] += dx;
            vertices[i][1] += dy;
            vertices[i][2] += dz;

        }
        for (var i = 0; i < vertices2.length; i++) {
            vertices2[i][0] += dx;
            vertices2[i][1] += dy;
            vertices2[i][2] += dz;

        }
        ;
    }
    function scale(sx, sy, sz) //from skgCubeModel, lecture 2/22
    {
        for (var i = 0; i < 8; i++) {
            vertices[i][0] *= sx;
            vertices[i][1] *= sy;
            vertices[i][2] *= sz;

        }
        for (var i = 0; i < vertices2.length; i++) {
            vertices2[i][0] *= sx;
            vertices2[i][1] *= sy;
            vertices2[i][2] *= sz;

        }
        ;
    }
    function rotate(angle, axis) {
        //from example of d2l

        var d = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);

        var x = axis[0] / d;
        var y = axis[1] / d;
        var z = axis[2] / d;

        var c = Math.cos(radians(angle));
        var omc = 1.0 - c;
        var s = Math.sin(radians(angle));

        var mat = [[x * x * omc + c, x * y * omc - z * s, x * z * omc + y * s], [x * y * omc + z * s, y * y * omc + c, y * z * omc - x * s], [x * z * omc - y * s, y * z * omc + x * s, z * z * omc + c]];

        for (var i = 0; i < vertices.length; i++) {
            var t = [0, 0, 0];
            for (var j = 0; j < 3; j++)
                for (var k = 0; k < 3; k++)
                    t[j] += mat[j][k] * vertices[i][k];
            for (var j = 0; j < 3; j++)
                vertices[i][j] = t[j];
        }
        ;for (var i = 0; i < vertices2.length; i++) {
            var t = [0, 0, 0];
            for (var j = 0; j < 3; j++)
                for (var k = 0; k < 3; k++)
                    t[j] += mat[j][k] * vertices2[i][k];
            for (var j = 0; j < 3; j++)
                vertices2[i][j] = t[j];
        }
        ;

    }
}
