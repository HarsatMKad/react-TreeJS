import * as THREE from "three";
import { useRef, useEffect, useState } from "react";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import angleToXY from "../modules/angleToPlane";
import findAzimuth from "../modules/azimuth";

const Line3D = () => {
  const canvasRef = useRef(null);
  const [sphereA, setSphereA] = useState(null);
  const [sphereB, setSphereB] = useState(null);
  const [line, setLine] = useState(null);
  const [control, setControl] = useState(null);
  const [rendererState, setRendererState] = useState(null);
  const [sceneState, setSceneState] = useState(null);
  const [cameraState, setCameraState] = useState(null);

  const gridSize = 25; // Размер сетки
  const gridDivisions = 25; // Количество делений сетки
  const camMinDistance = 1; // Минимальное растояние камеры
  const camMaxDistance = 20; // Максимальное растояние камеры
  const pointRadius = 0.1; // Радиус точек
  const pointColor = 0x10ff00; // Цвет точек
  const lineColor = 0xff4c5b; // Цвет линии
  const planeSize = 25; // Размер плоскости

  const [sphereAPos, setSphereAPos] = useState({ x: 0, y: 0, z: 0 });
  const [sphereBPos, setSphereBPos] = useState({ x: 0, y: 0, z: 0 });

  const [angleValue, setAngleValue] = useState();
  const [azimuthValue, setAzimuthValue] = useState();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene = new THREE.Scene();
    scene.add(
      new THREE.GridHelper(gridSize, gridDivisions, 0x888888, 0x444444)
    );
    const camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    camera.position.set(10, 10, 12);
    camera.lookAt(0, 0, 0);

    const geometry = new THREE.SphereGeometry(pointRadius, 32, 32);
    const material = new THREE.LineBasicMaterial({ color: pointColor });

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.minDistance = camMinDistance;
    orbit.maxDistance = camMaxDistance;
    orbit.update();
    orbit.addEventListener("change", () => {
      renderer.render(scene, camera);
    });

    const sphereA = new THREE.Mesh(geometry, material);
    sphereA.position.z = 2;
    sphereA.position.y = 1;
    const sphereB = new THREE.Mesh(geometry, material);
    sphereB.position.x = 2;
    sphereB.position.y = 2;
    scene.add(sphereA);
    scene.add(sphereB);

    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(
        sphereA.position.x,
        sphereA.position.y,
        sphereA.position.z
      ),
      new THREE.Vector3(
        sphereB.position.x,
        sphereB.position.y,
        sphereB.position.z
      ),
    ]);
    const lineMaterial = new THREE.LineBasicMaterial({ color: lineColor });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);
    setLine(line);

    const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0x757575,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });

    const planeXY = new THREE.Mesh(planeGeometry, planeMaterial);
    planeXY.position.set(0, 0, -planeSize / 2);
    scene.add(planeXY);

    const control = new TransformControls(camera, renderer.domElement);
    control.addEventListener("change", () => {
      renderer.render(scene, camera);
      const positions = [sphereA.position, sphereB.position];
      line.geometry.setFromPoints(positions);

      setSphereAPos({
        x: sphereA.position.x,
        y: sphereA.position.y,
        z: sphereA.position.z,
      });

      setSphereBPos({
        x: sphereB.position.x,
        y: sphereB.position.y,
        z: sphereB.position.z,
      });
    });

    control.addEventListener("dragging-changed", function (event) {
      orbit.enabled = !event.value;
    });

    const gizmo = control.getHelper();
    scene.add(gizmo);

    setRendererState(renderer);
    setCameraState(camera);
    setSphereA(sphereA);
    setSphereAPos({
      x: sphereA.position.x,
      y: sphereA.position.y,
      z: sphereA.position.z,
    });
    setSphereBPos({
      x: sphereB.position.x,
      y: sphereB.position.y,
      z: sphereB.position.z,
    });
    setSphereB(sphereB);
    setControl(control);
    setSceneState(scene);

    renderer.render(scene, camera);

    return () => {
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      control.dispose();
      orbit.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      planeGeometry.dispose();
      planeMaterial.dispose();
    };
  }, []);

  const handleSphereAPosChange = (e) => {
    const { name, value } = e.target;
    const newValue = parseFloat(value);
    setSphereAPos((prevState) => ({ ...prevState, [name]: newValue }));
    if (sphereA) {
      const newPosition = {
        ...sphereAPos,
        [name]: newValue,
      };
      sphereA.position.set(newPosition.x, newPosition.y, newPosition.z);
      updateLinePosition();
    }
  };

  const handleSphereBPosChange = (e) => {
    const { name, value } = e.target;
    const newValue = parseFloat(value);
    setSphereBPos((prevState) => ({ ...prevState, [name]: newValue }));
    if (sphereB) {
      const newPosition = {
        ...sphereBPos,
        [name]: newValue,
      };
      sphereB.position.set(newPosition.x, newPosition.y, newPosition.z);
      updateLinePosition();
    }
  };

  const updateLinePosition = () => {
    if (sphereA && sphereB && line && line.geometry) {
      const positions = [sphereA.position, sphereB.position];
      line.geometry.setFromPoints(positions);
      rendererState?.render(sceneState, cameraState);
    }
  };

  function moveA() {
    control.detach(sphereB);
    control.attach(sphereA);
    rendererState.render(sceneState, cameraState);
  }

  function moveB() {
    control.detach(sphereA);
    control.attach(sphereB);
    rendererState.render(sceneState, cameraState);
  }

  function detach() {
    control.detach(sphereA);
    control.detach(sphereB);
    rendererState.render(sceneState, cameraState);
  }

  function calculate() {
    setAngleValue(
      angleToXY(
        sphereAPos.x,
        sphereAPos.y,
        sphereAPos.z,
        sphereBPos.x,
        sphereBPos.y,
        sphereBPos.z
      )
    );

    setAzimuthValue(
      findAzimuth(
        sphereAPos.x,
        sphereAPos.y,
        sphereAPos.z,
        sphereBPos.x,
        sphereBPos.y,
        sphereBPos.z
      )
    );
  }

  return (
    <div className="canvas">
      <div>
        <div>
          <button onClick={moveA}>attach A</button>
          x:
          <input
            type="number"
            name="x"
            placeholder="x"
            value={sphereAPos.x}
            onChange={handleSphereAPosChange}
          ></input>
          y:
          <input
            type="number"
            name="y"
            placeholder="y"
            value={sphereAPos.y}
            onChange={handleSphereAPosChange}
          ></input>
          z:
          <input
            type="number"
            name="z"
            placeholder="z"
            value={sphereAPos.z}
            onChange={handleSphereAPosChange}
          ></input>
        </div>
        <div>
          <button onClick={moveB}>attach B</button>
          x:
          <input
            type="number"
            name="x"
            placeholder="x"
            value={sphereBPos.x}
            onChange={handleSphereBPosChange}
          ></input>
          y:
          <input
            type="number"
            name="y"
            placeholder="y"
            value={sphereBPos.y}
            onChange={handleSphereBPosChange}
          ></input>
          z:
          <input
            type="number"
            name="z"
            placeholder="z"
            value={sphereBPos.z}
            onChange={handleSphereBPosChange}
          ></input>
        </div>
        <div>
          <button onClick={detach}>detach</button>
        </div>
      </div>
      <div className="controlResultSection">
        Angle:
        <input placeholder="angle" value={angleValue} />
        Azimuth:
        <input placeholder="azimuth" value={azimuthValue} />
        <button onClick={calculate}>Calculate</button>
      </div>
      <canvas ref={canvasRef} style={{ width: "100%", height: "700px" }} />
    </div>
  );
};

export default Line3D;
