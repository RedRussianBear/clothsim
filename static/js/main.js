window.onload = function () {

    const FPS = 120;

    const N = 30;
    const K = 60;

    const k = 130;
    const n = 0.2 * (20 / N);
    const m = .5;
    const g = 2;
    const h = 1 / (FPS);
    const r = 2;

    let points = [];
    let new_points = [];
    let velocity = [];
    let new_velocity = [];

    function reset(side) {
        points = [];
        new_points = [];
        velocity = [];
        new_velocity = [];
        for (let i = 0; i < N; i++) {
            points.push([]);
            new_points.push([]);
            velocity.push([]);
            new_velocity.push([]);
            for (let j = 0; j < K; j++) {
                if (side) {
                    points[i].push(new THREE.Vector3(j * (6 / K) - 3, .2 * Math.cos(j / (K / 6) * 2 * Math.PI), i * (3 / N) - 1.5));
                    new_points[i].push(new THREE.Vector3(j * (6 / K) - 3, .2 * Math.cos(j / (K / 6) * 2 * Math.PI), i * (3 / N) - 1.5));
                    velocity[i].push(new THREE.Vector3(0, 0, 0));
                    new_velocity[i].push(new THREE.Vector3(0, 0, 0));
                } else {
                    points[i].push(new THREE.Vector3(j * (6 / K) - 3, i * (3 / N) - 1.5, .2 * Math.cos(j / (K / 6) * 2 * Math.PI)));
                    new_points[i].push(new THREE.Vector3(j * (6 / K) - 3, i * (3 / N) - 1.5, .2 * Math.cos(j / (K / 6) * 2 * Math.PI)));
                    velocity[i].push(new THREE.Vector3(0, 0, 0));
                    new_velocity[i].push(new THREE.Vector3(0, 0, 0));
                }
            }
        }
    }

    reset(Math.ceil(new Date().getTime()/1000) % 2 === 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

    const light1 = new THREE.SpotLight(0xffffff, 1);
    light1.position.x = 5;
    light1.position.y = 5;
    light1.position.z = 5;
    light1.castShadow = true;
    light1.shadow.mapSize.x = 4096;
    light1.shadow.mapSize.y = 4096;
    scene.add(light1);

    const light2 = new THREE.SpotLight(0xffffff, 1);
    light2.position.x = -5;
    light2.position.y = 5;
    light2.position.z = -5;
    light2.castShadow = true;
    light2.shadow.mapSize.x = 4096;
    light2.shadow.mapSize.y = 4096;
    scene.add(light2);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    const geometry = new THREE.Geometry();
    geometry.dynamic = true;

    for (let i = 0; i < N; i++)
        for (let j = 0; j < K; j++)
            geometry.vertices.push(points[i][j]);
    for (let i = 0; i < N - 1; i++)
        for (let j = 0; j < K - 1; j++) {
            geometry.faces.push(new THREE.Face3(i * K + j, i * K + j + 1, (i + 1) * K + j));
            geometry.faces.push(new THREE.Face3(i * K + j + 1, (i + 1) * K + j + 1, (i + 1) * K + j));
        }


    const material = new THREE.MeshStandardMaterial({'color': 0xff0000, 'side': THREE.DoubleSide});
    const cloth = new THREE.Mesh(geometry, material);
    cloth.castShadow = true;
    // cloth.receiveShadow = true;
    scene.add(cloth);

    camera.position.z = 8;

    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.MeshStandardMaterial({color: 0xffff00, side: THREE.DoubleSide});
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.translateZ(-5);
    plane.receiveShadow = true;
    scene.add(plane);

    function accel(i, j, pos) {
        let vec = new THREE.Vector3(0, 0, 0);
        let diff = new THREE.Vector3();

        if (i > 0 && pos.distanceTo(points[i - 1][j]) > n) {
            diff = points[i - 1][j].clone().addScaledVector(pos, -1);
            vec.addScaledVector(diff.normalize(), (pos.distanceTo(points[i - 1][j]) - n));
        }
        if (j > 0 && pos.distanceTo(points[i][j - 1]) > n) {
            diff = points[i][j - 1].clone().addScaledVector(pos, -1);
            vec.addScaledVector(diff.normalize(), (pos.distanceTo(points[i][j - 1]) - n));
        }
        if (i < N - 1 && pos.distanceTo(points[i + 1][j]) > n) {
            diff = points[i + 1][j].clone().addScaledVector(pos, -1);
            vec.addScaledVector(diff.normalize(), (pos.distanceTo(points[i + 1][j]) - n));
        }
        if (j < K - 1 && pos.distanceTo(points[i][j + 1]) > n) {
            diff = points[i][j + 1].clone().addScaledVector(pos, -1);
            vec.addScaledVector(diff.normalize(), (pos.distanceTo(points[i][j + 1]) - n));
        }

        vec.multiplyScalar(k / m);
        vec.addScaledVector(velocity[i][j], -r);
        vec.y = vec.y - g;
        vec.z = vec.x;
        return vec;
    }

    function vel(i, j) {
        return velocity[i][j].clone();
    }

    function animate() {

        for (let i = 0; i < N; i++) {
            for (let j = 1; j < K - 1; j++) {
                let k0 = vel(i, j).multiplyScalar(h);
                let l0 = accel(i, j, points[i][j]).multiplyScalar(h);
                let k1 = vel(i, j).addScaledVector(l0, 1 / 2).multiplyScalar(h);
                let l1 = accel(i, j, points[i][j].clone().addScaledVector(k0, 1 / 2)).multiplyScalar(h);
                let k2 = vel(i, j).addScaledVector(l1, 1 / 2).multiplyScalar(h);
                let l2 = accel(i, j, points[i][j].clone().addScaledVector(k1, 1 / 2)).multiplyScalar(h);
                let k3 = vel(i, j).add(l2).multiplyScalar(h);
                let l3 = accel(i, j, points[i][j].clone().add(k2)).multiplyScalar(h);

                new_velocity[i][j].addScaledVector(l0, 1 / 6);
                new_velocity[i][j].addScaledVector(l1, 1 / 3);
                new_velocity[i][j].addScaledVector(l2, 1 / 3);
                new_velocity[i][j].addScaledVector(l3, 1 / 6);

                new_points[i][j].addScaledVector(k0, 1 / 6);
                new_points[i][j].addScaledVector(k1, 1 / 3);
                new_points[i][j].addScaledVector(k2, 1 / 3);
                new_points[i][j].addScaledVector(k3, 1 / 6);

                new_points[i][j].y = Math.max(new_points[i][j].y, -4.98);
                if (new_points[i][j].y <= -4.98) new_velocity[i][j].y = 0;
            }
        }

        // cloth.geometry.__dirtyVertices = true;

        for (let i = 0; i < N; i++) {
            for (let j = 0; j < K; j++) {
                velocity[i][j].x = new_velocity[i][j].x;
                velocity[i][j].y = new_velocity[i][j].y;
                velocity[i][j].z = new_velocity[i][j].z;

                points[i][j].x = new_points[i][j].x;
                points[i][j].y = new_points[i][j].y;
                points[i][j].z = new_points[i][j].z;

                cloth.geometry.vertices[i * K + j] = points[i][j];
                geometry.verticesNeedUpdate = true;
            }
        }

        camera.position.z = 8 * Math.cos((new Date().getTime()) / 30000 * 2 * Math.PI);
        camera.position.x = 8 * Math.sin((new Date().getTime()) / 30000 * 2 * Math.PI);
        camera.up = new THREE.Vector3(0, 1, 0);
        camera.lookAt(new THREE.Vector3(0, -.5, 0));

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        renderer.render(scene, camera);
        setTimeout(animate, 1000 / FPS);
    }

    setTimeout(animate, 1000 / FPS);
};