// ShaderParticleGroup 0.7.5
//
// (c) 2014 Luke Moody (http://www.github.com/squarefeet)
//     & Lee Stemkoski (http://www.adelphi.edu/~stemkoski/)
//
// Based on Lee Stemkoski's original work:
//    (https://github.com/stemkoski/stemkoski.github.com/blob/master/Three.js/js/ParticleEngine.js).
//
// ShaderParticleGroup may be freely distributed under the MIT license (See LICENSE.txt)

var SPE = SPE || {};

SPE.ready = function(callback) {
    var count = false;

    SPE.loadShader('../src/vshader.glsl', function(response) {
        SPE.shaders.vertex = response;
        count++;
        finished();
    });

    SPE.loadShader('../src/fshader.glsl', function(response) {
        SPE.shaders.fragment = response;
        count++;
        finished();
    });


    function finished() {
        if (count == 2 && callback && typeof callback === 'function') {
            callback();
        }
    }

};

SPE.Group = function(options) {
    var that = this;

    that.fixedTimeStep = parseFloat(typeof options.fixedTimeStep === 'number' ? options.fixedTimeStep : 0.016);

    // Uniform properties ( applied to all particles )
    that.maxAge = parseFloat(options.maxAge || 3);
    that.texture = options.texture || null;
    that.hasPerspective = parseInt(typeof options.hasPerspective === 'number' ? options.hasPerspective : 1, 10);
    that.colorize = parseInt(typeof options.colorize === 'number' ? options.colorize : 1, 10);

    // Material properties
    that.blending = typeof options.blending === 'number' ? options.blending : THREE.AdditiveBlending;
    that.transparent = typeof options.transparent === 'number' ? options.transparent : 1;
    that.alphaTest = typeof options.alphaTest === 'number' ? options.alphaTest : 0.5;
    that.depthWrite = options.depthWrite || false;
    that.depthTest = options.depthTest || true;

    // Create uniforms
    that.uniforms = {
        duration: {type: 'f', value: that.maxAge},
        texture: {type: 't', value: that.texture},
        hasPerspective: {type: 'i', value: that.hasPerspective},
        colorize: {type: 'i', value: that.colorize}
    };

    // Create a map of attributes that will hold values for each particle in this group.
    that.attributes = {
        acceleration: {type: 'v3', value: []},
        velocity: {type: 'v3', value: []},
        alive: {type: 'f', value: []},
        age: {type: 'f', value: []},
        size: {type: 'v3', value: []},
        angle: {type: 'v4', value: []},
        colorStart: {type: 'c', value: []},
        colorMiddle: {type: 'c', value: []},
        colorEnd: {type: 'c', value: []},
        opacity: {type: 'v3', value: []}
    };

    // Emitters (that aren't static) will be added to this array for
    // processing during the `tick()` function.
    that.emitters = [];

    // Create properties for use by the emitter pooling functions.
    that._pool = [];
    that._poolCreationSettings = null;
    that._createNewWhenPoolEmpty = 0;
    that.maxAgeMilliseconds = that.maxAge * 1000;

    // Create an empty geometry to hold the particles.
    // Each particle is a vertex pushed into this geometry's
    // vertices array.
    that.geometry = new THREE.Geometry();

    // Create the shader material using the properties we set above.
    that.material = new THREE.ShaderMaterial({
        uniforms: that.uniforms,
        attributes: that.attributes,
        vertexShader: SPE.shaders.vertex,
        fragmentShader: SPE.shaders.fragment,
        blending: that.blending,
        transparent: that.transparent,
        alphaTest: that.alphaTest,
        depthWrite: that.depthWrite,
        depthTest: that.depthTest
    });

    // And finally create the ParticleSystem. It's got its `dynamic` property
    // set so that THREE.js knows to update it on each frame.
    that.mesh = new THREE.ParticleSystem(that.geometry, that.material);
    that.mesh.dynamic = false;
};

SPE.Group.prototype = {
    addEmitter: function(emitter) {
        var that = this;

        if (emitter.duration) {
            emitter.particlesPerSecond = emitter.particleCount / (that.maxAge < emitter.duration ? that.maxAge : emitter.duration) | 0;
        }
        else {
            emitter.particlesPerSecond = emitter.particleCount / that.maxAge | 0
        }

        var vertices = that.geometry.vertices = [],
                start = 0,
                end = emitter.particleCount + start,
                a = that.attributes,
                acceleration = a.acceleration.value = [],
                velocity = a.velocity.value,
                alive = a.alive.value,
                age = a.age.value,
                size = a.size.value = [],
                angle = a.angle.value,
                colorStart = a.colorStart.value,
                colorMiddle = a.colorMiddle.value,
                colorEnd = a.colorEnd.value,
                opacity = a.opacity.value;

        emitter.particleIndex = parseFloat(start);

        var p, pIncr, dP, p0, p1, rp, pmax = 0, numPts = 0, ptot = 0,
                d, rd, currPts, intVal, floatVal, subData, incr = emitter.increment, tincr = emitter.tincr,
                i2 = 0, j2 = 0,
                angpMax = -Infinity, radpMax = -Infinity,
                angP = [],
                radP = [];

        console.log(+new Date());

        for (var i = 0; i < radial.length; i++) {
            radP[i] = emitter.func.evalRad(radial[i]);
            if (radP[i] > radpMax) {
                radpMax = radP[i];
            }
        }

        for (var j = 0; j < angular.length; j++) {
            angP[j] = emitter.func.evalAng(angular[j].x, angular[j].y);
            if (angP[j] > angpMax) {
                angpMax = angP[j];
            }
        }


        pmax = angpMax * radpMax;
        console.log(+new Date());

        for (var i = 0; i < radial.length; i++) {
            for (var j = 0; j < angular.length; j++) {
                ptot += radP[i] * angP[j];
            }
        }
        console.log(ptot);
        var dpArr = [], rl = radial.length, al = angular.length;

        for (var i = 0; i < rl; i++) {
            for (var j = 0; j < al; j++) {
                i == rl ? (i2 = rl) : i2 = i + 1;
                j == al ? (j2 = al) : j2 = j + 1;
                dpArr[i * rl + j] = (radP[i] * angP[j] + radP[i2] * angP[j2]) / ptot;


                currPts = dP * emitter.particleCount;

                intVal = Math.floor(currPts);
                floatVal = currPts % 1;

                currPts = intVal + (floatVal > Math.random() ? 1 : 0);


                for (var k = 0; k < currPts; i++) {
                    rp = new THREE.Vector3(randBtw(p.x, pIncr.x), randBtw(p.y, pIncr.y), randBtw(p.z, pIncr.z));

                    vertices[numPts] = MathLib.sph2cart(rp);
                    velocity[numPts] = new THREE.Vector3();

                    alive[numPts] = (1.0);

                    age[numPts] = 0.0;

                    acceleration[numPts] = that._randomVector3(emitter.acceleration, emitter.accelerationSpread);

                    size[numPts] = new THREE.Vector3(
                            Math.abs(that._randomFloat(emitter.sizeStart, emitter.sizeStartSpread)),
                            Math.abs(that._randomFloat(emitter.sizeMiddle, emitter.sizeMiddleSpread)),
                            Math.abs(that._randomFloat(emitter.sizeEnd, emitter.sizeEndSpread))
                            );

                    angle[numPts] = new THREE.Vector4(
                            that._randomFloat(emitter.angleStart, emitter.angleStartSpread),
                            that._randomFloat(emitter.angleMiddle, emitter.angleMiddleSpread),
                            that._randomFloat(emitter.angleEnd, emitter.angleEndSpread),
                            emitter.angleAlignVelocity ? 1.0 : 0.0
                            );

                    var color = new THREE.Color();
                    rd = MathLib.sph2cart(p).distanceTo(vertices[numPts]);
                    var val = Math.max(Math.min(0.8, 0.8 * ((p1 - p0) * rd / d + p0) / pmax), 0);

                    color.setHSL(0.8 - val, 0.8, 0.3 + val / 2);

                    colorStart[numPts] = that._randomColor(color, emitter.colorStartSpread);
                    colorMiddle[numPts] = that._randomColor(color, emitter.colorMiddleSpread);
                    colorEnd[numPts] = that._randomColor(color, emitter.colorEndSpread);

                    opacity[numPts] = new THREE.Vector3(
                            Math.abs(that._randomFloat(emitter.opacityStart, emitter.opacityStartSpread)),
                            Math.abs(that._randomFloat(emitter.opacityMiddle, emitter.opacityMiddleSpread)),
                            Math.abs(that._randomFloat(emitter.opacityEnd, emitter.opacityEndSpread))
                            );
                    numPts++;

                }


            }
        }

        console.log(dpArr);
        console.log(+new Date());
        return;

        /*console.log(+new Date());
         var prob = emitter.positionGrid.reduce(function(p, c) {
         p0 = emitter.func.eval(c.x, c.y, c.z);
         p1 = emitter.func.eval(c.x + incr, c.y + incr, c.z + incr);
         dP = (p0 + p1) * incr * incr * incr;
         
         if (p0 > pmax)
         pmax = p0;
         
         p += dP;
         return p;
         }, 0);*/


        for (var i = start; i < end; ++i) {

            p = emitter.positionGrid[i - start];
            pIncr = new THREE.Vector3(p.x + incr, p.y + tincr, p.z + tincr);

            d = MathLib.sph2cart(p).distanceTo(MathLib.sph2cart(pIncr));

            p0 = emitter.func.eval(p.x, p.y, p.z);
            p1 = emitter.func.eval(pIncr.x, pIncr.y, pIncr.z);


            dP = (p0 + p1) * incr * incr * incr / ptot;

            currPts = dP * emitter.particleCount;

            subData = [];
            intVal = Math.floor(currPts);
            floatVal = currPts % 1;

            currPts = intVal + (floatVal > Math.random() ? 1 : 0);

            for (var j = 0; i < currPts; i++) {
                rp = new THREE.Vector3(randBtw(p.x, pIncr.x), randBtw(p.y, pIncr.y), randBtw(p.z, pIncr.z));

                vertices[numPts] = MathLib.sph2cart(rp);
                velocity[numPts] = new THREE.Vector3();

                alive[numPts] = (1.0);

                age[numPts] = 0.0;

                acceleration[numPts] = that._randomVector3(emitter.acceleration, emitter.accelerationSpread);

                size[numPts] = new THREE.Vector3(
                        Math.abs(that._randomFloat(emitter.sizeStart, emitter.sizeStartSpread)),
                        Math.abs(that._randomFloat(emitter.sizeMiddle, emitter.sizeMiddleSpread)),
                        Math.abs(that._randomFloat(emitter.sizeEnd, emitter.sizeEndSpread))
                        );

                angle[numPts] = new THREE.Vector4(
                        that._randomFloat(emitter.angleStart, emitter.angleStartSpread),
                        that._randomFloat(emitter.angleMiddle, emitter.angleMiddleSpread),
                        that._randomFloat(emitter.angleEnd, emitter.angleEndSpread),
                        emitter.angleAlignVelocity ? 1.0 : 0.0
                        );

                var color = new THREE.Color();
                rd = MathLib.sph2cart(p).distanceTo(vertices[numPts]);
                var val = Math.max(Math.min(0.8, 0.8 * ((p1 - p0) * rd / d + p0) / pmax), 0);

                color.setHSL(0.8 - val, 0.8, 0.3 + val / 2);

                colorStart[numPts] = that._randomColor(color, emitter.colorStartSpread);
                colorMiddle[numPts] = that._randomColor(color, emitter.colorMiddleSpread);
                colorEnd[numPts] = that._randomColor(color, emitter.colorEndSpread);

                opacity[numPts] = new THREE.Vector3(
                        Math.abs(that._randomFloat(emitter.opacityStart, emitter.opacityStartSpread)),
                        Math.abs(that._randomFloat(emitter.opacityMiddle, emitter.opacityMiddleSpread)),
                        Math.abs(that._randomFloat(emitter.opacityEnd, emitter.opacityEndSpread))
                        );
                numPts++;

            }

            if (i % 100)
                setCount(numPts);
        }

        console.log(+new Date());

        // Cache properties on the emitter so we can access
        // them from its tick function.
        emitter.verticesIndex = parseFloat(start);
        emitter.attributes = a;
        emitter.vertices = that.geometry.vertices;
        emitter.maxAge = that.maxAge;
        emitter.particleCount = numPts;

        // Assign a unique ID to this emitter
        emitter.__id = that._generateID();

        // Save this emitter in an array for processing during this.tick()
        if (!emitter.isStatic) {
            that.emitters.push(emitter);
        }

        return that;
    },
    /**
     * The main particle group update function. Call this once per frame.
     *
     * @param  {Number} dt
     * @return {this}
     */
    tick: function(dt) {
        var that = this,
                emitters = that.emitters,
                numEmitters = emitters.length;

        dt = dt || that.fixedTimeStep;

        if (numEmitters === 0) {
            return;
        }

        for (var i = 0; i < numEmitters; ++i) {
            emitters[i].tick(dt);
        }

        that._flagUpdate();
        return that;
    }
};


// Extend ShaderParticleGroup's prototype with functions from utils object.
for (var i in SPE.utils) {
    SPE.Group.prototype[ '_' + i ] = SPE.utils[i];
}

SPE.loadShader = function(fileName, callback)
{

    function reqListener() {

        if (this.readyState == 4 && this.status == 200)
        {
            if (callback && typeof callback === 'function')
                callback(this.response);
        } else if (this.status >= 400 && this.status <= 501) {
            console.log('A problem occured ' + this.statusText);
        }
    }

    var oReq = new XMLHttpRequest();
    oReq.open("get", fileName, true);
    oReq.onreadystatechange = reqListener;
    oReq.send();
};


// The all-important shaders
SPE.shaders = {
    vertex: '',
    fragment: ''
};
