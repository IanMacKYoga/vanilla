import React, { useEffect, useRef } from 'react';

export default function WireframeIceCream({ width = '100%', height = '240px' }) {
    const mountRef = useRef(null);
    const rendererRef = useRef(null);
    const frameRef = useRef(null);

    useEffect(() => {
        let THREE;
        let cleanup = false;

        async function init() {
            THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
            if (cleanup) return;

            const container = mountRef.current;
            if (!container) return;

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
            camera.position.set(0, 1, 6);
            camera.lookAt(0, 0.5, 0);

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setClearColor(0x000000, 0); // transparent background
            container.appendChild(renderer.domElement);
            rendererRef.current = renderer;

            const teal = 0x14b8a6;

            const wireframeMat = new THREE.MeshBasicMaterial({
                color: teal, wireframe: true, transparent: true, opacity: 0.9
            });

            const iceCreamGroup = new THREE.Group();

            // Cone
            const coneGeo = new THREE.ConeGeometry(0.7, 2, 16, 4, true);
            const cone = new THREE.Mesh(coneGeo, wireframeMat.clone());
            cone.position.y = -0.5;
            iceCreamGroup.add(cone);

            // Scoop group
            const scoopGroup = new THREE.Group();
            scoopGroup.position.y = 0.8;
            iceCreamGroup.add(scoopGroup);

            // Bite phases
            const bitePhases = [
                { phiStart: 0, phiLen: Math.PI * 2, thetaStart: 0, thetaLen: Math.PI, scale: 1.0 },
                { phiStart: 0.4, phiLen: Math.PI * 1.7, thetaStart: 0, thetaLen: Math.PI, scale: 1.0 },
                { phiStart: 0.7, phiLen: Math.PI * 1.4, thetaStart: 0.15, thetaLen: Math.PI * 0.85, scale: 0.95 },
                { phiStart: 0.9, phiLen: Math.PI * 1.15, thetaStart: 0.3, thetaLen: Math.PI * 0.7, scale: 0.88 },
                { phiStart: 1.1, phiLen: Math.PI * 0.9, thetaStart: 0.5, thetaLen: Math.PI * 0.55, scale: 0.78 },
                { phiStart: 1.3, phiLen: Math.PI * 0.65, thetaStart: 0.7, thetaLen: Math.PI * 0.4, scale: 0.6 },
            ];

            let currentScoop = null;
            let currentPhase = 0;
            let phaseTimer = 0;
            const PHASE_DURATION = 2.0;
            const PAUSE_DURATION = 3.0;
            let pauseTimer = PAUSE_DURATION;
            let isEating = false;

            const crumbs = [];

            function spawnCrumbs(biteAngle) {
                for (let i = 0; i < 8; i++) {
                    const geo = new THREE.TetrahedronGeometry(0.04 + Math.random() * 0.06, 0);
                    const mat = new THREE.MeshBasicMaterial({ color: teal, wireframe: true, transparent: true, opacity: 0.8 });
                    const crumb = new THREE.Mesh(geo, mat);
                    const a = biteAngle + (Math.random() - 0.5) * 0.8;
                    crumb.position.set(
                        Math.cos(a) * 0.8,
                        scoopGroup.position.y + 0.8 + (Math.random() - 0.5) * 0.3,
                        Math.sin(a) * 0.8
                    );
                    crumb.userData = {
                        vx: Math.cos(a) * (0.5 + Math.random() * 1),
                        vy: Math.random() * 1.5,
                        vz: Math.sin(a) * (0.5 + Math.random() * 1),
                        life: 1.0,
                        rotSpeed: (Math.random() - 0.5) * 8
                    };
                    scene.add(crumb);
                    crumbs.push(crumb);
                }
            }

            function buildScoop(phase) {
                if (currentScoop) {
                    scoopGroup.remove(currentScoop);
                    currentScoop.geometry.dispose();
                }
                const p = bitePhases[phase];
                const geo = new THREE.SphereGeometry(0.8 * p.scale, 18, 14, p.phiStart, p.phiLen, p.thetaStart, p.thetaLen);
                const mat = new THREE.MeshBasicMaterial({ color: teal, wireframe: true, transparent: true, opacity: 0.85 });
                currentScoop = new THREE.Mesh(geo, mat);
                scoopGroup.add(currentScoop);
            }

            buildScoop(0);

            // Drips
            for (let i = 0; i < 4; i++) {
                const dripGeo = new THREE.SphereGeometry(0.06, 5, 5);
                dripGeo.scale(1, 2, 1);
                const dripMat = new THREE.MeshBasicMaterial({ color: teal, wireframe: true, transparent: true, opacity: 0.7 });
                const drip = new THREE.Mesh(dripGeo, dripMat);
                const angle = (i / 4) * Math.PI * 2;
                drip.position.set(Math.cos(angle) * 0.55, 0.15, Math.sin(angle) * 0.55);
                drip.userData = { baseY: drip.position.y, speed: 0.3 + Math.random() * 0.4 };
                iceCreamGroup.add(drip);
            }

            scene.add(iceCreamGroup);

            // Particles
            const particlesGeo = new THREE.BufferGeometry();
            const pCount = 50;
            const pPos = new Float32Array(pCount * 3);
            for (let i = 0; i < pCount; i++) {
                pPos[i * 3] = (Math.random() - 0.5) * 10;
                pPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
                pPos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 2;
            }
            particlesGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
            const particlesMat = new THREE.PointsMaterial({ color: teal, size: 0.025, transparent: true, opacity: 0.25 });
            const particles = new THREE.Points(particlesGeo, particlesMat);
            scene.add(particles);

            let time = 0;
            const dt = 0.016;

            function animate() {
                if (cleanup) return;
                frameRef.current = requestAnimationFrame(animate);
                time += dt;

                iceCreamGroup.rotation.y = Math.sin(time * 0.35) * 0.5;
                iceCreamGroup.position.y = Math.sin(time * 0.7) * 0.08;

                iceCreamGroup.children.forEach(child => {
                    if (child.userData && child.userData.baseY !== undefined) {
                        child.position.y = child.userData.baseY + Math.sin(time * child.userData.speed + child.userData.baseY * 10) * 0.1;
                    }
                });

                // Bite cycle
                if (!isEating) {
                    pauseTimer -= dt;
                    if (pauseTimer <= 0) { isEating = true; currentPhase = 0; phaseTimer = 0; }
                } else {
                    phaseTimer += dt;
                    if (phaseTimer >= PHASE_DURATION && currentPhase < bitePhases.length - 1) {
                        currentPhase++;
                        phaseTimer = 0;
                        buildScoop(currentPhase);
                        spawnCrumbs(bitePhases[currentPhase].phiStart);
                    }
                    if (currentPhase >= bitePhases.length - 1 && phaseTimer >= PHASE_DURATION) {
                        currentPhase = 0;
                        buildScoop(0);
                        isEating = false;
                        pauseTimer = PAUSE_DURATION;
                    }
                }

                // Animate crumbs
                for (let i = crumbs.length - 1; i >= 0; i--) {
                    const c = crumbs[i];
                    c.userData.vy -= 3.0 * dt;
                    c.position.x += c.userData.vx * dt;
                    c.position.y += c.userData.vy * dt;
                    c.position.z += c.userData.vz * dt;
                    c.rotation.x += c.userData.rotSpeed * dt;
                    c.rotation.z += c.userData.rotSpeed * dt * 0.7;
                    c.userData.life -= dt * 0.8;
                    c.material.opacity = Math.max(0, c.userData.life);
                    if (c.userData.life <= 0) {
                        scene.remove(c);
                        c.geometry.dispose();
                        c.material.dispose();
                        crumbs.splice(i, 1);
                    }
                }

                particles.rotation.y = time * 0.03;
                renderer.render(scene, camera);
            }
            animate();

            // Resize handler
            const handleResize = () => {
                if (!container || cleanup) return;
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
            };
            window.addEventListener('resize', handleResize);
        }

        init();

        return () => {
            cleanup = true;
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            if (rendererRef.current) {
                rendererRef.current.dispose();
                if (mountRef.current && rendererRef.current.domElement) {
                    mountRef.current.removeChild(rendererRef.current.domElement);
                }
            }
        };
    }, []);

    return (
        <div
            ref={mountRef}
            style={{
                width,
                height,
                position: 'relative',
                overflow: 'hidden',
                background: '#f5f8fa',
            }}
        />
    );
}
