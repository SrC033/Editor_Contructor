// ============================================
// MAIN.JS - Constructor 3D/2D v5.3.34
// MODO OSCURO CONSISTENTE - SIN FONDO BLANCO
// SOPORTE COMPLETO: TALLAR + MATERIAL
// ============================================

(function() {
    'use strict';

    const COLOR_MAP = {
        'rojo': 0xff4444, 'verde': 0x44ff44, 'azul': 0x4444ff,
        'amarillo': 0xffff44, 'naranja': 0xff8800, 'morado': 0xaa44ff,
        'rosa': 0xff44aa, 'cian': 0x44ffff, 'blanco': 0xffffff,
        'negro': 0x000000, 'gris': 0x888888, 'turquesa': 0x40e0d0,
        'violeta': 0x8a2be2, 'mostaza': 0xffdb58, 'celeste': 0x87ceeb,
        'marron': 0x8b4513, 'plateado': 0xc0c0c0, 'dorado': 0xffd700
    };

    const RANGO_DEFAULT = 100;

    // Polyfill roundRect
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
            if (r > w/2) r = w/2;
            if (r > h/2) r = h/2;
            this.beginPath();
            this.moveTo(x + r, y);
            this.arcTo(x + w, y, x + w, y + h, r);
            this.arcTo(x + w, y + h, x, y + h, r);
            this.arcTo(x, y + h, x, y, r);
            this.arcTo(x, y, x + w, y, r);
            this.closePath();
            return this;
        };
    }

    function parseColor(input) {
        if (!input) return 0x4facfe;
        const clean = input.trim();
        const hexMatch = clean.match(/^#?([0-9a-fA-F]{6})$/);
        if (hexMatch) return parseInt(hexMatch[1], 16);
        const shortHexMatch = clean.match(/^#?([0-9a-fA-F]{3})$/);
        if (shortHexMatch) {
            const hex = shortHexMatch[1];
            return parseInt(hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2], 16);
        }
        const lower = clean.toLowerCase();
        for (const [name, value] of Object.entries(COLOR_MAP)) {
            if (name === lower) return value;
        }
        for (const [name, value] of Object.entries(COLOR_MAP)) {
            if (lower.includes(name) || name.includes(lower)) return value;
        }
        return 0x4facfe;
    }

    function obtenerValorColor(nombre) { return parseColor(nombre); }
    function obtenerNombreColor(valor) {
        for (var nombre in COLOR_MAP) {
            if (COLOR_MAP[nombre] === valor) return nombre;
        }
        return 'azul';
    }
    function getColorHex(colorValue) {
        return '#' + colorValue.toString(16).padStart(6, '0');
    }

    // ========== ESTADO ==========
    const estado = {
        scene: null, camera: null, renderer: null, controls: null,
        drawingScene: null, drawingCamera: null, drawingRenderer: null, drawingControls: null,
        puntos: [], lineas: [], conjuntos: [],
        meshesPuntos: [], meshesLineas: [], meshesConjuntos: [],
        objetosGuardados: [], figurasGuardadas: [],
        contadorPuntos: 0, contadorConjuntos: 0,
        modalAbierto: false, modoEditor: false, ejecutando: false,
        isSolidView: true, isWireframeView: false, isTransparentView: false,
        colorActual: 0x4facfe, nombreObjeto: 'mi_objeto',
        modoDibujoActivo: true, modoConexionActivo: false,
        modoManoActivo: false, modoOrbitaActivo: false,
        modoTallarActivo: false, modoMaterialActivo: false,
        modoPincelActivo: false, modoCubetaActivo: false,
        colorPintura: 0x4facfe, texturaPintura: null, usarTextura: false,
        fondoModo: 'claro', fondoIntensidad: 1.0, fondoColor: '#0a0a1a',
        puntoSeleccionado: null, puntoSeleccionadoMesh: null,
        lineaTemporal: null, puntoArrastrando: null,
        puntosSeleccionados: [], meshesSeleccionados: [],
        mousePresionado: false,
        rangoX: RANGO_DEFAULT, rangoY: RANGO_DEFAULT, rangoZ: RANGO_DEFAULT,
        ejesElementos: { lineas: [], marcas: [], etiquetas: [], numeros: [], box: null, grid: null, origen: null },
        rangesPanelVisible: false, sistemaInicializado: false,
        timeoutEditor: null, figuraSize: 30,
        figuraSeleccionada: null, figuraSeleccionadaInfo: null,
        tallarActivo: false, ultimoPuntoTallar: null,
        radioTallar: 5, intensidadTallar: 0.5,
        materialesOriginales: []
    };

    // ========== DOM REFERENCIAS ==========
    const dom = {
        container: document.getElementById('canvas-principal'),
        drawingContainer: document.getElementById('canvas-secundario'),
        terminal: document.getElementById('terminalOutput'),
        terminalInput: document.getElementById('terminalInput'),
        editor: document.getElementById('drawingEditorInput'),
        nombreInput: document.getElementById('objectNameInput'),
        puntosList: document.getElementById('pointsList'),
        lineasList: document.getElementById('linesList'),
        pointCount: document.getElementById('pointCount'),
        lineCount: document.getElementById('lineCount'),
        solidCount: document.getElementById('solidCount'),
        figurasCount: document.getElementById('figurasCountLabel'),
        statusText: document.querySelector('#drawingEditorStatus .status-text'),
        figuraSizeInput: document.getElementById('figuraSizeInput'),
        figuraSizeValue: document.getElementById('figuraSizeValue'),
        viewSolidBtn: document.getElementById('viewSolidBtn'),
        viewWireframeBtn: document.getElementById('viewWireframeBtn'),
        viewTransparentBtn: document.getElementById('viewTransparentBtn'),
        paletteTallar: document.getElementById('paletteTallar'),
        paletteMaterial: document.getElementById('paletteMaterial'),
        tallarRadio: document.getElementById('tallarRadio'),
        tallarIntensidad: document.getElementById('tallarIntensidad'),
        tallarRadioValue: document.getElementById('tallarRadioValue'),
        tallarIntensidadValue: document.getElementById('tallarIntensidadValue'),
        drawingStatus: document.getElementById('drawingStatus')
    };

    // ========== FUNCIONES DE TERMINAL ==========
    function mensajeTerminal(mensaje, color) {
        color = color || 'rgba(255,255,255,0.5)';
        if (!dom.terminal) { console.log('📝 Terminal:', mensaje); return; }
        try {
            var linea = document.createElement('div');
            linea.className = 'terminal-line';
            linea.innerHTML = '<span class="prompt">▶</span><span class="text" style="color: ' + color + '">' + mensaje + '</span>';
            linea.style.userSelect = 'text';
            linea.style.cursor = 'text';
            dom.terminal.appendChild(linea);
            dom.terminal.scrollTop = dom.terminal.scrollHeight;
            while (dom.terminal.children.length > 200) {
                dom.terminal.removeChild(dom.terminal.firstChild);
            }
        } catch (error) {
            console.log('📝 Terminal:', mensaje);
        }
    }

    // ========== FUNCIONES DE UI ==========
    function actualizarUI() {
        try {
            actualizarStats();
            actualizarListaPuntos();
            actualizarListaLineas();
            actualizarInfoDibujo();
            actualizarInfoCamara();
            actualizarEstadoDibujo();
            actualizarCursor();
            actualizarRangosUI();
            actualizarContadorFiguras();
            actualizarBotonesVisualizacion();
            actualizarBotonTallar();
            actualizarBotonMaterial();
            actualizarBotonesPintura();
            actualizarEstadoTextura();
            if (window.ComandosModule) {
                window.ComandosModule.setDrawingPoints(estado.puntos);
                window.ComandosModule.setDrawingLines(estado.lineas);
                window.ComandosModule.setDrawingScene(estado.drawingScene);
                window.ComandosModule.setDrawingLineObjects(estado.meshesLineas);
                window.ComandosModule.setDrawingPointMeshes(estado.meshesPuntos);
                window.ComandosModule.setDrawingSolidMeshes(estado.meshesConjuntos);
                window.ComandosModule.setFigurasGuardadas(estado.figurasGuardadas);
            }
        } catch (error) {
            console.warn('Error en actualizarUI:', error);
        }
    }

    function actualizarEstadoTextura() {
        var status = document.getElementById('textureStatus');
        var preview = document.getElementById('texturaPreview');
        var toggleBtn = document.getElementById('toggleTextureBtn');
        if (estado.usarTextura && estado.texturaPintura) {
            if (status) status.textContent = '🖼️ Textura';
            if (toggleBtn) toggleBtn.classList.add('active');
            if (preview) preview.style.display = 'block';
        } else {
            if (status) status.textContent = '🎨 Color';
            if (toggleBtn) toggleBtn.classList.remove('active');
        }
    }

    function actualizarBotonTallar() {
        var btnTallar = document.getElementById('paletteTallar');
        if (!btnTallar) return;
        if (estado.modoTallarActivo) {
            btnTallar.classList.add('active');
            btnTallar.style.color = '#ff6b6b';
            btnTallar.style.background = 'rgba(255, 107, 107, 0.2)';
            btnTallar.style.boxShadow = '0 0 20px rgba(255, 107, 107, 0.15)';
        } else {
            btnTallar.classList.remove('active');
            btnTallar.style.color = 'rgba(255,255,255,0.4)';
            btnTallar.style.background = 'none';
            btnTallar.style.boxShadow = 'none';
        }
    }

    function actualizarBotonMaterial() {
        var btnMaterial = document.getElementById('paletteMaterial');
        if (!btnMaterial) return;
        if (estado.modoMaterialActivo) {
            btnMaterial.classList.add('active');
            btnMaterial.style.color = '#4facfe';
            btnMaterial.style.background = 'rgba(79, 172, 254, 0.2)';
            btnMaterial.style.boxShadow = '0 0 20px rgba(79, 172, 254, 0.15)';
        } else {
            btnMaterial.classList.remove('active');
            btnMaterial.style.color = 'rgba(255,255,255,0.4)';
            btnMaterial.style.background = 'none';
            btnMaterial.style.boxShadow = 'none';
        }
    }

    function actualizarBotonesPintura() {
        var btnPincel = document.getElementById('paintBrushBtn');
        var btnCubeta = document.getElementById('paintBucketBtn');
        if (btnPincel) {
            if (estado.modoPincelActivo) btnPincel.classList.add('active');
            else btnPincel.classList.remove('active');
        }
        if (btnCubeta) {
            if (estado.modoCubetaActivo) btnCubeta.classList.add('active');
            else btnCubeta.classList.remove('active');
        }
    }

    function actualizarBotonesVisualizacion() {
        if (dom.viewSolidBtn) {
            dom.viewSolidBtn.classList.toggle('active', estado.isSolidView && !estado.isWireframeView && !estado.isTransparentView);
        }
        if (dom.viewWireframeBtn) {
            dom.viewWireframeBtn.classList.toggle('active', estado.isWireframeView);
        }
        if (dom.viewTransparentBtn) {
            dom.viewTransparentBtn.classList.toggle('active', estado.isTransparentView && !estado.isWireframeView);
        }
        actualizarBotonTallar();
        actualizarBotonMaterial();
        actualizarBotonesPintura();
    }

    function actualizarContadorFiguras() {
        if (dom.figurasCount) {
            dom.figurasCount.textContent = estado.figurasGuardadas.length;
        }
    }

    function actualizarRangosUI() {
        var rangoXInput = document.getElementById('rangoXInput');
        var rangoYInput = document.getElementById('rangoYInput');
        var rangoZInput = document.getElementById('rangoZInput');
        var rangoXValue = document.getElementById('rangoXValue');
        var rangoYValue = document.getElementById('rangoYValue');
        var rangoZValue = document.getElementById('rangoZValue');
        if (rangoXInput) rangoXInput.value = estado.rangoX;
        if (rangoYInput) rangoYInput.value = estado.rangoY;
        if (rangoZInput) rangoZInput.value = estado.rangoZ;
        if (rangoXValue) rangoXValue.textContent = estado.rangoX;
        if (rangoYValue) rangoYValue.textContent = estado.rangoY;
        if (rangoZValue) rangoZValue.textContent = estado.rangoZ;
        actualizarRangosPanelUI();
    }

    function actualizarRangosPanelUI() {
        var minX = document.getElementById('rangoXMinInput');
        var maxX = document.getElementById('rangoXMaxInput');
        var minY = document.getElementById('rangoYMinInput');
        var maxY = document.getElementById('rangoYMaxInput');
        var minZ = document.getElementById('rangoZMinInput');
        var maxZ = document.getElementById('rangoZMaxInput');
        var rangeX = document.getElementById('rangoXRange');
        var rangeY = document.getElementById('rangoYRange');
        var rangeZ = document.getElementById('rangoZRange');
        var displayX = document.getElementById('rangoXDisplay');
        var displayY = document.getElementById('rangoYDisplay');
        var displayZ = document.getElementById('rangoZDisplay');
        if (minX) minX.value = -estado.rangoX;
        if (maxX) maxX.value = estado.rangoX;
        if (minY) minY.value = -estado.rangoY;
        if (maxY) maxY.value = estado.rangoY;
        if (minZ) minZ.value = -estado.rangoZ;
        if (maxZ) maxZ.value = estado.rangoZ;
        if (rangeX) rangeX.value = estado.rangoX;
        if (rangeY) rangeY.value = estado.rangoY;
        if (rangeZ) rangeZ.value = estado.rangoZ;
        if (displayX) displayX.textContent = '±' + estado.rangoX;
        if (displayY) displayY.textContent = '±' + estado.rangoY;
        if (displayZ) displayZ.textContent = '±' + estado.rangoZ;
    }

    function actualizarStats() {
        var totalVectores = document.getElementById('totalVectors');
        var totalItems = document.getElementById('totalItems');
        var totalObjects = document.getElementById('totalObjects');
        if (totalVectores) totalVectores.textContent = estado.objetosGuardados.length;
        if (totalItems) totalItems.textContent = estado.puntos.length + estado.lineas.length + estado.meshesConjuntos.length + estado.figurasGuardadas.length;
        if (totalObjects) totalObjects.textContent = estado.drawingScene ? estado.drawingScene.children.length : 0;
    }

    function actualizarInfoDibujo() {
        var pointCount = document.getElementById('pointCount');
        var lineCount = document.getElementById('lineCount');
        var solidCount = document.getElementById('solidCount');
        if (pointCount) pointCount.textContent = estado.puntos.length + ' puntos';
        if (lineCount) lineCount.textContent = estado.lineas.length + ' líneas';
        if (solidCount) solidCount.textContent = (estado.meshesConjuntos.length + estado.figurasGuardadas.length) + ' sólidos';
        var pointsLabel = document.getElementById('pointsListLabel');
        var linesLabel = document.getElementById('linesCountLabel');
        if (pointsLabel) pointsLabel.textContent = estado.puntos.length;
        if (linesLabel) linesLabel.textContent = estado.lineas.length;
        actualizarContadorFiguras();
    }

    function actualizarListaPuntos() {
        var container = dom.puntosList;
        if (!container) return;
        if (estado.puntos.length === 0) {
            container.innerHTML = '<div class="empty-lines">Sin puntos dibujados</div>';
            return;
        }
        var html = '';
        for (var i = 0; i < estado.puntos.length; i++) {
            var p = estado.puntos[i];
            var nombreColor = obtenerNombreColor(p.color);
            var colorHex = p.color.toString(16).padStart(6, '0');
            var isSelected = estado.puntosSeleccionados.some(function(sp) { return sp.label === p.label; });
            var isConnectSelected = estado.puntoSeleccionado && estado.puntoSeleccionado.label === p.label;
            html += '<div class="line-item" style="border-left-color: #' + colorHex + '; ' + 
                (isSelected ? 'background: rgba(253,160,133,0.2);' : '') + 
                (isConnectSelected ? 'background: rgba(79,172,254,0.2);' : '') + '">';
            html += '    <span class="line-label">' + p.label + '</span>';
            html += '    <span class="line-coords">(' + p.x + ', ' + p.y + ', ' + p.z + ') [' + nombreColor + ' #' + colorHex + ']</span>';
            if (isSelected) {
                html += '    <span style="color:#fda085;font-size:8px;">✋</span>';
            } else if (isConnectSelected) {
                html += '    <span style="color:#4facfe;font-size:8px;">🔗</span>';
            }
            html += '    <button class="btn-delete-point" onclick="eliminarPunto(\'' + p.label + '\')" title="Eliminar punto">';
            html += '        <svg viewBox="0 0 10 10"><path d="M2 2L8 8M8 2L2 8" stroke="currentColor" stroke-width="1.5"/></svg>';
            html += '    </button>';
            html += '</div>';
        }
        container.innerHTML = html;
    }

    function actualizarListaLineas() {
        var container = dom.lineasList;
        if (!container) return;
        if (estado.lineas.length === 0) {
            container.innerHTML = '<div class="empty-lines">Sin líneas conectadas</div>';
            return;
        }
        var html = '';
        for (var i = 0; i < estado.lineas.length; i++) {
            var l = estado.lineas[i];
            var nombreColor = obtenerNombreColor(l.p1.color);
            var colorHex = l.p1.color.toString(16).padStart(6, '0');
            html += '<div class="line-item" style="border-left-color: #' + colorHex + '">';
            html += '    <span class="line-label">' + l.p1.label + '-' + l.p2.label + '</span>';
            html += '    <span class="line-coords">[' + nombreColor + ' #' + colorHex + ']</span>';
            html += '</div>';
        }
        container.innerHTML = html;
    }

    function actualizarInfoCamara() {
        if (!estado.camera) return;
        try {
            var pos = estado.camera.position;
            var camX = document.getElementById('camX');
            var camY = document.getElementById('camY');
            var camZ = document.getElementById('camZ');
            var camZoom = document.getElementById('camZoom');
            if (camX) camX.textContent = pos.x.toFixed(2);
            if (camY) camY.textContent = pos.y.toFixed(2);
            if (camZ) camZ.textContent = pos.z.toFixed(2);
            if (camZoom) {
                var dist = pos.length();
                var zoom = Math.max(20, Math.min(300, 100 - (dist - 150) * 0.2));
                camZoom.textContent = Math.round(zoom) + '%';
            }
        } catch (e) {}
    }

    function actualizarEstadoDibujo() {
        if (dom.drawingStatus) {
            if (estado.modoOrbitaActivo) {
                dom.drawingStatus.textContent = '🌐 Modo órbita - Arrastra para mover la cámara';
                dom.drawingStatus.style.color = '#667eea';
                dom.drawingStatus.classList.remove('tallando');
                dom.drawingStatus.classList.remove('pintando');
            } else if (estado.modoManoActivo) {
                if (estado.puntosSeleccionados.length > 0) {
                    dom.drawingStatus.textContent = '✋ ' + estado.puntosSeleccionados.length + ' puntos seleccionados - Arrastra para mover';
                    dom.drawingStatus.style.color = '#fda085';
                } else {
                    dom.drawingStatus.textContent = '✋ Modo mano - Haz clic en puntos para seleccionarlos';
                    dom.drawingStatus.style.color = '#fda085';
                }
                dom.drawingStatus.classList.remove('tallando');
                dom.drawingStatus.classList.remove('pintando');
            } else if (estado.modoConexionActivo) {
                if (estado.puntoSeleccionado) {
                    dom.drawingStatus.textContent = '🔗 Conectando: ' + estado.puntoSeleccionado.label + ' → Selecciona otro punto';
                    dom.drawingStatus.style.color = '#38ef7d';
                } else {
                    dom.drawingStatus.textContent = '🔗 Modo conexión - Selecciona el primer punto';
                    dom.drawingStatus.style.color = '#fda085';
                }
                dom.drawingStatus.classList.remove('tallando');
                dom.drawingStatus.classList.remove('pintando');
            } else if (estado.modoTallarActivo) {
                if (estado.figuraSeleccionada) {
                    dom.drawingStatus.textContent = '🪚 Tallando: ' + estado.figuraSeleccionadaInfo.label + ' - Arrastra para esculpir (quitar material)';
                    dom.drawingStatus.style.color = '#ff6b6b';
                    dom.drawingStatus.classList.add('tallando');
                } else {
                    dom.drawingStatus.textContent = '🪚 Modo tallar - Haz clic en una figura para seleccionarla';
                    dom.drawingStatus.style.color = '#ff6b6b';
                    dom.drawingStatus.classList.add('tallando');
                }
                dom.drawingStatus.classList.remove('pintando');
            } else if (estado.modoMaterialActivo) {
                if (estado.figuraSeleccionada) {
                    dom.drawingStatus.textContent = '🧱 Añadiendo material: ' + estado.figuraSeleccionadaInfo.label + ' - Arrastra para añadir volumen';
                    dom.drawingStatus.style.color = '#4facfe';
                    dom.drawingStatus.classList.add('tallando');
                } else {
                    dom.drawingStatus.textContent = '🧱 Modo añadir material - Haz clic en una figura para seleccionarla';
                    dom.drawingStatus.style.color = '#4facfe';
                    dom.drawingStatus.classList.add('tallando');
                }
                dom.drawingStatus.classList.remove('pintando');
            } else if (estado.modoPincelActivo) {
                if (estado.usarTextura && estado.texturaPintura) {
                    dom.drawingStatus.textContent = '🖌️ Pincel con textura - Haz clic y arrastra para pintar';
                } else {
                    dom.drawingStatus.textContent = '🖌️ Pincel - Haz clic y arrastra sobre la figura para pintar';
                }
                dom.drawingStatus.style.color = '#4facfe';
                dom.drawingStatus.classList.add('pintando');
                dom.drawingStatus.classList.remove('tallando');
            } else if (estado.modoCubetaActivo) {
                if (estado.usarTextura && estado.texturaPintura) {
                    dom.drawingStatus.textContent = '🪣 Cubeta con textura - Haz clic en una figura para pintar toda';
                } else {
                    dom.drawingStatus.textContent = '🪣 Cubeta - Haz clic en una figura para pintar toda';
                }
                dom.drawingStatus.style.color = '#ff6b6b';
                dom.drawingStatus.classList.add('pintando');
                dom.drawingStatus.classList.remove('tallando');
            } else if (estado.modoDibujoActivo) {
                dom.drawingStatus.textContent = '✏️ Modo dibujo activo - Haz clic para agregar puntos';
                dom.drawingStatus.style.color = '#38ef7d';
                dom.drawingStatus.classList.remove('tallando');
                dom.drawingStatus.classList.remove('pintando');
            } else {
                dom.drawingStatus.textContent = '🔒 Modo dibujo desactivado';
                dom.drawingStatus.style.color = 'rgba(255,255,255,0.25)';
                dom.drawingStatus.classList.remove('tallando');
                dom.drawingStatus.classList.remove('pintando');
            }
        }
        actualizarCursor();
    }

    function actualizarCursor() {
        if (!estado.drawingRenderer) return;
        var canvas = estado.drawingRenderer.domElement;
        if (estado.modoOrbitaActivo) {
            canvas.style.cursor = 'grab';
        } else if (estado.modoManoActivo) {
            canvas.style.cursor = estado.puntoArrastrando ? 'grabbing' : 'grab';
        } else if (estado.modoConexionActivo) {
            canvas.style.cursor = 'pointer';
        } else if (estado.modoTallarActivo) {
            canvas.style.cursor = 'crosshair';
        } else if (estado.modoMaterialActivo) {
            canvas.style.cursor = 'crosshair';
        } else if (estado.modoPincelActivo) {
            canvas.style.cursor = 'crosshair';
        } else if (estado.modoCubetaActivo) {
            canvas.style.cursor = 'pointer';
        } else if (estado.modoDibujoActivo) {
            canvas.style.cursor = 'crosshair';
        } else {
            canvas.style.cursor = 'default';
        }
    }

    function actualizarTamanioCanvas() {
        if (!dom.drawingContainer || !estado.drawingRenderer || !estado.drawingCamera) return;
        try {
            var rect = dom.drawingContainer.getBoundingClientRect();
            var ancho = Math.max(rect.width || dom.drawingContainer.clientWidth || 400, 100);
            var alto = Math.max(rect.height || dom.drawingContainer.clientHeight || 300, 100);
            estado.drawingRenderer.setSize(ancho, alto);
            estado.drawingRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            estado.drawingCamera.aspect = ancho / alto;
            estado.drawingCamera.updateProjectionMatrix();
            estado.drawingRenderer.render(estado.drawingScene, estado.drawingCamera);
            if (estado.drawingControls) estado.drawingControls.update();
        } catch (error) {
            console.error('Error actualizando tamaño:', error);
        }
    }

    // ========== FUNCIONES DE CÁMARA ==========
    window.resetearCamara = function() {
        if (!estado.camera || !estado.controls) return;
        estado.camera.position.set(120, 100, 150);
        estado.controls.target.set(0, 0, 0);
        estado.controls.update();
        mensajeTerminal('🏠 Cámara reseteada', '#667eea');
        actualizarInfoCamara();
    };

    window.zoomIn = function() {
        if (!estado.camera || !estado.controls) return;
        var dir = new THREE.Vector3();
        estado.camera.position.clone().normalize(dir);
        estado.camera.position.multiplyScalar(0.9);
        estado.controls.update();
        actualizarInfoCamara();
    };

    window.zoomOut = function() {
        if (!estado.camera || !estado.controls) return;
        var dir = new THREE.Vector3();
        estado.camera.position.clone().normalize(dir);
        estado.camera.position.multiplyScalar(1.1);
        estado.controls.update();
        actualizarInfoCamara();
    };

    window.rotateUp = function() {
        if (!estado.camera || !estado.controls) return;
        var q = new THREE.Quaternion();
        var v = new THREE.Vector3(1, 0, 0);
        q.setFromAxisAngle(v, -0.1);
        estado.camera.position.applyQuaternion(q);
        estado.controls.update();
        actualizarInfoCamara();
    };

    window.rotateDown = function() {
        if (!estado.camera || !estado.controls) return;
        var q = new THREE.Quaternion();
        var v = new THREE.Vector3(1, 0, 0);
        q.setFromAxisAngle(v, 0.1);
        estado.camera.position.applyQuaternion(q);
        estado.controls.update();
        actualizarInfoCamara();
    };

    window.rotateLeft = function() {
        if (!estado.camera || !estado.controls) return;
        var q = new THREE.Quaternion();
        var v = new THREE.Vector3(0, 1, 0);
        q.setFromAxisAngle(v, -0.1);
        estado.camera.position.applyQuaternion(q);
        estado.controls.update();
        actualizarInfoCamara();
    };

    window.rotateRight = function() {
        if (!estado.camera || !estado.controls) return;
        var q = new THREE.Quaternion();
        var v = new THREE.Vector3(0, 1, 0);
        q.setFromAxisAngle(v, 0.1);
        estado.camera.position.applyQuaternion(q);
        estado.controls.update();
        actualizarInfoCamara();
    };

    window.setViewMode = function(mode) {
        if (!estado.camera || !estado.controls) return;
        if (mode === '2d') {
            estado.camera.position.set(0, 150, 0);
            estado.controls.target.set(0, 0, 0);
            estado.controls.update();
        } else {
            estado.camera.position.set(120, 100, 150);
            estado.controls.target.set(0, 0, 0);
            estado.controls.update();
        }
        var camMode = document.getElementById('camMode');
        if (camMode) camMode.textContent = mode.toUpperCase();
        mensajeTerminal('🎯 Vista ' + mode.toUpperCase(), '#667eea');
        actualizarInfoCamara();
    };

    window.toggleFullscreen = function() {
        var container = document.getElementById('appContainer');
        var btn = document.getElementById('fullscreenBtn');
        if (!document.fullscreenElement) {
            if (container.requestFullscreen) container.requestFullscreen();
            else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
            if (btn) btn.classList.add('active');
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            if (btn) btn.classList.remove('active');
        }
    };

    window.toggleMovementPanel = function() {
        var panel = document.getElementById('movementPanel');
        var btn = document.getElementById('togglePanelBtn');
        if (panel) panel.classList.toggle('hidden');
        if (btn) btn.classList.toggle('active');
    };

    // ========== FUNCIONES DE RANGO ==========
    window.actualizarRangoEje = function(eje) {
        var input = document.getElementById('rango' + eje.toUpperCase() + 'Input');
        var valueDisplay = document.getElementById('rango' + eje.toUpperCase() + 'Value');
        if (!input) return;
        var valor = parseInt(input.value);
        if (isNaN(valor) || valor < 10) { valor = 10; input.value = 10; }
        if (valor > 500) { valor = 500; input.value = 500; }
        if (eje === 'x') estado.rangoX = valor;
        else if (eje === 'y') estado.rangoY = valor;
        else if (eje === 'z') estado.rangoZ = valor;
        if (valueDisplay) valueDisplay.textContent = valor;
        reconstruirEjes();
        actualizarRangosUI();
        mensajeTerminal('📐 Rango ' + eje.toUpperCase() + ' = ' + valor, '#667eea');
    };

    window.resetearRangos = function() {
        estado.rangoX = RANGO_DEFAULT;
        estado.rangoY = RANGO_DEFAULT;
        estado.rangoZ = RANGO_DEFAULT;
        var rangoXInput = document.getElementById('rangoXInput');
        var rangoYInput = document.getElementById('rangoYInput');
        var rangoZInput = document.getElementById('rangoZInput');
        var rangoXValue = document.getElementById('rangoXValue');
        var rangoYValue = document.getElementById('rangoYValue');
        var rangoZValue = document.getElementById('rangoZValue');
        if (rangoXInput) rangoXInput.value = RANGO_DEFAULT;
        if (rangoYInput) rangoYInput.value = RANGO_DEFAULT;
        if (rangoZInput) rangoZInput.value = RANGO_DEFAULT;
        if (rangoXValue) rangoXValue.textContent = RANGO_DEFAULT;
        if (rangoYValue) rangoYValue.textContent = RANGO_DEFAULT;
        if (rangoZValue) rangoZValue.textContent = RANGO_DEFAULT;
        actualizarRangosPanelUI();
        reconstruirEjes();
        actualizarRangosUI();
        mensajeTerminal('📐 Rangos reseteados a ' + RANGO_DEFAULT, '#667eea');
    };

    // ========== FUNCIONES DE EJES ==========
    function limpiarEjes() {
        if (!estado.drawingScene) return;
        for (var i = 0; i < estado.ejesElementos.lineas.length; i++) {
            if (estado.drawingScene) estado.drawingScene.remove(estado.ejesElementos.lineas[i]);
        }
        for (var i = 0; i < estado.ejesElementos.marcas.length; i++) {
            if (estado.drawingScene) estado.drawingScene.remove(estado.ejesElementos.marcas[i]);
        }
        for (var i = 0; i < estado.ejesElementos.etiquetas.length; i++) {
            if (estado.drawingScene) estado.drawingScene.remove(estado.ejesElementos.etiquetas[i]);
        }
        for (var i = 0; i < estado.ejesElementos.numeros.length; i++) {
            if (estado.drawingScene) estado.drawingScene.remove(estado.ejesElementos.numeros[i]);
        }
        if (estado.ejesElementos.box && estado.drawingScene) {
            estado.drawingScene.remove(estado.ejesElementos.box);
        }
        if (estado.ejesElementos.grid && estado.drawingScene) {
            estado.drawingScene.remove(estado.ejesElementos.grid);
        }
        if (estado.ejesElementos.origen && estado.drawingScene) {
            estado.drawingScene.remove(estado.ejesElementos.origen);
        }
        estado.ejesElementos.lineas = [];
        estado.ejesElementos.marcas = [];
        estado.ejesElementos.etiquetas = [];
        estado.ejesElementos.numeros = [];
        estado.ejesElementos.box = null;
        estado.ejesElementos.grid = null;
        estado.ejesElementos.origen = null;
    }

    function reconstruirEjes() {
        limpiarEjes();
        crearEjesConRango();
        actualizarTamanioCanvas();
    }

    function crearEjesConRango() {
        if (!estado.drawingScene) return;
        var rangoX = estado.rangoX;
        var rangoY = estado.rangoY;
        var rangoZ = estado.rangoZ;
        
        var ejeX = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-rangoX, 0, 0), new THREE.Vector3(rangoX, 0, 0)]),
            new THREE.LineBasicMaterial({ color: 0xff4444, linewidth: 1 })
        );
        estado.drawingScene.add(ejeX);
        estado.ejesElementos.lineas.push(ejeX);
        
        var ejeY = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -rangoY, 0), new THREE.Vector3(0, rangoY, 0)]),
            new THREE.LineBasicMaterial({ color: 0x44ff44, linewidth: 1 })
        );
        estado.drawingScene.add(ejeY);
        estado.ejesElementos.lineas.push(ejeY);
        
        var ejeZ = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -rangoZ), new THREE.Vector3(0, 0, rangoZ)]),
            new THREE.LineBasicMaterial({ color: 0x4444ff, linewidth: 1 })
        );
        estado.drawingScene.add(ejeZ);
        estado.ejesElementos.lineas.push(ejeZ);
        
        var step = Math.max(5, Math.min(20, Math.floor(Math.min(rangoX, rangoY, rangoZ) / 10)));
        var tamanoMarca = 2;
        
        function crearMarcasEje(axis, color, rango) {
            var marcas = [];
            var fixedX = 0, fixedY = 0, fixedZ = 0;
            var dirX = 0, dirY = 0, dirZ = 0;
            if (axis === 'x') { dirX = 1; fixedY = 0; fixedZ = 0; }
            else if (axis === 'y') { dirY = 1; fixedX = 0; fixedZ = 0; }
            else if (axis === 'z') { dirZ = 1; fixedX = 0; fixedY = 0; }
            for (var v = -rango + step; v < rango; v += step) {
                if (Math.abs(v) < 0.1) continue;
                var x1 = fixedX + (dirX * v);
                var y1 = fixedY + (dirY * v);
                var z1 = fixedZ + (dirZ * v);
                if (axis === 'x') {
                    marcas.push(new THREE.Vector3(x1, -tamanoMarca, 0));
                    marcas.push(new THREE.Vector3(x1, tamanoMarca, 0));
                } else if (axis === 'y') {
                    marcas.push(new THREE.Vector3(-tamanoMarca, y1, 0));
                    marcas.push(new THREE.Vector3(tamanoMarca, y1, 0));
                } else if (axis === 'z') {
                    marcas.push(new THREE.Vector3(0, -tamanoMarca, z1));
                    marcas.push(new THREE.Vector3(0, tamanoMarca, z1));
                }
            }
            if (marcas.length > 0) {
                var geo = new THREE.BufferGeometry().setFromPoints(marcas);
                var mat = new THREE.LineBasicMaterial({ color: color, linewidth: 1, transparent: true, opacity: 0.3 });
                var line = new THREE.LineSegments(geo, mat);
                estado.drawingScene.add(line);
                estado.ejesElementos.marcas.push(line);
            }
        }
        
        crearMarcasEje('x', 0xff4444, rangoX);
        crearMarcasEje('y', 0x44ff44, rangoY);
        crearMarcasEje('z', 0x4444ff, rangoZ);
        
        function crearEtiqueta(texto, posicion, color) {
            var canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 32;
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, 64, 32);
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            if (ctx.roundRect) {
                ctx.roundRect(4, 4, 56, 24, 4);
                ctx.fill();
            } else {
                ctx.fillRect(4, 4, 56, 24);
            }
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = color || '#ffffff';
            ctx.fillText(texto, 32, 18);
            var texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            var material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthTest: false,
                sizeAttenuation: true
            });
            var sprite = new THREE.Sprite(material);
            sprite.position.copy(posicion);
            sprite.scale.set(8, 4, 1);
            estado.drawingScene.add(sprite);
            estado.ejesElementos.etiquetas.push(sprite);
        }
        
        crearEtiqueta('X', new THREE.Vector3(rangoX + 8, 0, 0), '#ff6666');
        crearEtiqueta('-X', new THREE.Vector3(-rangoX - 8, 0, 0), '#ff6666');
        crearEtiqueta('Y', new THREE.Vector3(0, rangoY + 8, 0), '#66ff66');
        crearEtiqueta('-Y', new THREE.Vector3(0, -rangoY - 8, 0), '#66ff66');
        crearEtiqueta('Z', new THREE.Vector3(0, 0, rangoZ + 8), '#6666ff');
        crearEtiqueta('-Z', new THREE.Vector3(0, 0, -rangoZ - 8), '#6666ff');
        
        var numStep = Math.max(10, Math.floor(Math.min(rangoX, rangoY, rangoZ) / 5));
        if (numStep > 50) numStep = 50;
        if (numStep < 5) numStep = 5;
        
        function crearMarcaNumerica(valor, posicion, color) {
            var canvas = document.createElement('canvas');
            canvas.width = 48;
            canvas.height = 24;
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, 48, 24);
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            if (ctx.roundRect) {
                ctx.roundRect(2, 2, 44, 20, 3);
                ctx.fill();
            } else {
                ctx.fillRect(2, 2, 44, 20);
            }
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = color || 'rgba(255,255,255,0.5)';
            ctx.fillText(valor.toString(), 24, 13);
            var texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            var material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthTest: false,
                sizeAttenuation: true
            });
            var sprite = new THREE.Sprite(material);
            sprite.position.copy(posicion);
            sprite.scale.set(6, 3, 1);
            estado.drawingScene.add(sprite);
            estado.ejesElementos.numeros.push(sprite);
        }
        
        for (var v = -rangoX + numStep; v < rangoX; v += numStep) {
            if (Math.abs(v) < 0.1) continue;
            var color = v < 0 ? 'rgba(255,100,100,0.4)' : 'rgba(100,255,100,0.4)';
            crearMarcaNumerica(v, new THREE.Vector3(v, -4, 0), color);
        }
        for (var v = -rangoY + numStep; v < rangoY; v += numStep) {
            if (Math.abs(v) < 0.1) continue;
            var color = v < 0 ? 'rgba(255,100,100,0.4)' : 'rgba(100,255,100,0.4)';
            crearMarcaNumerica(v, new THREE.Vector3(-4, v, 0), color);
        }
        for (var v = -rangoZ + numStep; v < rangoZ; v += numStep) {
            if (Math.abs(v) < 0.1) continue;
            var color = v < 0 ? 'rgba(100,100,255,0.4)' : 'rgba(100,100,255,0.4)';
            crearMarcaNumerica(v, new THREE.Vector3(4, -4, v), color);
        }
        
        var origenGeo = new THREE.SphereGeometry(1.2, 16, 16);
        var origenMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        var origenMesh = new THREE.Mesh(origenGeo, origenMat);
        origenMesh.position.set(0, 0, 0);
        estado.drawingScene.add(origenMesh);
        estado.ejesElementos.origen = origenMesh;
        crearEtiqueta('0', new THREE.Vector3(0, -4, 0), '#ffffff');
        
        var maxRango = Math.max(rangoX, rangoY, rangoZ);
        var gridHelper = new THREE.GridHelper(maxRango * 2, 20, 0x667eea, 0x2a2a4a);
        gridHelper.position.y = -0.5;
        estado.drawingScene.add(gridHelper);
        estado.ejesElementos.grid = gridHelper;
        
        var boxPoints = [
            new THREE.Vector3(-rangoX, -rangoY, -rangoZ),
            new THREE.Vector3(rangoX, -rangoY, -rangoZ),
            new THREE.Vector3(rangoX, rangoY, -rangoZ),
            new THREE.Vector3(-rangoX, rangoY, -rangoZ),
            new THREE.Vector3(-rangoX, -rangoY, -rangoZ),
            new THREE.Vector3(-rangoX, -rangoY, rangoZ),
            new THREE.Vector3(rangoX, -rangoY, rangoZ),
            new THREE.Vector3(rangoX, rangoY, rangoZ),
            new THREE.Vector3(-rangoX, rangoY, rangoZ),
            new THREE.Vector3(-rangoX, -rangoY, rangoZ)
        ];
        var boxGeo = new THREE.BufferGeometry().setFromPoints(boxPoints);
        var boxMat = new THREE.LineBasicMaterial({ color: 0x667eea, transparent: true, opacity: 0.08, linewidth: 1 });
        var boxLine = new THREE.Line(boxGeo, boxMat);
        estado.drawingScene.add(boxLine);
        estado.ejesElementos.box = boxLine;
    }

    // ========== FUNCIONES DE RANGOS PANEL ==========
    window.toggleRangesPanel = function() {
        var panel = document.getElementById('drawingRangesPanel');
        var btn = document.getElementById('paletteRangesToggle');
        if (panel) {
            estado.rangesPanelVisible = !estado.rangesPanelVisible;
            if (estado.rangesPanelVisible) {
                panel.classList.add('visible');
                panel.style.display = 'block';
                if (btn) btn.classList.add('active');
                actualizarRangosPanelUI();
            } else {
                panel.classList.remove('visible');
                panel.style.display = 'none';
                if (btn) btn.classList.remove('active');
            }
        }
    };

    window.aplicarRangosDesdePanel = function() {
        var minX = document.getElementById('rangoXMinInput');
        var maxX = document.getElementById('rangoXMaxInput');
        var minY = document.getElementById('rangoYMinInput');
        var maxY = document.getElementById('rangoYMaxInput');
        var minZ = document.getElementById('rangoZMinInput');
        var maxZ = document.getElementById('rangoZMaxInput');
        if (!minX || !maxX || !minY || !maxY || !minZ || !maxZ) {
            mensajeTerminal('❌ No se encontraron todos los campos de rango', '#f5576c');
            return;
        }
        var xMin = parseInt(minX.value);
        var xMax = parseInt(maxX.value);
        var yMin = parseInt(minY.value);
        var yMax = parseInt(maxY.value);
        var zMin = parseInt(minZ.value);
        var zMax = parseInt(maxZ.value);
        if (isNaN(xMin) || isNaN(xMax) || isNaN(yMin) || isNaN(yMax) || isNaN(zMin) || isNaN(zMax)) {
            mensajeTerminal('❌ Todos los valores deben ser números', '#f5576c');
            return;
        }
        if (xMin >= xMax || yMin >= yMax || zMin >= zMax) {
            mensajeTerminal('❌ El valor mínimo debe ser menor que el máximo', '#f5576c');
            return;
        }
        var rangoX = Math.max(Math.abs(xMin), Math.abs(xMax));
        var rangoY = Math.max(Math.abs(yMin), Math.abs(yMax));
        var rangoZ = Math.max(Math.abs(zMin), Math.abs(zMax));
        if (rangoX < 10) rangoX = 10;
        if (rangoY < 10) rangoY = 10;
        if (rangoZ < 10) rangoZ = 10;
        if (rangoX > 500) rangoX = 500;
        if (rangoY > 500) rangoY = 500;
        if (rangoZ > 500) rangoZ = 500;
        estado.rangoX = rangoX;
        estado.rangoY = rangoY;
        estado.rangoZ = rangoZ;
        var rangoXInput = document.getElementById('rangoXInput');
        var rangoYInput = document.getElementById('rangoYInput');
        var rangoZInput = document.getElementById('rangoZInput');
        var rangoXValue = document.getElementById('rangoXValue');
        var rangoYValue = document.getElementById('rangoYValue');
        var rangoZValue = document.getElementById('rangoZValue');
        if (rangoXInput) rangoXInput.value = rangoX;
        if (rangoYInput) rangoYInput.value = rangoY;
        if (rangoZInput) rangoZInput.value = rangoZ;
        if (rangoXValue) rangoXValue.textContent = rangoX;
        if (rangoYValue) rangoYValue.textContent = rangoY;
        if (rangoZValue) rangoZValue.textContent = rangoZ;
        var displayX = document.getElementById('rangoXDisplay');
        var displayY = document.getElementById('rangoYDisplay');
        var displayZ = document.getElementById('rangoZDisplay');
        if (displayX) displayX.textContent = '±' + rangoX;
        if (displayY) displayY.textContent = '±' + rangoY;
        if (displayZ) displayZ.textContent = '±' + rangoZ;
        reconstruirEjes();
        actualizarRangosUI();
        mensajeTerminal('📐 Rangos aplicados: X: ±' + rangoX + ', Y: ±' + rangoY + ', Z: ±' + rangoZ, '#38ef7d');
    };

    window.resetearRangosDesdePanel = function() {
        window.resetearRangos();
        actualizarRangosPanelUI();
        mensajeTerminal('🔄 Rangos reseteados a ' + RANGO_DEFAULT, '#667eea');
    };

    function setupRangesPanelEvents() {
        var rangeItems = ['X', 'Y', 'Z'];
        rangeItems.forEach(function(axis) {
            var rangeInput = document.getElementById('rango' + axis + 'Range');
            var minInput = document.getElementById('rango' + axis + 'MinInput');
            var maxInput = document.getElementById('rango' + axis + 'MaxInput');
            var display = document.getElementById('rango' + axis + 'Display');
            if (rangeInput && minInput && maxInput && display) {
                rangeInput.addEventListener('input', function() {
                    var val = parseInt(this.value);
                    if (isNaN(val)) return;
                    if (val < 10) val = 10;
                    if (val > 500) val = 500;
                    this.value = val;
                    minInput.value = -val;
                    maxInput.value = val;
                    display.textContent = '±' + val;
                });
                minInput.addEventListener('change', function() {
                    var axis = this.id.replace('rango', '').replace('MinInput', '');
                    var minVal = parseInt(this.value);
                    var maxInput = document.getElementById('rango' + axis + 'MaxInput');
                    var maxVal = parseInt(maxInput ? maxInput.value : 0);
                    if (isNaN(minVal) || isNaN(maxVal)) return;
                    if (minVal >= maxVal) {
                        mensajeTerminal('⚠️ El mínimo debe ser menor que el máximo', '#fda085');
                        return;
                    }
                    var rango = Math.max(Math.abs(minVal), Math.abs(maxVal));
                    if (rango < 10) rango = 10;
                    if (rango > 500) rango = 500;
                    var rangeInput = document.getElementById('rango' + axis + 'Range');
                    var display = document.getElementById('rango' + axis + 'Display');
                    if (rangeInput) rangeInput.value = rango;
                    if (display) display.textContent = '±' + rango;
                });
                maxInput.addEventListener('change', function() {
                    var axis = this.id.replace('rango', '').replace('MaxInput', '');
                    var minInput = document.getElementById('rango' + axis + 'MinInput');
                    var minVal = parseInt(minInput ? minInput.value : 0);
                    var maxVal = parseInt(this.value);
                    if (isNaN(minVal) || isNaN(maxVal)) return;
                    if (minVal >= maxVal) {
                        mensajeTerminal('⚠️ El mínimo debe ser menor que el máximo', '#fda085');
                        return;
                    }
                    var rango = Math.max(Math.abs(minVal), Math.abs(maxVal));
                    if (rango < 10) rango = 10;
                    if (rango > 500) rango = 500;
                    var rangeInput = document.getElementById('rango' + axis + 'Range');
                    var display = document.getElementById('rango' + axis + 'Display');
                    if (rangeInput) rangeInput.value = rango;
                    if (display) display.textContent = '±' + rango;
                });
            }
        });
    }

    // ========== FUNCIONES DE DIBUJO CON MOUSE ==========
    window.setPointMode = function(mode) {
        if (estado.modoConexionActivo) {
            estado.modoConexionActivo = false;
            estado.puntoSeleccionado = null;
            estado.puntoSeleccionadoMesh = null;
            eliminarLineaTemporal();
            var btnConectar = document.getElementById('paletteConnect');
            if (btnConectar) {
                btnConectar.classList.remove('active');
                btnConectar.style.color = 'rgba(255,255,255,0.4)';
                btnConectar.style.background = 'none';
            }
        }
        if (estado.modoManoActivo) {
            estado.modoManoActivo = false;
            limpiarSeleccionMano();
            var btnMano = document.getElementById('paletteHand');
            if (btnMano) {
                btnMano.classList.remove('active');
                btnMano.style.color = 'rgba(255,255,255,0.4)';
                btnMano.style.background = 'none';
            }
        }
        if (estado.modoOrbitaActivo) {
            estado.modoOrbitaActivo = false;
            if (estado.drawingControls) {
                estado.drawingControls.enabled = false;
                estado.drawingControls.enableRotate = false;
                estado.drawingControls.enablePan = false;
                estado.drawingControls.enableZoom = false;
            }
            var btnOrbit = document.getElementById('paletteOrbit');
            if (btnOrbit) {
                btnOrbit.classList.remove('active');
                btnOrbit.style.color = 'rgba(255,255,255,0.4)';
                btnOrbit.style.background = 'none';
            }
        }
        if (estado.modoTallarActivo) {
            estado.modoTallarActivo = false;
            estado.figuraSeleccionada = null;
            estado.figuraSeleccionadaInfo = null;
            estado.tallarActivo = false;
            actualizarBotonTallar();
        }
        if (estado.modoMaterialActivo) {
            estado.modoMaterialActivo = false;
            estado.figuraSeleccionada = null;
            estado.figuraSeleccionadaInfo = null;
            estado.tallarActivo = false;
            actualizarBotonMaterial();
        }
        if (estado.modoPincelActivo) {
            estado.modoPincelActivo = false;
            actualizarBotonesPintura();
        }
        if (estado.modoCubetaActivo) {
            estado.modoCubetaActivo = false;
            actualizarBotonesPintura();
        }
        if (mode === 'create') {
            estado.modoDibujoActivo = !estado.modoDibujoActivo;
        }
        var btn = document.getElementById('paletteCreatePoint');
        if (btn) {
            if (estado.modoDibujoActivo) {
                btn.classList.add('active');
                btn.style.color = '#4facfe';
                btn.style.background = 'rgba(79, 172, 254, 0.15)';
            } else {
                btn.classList.remove('active');
                btn.style.color = 'rgba(255,255,255,0.4)';
                btn.style.background = 'none';
            }
        }
        actualizarEstadoDibujo();
        mensajeTerminal(
            estado.modoDibujoActivo ? '✏️ Modo dibujo activado' : '🔒 Modo dibujo desactivado',
            estado.modoDibujoActivo ? '#38ef7d' : '#fda085'
        );
    };

    window.activarModoConexion = function() {
        if (estado.modoDibujoActivo) {
            estado.modoDibujoActivo = false;
            var btnDibujo = document.getElementById('paletteCreatePoint');
            if (btnDibujo) {
                btnDibujo.classList.remove('active');
                btnDibujo.style.color = 'rgba(255,255,255,0.4)';
                btnDibujo.style.background = 'none';
            }
        }
        if (estado.modoManoActivo) {
            estado.modoManoActivo = false;
            limpiarSeleccionMano();
            var btnMano = document.getElementById('paletteHand');
            if (btnMano) {
                btnMano.classList.remove('active');
                btnMano.style.color = 'rgba(255,255,255,0.4)';
                btnMano.style.background = 'none';
            }
        }
        if (estado.modoOrbitaActivo) {
            estado.modoOrbitaActivo = false;
            if (estado.drawingControls) {
                estado.drawingControls.enabled = false;
                estado.drawingControls.enableRotate = false;
                estado.drawingControls.enablePan = false;
                estado.drawingControls.enableZoom = false;
            }
            var btnOrbit = document.getElementById('paletteOrbit');
            if (btnOrbit) {
                btnOrbit.classList.remove('active');
                btnOrbit.style.color = 'rgba(255,255,255,0.4)';
                btnOrbit.style.background = 'none';
            }
        }
        if (estado.modoTallarActivo) {
            estado.modoTallarActivo = false;
            estado.figuraSeleccionada = null;
            estado.figuraSeleccionadaInfo = null;
            estado.tallarActivo = false;
            actualizarBotonTallar();
        }
        if (estado.modoMaterialActivo) {
            estado.modoMaterialActivo = false;
            estado.figuraSeleccionada = null;
            estado.figuraSeleccionadaInfo = null;
            estado.tallarActivo = false;
            actualizarBotonMaterial();
        }
        if (estado.modoPincelActivo) {
            estado.modoPincelActivo = false;
            actualizarBotonesPintura();
        }
        if (estado.modoCubetaActivo) {
            estado.modoCubetaActivo = false;
            actualizarBotonesPintura();
        }
        estado.modoConexionActivo = !estado.modoConexionActivo;
        if (!estado.modoConexionActivo) {
            estado.puntoSeleccionado = null;
            estado.puntoSeleccionadoMesh = null;
            eliminarLineaTemporal();
        }
        var btnConectar = document.getElementById('paletteConnect');
        if (btnConectar) {
            if (estado.modoConexionActivo) {
                btnConectar.classList.add('active');
                btnConectar.style.color = '#38ef7d';
                btnConectar.style.background = 'rgba(56, 239, 125, 0.15)';
            } else {
                btnConectar.classList.remove('active');
                btnConectar.style.color = 'rgba(255,255,255,0.4)';
                btnConectar.style.background = 'none';
            }
        }
        actualizarEstadoDibujo();
        actualizarListaPuntos();
        mensajeTerminal(
            estado.modoConexionActivo ? '🔗 Modo conexión activado - Selecciona un punto' : '🔗 Modo conexión desactivado',
            estado.modoConexionActivo ? '#38ef7d' : '#fda085'
        );
    };

    function eliminarLineaTemporal() {
        if (estado.lineaTemporal) {
            if (estado.drawingScene) {
                estado.drawingScene.remove(estado.lineaTemporal);
            }
            estado.lineaTemporal = null;
        }
    }

    function crearLineaTemporal(punto) {
        eliminarLineaTemporal();
        if (!estado.puntoSeleccionado) return;
        var p1 = estado.puntoSeleccionado;
        var pts = [
            new THREE.Vector3(p1.x, p1.y + 0.01, p1.z),
            new THREE.Vector3(punto.x, punto.y + 0.01, punto.z)
        ];
        var geo = new THREE.BufferGeometry().setFromPoints(pts);
        var mat = new THREE.LineBasicMaterial({ 
            color: 0x4facfe, 
            linewidth: 2,
            transparent: true,
            opacity: 0.5
        });
        var line = new THREE.Line(geo, mat);
        line.raycast = function() {};
        estado.drawingScene.add(line);
        estado.lineaTemporal = line;
    }

    // ========== FUNCIONES DEL MODO MANO ==========
    window.activarModoMano = function() {
        if (estado.modoDibujoActivo) {
            estado.modoDibujoActivo = false;
            var btnDibujo = document.getElementById('paletteCreatePoint');
            if (btnDibujo) {
                btnDibujo.classList.remove('active');
                btnDibujo.style.color = 'rgba(255,255,255,0.4)';
                btnDibujo.style.background = 'none';
            }
        }
        if (estado.modoConexionActivo) {
            estado.modoConexionActivo = false;
            estado.puntoSeleccionado = null;
            estado.puntoSeleccionadoMesh = null;
            eliminarLineaTemporal();
            var btnConectar = document.getElementById('paletteConnect');
            if (btnConectar) {
                btnConectar.classList.remove('active');
                btnConectar.style.color = 'rgba(255,255,255,0.4)';
                btnConectar.style.background = 'none';
            }
        }
        if (estado.modoOrbitaActivo) {
            estado.modoOrbitaActivo = false;
            if (estado.drawingControls) {
                estado.drawingControls.enabled = false;
                estado.drawingControls.enableRotate = false;
                estado.drawingControls.enablePan = false;
                estado.drawingControls.enableZoom = false;
            }
            var btnOrbit = document.getElementById('paletteOrbit');
            if (btnOrbit) {
                btnOrbit.classList.remove('active');
                btnOrbit.style.color = 'rgba(255,255,255,0.4)';
                btnOrbit.style.background = 'none';
            }
        }
        if (estado.modoTallarActivo) {
            estado.modoTallarActivo = false;
            estado.figuraSeleccionada = null;
            estado.figuraSeleccionadaInfo = null;
            estado.tallarActivo = false;
            actualizarBotonTallar();
        }
        if (estado.modoMaterialActivo) {
            estado.modoMaterialActivo = false;
            estado.figuraSeleccionada = null;
            estado.figuraSeleccionadaInfo = null;
            estado.tallarActivo = false;
            actualizarBotonMaterial();
        }
        if (estado.modoPincelActivo) {
            estado.modoPincelActivo = false;
            actualizarBotonesPintura();
        }
        if (estado.modoCubetaActivo) {
            estado.modoCubetaActivo = false;
            actualizarBotonesPintura();
        }
        estado.modoManoActivo = !estado.modoManoActivo;
        if (!estado.modoManoActivo) {
            limpiarSeleccionMano();
        }
        var btnMano = document.getElementById('paletteHand');
        if (btnMano) {
            if (estado.modoManoActivo) {
                btnMano.classList.add('active');
                btnMano.style.color = '#fda085';
                btnMano.style.background = 'rgba(253, 160, 133, 0.15)';
            } else {
                btnMano.classList.remove('active');
                btnMano.style.color = 'rgba(255,255,255,0.4)';
                btnMano.style.background = 'none';
            }
        }
        actualizarEstadoDibujo();
        actualizarListaPuntos();
        mensajeTerminal(
            estado.modoManoActivo ? '✋ Modo mano activado - Haz clic en puntos para seleccionarlos' : '✋ Modo mano desactivado',
            estado.modoManoActivo ? '#fda085' : '#fda085'
        );
    };

    window.activarModoOrbita = function() {
        if (estado.modoDibujoActivo) {
            estado.modoDibujoActivo = false;
            var btnDibujo = document.getElementById('paletteCreatePoint');
            if (btnDibujo) {
                btnDibujo.classList.remove('active');
                btnDibujo.style.color = 'rgba(255,255,255,0.4)';
                btnDibujo.style.background = 'none';
            }
        }
        if (estado.modoConexionActivo) {
            estado.modoConexionActivo = false;
            estado.puntoSeleccionado = null;
            estado.puntoSeleccionadoMesh = null;
            eliminarLineaTemporal();
            var btnConectar = document.getElementById('paletteConnect');
            if (btnConectar) {
                btnConectar.classList.remove('active');
                btnConectar.style.color = 'rgba(255,255,255,0.4)';
                btnConectar.style.background = 'none';
            }
        }
        if (estado.modoManoActivo) {
            estado.modoManoActivo = false;
            limpiarSeleccionMano();
            var btnMano = document.getElementById('paletteHand');
            if (btnMano) {
                btnMano.classList.remove('active');
                btnMano.style.color = 'rgba(255,255,255,0.4)';
                btnMano.style.background = 'none';
            }
        }
        if (estado.modoTallarActivo) {
            estado.modoTallarActivo = false;
            estado.figuraSeleccionada = null;
            estado.figuraSeleccionadaInfo = null;
            estado.tallarActivo = false;
            actualizarBotonTallar();
        }
        if (estado.modoMaterialActivo) {
            estado.modoMaterialActivo = false;
            estado.figuraSeleccionada = null;
            estado.figuraSeleccionadaInfo = null;
            estado.tallarActivo = false;
            actualizarBotonMaterial();
        }
        if (estado.modoPincelActivo) {
            estado.modoPincelActivo = false;
            actualizarBotonesPintura();
        }
        if (estado.modoCubetaActivo) {
            estado.modoCubetaActivo = false;
            actualizarBotonesPintura();
        }
        estado.modoOrbitaActivo = !estado.modoOrbitaActivo;
        if (estado.drawingControls) {
            estado.drawingControls.enabled = estado.modoOrbitaActivo;
            estado.drawingControls.enableRotate = estado.modoOrbitaActivo;
            estado.drawingControls.enablePan = estado.modoOrbitaActivo;
            estado.drawingControls.enableZoom = estado.modoOrbitaActivo;
            estado.drawingControls.update();
        }
        var btnOrbit = document.getElementById('paletteOrbit');
        if (btnOrbit) {
            if (estado.modoOrbitaActivo) {
                btnOrbit.classList.add('active');
                btnOrbit.style.color = '#667eea';
                btnOrbit.style.background = 'rgba(102, 126, 234, 0.15)';
            } else {
                btnOrbit.classList.remove('active');
                btnOrbit.style.color = 'rgba(255,255,255,0.4)';
                btnOrbit.style.background = 'none';
            }
        }
        actualizarEstadoDibujo();
        actualizarListaPuntos();
        mensajeTerminal(
            estado.modoOrbitaActivo ? '🌐 Modo órbita activado - Arrastra para mover la cámara' : '🌐 Modo órbita desactivado',
            estado.modoOrbitaActivo ? '#667eea' : '#fda085'
        );
    };

    function limpiarSeleccionMano() {
        for (var i = 0; i < estado.meshesSeleccionados.length; i++) {
            var mesh = estado.meshesSeleccionados[i];
            var label = mesh.userData.pointLabel;
            var punto = null;
            for (var j = 0; j < estado.puntos.length; j++) {
                if (estado.puntos[j].label === label) {
                    punto = estado.puntos[j];
                    break;
                }
            }
            if (punto) {
                mesh.material.color.setHex(punto.color);
            }
            mesh.scale.set(1, 1, 1);
        }
        estado.puntosSeleccionados = [];
        estado.meshesSeleccionados = [];
        estado.puntoArrastrando = null;
        estado.puntoArrastrandoMesh = null;
        estado.offsetArrastre = null;
        estado.mousePresionado = false;
        actualizarCursor();
    }

    function seleccionarPuntoMano(label) {
        var punto = null;
        var mesh = null;
        for (var i = 0; i < estado.puntos.length; i++) {
            if (estado.puntos[i].label === label) {
                punto = estado.puntos[i];
                break;
            }
        }
        if (!punto) return;
        for (var i = 0; i < estado.meshesPuntos.length; i++) {
            if (estado.meshesPuntos[i].userData.pointLabel === label) {
                mesh = estado.meshesPuntos[i];
                break;
            }
        }
        if (!mesh) return;
        var idx = estado.meshesSeleccionados.indexOf(mesh);
        if (idx !== -1) {
            mesh.material.color.setHex(punto.color);
            mesh.scale.set(1, 1, 1);
            estado.meshesSeleccionados.splice(idx, 1);
            for (var i = 0; i < estado.puntosSeleccionados.length; i++) {
                if (estado.puntosSeleccionados[i].label === label) {
                    estado.puntosSeleccionados.splice(i, 1);
                    break;
                }
            }
            mensajeTerminal('🔽 Punto ' + label + ' deseleccionado', 'rgba(255,255,255,0.3)');
            actualizarListaPuntos();
            actualizarCursor();
            return;
        }
        mesh.material.color.setHex(0xfda085);
        mesh.scale.set(1.3, 1.3, 1.3);
        estado.puntosSeleccionados.push(punto);
        estado.meshesSeleccionados.push(mesh);
        mensajeTerminal('🟠 Punto ' + label + ' seleccionado (arrastra para mover)', '#fda085');
        actualizarListaPuntos();
        actualizarCursor();
    }

    function manejarClicMano(event) {
        try {
            var rect = estado.drawingRenderer.domElement.getBoundingClientRect();
            var x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            var y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(x, y), estado.drawingCamera);
            var intersects = [];
            for (var i = 0; i < estado.meshesPuntos.length; i++) {
                var mesh = estado.meshesPuntos[i];
                var intersect = raycaster.intersectObject(mesh);
                if (intersect.length > 0) {
                    intersects.push({ mesh: mesh, distance: intersect[0].distance });
                }
            }
            intersects.sort(function(a, b) { return a.distance - b.distance; });
            if (intersects.length === 0) {
                limpiarSeleccionMano();
                actualizarListaPuntos();
                mensajeTerminal('🟠 Selección limpiada', 'rgba(255,255,255,0.3)');
                return;
            }
            var mesh = intersects[0].mesh;
            var label = mesh.userData.pointLabel;
            seleccionarPuntoMano(label);
        } catch (error) {
            console.error('Error en clic mano:', error);
        }
    }

    function manejarMouseDownMano(event) {
        if (!estado.modoManoActivo) return;
        if (estado.puntosSeleccionados.length === 0) return;
        try {
            estado.mousePresionado = true;
            var rect = estado.drawingRenderer.domElement.getBoundingClientRect();
            var x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            var y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(x, y), estado.drawingCamera);
            for (var i = 0; i < estado.meshesSeleccionados.length; i++) {
                var mesh = estado.meshesSeleccionados[i];
                var intersect = raycaster.intersectObject(mesh);
                if (intersect.length > 0) {
                    estado.puntoArrastrando = estado.puntosSeleccionados[i];
                    estado.puntoArrastrandoMesh = mesh;
                    var plano = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
                    var interseccionPlano = new THREE.Vector3();
                    raycaster.ray.intersectPlane(plano, interseccionPlano);
                    if (interseccionPlano) {
                        var cam = estado.drawingCamera.position;
                        var dir = raycaster.ray.direction.clone().normalize();
                        var t = -cam.z / dir.z;
                        var puntoEnZ = cam.clone().add(dir.clone().multiplyScalar(t));
                        var pz = Math.round((cam.z - puntoEnZ.z) * 0.15);
                        estado.offsetArrastre = {
                            x: interseccionPlano.x - estado.puntoArrastrando.x,
                            y: interseccionPlano.y - estado.puntoArrastrando.y,
                            z: pz - estado.puntoArrastrando.z
                        };
                    } else {
                        estado.offsetArrastre = { x: 0, y: 0, z: 0 };
                    }
                    actualizarCursor();
                    mensajeTerminal('✋ Arrastrando ' + estado.puntoArrastrando.label + '...', '#fda085');
                    break;
                }
            }
        } catch (error) {
            console.error('Error en mouse down mano:', error);
        }
    }

    function manejarMouseMoveMano(event) {
        if (!estado.modoManoActivo) return;
        if (!estado.puntoArrastrando) return;
        if (!estado.offsetArrastre) return;
        if (!estado.mousePresionado) return;
        try {
            var rect = estado.drawingRenderer.domElement.getBoundingClientRect();
            var x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            var y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(x, y), estado.drawingCamera);
            var plano = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
            var interseccion = new THREE.Vector3();
            raycaster.ray.intersectPlane(plano, interseccion);
            if (interseccion) {
                var cam = estado.drawingCamera.position;
                var dir = raycaster.ray.direction.clone().normalize();
                var t = -cam.z / dir.z;
                var puntoEnZ = cam.clone().add(dir.clone().multiplyScalar(t));
                var pz = Math.round((cam.z - puntoEnZ.z) * 0.15);
                var nuevoX = Math.round(interseccion.x - estado.offsetArrastre.x);
                var nuevoY = Math.round(interseccion.y - estado.offsetArrastre.y);
                var nuevoZ = Math.round(pz - estado.offsetArrastre.z);
                nuevoX = Math.max(-estado.rangoX, Math.min(estado.rangoX, nuevoX));
                nuevoY = Math.max(-estado.rangoY, Math.min(estado.rangoY, nuevoY));
                nuevoZ = Math.max(-estado.rangoZ, Math.min(estado.rangoZ, nuevoZ));
                var deltaX = nuevoX - estado.puntoArrastrando.x;
                var deltaY = nuevoY - estado.puntoArrastrando.y;
                var deltaZ = nuevoZ - estado.puntoArrastrando.z;
                if (Math.abs(deltaX) < 0.01 && Math.abs(deltaY) < 0.01 && Math.abs(deltaZ) < 0.01) return;
                for (var i = 0; i < estado.puntosSeleccionados.length; i++) {
                    var p = estado.puntosSeleccionados[i];
                    var newX = Math.max(-estado.rangoX, Math.min(estado.rangoX, p.x + deltaX));
                    var newY = Math.max(-estado.rangoY, Math.min(estado.rangoY, p.y + deltaY));
                    var newZ = Math.max(-estado.rangoZ, Math.min(estado.rangoZ, p.z + deltaZ));
                    p.x = newX;
                    p.y = newY;
                    p.z = newZ;
                }
                for (var i = 0; i < estado.meshesSeleccionados.length; i++) {
                    var mesh = estado.meshesSeleccionados[i];
                    var label = mesh.userData.pointLabel;
                    for (var j = 0; j < estado.puntosSeleccionados.length; j++) {
                        if (estado.puntosSeleccionados[j].label === label) {
                            mesh.position.set(
                                estado.puntosSeleccionados[j].x,
                                estado.puntosSeleccionados[j].y,
                                estado.puntosSeleccionados[j].z
                            );
                            break;
                        }
                    }
                }
                actualizarLineasConectadas();
                actualizarUI();
            }
        } catch (error) {
            console.error('Error en mouse move mano:', error);
        }
    }

    function manejarMouseUpMano(event) {
        if (!estado.modoManoActivo) return;
        estado.mousePresionado = false;
        if (estado.puntoArrastrando) {
            mensajeTerminal('✅ Movimiento completado', '#38ef7d');
            estado.puntoArrastrando = null;
            estado.puntoArrastrandoMesh = null;
            estado.offsetArrastre = null;
            actualizarCursor();
            sincronizarEditor();
            actualizarTamanioCanvas();
            actualizarUI();
        }
    }

    function actualizarLineasConectadas() {
        var labelsSeleccionados = [];
        for (var i = 0; i < estado.puntosSeleccionados.length; i++) {
            labelsSeleccionados.push(estado.puntosSeleccionados[i].label);
        }
        for (var i = 0; i < estado.lineas.length; i++) {
            var linea = estado.lineas[i];
            var p1Label = linea.p1.label;
            var p2Label = linea.p2.label;
            var p1Seleccionado = false;
            var p2Seleccionado = false;
            for (var j = 0; j < labelsSeleccionados.length; j++) {
                if (labelsSeleccionados[j] === p1Label) p1Seleccionado = true;
                if (labelsSeleccionados[j] === p2Label) p2Seleccionado = true;
            }
            if (p1Seleccionado || p2Seleccionado) {
                var p1Pos = new THREE.Vector3(linea.p1.x, linea.p1.y + 0.01, linea.p1.z);
                var p2Pos = new THREE.Vector3(linea.p2.x, linea.p2.y + 0.01, linea.p2.z);
                var pts = [p1Pos, p2Pos];
                var nuevaGeo = new THREE.BufferGeometry().setFromPoints(pts);
                for (var j = 0; j < estado.meshesLineas.length; j++) {
                    var meshLinea = estado.meshesLineas[j];
                    if (meshLinea.userData && meshLinea.userData.label === linea.label) {
                        meshLinea.geometry.dispose();
                        meshLinea.geometry = nuevaGeo;
                        meshLinea.geometry.attributes.position.needsUpdate = true;
                        break;
                    }
                }
            }
        }
    }

    // ========== FUNCIONES DE DIBUJO CON MOUSE ==========
    function alHacerClicEnCanvas(event) {
        if (estado.ejecutando) return;
        if (!estado.drawingRenderer) return;
        if (estado.modoPincelActivo) {
            pintarConPincel(event);
            return;
        }
        if (estado.modoCubetaActivo) {
            pintarConCubeta(event);
            return;
        }
        if (estado.modoOrbitaActivo) return;
        if (estado.modoTallarActivo) {
            manejarMouseDownTallar(event);
            return;
        }
        if (estado.modoMaterialActivo) {
            manejarMouseDownMaterial(event);
            return;
        }
        if (estado.modoManoActivo) {
            manejarClicMano(event);
            return;
        }
        if (estado.modoConexionActivo) {
            manejarClicConexion(event);
            return;
        }
        if (estado.modoDibujoActivo) {
            manejarClicDibujo(event);
            return;
        }
    }

    function manejarClicDibujo(event) {
        try {
            var rect = estado.drawingRenderer.domElement.getBoundingClientRect();
            var x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            var y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(x, y), estado.drawingCamera);
            var plano = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
            var interseccion = new THREE.Vector3();
            raycaster.ray.intersectPlane(plano, interseccion);
            if (interseccion) {
                var cam = estado.drawingCamera.position;
                var dir = raycaster.ray.direction.clone().normalize();
                var t = -cam.z / dir.z;
                var puntoEnZ = cam.clone().add(dir.clone().multiplyScalar(t));
                var px = Math.round(interseccion.x);
                var py = Math.round(interseccion.y);
                var pz = Math.round((cam.z - puntoEnZ.z) * 0.15);
                px = Math.max(-estado.rangoX, Math.min(estado.rangoX, px));
                py = Math.max(-estado.rangoY, Math.min(estado.rangoY, py));
                pz = Math.max(-estado.rangoZ, Math.min(estado.rangoZ, pz));
                crearPunto(px, py, pz);
            }
        } catch (error) {
            console.error('Error en clic dibujo:', error);
        }
    }

    function manejarClicConexion(event) {
        try {
            var rect = estado.drawingRenderer.domElement.getBoundingClientRect();
            var x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            var y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(x, y), estado.drawingCamera);
            var intersects = [];
            for (var i = 0; i < estado.meshesPuntos.length; i++) {
                var mesh = estado.meshesPuntos[i];
                var intersect = raycaster.intersectObject(mesh);
                if (intersect.length > 0) {
                    intersects.push({ mesh: mesh, distance: intersect[0].distance });
                }
            }
            intersects.sort(function(a, b) { return a.distance - b.distance; });
            if (intersects.length === 0) {
                mensajeTerminal('⚠️ No se encontró ningún punto. Haz clic en un punto existente.', '#fda085');
                return;
            }
            var mesh = intersects[0].mesh;
            var label = mesh.userData.pointLabel;
            var punto = null;
            for (var i = 0; i < estado.puntos.length; i++) {
                if (estado.puntos[i].label === label) {
                    punto = estado.puntos[i];
                    break;
                }
            }
            if (!punto) return;
            if (!estado.puntoSeleccionado) {
                estado.puntoSeleccionado = punto;
                estado.puntoSeleccionadoMesh = mesh;
                mesh.material.color.setHex(0x4facfe);
                mesh.scale.set(1.5, 1.5, 1.5);
                mensajeTerminal('🔗 Punto ' + punto.label + ' seleccionado. Ahora selecciona el segundo punto.', '#4facfe');
                actualizarEstadoDibujo();
                actualizarListaPuntos();
                return;
            }
            if (estado.puntoSeleccionado.label === punto.label) {
                if (estado.puntoSeleccionadoMesh) {
                    estado.puntoSeleccionadoMesh.material.color.setHex(estado.puntoSeleccionado.color);
                    estado.puntoSeleccionadoMesh.scale.set(1, 1, 1);
                }
                estado.puntoSeleccionado = null;
                estado.puntoSeleccionadoMesh = null;
                eliminarLineaTemporal();
                mensajeTerminal('🔗 Selección cancelada', '#fda085');
                actualizarEstadoDibujo();
                actualizarListaPuntos();
                return;
            }
            var p1 = estado.puntoSeleccionado;
            var p2 = punto;
            var existe = false;
            for (var i = 0; i < estado.lineas.length; i++) {
                var l = estado.lineas[i];
                if ((l.p1.label === p1.label && l.p2.label === p2.label) ||
                    (l.p1.label === p2.label && l.p2.label === p1.label)) {
                    existe = true;
                    break;
                }
            }
            if (existe) {
                mensajeTerminal('⚠️ La línea ' + p1.label + '-' + p2.label + ' ya existe', '#fda085');
                if (estado.puntoSeleccionadoMesh) {
                    estado.puntoSeleccionadoMesh.material.color.setHex(estado.puntoSeleccionado.color);
                    estado.puntoSeleccionadoMesh.scale.set(1, 1, 1);
                }
                estado.puntoSeleccionado = null;
                estado.puntoSeleccionadoMesh = null;
                eliminarLineaTemporal();
                actualizarEstadoDibujo();
                actualizarListaPuntos();
                return;
            }
            var color = estado.colorActual;
            estado.lineas.push({ p1: p1, p2: p2, label: p1.label + '-' + p2.label });
            var pts = [
                new THREE.Vector3(p1.x, p1.y + 0.01, p1.z),
                new THREE.Vector3(p2.x, p2.y + 0.01, p2.z)
            ];
            var geo = new THREE.BufferGeometry().setFromPoints(pts);
            var mat = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
            var line = new THREE.Line(geo, mat);
            line.userData = { label: p1.label + '-' + p2.label };
            line.raycast = function() {};
            estado.drawingScene.add(line);
            estado.meshesLineas.push(line);
            eliminarLineaTemporal();
            if (estado.puntoSeleccionadoMesh) {
                estado.puntoSeleccionadoMesh.material.color.setHex(estado.puntoSeleccionado.color);
                estado.puntoSeleccionadoMesh.scale.set(1, 1, 1);
            }
            mensajeTerminal('✅ Línea ' + p1.label + '-' + p2.label + ' creada', '#38ef7d');
            estado.puntoSeleccionado = null;
            estado.puntoSeleccionadoMesh = null;
            actualizarUI();
            sincronizarEditor();
            actualizarTamanioCanvas();
        } catch (error) {
            console.error('Error en clic conexión:', error);
            mensajeTerminal('❌ Error al conectar: ' + error.message, '#f5576c');
        }
    }

    // ========== FUNCIONES DE PINTURA ==========
    function actualizarColorPintura() {
        var picker = document.getElementById('paintColorPicker');
        var preview = document.getElementById('paintColorPreview');
        if (picker) {
            estado.colorPintura = parseInt(picker.value.replace('#', ''), 16);
            if (preview) {
                preview.style.backgroundColor = picker.value;
            }
        }
    }

    window.subirTextura = function() {
        var input = document.getElementById('texturaFileInput');
        if (!input) return;
        var file = input.files[0];
        if (!file) {
            mensajeTerminal('⚠️ Selecciona una imagen primero', '#fda085');
            return;
        }
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var img = new Image();
                img.onload = function() {
                    var texture = new THREE.Texture(img);
                    texture.needsUpdate = true;
                    estado.texturaPintura = texture;
                    estado.usarTextura = true;
                    var preview = document.getElementById('texturaPreview');
                    if (preview) {
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                    }
                    mensajeTerminal('✅ Textura cargada: ' + file.name, '#38ef7d');
                    actualizarEstadoDibujo();
                    actualizarEstadoTextura();
                };
                img.src = e.target.result;
            } catch (error) {
                mensajeTerminal('❌ Error al cargar imagen: ' + error.message, '#f5576c');
            }
        };
        reader.readAsDataURL(file);
    };

    window.limpiarTextura = function() {
        estado.texturaPintura = null;
        estado.usarTextura = false;
        var preview = document.getElementById('texturaPreview');
        if (preview) {
            preview.src = '';
            preview.style.display = 'none';
        }
        var input = document.getElementById('texturaFileInput');
        if (input) input.value = '';
        mensajeTerminal('🗑️ Textura eliminada', '#fda085');
        actualizarEstadoDibujo();
        actualizarEstadoTextura();
    };

    window.toggleModoPintura = function() {
        estado.usarTextura = !estado.usarTextura;
        if (estado.usarTextura && !estado.texturaPintura) {
            mensajeTerminal('⚠️ No hay textura cargada. Sube una imagen primero.', '#fda085');
            estado.usarTextura = false;
            actualizarEstadoTextura();
            return;
        }
        mensajeTerminal(estado.usarTextura ? '🖼️ Modo textura activado' : '🎨 Modo color activado', '#4facfe');
        actualizarEstadoDibujo();
        actualizarEstadoTextura();
    };

    window.activarPincel = function() {
        console.log('🖌️ Activando pincel...');
        estado.modoCubetaActivo = false;
        var btnCubeta = document.getElementById('paintBucketBtn');
        if (btnCubeta) btnCubeta.classList.remove('active');
        if (estado.modoTallarActivo) {
            estado.modoTallarActivo = false;
            actualizarBotonTallar();
        }
        if (estado.modoMaterialActivo) {
            estado.modoMaterialActivo = false;
            actualizarBotonMaterial();
        }
        if (estado.modoManoActivo) {
            estado.modoManoActivo = false;
            limpiarSeleccionMano();
            var btnMano = document.getElementById('paletteHand');
            if (btnMano) btnMano.classList.remove('active');
        }
        if (estado.modoConexionActivo) {
            estado.modoConexionActivo = false;
            estado.puntoSeleccionado = null;
            estado.puntoSeleccionadoMesh = null;
            eliminarLineaTemporal();
            var btnConectar = document.getElementById('paletteConnect');
            if (btnConectar) btnConectar.classList.remove('active');
        }
        if (estado.modoOrbitaActivo) {
            estado.modoOrbitaActivo = false;
            if (estado.drawingControls) {
                estado.drawingControls.enabled = false;
                estado.drawingControls.enableRotate = false;
                estado.drawingControls.enablePan = false;
                estado.drawingControls.enableZoom = false;
            }
            var btnOrbit = document.getElementById('paletteOrbit');
            if (btnOrbit) btnOrbit.classList.remove('active');
        }
        if (estado.modoDibujoActivo) {
            estado.modoDibujoActivo = false;
            var btnDibujo = document.getElementById('paletteCreatePoint');
            if (btnDibujo) btnDibujo.classList.remove('active');
        }
        estado.modoPincelActivo = !estado.modoPincelActivo;
        var btnPincel = document.getElementById('paintBrushBtn');
        if (btnPincel) {
            if (estado.modoPincelActivo) {
                btnPincel.classList.add('active');
                mensajeTerminal('🖌️ Pincel activado - Haz clic y arrastra sobre la figura para pintar', '#4facfe');
            } else {
                btnPincel.classList.remove('active');
                mensajeTerminal('🖌️ Pincel desactivado', '#fda085');
            }
        }
        actualizarEstadoDibujo();
        actualizarCursor();
        actualizarBotonesPintura();
    };

    window.activarCubeta = function() {
        console.log('🪣 Activando cubeta...');
        estado.modoPincelActivo = false;
        var btnPincel = document.getElementById('paintBrushBtn');
        if (btnPincel) btnPincel.classList.remove('active');
        if (estado.modoTallarActivo) {
            estado.modoTallarActivo = false;
            actualizarBotonTallar();
        }
        if (estado.modoMaterialActivo) {
            estado.modoMaterialActivo = false;
            actualizarBotonMaterial();
        }
        if (estado.modoManoActivo) {
            estado.modoManoActivo = false;
            limpiarSeleccionMano();
            var btnMano = document.getElementById('paletteHand');
            if (btnMano) btnMano.classList.remove('active');
        }
        if (estado.modoConexionActivo) {
            estado.modoConexionActivo = false;
            estado.puntoSeleccionado = null;
            estado.puntoSeleccionadoMesh = null;
            eliminarLineaTemporal();
            var btnConectar = document.getElementById('paletteConnect');
            if (btnConectar) btnConectar.classList.remove('active');
        }
        if (estado.modoOrbitaActivo) {
            estado.modoOrbitaActivo = false;
            if (estado.drawingControls) {
                estado.drawingControls.enabled = false;
                estado.drawingControls.enableRotate = false;
                estado.drawingControls.enablePan = false;
                estado.drawingControls.enableZoom = false;
            }
            var btnOrbit = document.getElementById('paletteOrbit');
            if (btnOrbit) btnOrbit.classList.remove('active');
        }
        if (estado.modoDibujoActivo) {
            estado.modoDibujoActivo = false;
            var btnDibujo = document.getElementById('paletteCreatePoint');
            if (btnDibujo) btnDibujo.classList.remove('active');
        }
        estado.modoCubetaActivo = !estado.modoCubetaActivo;
        var btnCubeta = document.getElementById('paintBucketBtn');
        if (btnCubeta) {
            if (estado.modoCubetaActivo) {
                btnCubeta.classList.add('active');
                mensajeTerminal('🪣 Cubeta activada - Haz clic en una figura para pintar toda', '#ff6b6b');
            } else {
                btnCubeta.classList.remove('active');
                mensajeTerminal('🪣 Cubeta desactivada', '#fda085');
            }
        }
        actualizarEstadoDibujo();
        actualizarCursor();
        actualizarBotonesPintura();
    };

    function pintarConPincel(event) {
        if (!estado.modoPincelActivo) return;
        if (!estado.drawingRenderer) return;
        try {
            var rect = estado.drawingRenderer.domElement.getBoundingClientRect();
            var x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            var y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(x, y), estado.drawingCamera);
            var intersects = [];
            for (var i = 0; i < estado.figurasGuardadas.length; i++) {
                var fig = estado.figurasGuardadas[i];
                if (fig.group) {
                    fig.group.children.forEach(function(child) {
                        if (child.isMesh) {
                            var intersect = raycaster.intersectObject(child);
                            if (intersect.length > 0) {
                                intersects.push({
                                    mesh: child,
                                    distance: intersect[0].distance,
                                    figIndex: i,
                                    point: intersect[0].point,
                                    faceIndex: intersect[0].faceIndex,
                                    face: intersect[0].face
                                });
                            }
                        }
                    });
                }
            }
            intersects.sort(function(a, b) { return a.distance - b.distance; });
            if (intersects.length === 0) {
                mensajeTerminal('⚠️ No se encontró ninguna figura para pintar', '#fda085');
                return;
            }
            var hit = intersects[0];
            var figInfo = estado.figurasGuardadas[hit.figIndex];
            if (!figInfo) {
                mensajeTerminal('⚠️ Figura no encontrada', '#fda085');
                return;
            }
            var mesh = hit.mesh;
            var geometry = mesh.geometry;
            if (!geometry || !geometry.attributes || !geometry.attributes.position) {
                mensajeTerminal('⚠️ La figura no tiene geometría válida', '#fda085');
                return;
            }
            var radioPincel = 12;
            var matrix = new THREE.Matrix4().copy(mesh.matrixWorld).invert();
            var localPoint = hit.point.clone().applyMatrix4(matrix);
            var positions = geometry.attributes.position.array;
            var vertexCount = positions.length / 3;
            var usarTextura = estado.usarTextura && estado.texturaPintura;
            if (usarTextura) {
                var texture = estado.texturaPintura;
                var uv = new THREE.Vector2(0.5, 0.5);
                if (geometry.attributes.uv) {
                    var uvAttr = geometry.attributes.uv;
                    var uvArray = uvAttr.array;
                    var minDist = Infinity;
                    for (var i = 0; i < vertexCount; i++) {
                        var vx = positions[i * 3];
                        var vy = positions[i * 3 + 1];
                        var vz = positions[i * 3 + 2];
                        var dx = vx - localPoint.x;
                        var dy = vy - localPoint.y;
                        var dz = vz - localPoint.z;
                        var dist = dx*dx + dy*dy + dz*dz;
                        if (dist < minDist) {
                            minDist = dist;
                            uv.x = uvArray[i * 2];
                            uv.y = uvArray[i * 2 + 1];
                        }
                    }
                }
                var radioCuadrado = radioPincel * radioPincel;
                var modificados = 0;
                if (geometry.attributes.uv) {
                    var uvAttr = geometry.attributes.uv;
                    var uvArray = uvAttr.array;
                    for (var i = 0; i < vertexCount; i++) {
                        var vx = positions[i * 3];
                        var vy = positions[i * 3 + 1];
                        var vz = positions[i * 3 + 2];
                        var dx = vx - localPoint.x;
                        var dy = vy - localPoint.y;
                        var dz = vz - localPoint.z;
                        var distCuadrado = dx*dx + dy*dy + dz*dz;
                        if (distCuadrado < radioCuadrado) {
                            var dist = Math.sqrt(distCuadrado);
                            var factor = 1 - (dist / radioPincel);
                            var targetU = uv.x;
                            var targetV = uv.y;
                            var currentU = uvArray[i * 2];
                            var currentV = uvArray[i * 2 + 1];
                            uvArray[i * 2] = currentU + (targetU - currentU) * factor * 0.5;
                            uvArray[i * 2 + 1] = currentV + (targetV - currentV) * factor * 0.5;
                            modificados++;
                        }
                    }
                    if (modificados > 0) {
                        uvAttr.needsUpdate = true;
                        geometry.attributes.position.needsUpdate = true;
                        if (!mesh.material.map) {
                            mesh.material.map = texture.clone();
                        } else {
                            mesh.material.map = texture;
                        }
                        mesh.material.needsUpdate = true;
                        mensajeTerminal('🖌️ Pintados ' + modificados + ' vértices con textura en ' + figInfo.label, '#4facfe');
                        actualizarUI();
                    }
                } else {
                    mensajeTerminal('⚠️ La figura no tiene UVs, no se puede aplicar textura local', '#fda085');
                }
            } else {
                var colorHex = estado.colorPintura || 0x4facfe;
                var colorStr = '#' + colorHex.toString(16).padStart(6, '0');
                var colors = geometry.attributes.color;
                if (!colors) {
                    var colorArray = new Float32Array(vertexCount * 3);
                    var figColor = new THREE.Color(figInfo.color);
                    for (var i = 0; i < vertexCount; i++) {
                        colorArray[i * 3] = figColor.r;
                        colorArray[i * 3 + 1] = figColor.g;
                        colorArray[i * 3 + 2] = figColor.b;
                    }
                    geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
                    colors = geometry.attributes.color;
                }
                var targetColor = new THREE.Color(colorHex);
                var colorArray = colors.array;
                var modificados = 0;
                var radioCuadrado = radioPincel * radioPincel;
                for (var i = 0; i < vertexCount; i++) {
                    var vx = positions[i * 3];
                    var vy = positions[i * 3 + 1];
                    var vz = positions[i * 3 + 2];
                    var dx = vx - localPoint.x;
                    var dy = vy - localPoint.y;
                    var dz = vz - localPoint.z;
                    var distCuadrado = dx*dx + dy*dy + dz*dz;
                    if (distCuadrado < radioCuadrado) {
                        var dist = Math.sqrt(distCuadrado);
                        var factor = 1 - (dist / radioPincel);
                        factor = Math.pow(factor, 2);
                        var currentColor = new THREE.Color(
                            colorArray[i * 3],
                            colorArray[i * 3 + 1],
                            colorArray[i * 3 + 2]
                        );
                        var mixedColor = currentColor.clone().lerp(targetColor, factor * 0.9);
                        colorArray[i * 3] = mixedColor.r;
                        colorArray[i * 3 + 1] = mixedColor.g;
                        colorArray[i * 3 + 2] = mixedColor.b;
                        modificados++;
                    }
                }
                if (modificados > 0) {
                    colors.needsUpdate = true;
                    geometry.attributes.position.needsUpdate = true;
                    geometry.computeVertexNormals();
                    if (mesh.material) {
                        mesh.material.vertexColors = true;
                        mesh.material.needsUpdate = true;
                    }
                    mensajeTerminal('🖌️ Pintados ' + modificados + ' vértices en ' + figInfo.label + ' con ' + colorStr, '#4facfe');
                    actualizarUI();
                } else {
                    mensajeTerminal('⚠️ No se pintaron vértices. Prueba con un radio más grande.', '#fda085');
                }
            }
        } catch (error) {
            console.error('Error en pintarConPincel:', error);
            mensajeTerminal('❌ Error al pintar: ' + error.message, '#f5576c');
        }
    }

    function pintarConCubeta(event) {
        if (!estado.modoCubetaActivo) return;
        if (!estado.drawingRenderer) return;
        try {
            var rect = estado.drawingRenderer.domElement.getBoundingClientRect();
            var x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            var y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(x, y), estado.drawingCamera);
            var intersects = [];
            for (var i = 0; i < estado.figurasGuardadas.length; i++) {
                var fig = estado.figurasGuardadas[i];
                if (fig.group) {
                    fig.group.children.forEach(function(child) {
                        if (child.isMesh) {
                            var intersect = raycaster.intersectObject(child);
                            if (intersect.length > 0) {
                                intersects.push({
                                    mesh: child,
                                    distance: intersect[0].distance,
                                    figIndex: i,
                                    point: intersect[0].point
                                });
                            }
                        }
                    });
                }
            }
            intersects.sort(function(a, b) { return a.distance - b.distance; });
            if (intersects.length === 0) {
                mensajeTerminal('⚠️ No se encontró ninguna figura para pintar', '#fda085');
                return;
            }
            var hit = intersects[0];
            var figInfo = estado.figurasGuardadas[hit.figIndex];
            if (!figInfo) {
                mensajeTerminal('⚠️ Figura no encontrada', '#fda085');
                return;
            }
            var fig = estado.figurasGuardadas[hit.figIndex];
            var usarTextura = estado.usarTextura && estado.texturaPintura;
            if (usarTextura) {
                var texture = estado.texturaPintura;
                fig.group.children.forEach(function(child) {
                    if (child.isMesh && child.material) {
                        child.material.map = texture.clone();
                        child.material.color.setHex(0xffffff);
                        child.material.needsUpdate = true;
                    }
                });
                mensajeTerminal('🪣 Figura ' + fig.label + ' pintada completamente con textura', '#ff6b6b');
            } else {
                var colorHex = estado.colorPintura || 0x4facfe;
                var colorStr = '#' + colorHex.toString(16).padStart(6, '0');
                var targetColor = new THREE.Color(colorHex);
                fig.group.children.forEach(function(child) {
                    if (child.isMesh && child.material) {
                        if (child.material.vertexColors) {
                            var geometry = child.geometry;
                            if (geometry && geometry.attributes && geometry.attributes.color) {
                                var colorAttr = geometry.attributes.color;
                                var colorArray = colorAttr.array;
                                var vertexCount = colorArray.length / 3;
                                for (var i = 0; i < vertexCount; i++) {
                                    colorArray[i * 3] = targetColor.r;
                                    colorArray[i * 3 + 1] = targetColor.g;
                                    colorArray[i * 3 + 2] = targetColor.b;
                                }
                                colorAttr.needsUpdate = true;
                                geometry.attributes.position.needsUpdate = true;
                                geometry.computeVertexNormals();
                            }
                        } else {
                            child.material.color.setHex(colorHex);
                        }
                        child.material.needsUpdate = true;
                    }
                });
                fig.color = colorHex;
                mensajeTerminal('🪣 Figura ' + fig.label + ' pintada completamente con ' + colorStr, '#ff6b6b');
            }
            actualizarUI();
        } catch (error) {
            console.error('Error en pintarConCubeta:', error);
            mensajeTerminal('❌ Error al pintar: ' + error.message, '#f5576c');
        }
    }

    // ========== CONTROLES DE ILUMINACIÓN DEL FONDO ==========
    function aplicarFondoConfiguracion() {
        if (!estado.drawingScene) return;
        var color = new THREE.Color(estado.fondoColor);
        var intensidad = estado.fondoIntensidad || 1.0;
        if (intensidad < 1) {
            var negro = new THREE.Color(0x000000);
            color.lerp(negro, 1 - intensidad);
        }
        estado.drawingScene.background = color;
        if (estado.drawingRenderer) {
            estado.drawingRenderer.setClearColor(color, 1);
        }
        var valueDisplay = document.getElementById('fondoIntensidadValue');
        if (valueDisplay) {
            valueDisplay.textContent = Math.round(intensidad * 100) + '%';
        }
    }

    window.actualizarIntensidadFondo = function(intensidad) {
        estado.fondoIntensidad = Math.max(0, Math.min(1, intensidad));
        aplicarFondoConfiguracion();
    };

    window.actualizarColorFondo = function(color) {
        estado.fondoColor = color;
        estado.fondoColorOriginal = color;
        estado.fondoModo = 'personalizado';
        document.querySelectorAll('.btn-light-mode').forEach(function(b) {
            b.classList.remove('active');
        });
        aplicarFondoConfiguracion();
        mensajeTerminal('🎨 Color de fondo actualizado a ' + color, '#4facfe');
    };

    window.setFondoModo = function(modo) {
        estado.fondoModo = modo;
        var picker = document.getElementById('fondoColorPicker');
        var preview = document.getElementById('fondoColorPreview');
        if (modo === 'claro') {
            estado.fondoColor = '#ffffff';
            estado.fondoColorOriginal = '#ffffff';
            if (picker) picker.value = '#ffffff';
            if (preview) preview.style.backgroundColor = '#ffffff';
            document.querySelectorAll('.lighting-btn').forEach(function(b) { b.classList.remove('active'); });
            var btnClaro = document.getElementById('btnFondoClaro');
            if (btnClaro) btnClaro.classList.add('active');
            mensajeTerminal('☀️ Modo claro activado', '#fda085');
        } else if (modo === 'oscuro') {
            estado.fondoColor = '#0a0a1a';
            estado.fondoColorOriginal = '#0a0a1a';
            if (picker) picker.value = '#0a0a1a';
            if (preview) preview.style.backgroundColor = '#0a0a1a';
            document.querySelectorAll('.lighting-btn').forEach(function(b) { b.classList.remove('active'); });
            var btnOscuro = document.getElementById('btnFondoOscuro');
            if (btnOscuro) btnOscuro.classList.add('active');
            mensajeTerminal('🌙 Modo oscuro activado', '#667eea');
        } else if (modo === 'auto') {
            var hora = new Date().getHours();
            if (hora >= 7 && hora < 19) {
                estado.fondoColor = '#ffffff';
                estado.fondoColorOriginal = '#ffffff';
                if (picker) picker.value = '#ffffff';
                if (preview) preview.style.backgroundColor = '#ffffff';
                document.querySelectorAll('.lighting-btn').forEach(function(b) { b.classList.remove('active'); });
                var btnClaro = document.getElementById('btnFondoClaro');
                if (btnClaro) btnClaro.classList.add('active');
                mensajeTerminal('☀️ Modo auto - Claro (día)', '#fda085');
            } else {
                estado.fondoColor = '#0a0a1a';
                estado.fondoColorOriginal = '#0a0a1a';
                if (picker) picker.value = '#0a0a1a';
                if (preview) preview.style.backgroundColor = '#0a0a1a';
                document.querySelectorAll('.lighting-btn').forEach(function(b) { b.classList.remove('active'); });
                var btnOscuro = document.getElementById('btnFondoOscuro');
                if (btnOscuro) btnOscuro.classList.add('active');
                mensajeTerminal('🌙 Modo auto - Oscuro (noche)', '#667eea');
            }
        }
        aplicarFondoConfiguracion();
    };

    // ========== CONFIGURAR SELECTOR DE COLOR Y TEXTURA ==========
    function configurarSelectorColor() {
        var picker = document.getElementById('paintColorPicker');
        var preview = document.getElementById('paintColorPreview');
        if (picker) {
            picker.addEventListener('input', function() {
                actualizarColorPintura();
            });
            estado.colorPintura = parseInt(picker.value.replace('#', ''), 16);
            if (preview) {
                preview.style.backgroundColor = picker.value;
            }
        }
        var texturaInput = document.getElementById('texturaFileInput');
        if (texturaInput) {
            texturaInput.addEventListener('change', function() {
                window.subirTextura();
            });
        }
        var intensidadInput = document.getElementById('fondoIntensidadInput');
        if (intensidadInput) {
            intensidadInput.addEventListener('input', function() {
                var val = parseInt(this.value);
                window.actualizarIntensidadFondo(val / 100);
            });
        }
        var colorPicker = document.getElementById('fondoColorPicker');
        if (colorPicker) {
            colorPicker.addEventListener('input', function() {
                var preview = document.getElementById('fondoColorPreview');
                if (preview) preview.style.backgroundColor = this.value;
                window.actualizarColorFondo(this.value);
            });
        }
    }

    // ========== FUNCIÓN PARA CREAR PUNTO ==========
    function crearPunto(x, y, z, color, label) {
        if (estado.ejecutando) return false;
        if (Math.abs(x) > estado.rangoX || Math.abs(y) > estado.rangoY || Math.abs(z) > estado.rangoZ) {
            mensajeTerminal('⚠️ Coordenadas fuera de rango. X: ±' + estado.rangoX + ', Y: ±' + estado.rangoY + ', Z: ±' + estado.rangoZ, '#fda085');
            return false;
        }
        var colorValor = color || estado.colorActual;
        if (!label) {
            estado.contadorPuntos++;
            label = 'p_' + estado.contadorPuntos;
        }
        var existe = false;
        for (var i = 0; i < estado.puntos.length; i++) {
            if (estado.puntos[i].label === label) {
                existe = true;
                break;
            }
        }
        if (existe) {
            mensajeTerminal('⚠️ El punto ' + label + ' ya existe', '#fda085');
            return false;
        }
        try {
            var punto = { x: x, y: y, z: z, color: colorValor, label: label };
            estado.puntos.push(punto);
            var geometry = new THREE.SphereGeometry(0.8, 16, 16);
            var material = new THREE.MeshBasicMaterial({ color: colorValor });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, y, z);
            mesh.userData = { pointLabel: label };
            mesh.raycast = function(raycaster, intersects) {
                var sphere = new THREE.Sphere(this.position, 1.2);
                var intersect = raycaster.ray.intersectsSphere(sphere);
                if (intersect) {
                    intersects.push({
                        distance: raycaster.ray.origin.distanceTo(this.position),
                        object: this,
                        point: this.position.clone()
                    });
                }
            };
            estado.drawingScene.add(mesh);
            estado.meshesPuntos.push(mesh);
            actualizarUI();
            mensajeTerminal('✅ Punto ' + label + ' creado en (' + x + ', ' + y + ', ' + z + ')', '#38ef7d');
            sincronizarEditor();
            return true;
        } catch (error) {
            console.error('Error creando punto:', error);
            mensajeTerminal('❌ Error al crear punto: ' + error.message, '#f5576c');
            return false;
        }
    }

    function eliminarPunto(label) {
        if (estado.ejecutando) return;
        if (estado.puntoSeleccionado && estado.puntoSeleccionado.label === label) {
            estado.puntoSeleccionado = null;
            estado.puntoSeleccionadoMesh = null;
            eliminarLineaTemporal();
        }
        for (var i = 0; i < estado.puntosSeleccionados.length; i++) {
            if (estado.puntosSeleccionados[i].label === label) {
                estado.puntosSeleccionados.splice(i, 1);
                break;
            }
        }
        for (var i = 0; i < estado.meshesSeleccionados.length; i++) {
            if (estado.meshesSeleccionados[i].userData.pointLabel === label) {
                estado.meshesSeleccionados.splice(i, 1);
                break;
            }
        }
        var idx = -1;
        for (var i = 0; i < estado.puntos.length; i++) {
            if (estado.puntos[i].label === label) {
                idx = i;
                break;
            }
        }
        if (idx === -1) {
            mensajeTerminal('⚠️ Punto ' + label + ' no encontrado', '#fda085');
            return;
        }
        try {
            estado.puntos.splice(idx, 1);
            var lineasEliminar = [];
            for (var i = 0; i < estado.lineas.length; i++) {
                var l = estado.lineas[i];
                if (l.p1.label === label || l.p2.label === label) {
                    lineasEliminar.push(l);
                }
            }
            for (var i = 0; i < lineasEliminar.length; i++) {
                var l = lineasEliminar[i];
                var lineIdx = estado.lineas.indexOf(l);
                if (lineIdx !== -1) {
                    estado.lineas.splice(lineIdx, 1);
                    var lineObj = null;
                    for (var j = 0; j < estado.meshesLineas.length; j++) {
                        if (estado.meshesLineas[j].userData && estado.meshesLineas[j].userData.label === l.label) {
                            lineObj = estado.meshesLineas[j];
                            break;
                        }
                    }
                    if (lineObj) {
                        estado.drawingScene.remove(lineObj);
                        var objIdx = estado.meshesLineas.indexOf(lineObj);
                        if (objIdx !== -1) estado.meshesLineas.splice(objIdx, 1);
                    }
                }
            }
            var mesh = null;
            for (var i = 0; i < estado.meshesPuntos.length; i++) {
                if (estado.meshesPuntos[i].userData && estado.meshesPuntos[i].userData.pointLabel === label) {
                    mesh = estado.meshesPuntos[i];
                    break;
                }
            }
            if (mesh) {
                estado.drawingScene.remove(mesh);
                var meshIdx = estado.meshesPuntos.indexOf(mesh);
                if (meshIdx !== -1) estado.meshesPuntos.splice(meshIdx, 1);
            }
            actualizarUI();
            sincronizarEditor();
            actualizarTamanioCanvas();
            mensajeTerminal('🗑️ Punto ' + label + ' eliminado', '#fda085');
        } catch (error) {
            console.error('Error eliminando punto:', error);
            mensajeTerminal('❌ Error al eliminar punto: ' + error.message, '#f5576c');
        }
    }

    // ========== FUNCIÓN PARA CREAR FIGURAS GEOMÉTRICAS ==========
    function crearFiguraEnDibujo(tipo, color, size1, size2) {
        if (!estado.drawingScene) return false;
        try {
            var tiposValidos = ['esfera', 'cuadrado', 'cono', 'piramide', 'cilindro'];
            if (!tiposValidos.includes(tipo)) {
                mensajeTerminal('❌ Tipo de figura no válido: ' + tipo, '#f5576c');
                return false;
            }
            var maxSize = Math.min(estado.rangoX, estado.rangoY, estado.rangoZ) * 0.8;
            size1 = Math.min(Math.max(3, size1), maxSize);
            size2 = Math.min(Math.max(3, size2), maxSize);
            var group = new THREE.Group();
            var mesh = null;
            var geometry = null;
            var material = new THREE.MeshStandardMaterial({ 
                color: color,
                roughness: 0.5,
                metalness: 0.1,
                transparent: false,
                opacity: 1.0,
                wireframe: false,
                side: THREE.DoubleSide,
                vertexColors: true
            });
            var posX = 0, posY = 0, posZ = 0, altura = 0;
            switch (tipo) {
                case 'esfera':
                    geometry = new THREE.SphereGeometry(size1, 48, 48);
                    mesh = new THREE.Mesh(geometry, material);
                    mesh.position.set(posX, posY, posZ);
                    altura = size1;
                    group.add(mesh);
                    break;
                case 'cuadrado':
                    geometry = new THREE.BoxGeometry(size1, size1, size1);
                    mesh = new THREE.Mesh(geometry, material);
                    mesh.position.set(posX, posY, posZ);
                    altura = size1;
                    group.add(mesh);
                    break;
                case 'cono':
                    geometry = new THREE.ConeGeometry(size1, size2, 48);
                    mesh = new THREE.Mesh(geometry, material);
                    mesh.position.set(posX, posY, posZ);
                    altura = size2;
                    group.add(mesh);
                    break;
                case 'piramide':
                    geometry = new THREE.ConeGeometry(size1, size2, 4);
                    mesh = new THREE.Mesh(geometry, material);
                    mesh.position.set(posX, posY, posZ);
                    altura = size2;
                    group.add(mesh);
                    break;
                case 'cilindro':
                    geometry = new THREE.CylinderGeometry(size1, size1, size2, 48);
                    mesh = new THREE.Mesh(geometry, material);
                    mesh.position.set(posX, posY, posZ);
                    altura = size2;
                    group.add(mesh);
                    break;
                default:
                    return false;
            }
            var pos = geometry.attributes.position;
            var vertexCount = pos.count;
            var colorArray = new Float32Array(vertexCount * 3);
            var figColor = new THREE.Color(color);
            for (var i = 0; i < vertexCount; i++) {
                colorArray[i * 3] = figColor.r;
                colorArray[i * 3 + 1] = figColor.g;
                colorArray[i * 3 + 2] = figColor.b;
            }
            geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
            var label = tipo.charAt(0).toUpperCase() + tipo.slice(1);
            var canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 48;
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, 128, 48);
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            if (ctx.roundRect) {
                ctx.roundRect(4, 4, 120, 40, 8);
                ctx.fill();
            } else {
                ctx.fillRect(4, 4, 120, 40);
            }
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(label, 64, 26);
            var texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            var spriteMaterial = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthTest: false,
                sizeAttenuation: true
            });
            var sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.set(posX, posY + altura + 10, posZ);
            sprite.scale.set(18, 7, 1);
            group.add(sprite);
            estado.drawingScene.add(group);
            estado.figurasGuardadas.push({
                tipo: tipo,
                color: color,
                size1: size1,
                size2: size2,
                group: group,
                label: label,
                posX: posX, posY: posY, posZ: posZ,
                mesh: mesh,
                originalMaterial: material.clone(),
                modificada: false
            });
            var colorName = obtenerNombreColor(color);
            var colorHex = getColorHex(color);
            mensajeTerminal('✅ ' + label + ' creada [' + colorName + ' ' + colorHex + '] tamaño: ' + size1 + (size2 !== size1 ? ' x ' + size2 : ''), '#38ef7d');
            aplicarModoVisualizacion();
            actualizarUI();
            sincronizarEditor();
            actualizarTamanioCanvas();
            return true;
        } catch (error) {
            console.error('Error creando figura:', error);
            mensajeTerminal('❌ Error al crear figura: ' + error.message, '#f5576c');
            return false;
        }
    }

    // ========== FUNCIONES DE VISUALIZACIÓN DE FIGURAS ==========
    function aplicarModoVisualizacion() {
        if (estado.isSolidView && !estado.isWireframeView && !estado.isTransparentView) {
            aplicarModoSolid();
        } else if (estado.isWireframeView) {
            aplicarModoWireframe();
        } else if (estado.isTransparentView && !estado.isWireframeView) {
            aplicarModoTransparente();
        } else {
            aplicarModoSolid();
        }
    }

    function aplicarModoSolid() {
        estado.isSolidView = true;
        estado.isWireframeView = false;
        estado.isTransparentView = false;
        for (var i = 0; i < estado.figurasGuardadas.length; i++) {
            var fig = estado.figurasGuardadas[i];
            if (fig.mesh && fig.mesh.material) {
                fig.mesh.material.color.setHex(fig.color);
                fig.mesh.material.opacity = 1.0;
                fig.mesh.material.transparent = false;
                fig.mesh.material.wireframe = false;
                fig.mesh.material.roughness = 0.5;
                fig.mesh.material.vertexColors = true;
                fig.mesh.material.needsUpdate = true;
            }
        }
        for (var i = 0; i < estado.meshesConjuntos.length; i++) {
            var mesh = estado.meshesConjuntos[i];
            if (mesh.userData && mesh.userData.type === 'conjunto') {
                if (mesh.material) {
                    mesh.material.opacity = 1.0;
                    mesh.material.transparent = false;
                    mesh.material.wireframe = false;
                    mesh.material.needsUpdate = true;
                }
            }
        }
        actualizarBotonesVisualizacion();
    }

    function aplicarModoWireframe() {
        estado.isSolidView = false;
        estado.isWireframeView = true;
        estado.isTransparentView = false;
        for (var i = 0; i < estado.figurasGuardadas.length; i++) {
            var fig = estado.figurasGuardadas[i];
            if (fig.mesh && fig.mesh.material) {
                fig.mesh.material.color.setHex(fig.color);
                fig.mesh.material.opacity = 0.9;
                fig.mesh.material.transparent = true;
                fig.mesh.material.wireframe = true;
                fig.mesh.material.needsUpdate = true;
            }
        }
        for (var i = 0; i < estado.meshesConjuntos.length; i++) {
            var mesh = estado.meshesConjuntos[i];
            if (mesh.userData && mesh.userData.type === 'conjunto') {
                if (mesh.material) {
                    mesh.material.opacity = 0.6;
                    mesh.material.transparent = true;
                    mesh.material.wireframe = true;
                    mesh.material.needsUpdate = true;
                }
            }
        }
        actualizarBotonesVisualizacion();
    }

    function aplicarModoTransparente() {
        estado.isSolidView = false;
        estado.isWireframeView = false;
        estado.isTransparentView = true;
        for (var i = 0; i < estado.figurasGuardadas.length; i++) {
            var fig = estado.figurasGuardadas[i];
            if (fig.mesh && fig.mesh.material) {
                fig.mesh.material.color.setHex(fig.color);
                fig.mesh.material.opacity = 0.25;
                fig.mesh.material.transparent = true;
                fig.mesh.material.wireframe = false;
                fig.mesh.material.needsUpdate = true;
            }
        }
        for (var i = 0; i < estado.meshesConjuntos.length; i++) {
            var mesh = estado.meshesConjuntos[i];
            if (mesh.userData && mesh.userData.type === 'conjunto') {
                if (mesh.material) {
                    mesh.material.opacity = 0.15;
                    mesh.material.transparent = true;
                    mesh.material.wireframe = false;
                    mesh.material.needsUpdate = true;
                }
            }
        }
        actualizarBotonesVisualizacion();
    }

    window.setViewSolid = function() {
        aplicarModoSolid();
        actualizarUI();
    };

    window.setViewWireframe = function() {
        aplicarModoWireframe();
        actualizarUI();
    };

    window.setViewTransparent = function() {
        aplicarModoTransparente();
        actualizarUI();
    };

    // ========== FUNCIÓN PARA AGREGAR FIGURA DESDE EL BOTÓN ==========
    window.agregarFigura = function(tipo) {
        if (!estado.drawingScene) {
            mensajeTerminal('❌ El canvas de dibujo no está inicializado', '#f5576c');
            return;
        }
        var size = estado.figuraSize || 30;
        var colores = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44aa, 0xaa44ff, 0x44ffff, 0xff8800];
        var color = colores[Math.floor(Math.random() * colores.length)];
        var size1 = size;
        var size2 = size;
        if (tipo === 'cono' || tipo === 'piramide') {
            size1 = size * 0.8;
            size2 = size * 1.2;
        } else if (tipo === 'cilindro') {
            size1 = size * 0.7;
            size2 = size * 1.3;
        }
        var resultado = crearFiguraEnDibujo(tipo, color, size1, size2);
        if (resultado) {
            actualizarUI();
            actualizarTamanioCanvas();
        }
    };

    // ========== FUNCIONES DE SINCRONIZACIÓN ==========
    function sincronizarEditor() {
        if (estado.ejecutando) return;
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                actualizarEditor();
                if (estado.modalAbierto) {
                    actualizarUI();
                }
            });
        });
    }

    function actualizarEditor() {
        if (estado.ejecutando) return;
        try {
            var editor = dom.editor;
            if (!editor) return;
            var nombre = dom.nombreInput ? dom.nombreInput.value || estado.nombreObjeto : estado.nombreObjeto;
            var contenido = nombre + ' : {\n';
            if (estado.puntos.length === 0 && estado.lineas.length === 0 && estado.meshesConjuntos.length === 0 && estado.figurasGuardadas.length === 0) {
                contenido += '    // Agrega puntos aquí\n';
                contenido += '    // Ejemplo: p_1 : {(10,20,30), color_azul}\n';
                contenido += '    // Figuras: esfera : {color_rojo, 20}\n';
                contenido += '}\n';
            } else {
                var puntosAgregados = {};
                for (var i = 0; i < estado.puntos.length; i++) {
                    var p = estado.puntos[i];
                    if (!puntosAgregados[p.label]) {
                        puntosAgregados[p.label] = true;
                        var hex = p.color.toString(16).padStart(6, '0');
                        contenido += '    ' + p.label + ' : { (' + p.x + ', ' + p.y + ', ' + p.z + '), #' + hex + ' }\n';
                    }
                }
                var lineasAgregadas = {};
                for (var i = 0; i < estado.lineas.length; i++) {
                    var l = estado.lineas[i];
                    var key = l.p1.label + '-' + l.p2.label;
                    var keyReverse = l.p2.label + '-' + l.p1.label;
                    if (!lineasAgregadas[key] && !lineasAgregadas[keyReverse]) {
                        lineasAgregadas[key] = true;
                        var hex = l.p1.color.toString(16).padStart(6, '0');
                        contenido += '    ' + l.p1.label + '-' + l.p2.label + ' : { #' + hex + ' }\n';
                    }
                }
                var figurasAgregadas = {};
                for (var i = 0; i < estado.figurasGuardadas.length; i++) {
                    var fig = estado.figurasGuardadas[i];
                    var key = fig.tipo + '_' + fig.size1 + '_' + fig.size2;
                    if (!figurasAgregadas[key]) {
                        figurasAgregadas[key] = true;
                        var hex = fig.color.toString(16).padStart(6, '0');
                        var nombreColor = obtenerNombreColor(fig.color);
                        if (fig.size1 === fig.size2 || fig.tipo === 'esfera' || fig.tipo === 'cuadrado') {
                            contenido += '    ' + fig.tipo + ' : { ' + nombreColor + ', ' + fig.size1 + ' }\n';
                        } else {
                            contenido += '    ' + fig.tipo + ' : { ' + nombreColor + ', ' + fig.size1 + ', ' + fig.size2 + ' }\n';
                        }
                        if (fig.modificada) {
                            contenido += '    // ' + fig.tipo + ' fue modificada (tallada/material)\n';
                        }
                    }
                }
            }
            contenido += '}';
            if (editor.value !== contenido && !estado.ejecutando) {
                editor.value = contenido;
            }
        } catch (error) {
            console.warn('Error actualizando editor:', error);
        }
    }

    // ========== FUNCIÓN EJECUTAR EDITOR ==========
    window.ejecutarEditor = function() {
        var editor = dom.editor;
        var statusText = dom.statusText;
        if (!editor || !statusText) return;
        if (estado.ejecutando) {
            mensajeTerminal('⚠️ El editor ya está ejecutando', '#fda085');
            return;
        }
        estado.ejecutando = true;
        statusText.textContent = '⏳ Ejecutando...';
        statusText.style.color = '#fda085';
        var codigo = editor.value;
        var errores = [];
        var comandosEjecutados = 0;
        try {
            if (window.ComandosModule) {
                window.ComandosModule.setDrawingPoints(estado.puntos);
                window.ComandosModule.setDrawingLines(estado.lineas);
                window.ComandosModule.setDrawingScene(estado.drawingScene);
                window.ComandosModule.setDrawingLineObjects(estado.meshesLineas);
                window.ComandosModule.setDrawingPointMeshes(estado.meshesPuntos);
                window.ComandosModule.setDrawingSolidMeshes(estado.meshesConjuntos);
                window.ComandosModule.setFigurasGuardadas(estado.figurasGuardadas);
                var lines = codigo.split('\n');
                var commands = [];
                var dentroDeObjeto = false;
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i].trim();
                    if (!line || line.startsWith('//')) continue;
                    if (line.match(/^[a-zA-Z_]+\s*:\s*\{/)) {
                        var match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\{/);
                        if (match) {
                            estado.nombreObjeto = match[1];
                            var input = dom.nombreInput;
                            if (input) input.value = estado.nombreObjeto;
                            dentroDeObjeto = true;
                        }
                        continue;
                    }
                    if (line === '}') {
                        dentroDeObjeto = false;
                        continue;
                    }
                    if (dentroDeObjeto && line) {
                        var cleanLine = line.split('//')[0].trim();
                        if (cleanLine) commands.push(cleanLine);
                    }
                }
                if (commands.length > 0) {
                    var result = window.ComandosModule.executeCommands(commands);
                    if (result.executed > 0) {
                        statusText.textContent = '✅ ' + result.executed + ' comandos ejecutados';
                        statusText.style.color = '#38ef7d';
                        mensajeTerminal('✅ Editor aplicado: ' + result.executed + ' comandos ejecutados', '#38ef7d');
                        actualizarUI();
                        actualizarTamanioCanvas();
                        sincronizarEditor();
                        estado.ejecutando = false;
                        return;
                    }
                }
            }
            var procesados = procesarEditorLineaPorLinea(codigo, errores);
            comandosEjecutados = procesados || 0;
            if (errores.length === 0 && comandosEjecutados > 0) {
                statusText.textContent = '✅ ' + comandosEjecutados + ' elementos procesados';
                statusText.style.color = '#38ef7d';
                mensajeTerminal('✅ Editor aplicado: ' + comandosEjecutados + ' elementos procesados', '#38ef7d');
            } else if (errores.length === 0 && comandosEjecutados === 0) {
                statusText.textContent = '⚠️ No se encontraron elementos para procesar';
                statusText.style.color = '#fda085';
                mensajeTerminal('⚠️ No se encontraron elementos para procesar en el editor', '#fda085');
            } else {
                statusText.textContent = '⚠️ ' + errores.length + ' errores encontrados';
                statusText.style.color = '#fda085';
                mensajeTerminal('⚠️ ' + errores.length + ' errores en el editor', '#fda085');
                errores.forEach(function(err) {
                    mensajeTerminal('  ❌ ' + err, '#f5576c');
                });
            }
            actualizarUI();
            actualizarTamanioCanvas();
            sincronizarEditor();
        } catch (error) {
            statusText.textContent = '❌ Error: ' + error.message;
            statusText.style.color = '#f5576c';
            mensajeTerminal('❌ Error en el editor: ' + error.message, '#f5576c');
            console.error('Error en ejecutarEditor:', error);
        } finally {
            estado.ejecutando = false;
            if (estado.drawingRenderer && estado.drawingScene && estado.drawingCamera) {
                estado.drawingRenderer.render(estado.drawingScene, estado.drawingCamera);
            }
        }
    };

    // ========== PROCESAR EDITOR LÍNEA POR LÍNEA ==========
    function procesarEditorLineaPorLinea(codigo, errores) {
        var lines = codigo.split('\n');
        var numLinea = 0;
        var dentroDeObjeto = false;
        var comandosProcesados = 0;
        for (var idx = 0; idx < lines.length; idx++) {
            var linea = lines[idx];
            numLinea++;
            var textoSinComentario = linea.split('//')[0].trim();
            if (!textoSinComentario) continue;
            if (textoSinComentario.match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*:\s*\{/)) {
                var match = textoSinComentario.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\{/);
                if (match) {
                    estado.nombreObjeto = match[1];
                    var input = dom.nombreInput;
                    if (input) input.value = estado.nombreObjeto;
                    dentroDeObjeto = true;
                }
                continue;
            }
            if (textoSinComentario === '}') {
                dentroDeObjeto = false;
                continue;
            }
            var texto = textoSinComentario;
            var regexFigura = /^(esfera|cuadrado|cono|piramide|cilindro)\s*:\s*\{\s*([^}]+)\s*\}/i;
            var matchFigura = texto.match(regexFigura);
            if (matchFigura) {
                var tipo = matchFigura[1].toLowerCase();
                var paramsStr = matchFigura[2].trim();
                var elementos = paramsStr.split(',').map(function(s) { return s.trim(); });
                var valoresNumericos = [];
                var coloresTexto = [];
                elementos.forEach(function(el) {
                    var num = parseFloat(el);
                    if (!isNaN(num) && num > 0) {
                        valoresNumericos.push(num);
                        return;
                    }
                    var colorTest = parseColor(el);
                    if (colorTest !== 0x4facfe || el === 'azul' || el === '#4facfe' || el === '4facfe') {
                        coloresTexto.push(el);
                        return;
                    }
                });
                var color = 0x4facfe;
                if (coloresTexto.length > 0) {
                    color = parseColor(coloresTexto[0]);
                }
                var size1 = 20;
                var size2 = 20;
                if (tipo === 'esfera' || tipo === 'cuadrado') {
                    size1 = valoresNumericos[0] || 20;
                    size2 = size1;
                } else {
                    size1 = valoresNumericos[0] || 20;
                    size2 = valoresNumericos[1] || 30;
                }
                var result = crearFiguraEnDibujo(tipo, color, size1, size2);
                if (result) {
                    mensajeTerminal('  ✅ ' + tipo.charAt(0).toUpperCase() + tipo.slice(1) + ' creada', '#38ef7d');
                    comandosProcesados++;
                }
                continue;
            }
            var regexPunto = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\{\s*\(\s*([\d\-\.]+)\s*,\s*([\d\-\.]+)\s*,\s*([\d\-\.]+)\s*\)\s*(?:,\s*(?:color_)?([a-zA-Z0-9_#]+))?\s*\}/i;
            var matchPunto = texto.match(regexPunto);
            if (matchPunto) {
                var label = matchPunto[1].trim();
                var x = Math.round(parseFloat(matchPunto[2]));
                var y = Math.round(parseFloat(matchPunto[3]));
                var z = Math.round(parseFloat(matchPunto[4]));
                var colorInput = matchPunto[5] ? matchPunto[5].trim() : 'azul';
                if (Math.abs(x) <= estado.rangoX && Math.abs(y) <= estado.rangoY && Math.abs(z) <= estado.rangoZ) {
                    var color = parseColor(colorInput);
                    crearPunto(x, y, z, color, label);
                    comandosProcesados++;
                }
                continue;
            }
        }
        return comandosProcesados;
    }

    // ========== FUNCIONES DE OBJETOS Y MODALES ==========
    window.guardarObjeto = function() {
        mensajeTerminal('💾 Objeto guardado: ' + estado.nombreObjeto, '#38ef7d');
    };

    function limpiarTodo() {
        estado.puntos = [];
        estado.lineas = [];
        estado.puntoSeleccionado = null;
        estado.puntoSeleccionadoMesh = null;
        limpiarSeleccionMano();
        eliminarLineaTemporal();
        estado.materialesOriginales = [];
        estado.figuraSeleccionada = null;
        estado.figuraSeleccionadaInfo = null;
        estado.tallarActivo = false;
        estado.modoPincelActivo = false;
        estado.modoCubetaActivo = false;
        estado.texturaPintura = null;
        estado.usarTextura = false;
        estado.modoTallarActivo = false;
        estado.modoMaterialActivo = false;
        for (var i = 0; i < estado.meshesPuntos.length; i++) {
            if (estado.drawingScene) estado.drawingScene.remove(estado.meshesPuntos[i]);
        }
        estado.meshesPuntos = [];
        for (var i = 0; i < estado.meshesLineas.length; i++) {
            if (estado.drawingScene) estado.drawingScene.remove(estado.meshesLineas[i]);
        }
        estado.meshesLineas = [];
        for (var i = 0; i < estado.meshesConjuntos.length; i++) {
            if (estado.drawingScene) estado.drawingScene.remove(estado.meshesConjuntos[i]);
        }
        estado.meshesConjuntos = [];
        for (var i = 0; i < estado.figurasGuardadas.length; i++) {
            if (estado.figurasGuardadas[i].group && estado.drawingScene) {
                estado.drawingScene.remove(estado.figurasGuardadas[i].group);
            }
        }
        estado.figurasGuardadas = [];
        estado.contadorPuntos = 0;
        estado.contadorConjuntos = 0;
        actualizarUI();
        sincronizarEditor();
        actualizarTamanioCanvas();
        mensajeTerminal('🧹 Todo limpiado', '#fda085');
    }

    window.clearDrawingCanvas = function() {
        limpiarTodo();
        var pointsList = document.getElementById('pointsList');
        var linesList = document.getElementById('linesList');
        if (pointsList) pointsList.innerHTML = '<div class="empty-lines">Sin puntos dibujados</div>';
        if (linesList) linesList.innerHTML = '<div class="empty-lines">Sin líneas conectadas</div>';
    };

    window.undoLastPoint = function() {
        if (estado.puntos.length === 0) {
            mensajeTerminal('⚠️ No hay puntos para deshacer', '#fda085');
            return;
        }
        var ultimo = estado.puntos[estado.puntos.length - 1];
        eliminarPunto(ultimo.label);
    };

    window.conectarPuntos = function() {
        var connectInput = document.getElementById('connectInput');
        if (!connectInput) return;
        var input = connectInput.value.trim();
        if (!input) {
            mensajeTerminal('⚠️ Ingresa una lista de puntos separados por guiones', '#fda085');
            return;
        }
        var partes = input.split(',').map(function(s) { return s.trim(); });
        var puntosConectados = 0;
        for (var i = 0; i < partes.length; i++) {
            var labels = partes[i].split('-').map(function(s) { return s.trim(); });
            if (labels.length < 2) continue;
            for (var j = 0; j < labels.length - 1; j++) {
                var p1Label = labels[j];
                var p2Label = labels[j + 1];
                var p1 = null, p2 = null;
                for (var k = 0; k < estado.puntos.length; k++) {
                    if (estado.puntos[k].label === p1Label) p1 = estado.puntos[k];
                    if (estado.puntos[k].label === p2Label) p2 = estado.puntos[k];
                }
                if (!p1 || !p2) {
                    mensajeTerminal('⚠️ Puntos no encontrados: ' + (!p1 ? p1Label : '') + (!p2 ? p2Label : ''), '#fda085');
                    continue;
                }
                var existe = false;
                for (var k = 0; k < estado.lineas.length; k++) {
                    var l = estado.lineas[k];
                    if ((l.p1.label === p1Label && l.p2.label === p2Label) ||
                        (l.p1.label === p2Label && l.p2.label === p1Label)) {
                        existe = true;
                        break;
                    }
                }
                if (existe) continue;
                var color = estado.colorActual;
                estado.lineas.push({ p1: p1, p2: p2, label: p1Label + '-' + p2Label });
                var pts = [
                    new THREE.Vector3(p1.x, p1.y + 0.01, p1.z),
                    new THREE.Vector3(p2.x, p2.y + 0.01, p2.z)
                ];
                var geo = new THREE.BufferGeometry().setFromPoints(pts);
                var mat = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
                var line = new THREE.Line(geo, mat);
                line.userData = { label: p1Label + '-' + p2Label };
                line.raycast = function() {};
                estado.drawingScene.add(line);
                estado.meshesLineas.push(line);
                puntosConectados++;
            }
        }
        if (puntosConectados > 0) {
            mensajeTerminal('✅ ' + puntosConectados + ' líneas conectadas', '#38ef7d');
            actualizarUI();
            sincronizarEditor();
        } else {
            mensajeTerminal('⚠️ No se conectaron nuevas líneas', '#fda085');
        }
    };

    window.createPointByCoordinates = function() {
        var coordInput = document.getElementById('coordInput');
        if (!coordInput) return;
        var input = coordInput.value.trim();
        if (!input) {
            mensajeTerminal('⚠️ Ingresa coordenadas en formato: X, Y, Z', '#fda085');
            return;
        }
        var parts = input.split(',').map(function(s) { return parseFloat(s.trim()); });
        if (parts.length < 3 || parts.some(isNaN)) {
            mensajeTerminal('⚠️ Formato inválido. Usa: X, Y, Z', '#fda085');
            return;
        }
        var x = Math.round(parts[0]);
        var y = Math.round(parts[1]);
        var z = Math.round(parts[2]);
        crearPunto(x, y, z);
        coordInput.value = '';
    };

    window.resetDrawingCamera = function() {
        if (!estado.drawingCamera || !estado.drawingControls) return;
        estado.drawingCamera.position.set(120, 90, 140);
        estado.drawingControls.target.set(0, 0, 0);
        estado.drawingControls.update();
        mensajeTerminal('🏠 Cámara de dibujo reseteada', '#667eea');
    };

    window.zoomDrawingIn = function() {
        if (!estado.drawingCamera || !estado.drawingControls) return;
        var dir = new THREE.Vector3();
        estado.drawingCamera.position.clone().normalize(dir);
        estado.drawingCamera.position.multiplyScalar(0.9);
        estado.drawingControls.update();
    };

    window.zoomDrawingOut = function() {
        if (!estado.drawingCamera || !estado.drawingControls) return;
        var dir = new THREE.Vector3();
        estado.drawingCamera.position.clone().normalize(dir);
        estado.drawingCamera.position.multiplyScalar(1.1);
        estado.drawingControls.update();
    };

    window.rotateDrawingUp = function() {
        if (!estado.drawingCamera || !estado.drawingControls) return;
        var q = new THREE.Quaternion();
        var v = new THREE.Vector3(1, 0, 0);
        q.setFromAxisAngle(v, -0.1);
        estado.drawingCamera.position.applyQuaternion(q);
        estado.drawingControls.update();
    };

    window.rotateDrawingDown = function() {
        if (!estado.drawingCamera || !estado.drawingControls) return;
        var q = new THREE.Quaternion();
        var v = new THREE.Vector3(1, 0, 0);
        q.setFromAxisAngle(v, 0.1);
        estado.drawingCamera.position.applyQuaternion(q);
        estado.drawingControls.update();
    };

    window.rotateDrawingLeft = function() {
        if (!estado.drawingCamera || !estado.drawingControls) return;
        var q = new THREE.Quaternion();
        var v = new THREE.Vector3(0, 1, 0);
        q.setFromAxisAngle(v, -0.1);
        estado.drawingCamera.position.applyQuaternion(q);
        estado.drawingControls.update();
    };

    window.rotateDrawingRight = function() {
        if (!estado.drawingCamera || !estado.drawingControls) return;
        var q = new THREE.Quaternion();
        var v = new THREE.Vector3(0, 1, 0);
        q.setFromAxisAngle(v, 0.1);
        estado.drawingCamera.position.applyQuaternion(q);
        estado.drawingControls.update();
    };

    window.setDrawingView = function(mode) {
        if (!estado.drawingCamera || !estado.drawingControls) return;
        if (mode === '2d') {
            estado.drawingCamera.position.set(0, 150, 0);
            estado.drawingControls.target.set(0, 0, 0);
            estado.drawingControls.update();
            mensajeTerminal('📐 Vista 2D en dibujo', '#667eea');
        } else {
            estado.drawingCamera.position.set(120, 90, 140);
            estado.drawingControls.target.set(0, 0, 0);
            estado.drawingControls.update();
            mensajeTerminal('🌐 Vista 3D en dibujo', '#667eea');
        }
    };

    window.addRandomObject = function() {
        var tipos = ['esfera', 'cuadrado', 'cono', 'piramide', 'cilindro'];
        var tipo = tipos[Math.floor(Math.random() * tipos.length)];
        window.agregarFigura(tipo);
    };

    window.clearObjects = function() {
        for (var i = 0; i < estado.meshesConjuntos.length; i++) {
            if (estado.drawingScene) estado.drawingScene.remove(estado.meshesConjuntos[i]);
        }
        estado.meshesConjuntos = [];
        for (var i = 0; i < estado.figurasGuardadas.length; i++) {
            if (estado.figurasGuardadas[i].group && estado.drawingScene) {
                estado.drawingScene.remove(estado.figurasGuardadas[i].group);
            }
        }
        estado.figurasGuardadas = [];
        actualizarUI();
        sincronizarEditor();
        mensajeTerminal('🧹 Objetos (figuras y conjuntos) eliminados', '#fda085');
    };

    window.clearAll = function() {
        limpiarTodo();
    };

    // ========== FUNCIONES DE MODALES ==========
    window.abrirModalObjeto = function() {
        var modal = document.getElementById('createObjectModal');
        if (modal) {
            modal.style.display = 'flex';
            estado.modalAbierto = true;
            setTimeout(function() {
                actualizarTamanioCanvas();
                actualizarUI();
                sincronizarEditor();
            }, 100);
        }
    };

    window.cerrarModalObjeto = function() {
        var modal = document.getElementById('createObjectModal');
        if (modal) {
            modal.style.display = 'none';
            estado.modalAbierto = false;
        }
    };

    window.toggleModoEditor = function() {
        var controlsContent = document.getElementById('drawingControlsContent');
        var editorContent = document.getElementById('drawingEditorContent');
        var btn = document.getElementById('btnToggleTerminalModal');
        if (controlsContent && editorContent) {
            var isEditorVisible = editorContent.style.display !== 'none';
            if (isEditorVisible) {
                controlsContent.style.display = 'flex';
                editorContent.style.display = 'none';
                if (btn) btn.classList.remove('active');
                mensajeTerminal('📋 Modo Controles activado', '#667eea');
            } else {
                controlsContent.style.display = 'none';
                editorContent.style.display = 'flex';
                if (btn) btn.classList.add('active');
                actualizarEditor();
                mensajeTerminal('📝 Modo Editor activado', '#667eea');
            }
        }
    };

    window.closeModal = function() {
        var modal = document.getElementById('addItemModal');
        if (modal) modal.style.display = 'none';
    };

    window.addItemToVector = function() {
        mensajeTerminal('➕ Item agregado', '#38ef7d');
        window.closeModal();
    };

    // ========== FUNCIONES DE TERMINAL ==========
    window.ejecutarComandoTerminal = function() {
        var input = dom.terminalInput;
        if (!input) return;
        var comando = input.value.trim();
        if (!comando) return;
        mensajeTerminal('$ ' + comando, '#667eea');
        if (comando === 'clear' || comando === 'cls') {
            dom.terminal.innerHTML = '';
            input.value = '';
            return;
        }
        if (window.ComandosModule) {
            var result = window.ComandosModule.executeCommand(comando);
            if (result === true) {
                input.value = '';
                actualizarUI();
                sincronizarEditor();
                return;
            }
        }
        var lower = comando.toLowerCase();
        if (lower === 'help' || lower === '?') {
            if (typeof window.abrirAyuda === 'function') {
                window.abrirAyuda();
            }
            input.value = '';
            return;
        }
        if (lower === 'helptallar') {
            mensajeTerminal('🪚🧱 GUÍA DEL MODO TALLAR Y MATERIAL:', '#ff6b6b');
            mensajeTerminal('  📌 TALLAR (🪚) - Quitar material:', '#ff6b6b');
            mensajeTerminal('    1. Crea una figura geométrica', 'rgba(255,255,255,0.3)');
            mensajeTerminal('    2. Activa el modo tallar con el botón 🪚 en la paleta', 'rgba(255,255,255,0.3)');
            mensajeTerminal('    3. Haz clic en la figura y arrastra para quitar material', 'rgba(255,255,255,0.3)');
            mensajeTerminal('  📌 MATERIAL (🧱) - Añadir material:', '#4facfe');
            mensajeTerminal('    1. Activa el modo material con el botón 🧱 en la paleta', 'rgba(255,255,255,0.3)');
            mensajeTerminal('    2. Haz clic en la figura y arrastra para añadir volumen', 'rgba(255,255,255,0.3)');
            mensajeTerminal('  Comando: tallar {radio, intensidad} - Ej: tallar {10, 0.7}', '#4facfe');
            mensajeTerminal('  Comando: material {radio, intensidad} - Ej: material {10, 0.7}', '#4facfe');
            mensajeTerminal('  Comando: tallarf esfera {10, 0.7} - Tallar figura directamente', '#4facfe');
            mensajeTerminal('  Comando: materialf esfera {10, 0.7} - Añadir material directamente', '#4facfe');
            input.value = '';
            return;
        }
        if (lower === 'list' || lower === 'ls') {
            mensajeTerminal('📋 Elementos en el dibujo:', '#4facfe');
            mensajeTerminal('  Puntos: ' + estado.puntos.length, 'rgba(255,255,255,0.3)');
            mensajeTerminal('  Líneas: ' + estado.lineas.length, 'rgba(255,255,255,0.3)');
            mensajeTerminal('  Figuras: ' + estado.figurasGuardadas.length, 'rgba(255,255,255,0.3)');
            input.value = '';
            return;
        }
        if (lower === 'diagnostico') {
            mensajeTerminal('🔍 DIAGNÓSTICO:', '#667eea');
            mensajeTerminal('  Puntos: ' + estado.puntos.length, 'rgba(255,255,255,0.3)');
            mensajeTerminal('  Líneas: ' + estado.lineas.length, 'rgba(255,255,255,0.3)');
            mensajeTerminal('  Figuras: ' + estado.figurasGuardadas.length, 'rgba(255,255,255,0.3)');
            mensajeTerminal('  Figuras modificadas: ' + estado.figurasGuardadas.filter(f => f.modificada).length, 'rgba(255,255,255,0.3)');
            mensajeTerminal('  Modo tallar: ' + (estado.modoTallarActivo ? 'ACTIVO' : 'Inactivo'), 'rgba(255,255,255,0.3)');
            mensajeTerminal('  Modo material: ' + (estado.modoMaterialActivo ? 'ACTIVO' : 'Inactivo'), 'rgba(255,255,255,0.3)');
            mensajeTerminal('  Modo pincel: ' + (estado.modoPincelActivo ? 'ACTIVO' : 'Inactivo'), 'rgba(255,255,255,0.3)');
            mensajeTerminal('  Modo cubeta: ' + (estado.modoCubetaActivo ? 'ACTIVO' : 'Inactivo'), 'rgba(255,255,255,0.3)');
            mensajeTerminal('  Textura: ' + (estado.usarTextura ? 'ACTIVA' : 'Inactiva'), 'rgba(255,255,255,0.3)');
            input.value = '';
            return;
        }
        if (lower === 'textura' || lower === 'texture') {
            var texturaInput = document.getElementById('texturaFileInput');
            if (texturaInput) {
                texturaInput.click();
            }
            input.value = '';
            return;
        }
        if (lower === 'limpiartextura' || lower === 'cleartexture') {
            window.limpiarTextura();
            input.value = '';
            return;
        }
        input.value = '';
    };

    function resetearFlags() {
        estado.ejecutando = false;
        estado.modoDibujoActivo = true;
        estado.modoConexionActivo = false;
        estado.modoManoActivo = false;
        estado.modoOrbitaActivo = false;
        estado.modoTallarActivo = false;
        estado.modoMaterialActivo = false;
        estado.tallarActivo = false;
        estado.figuraSeleccionada = null;
        estado.figuraSeleccionadaInfo = null;
        estado.modoPincelActivo = false;
        estado.modoCubetaActivo = false;
        actualizarBotonTallar();
        actualizarBotonMaterial();
        actualizarBotonesPintura();
        mensajeTerminal('🔄 Flags reseteados correctamente', '#38ef7d');
    }

    // ========== CONFIGURAR COMANDOS MODULE ==========
    function configurarComandos() {
        if (window.ComandosModule) {
            try {
                window.ComandosModule.configure({
                    drawingPoints: estado.puntos,
                    drawingLines: estado.lineas,
                    drawingScene: estado.drawingScene,
                    drawingLineObjects: estado.meshesLineas,
                    drawingPointMeshes: estado.meshesPuntos,
                    drawingSolidMeshes: estado.meshesConjuntos,
                    pointCounter: estado.contadorPuntos,
                    COLOR_MAP: COLOR_MAP,
                    terminalOutputCallback: mensajeTerminal,
                    updateUI: actualizarUI,
                    normalizePointLabel: function(label) { 
                        return label.toLowerCase().replace(/^p(\d+)$/, 'p_$1'); 
                    },
                    getColorName: obtenerNombreColor,
                    clearAllDrawingObjects: limpiarTodo,
                    createPointWithColor: crearPunto,
                    createConjunto: function(labels, color, label) {
                        return false;
                    },
                    createFigureInDrawing: crearFiguraEnDibujo,
                    figurasGuardadas: estado.figurasGuardadas,
                    getEditor: function() { return dom.editor; },
                    clearTerminalEditor: function() { if (dom.editor) dom.editor.value = ''; },
                    restoreExistingPoints: function() { actualizarUI(); },
                    updateDrawingCanvasSize: function() { actualizarTamanioCanvas(); },
                    updatePointsList: actualizarListaPuntos,
                    updateLinesList: actualizarListaLineas,
                    updateDrawingInfo: actualizarInfoDibujo,
                    updateEditorFromCanvas: actualizarEditor,
                    activarModoTallar: window.activarModoTallar,
                    activarModoMaterial: window.activarModoMaterial,
                    tallarFiguraDirecta: tallarFiguraDirecta,
                    añadirMaterialDirecto: añadirMaterialDirecto,
                    setViewSolid: window.setViewSolid,
                    setViewWireframe: window.setViewWireframe,
                    setViewTransparent: window.setViewTransparent,
                    getEstado: function() {
                        return {
                            'Puntos': estado.puntos.length,
                            'Líneas': estado.lineas.length,
                            'Sólidos': estado.meshesConjuntos.length,
                            'Figuras': estado.figurasGuardadas.length,
                            'Modo dibujo': estado.modoDibujoActivo ? 'Activo' : 'Inactivo',
                            'Modo tallar': estado.modoTallarActivo ? 'Activo' : 'Inactivo',
                            'Modo material': estado.modoMaterialActivo ? 'Activo' : 'Inactivo',
                            'Modo pincel': estado.modoPincelActivo ? 'Activo' : 'Inactivo',
                            'Modo cubeta': estado.modoCubetaActivo ? 'Activo' : 'Inactivo',
                            'Usar textura': estado.usarTextura ? 'Sí' : 'No',
                            'Fondo modo': estado.fondoModo,
                            'Fondo intensidad': Math.round(estado.fondoIntensidad * 100) + '%',
                            'ejecutando': estado.ejecutando,
                            'rangoX': estado.rangoX,
                            'rangoY': estado.rangoY,
                            'rangoZ': estado.rangoZ
                        };
                    },
                    getRangos: function() {
                        return { x: estado.rangoX, y: estado.rangoY, z: estado.rangoZ };
                    },
                    resetFlags: resetearFlags,
                    sincronizarEditor: sincronizarEditor,
                    actualizarEditor: actualizarEditor
                });
                console.log('✅ ComandosModule configurado con soporte tallar y material');
            } catch (error) {
                console.error('❌ Error configurando ComandosModule:', error);
            }
        }
    }

    // ========== FUNCIONES DE TALLAR Y MATERIAL ==========
    
    // TALLAR - Quitar material
    window.activarModoTallar = function() {
        console.log('🪚 activarModoTallar llamado');
        if (estado.modoDibujoActivo) {
            estado.modoDibujoActivo = false;
            var btnDibujo = document.getElementById('paletteCreatePoint');
            if (btnDibujo) { btnDibujo.classList.remove('active'); btnDibujo.style.color = 'rgba(255,255,255,0.4)'; btnDibujo.style.background = 'none'; }
        }
        if (estado.modoConexionActivo) {
            estado.modoConexionActivo = false;
            estado.puntoSeleccionado = null;
            estado.puntoSeleccionadoMesh = null;
            eliminarLineaTemporal();
            var btnConectar = document.getElementById('paletteConnect');
            if (btnConectar) { btnConectar.classList.remove('active'); btnConectar.style.color = 'rgba(255,255,255,0.4)'; btnConectar.style.background = 'none'; }
        }
        if (estado.modoManoActivo) {
            estado.modoManoActivo = false;
            limpiarSeleccionMano();
            var btnMano = document.getElementById('paletteHand');
            if (btnMano) { btnMano.classList.remove('active'); btnMano.style.color = 'rgba(255,255,255,0.4)'; btnMano.style.background = 'none'; }
        }
        if (estado.modoOrbitaActivo) {
            estado.modoOrbitaActivo = false;
            if (estado.drawingControls) {
                estado.drawingControls.enabled = false;
                estado.drawingControls.enableRotate = false;
                estado.drawingControls.enablePan = false;
                estado.drawingControls.enableZoom = false;
            }
            var btnOrbit = document.getElementById('paletteOrbit');
            if (btnOrbit) { btnOrbit.classList.remove('active'); btnOrbit.style.color = 'rgba(255,255,255,0.4)'; btnOrbit.style.background = 'none'; }
        }
        if (estado.modoMaterialActivo) {
            estado.modoMaterialActivo = false;
            estado.figuraSeleccionada = null;
            estado.figuraSeleccionadaInfo = null;
            estado.tallarActivo = false;
            actualizarBotonMaterial();
        }
        if (estado.modoPincelActivo) {
            estado.modoPincelActivo = false;
            actualizarBotonesPintura();
        }
        if (estado.modoCubetaActivo) {
            estado.modoCubetaActivo = false;
            actualizarBotonesPintura();
        }
        estado.modoTallarActivo = !estado.modoTallarActivo;
        if (!estado.modoTallarActivo) {
            estado.figuraSeleccionada = null;
            estado.figuraSeleccionadaInfo = null;
            estado.tallarActivo = false;
            if (dom.drawingStatus) { dom.drawingStatus.classList.remove('tallando'); }
            mensajeTerminal('🪚 Modo tallar desactivado', '#fda085');
            console.log('🪚 Modo tallar DESACTIVADO');
        } else {
            mensajeTerminal('🪚 Modo tallar activado - Haz clic en una figura para seleccionarla (quitar material)', '#ff6b6b');
            console.log('🪚 Modo tallar ACTIVADO');
        }
        actualizarBotonTallar();
        actualizarEstadoDibujo();
        actualizarListaPuntos();
        actualizarBotonesVisualizacion();
    };

    // MATERIAL - Añadir material
    window.activarModoMaterial = function() {
        console.log('🧱 activarModoMaterial llamado');
        if (estado.modoDibujoActivo) {
            estado.modoDibujoActivo = false;
            var btnDibujo = document.getElementById('paletteCreatePoint');
            if (btnDibujo) { btnDibujo.classList.remove('active'); btnDibujo.style.color = 'rgba(255,255,255,0.4)'; btnDibujo.style.background = 'none'; }
        }
        if (estado.modoConexionActivo) {
            estado.modoConexionActivo = false;
            estado.puntoSeleccionado = null;
            estado.puntoSeleccionadoMesh = null;
            eliminarLineaTemporal();
            var btnConectar = document.getElementById('paletteConnect');
            if (btnConectar) { btnConectar.classList.remove('active'); btnConectar.style.color = 'rgba(255,255,255,0.4)'; btnConectar.style.background = 'none'; }
        }
        if (estado.modoManoActivo) {
            estado.modoManoActivo = false;
            limpiarSeleccionMano();
            var btnMano = document.getElementById('paletteHand');
            if (btnMano) { btnMano.classList.remove('active'); btnMano.style.color = 'rgba(255,255,255,0.4)'; btnMano.style.background = 'none'; }
        }
        if (estado.modoOrbitaActivo) {
            estado.modoOrbitaActivo = false;
            if (estado.drawingControls) {
                estado.drawingControls.enabled = false;
                estado.drawingControls.enableRotate = false;
                estado.drawingControls.enablePan = false;
                estado.drawingControls.enableZoom = false;
            }
            var btnOrbit = document.getElementById('paletteOrbit');
            if (btnOrbit) { btnOrbit.classList.remove('active'); btnOrbit.style.color = 'rgba(255,255,255,0.4)'; btnOrbit.style.background = 'none'; }
        }
        if (estado.modoTallarActivo) {
            estado.modoTallarActivo = false;
            estado.figuraSeleccionada = null;
            estado.figuraSeleccionadaInfo = null;
            estado.tallarActivo = false;
            actualizarBotonTallar();
        }
        if (estado.modoPincelActivo) {
            estado.modoPincelActivo = false;
            actualizarBotonesPintura();
        }
        if (estado.modoCubetaActivo) {
            estado.modoCubetaActivo = false;
            actualizarBotonesPintura();
        }
        estado.modoMaterialActivo = !estado.modoMaterialActivo;
        if (!estado.modoMaterialActivo) {
            estado.figuraSeleccionada = null;
            estado.figuraSeleccionadaInfo = null;
            estado.tallarActivo = false;
            if (dom.drawingStatus) { dom.drawingStatus.classList.remove('tallando'); }
            mensajeTerminal('🧱 Modo añadir material desactivado', '#fda085');
            console.log('🧱 Modo material DESACTIVADO');
        } else {
            mensajeTerminal('🧱 Modo añadir material activado - Haz clic en una figura para seleccionarla (añadir volumen)', '#4facfe');
            console.log('🧱 Modo material ACTIVADO');
        }
        actualizarBotonMaterial();
        actualizarEstadoDibujo();
        actualizarListaPuntos();
        actualizarBotonesVisualizacion();
    };

    // Función para tallar figura (quitar material)
    function tallarFiguraDirecta(mesh, fig, radio, intensidad) {
        if (!mesh || !fig) return false;
        try {
            var geometry = mesh.geometry;
            if (!geometry || !geometry.attributes || !geometry.attributes.position) return false;
            var positions = geometry.attributes.position.array;
            var vertexCount = positions.length / 3;
            var center = new THREE.Vector3();
            for (var i = 0; i < vertexCount; i++) {
                center.x += positions[i * 3];
                center.y += positions[i * 3 + 1];
                center.z += positions[i * 3 + 2];
            }
            center.x /= vertexCount;
            center.y /= vertexCount;
            center.z /= vertexCount;
            var modificados = 0;
            var radioFinal = radio || 5;
            var intensidadFinal = intensidad || 0.5;
            var puntosPrueba = [
                { x: center.x + 10, y: center.y + 10, z: center.z + 10 },
                { x: center.x - 10, y: center.y + 10, z: center.z - 10 },
                { x: center.x + 10, y: center.y - 10, z: center.z - 10 },
                { x: center.x - 10, y: center.y - 10, z: center.z + 10 },
                { x: center.x, y: center.y + 15, z: center.z },
                { x: center.x, y: center.y - 15, z: center.z },
                { x: center.x + 15, y: center.y, z: center.z },
                { x: center.x - 15, y: center.y, z: center.z }
            ];
            var puntoImpacto = puntosPrueba[Math.floor(Math.random() * puntosPrueba.length)];
            var localPoint = new THREE.Vector3(puntoImpacto.x, puntoImpacto.y, puntoImpacto.z);
            var radioCuadrado = radioFinal * radioFinal;
            for (var i = 0; i < vertexCount; i++) {
                var vx = positions[i * 3];
                var vy = positions[i * 3 + 1];
                var vz = positions[i * 3 + 2];
                var dx = vx - localPoint.x;
                var dy = vy - localPoint.y;
                var dz = vz - localPoint.z;
                var distCuadrado = dx*dx + dy*dy + dz*dz;
                if (distCuadrado < radioCuadrado) {
                    var dist = Math.sqrt(distCuadrado);
                    var factor = 1 - (dist / radioFinal);
                    factor = Math.pow(factor, 3);
                    var dirX = vx - center.x;
                    var dirY = vy - center.y;
                    var dirZ = vz - center.z;
                    var len = Math.sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ);
                    if (len > 0.001) {
                        dirX /= len; dirY /= len; dirZ /= len;
                        var desplazamiento = intensidadFinal * factor * 0.8;
                        positions[i * 3] -= dirX * desplazamiento;
                        positions[i * 3 + 1] -= dirY * desplazamiento;
                        positions[i * 3 + 2] -= dirZ * desplazamiento;
                        modificados++;
                    }
                }
            }
            if (modificados > 0) {
                geometry.attributes.position.needsUpdate = true;
                geometry.computeVertexNormals();
                geometry.computeBoundingSphere();
                fig.modificada = true;
                if (estado.isSolidView && !estado.isWireframeView && !estado.isTransparentView) {
                    aplicarModoSolid();
                } else if (estado.isWireframeView) {
                    aplicarModoWireframe();
                } else if (estado.isTransparentView) {
                    aplicarModoTransparente();
                }
                sincronizarEditor();
                actualizarUI();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error en tallarFiguraDirecta:', error);
            return false;
        }
    }

    // Función para añadir material (NUEVO)
    function añadirMaterialDirecto(mesh, fig, radio, intensidad) {
        if (!mesh || !fig) return false;
        try {
            var geometry = mesh.geometry;
            if (!geometry || !geometry.attributes || !geometry.attributes.position) return false;
            var positions = geometry.attributes.position.array;
            var vertexCount = positions.length / 3;
            var center = new THREE.Vector3();
            for (var i = 0; i < vertexCount; i++) {
                center.x += positions[i * 3];
                center.y += positions[i * 3 + 1];
                center.z += positions[i * 3 + 2];
            }
            center.x /= vertexCount;
            center.y /= vertexCount;
            center.z /= vertexCount;
            var modificados = 0;
            var radioFinal = radio || 5;
            var intensidadFinal = intensidad || 0.5;
            var puntosPrueba = [
                { x: center.x + 10, y: center.y + 10, z: center.z + 10 },
                { x: center.x - 10, y: center.y + 10, z: center.z - 10 },
                { x: center.x + 10, y: center.y - 10, z: center.z - 10 },
                { x: center.x - 10, y: center.y - 10, z: center.z + 10 },
                { x: center.x, y: center.y + 15, z: center.z },
                { x: center.x, y: center.y - 15, z: center.z },
                { x: center.x + 15, y: center.y, z: center.z },
                { x: center.x - 15, y: center.y, z: center.z }
            ];
            var puntoImpacto = puntosPrueba[Math.floor(Math.random() * puntosPrueba.length)];
            var localPoint = new THREE.Vector3(puntoImpacto.x, puntoImpacto.y, puntoImpacto.z);
            var radioCuadrado = radioFinal * radioFinal;
            for (var i = 0; i < vertexCount; i++) {
                var vx = positions[i * 3];
                var vy = positions[i * 3 + 1];
                var vz = positions[i * 3 + 2];
                var dx = vx - localPoint.x;
                var dy = vy - localPoint.y;
                var dz = vz - localPoint.z;
                var distCuadrado = dx*dx + dy*dy + dz*dz;
                if (distCuadrado < radioCuadrado) {
                    var dist = Math.sqrt(distCuadrado);
                    var factor = 1 - (dist / radioFinal);
                    factor = Math.pow(factor, 3);
                    var dirX = vx - center.x;
                    var dirY = vy - center.y;
                    var dirZ = vz - center.z;
                    var len = Math.sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ);
                    if (len > 0.001) {
                        dirX /= len; dirY /= len; dirZ /= len;
                        var desplazamiento = intensidadFinal * factor * 0.8;
                        positions[i * 3] += dirX * desplazamiento;
                        positions[i * 3 + 1] += dirY * desplazamiento;
                        positions[i * 3 + 2] += dirZ * desplazamiento;
                        modificados++;
                    }
                }
            }
            if (modificados > 0) {
                geometry.attributes.position.needsUpdate = true;
                geometry.computeVertexNormals();
                geometry.computeBoundingSphere();
                fig.modificada = true;
                if (estado.isSolidView && !estado.isWireframeView && !estado.isTransparentView) {
                    aplicarModoSolid();
                } else if (estado.isWireframeView) {
                    aplicarModoWireframe();
                } else if (estado.isTransparentView) {
                    aplicarModoTransparente();
                }
                sincronizarEditor();
                actualizarUI();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error en añadirMaterialDirecto:', error);
            return false;
        }
    }

    // Seleccionar figura para tallar/material
    function seleccionarFiguraParaTallar(event) {
        try {
            var rect = estado.drawingRenderer.domElement.getBoundingClientRect();
            var x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            var y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(x, y), estado.drawingCamera);
            var intersects = [];
            for (var i = 0; i < estado.figurasGuardadas.length; i++) {
                var fig = estado.figurasGuardadas[i];
                if (fig.group) {
                    fig.group.children.forEach(function(child) {
                        if (child.isMesh) {
                            var intersect = raycaster.intersectObject(child);
                            if (intersect.length > 0) {
                                intersects.push({
                                    mesh: child,
                                    distance: intersect[0].distance,
                                    figIndex: i,
                                    point: intersect[0].point,
                                    face: intersect[0].face
                                });
                            }
                        }
                    });
                }
            }
            intersects.sort(function(a, b) { return a.distance - b.distance; });
            if (intersects.length === 0) {
                if (estado.figuraSeleccionada) {
                    if (estado.figuraSeleccionadaInfo && estado.figuraSeleccionadaInfo.mesh) {
                        estado.figuraSeleccionadaInfo.mesh.material.emissive.setHex(0x000000);
                    }
                    estado.figuraSeleccionada = null;
                    estado.figuraSeleccionadaInfo = null;
                    mensajeTerminal('🪚 Figura deseleccionada', '#fda085');
                    actualizarEstadoDibujo();
                }
                return;
            }
            var hit = intersects[0];
            var figInfo = estado.figurasGuardadas[hit.figIndex];
            if (!figInfo) {
                mensajeTerminal('⚠️ Figura no encontrada', '#fda085');
                return;
            }
            if (estado.figuraSeleccionadaInfo && estado.figuraSeleccionadaInfo.mesh) {
                estado.figuraSeleccionadaInfo.mesh.material.emissive.setHex(0x000000);
            }
            estado.figuraSeleccionada = hit.mesh;
            estado.figuraSeleccionadaInfo = figInfo;
            estado.ultimoPuntoTallar = null;
            if (hit.mesh.material) {
                if (estado.modoTallarActivo) {
                    hit.mesh.material.emissive.setHex(0xff6b6b);
                } else if (estado.modoMaterialActivo) {
                    hit.mesh.material.emissive.setHex(0x4facfe);
                }
                hit.mesh.material.emissiveIntensity = 0.3;
            }
            var modo = estado.modoTallarActivo ? 'tallar' : 'material';
            var icono = estado.modoTallarActivo ? '🪚' : '🧱';
            mensajeTerminal(icono + ' Figura seleccionada: ' + figInfo.label + ' - Arrastra para ' + (estado.modoTallarActivo ? 'quitar' : 'añadir') + ' material', estado.modoTallarActivo ? '#ff6b6b' : '#4facfe');
            actualizarEstadoDibujo();
        } catch (error) {
            console.error('Error seleccionando figura:', error);
        }
    }

    // Tallar figura (quitar material) con mouse
    function tallarFigura(event) {
        if (!estado.modoTallarActivo) return;
        if (!estado.figuraSeleccionada) return;
        if (!estado.figuraSeleccionadaInfo) return;
        try {
            var rect = estado.drawingRenderer.domElement.getBoundingClientRect();
            var x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            var y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(x, y), estado.drawingCamera);
            var mesh = estado.figuraSeleccionada;
            var fig = estado.figuraSeleccionadaInfo;
            var intersect = raycaster.intersectObject(mesh);
            if (intersect.length === 0) return;
            var hitPoint = intersect[0].point;
            var matrix = new THREE.Matrix4().copy(mesh.matrixWorld).invert();
            var localPoint = hitPoint.clone().applyMatrix4(matrix);
            var radio = estado.radioTallar || 5;
            var intensidad = estado.intensidadTallar || 0.5;
            var geometry = mesh.geometry;
            if (!geometry || !geometry.attributes || !geometry.attributes.position) return;
            var positions = geometry.attributes.position.array;
            var vertexCount = positions.length / 3;
            var center = new THREE.Vector3();
            for (var i = 0; i < vertexCount; i++) {
                center.x += positions[i * 3];
                center.y += positions[i * 3 + 1];
                center.z += positions[i * 3 + 2];
            }
            center.x /= vertexCount;
            center.y /= vertexCount;
            center.z /= vertexCount;
            var modificados = 0;
            var radioCuadrado = radio * radio;
            for (var i = 0; i < vertexCount; i++) {
                var vx = positions[i * 3];
                var vy = positions[i * 3 + 1];
                var vz = positions[i * 3 + 2];
                var dx = vx - localPoint.x;
                var dy = vy - localPoint.y;
                var dz = vz - localPoint.z;
                var distCuadrado = dx*dx + dy*dy + dz*dz;
                if (distCuadrado < radioCuadrado) {
                    var dist = Math.sqrt(distCuadrado);
                    var factor = 1 - (dist / radio);
                    factor = Math.pow(factor, 3);
                    var dirX = vx - center.x;
                    var dirY = vy - center.y;
                    var dirZ = vz - center.z;
                    var len = Math.sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ);
                    if (len > 0.001) {
                        dirX /= len; dirY /= len; dirZ /= len;
                        var desplazamiento = intensidad * factor * 0.8;
                        positions[i * 3] -= dirX * desplazamiento;
                        positions[i * 3 + 1] -= dirY * desplazamiento;
                        positions[i * 3 + 2] -= dirZ * desplazamiento;
                        modificados++;
                    }
                }
            }
            if (modificados > 0) {
                geometry.attributes.position.needsUpdate = true;
                geometry.computeVertexNormals();
                geometry.computeBoundingSphere();
                fig.modificada = true;
                if (estado.isSolidView && !estado.isWireframeView && !estado.isTransparentView) {
                    aplicarModoSolid();
                } else if (estado.isWireframeView) {
                    aplicarModoWireframe();
                } else if (estado.isTransparentView) {
                    aplicarModoTransparente();
                }
                sincronizarEditor();
                actualizarUI();
                if (dom.drawingStatus) {
                    dom.drawingStatus.textContent = '🪚 Tallando: ' + fig.label + ' (' + modificados + ' vértices)';
                    dom.drawingStatus.style.color = '#ff6b6b';
                }
            }
        } catch (error) {
            console.error('Error en tallarFigura:', error);
        }
    }

    // Añadir material con mouse (NUEVO)
    function añadirMaterialFigura(event) {
        if (!estado.modoMaterialActivo) return;
        if (!estado.figuraSeleccionada) return;
        if (!estado.figuraSeleccionadaInfo) return;
        try {
            var rect = estado.drawingRenderer.domElement.getBoundingClientRect();
            var x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            var y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(x, y), estado.drawingCamera);
            var mesh = estado.figuraSeleccionada;
            var fig = estado.figuraSeleccionadaInfo;
            var intersect = raycaster.intersectObject(mesh);
            if (intersect.length === 0) return;
            var hitPoint = intersect[0].point;
            var matrix = new THREE.Matrix4().copy(mesh.matrixWorld).invert();
            var localPoint = hitPoint.clone().applyMatrix4(matrix);
            var radio = estado.radioTallar || 5;
            var intensidad = estado.intensidadTallar || 0.5;
            var geometry = mesh.geometry;
            if (!geometry || !geometry.attributes || !geometry.attributes.position) return;
            var positions = geometry.attributes.position.array;
            var vertexCount = positions.length / 3;
            var center = new THREE.Vector3();
            for (var i = 0; i < vertexCount; i++) {
                center.x += positions[i * 3];
                center.y += positions[i * 3 + 1];
                center.z += positions[i * 3 + 2];
            }
            center.x /= vertexCount;
            center.y /= vertexCount;
            center.z /= vertexCount;
            var modificados = 0;
            var radioCuadrado = radio * radio;
            for (var i = 0; i < vertexCount; i++) {
                var vx = positions[i * 3];
                var vy = positions[i * 3 + 1];
                var vz = positions[i * 3 + 2];
                var dx = vx - localPoint.x;
                var dy = vy - localPoint.y;
                var dz = vz - localPoint.z;
                var distCuadrado = dx*dx + dy*dy + dz*dz;
                if (distCuadrado < radioCuadrado) {
                    var dist = Math.sqrt(distCuadrado);
                    var factor = 1 - (dist / radio);
                    factor = Math.pow(factor, 3);
                    var dirX = vx - center.x;
                    var dirY = vy - center.y;
                    var dirZ = vz - center.z;
                    var len = Math.sqrt(dirX*dirX + dirY*dirY + dirZ*dirZ);
                    if (len > 0.001) {
                        dirX /= len; dirY /= len; dirZ /= len;
                        var desplazamiento = intensidad * factor * 0.8;
                        positions[i * 3] += dirX * desplazamiento;
                        positions[i * 3 + 1] += dirY * desplazamiento;
                        positions[i * 3 + 2] += dirZ * desplazamiento;
                        modificados++;
                    }
                }
            }
            if (modificados > 0) {
                geometry.attributes.position.needsUpdate = true;
                geometry.computeVertexNormals();
                geometry.computeBoundingSphere();
                fig.modificada = true;
                if (estado.isSolidView && !estado.isWireframeView && !estado.isTransparentView) {
                    aplicarModoSolid();
                } else if (estado.isWireframeView) {
                    aplicarModoWireframe();
                } else if (estado.isTransparentView) {
                    aplicarModoTransparente();
                }
                sincronizarEditor();
                actualizarUI();
                if (dom.drawingStatus) {
                    dom.drawingStatus.textContent = '🧱 Añadiendo material: ' + fig.label + ' (' + modificados + ' vértices)';
                    dom.drawingStatus.style.color = '#4facfe';
                }
            }
        } catch (error) {
            console.error('Error en añadirMaterialFigura:', error);
        }
    }

    // Manejadores de eventos para tallar
    function manejarMouseDownTallar(event) {
        if (!estado.modoTallarActivo) return;
        if (!estado.figuraSeleccionada) {
            seleccionarFiguraParaTallar(event);
            return;
        }
        estado.tallarActivo = true;
        tallarFigura(event);
    }

    function manejarMouseMoveTallar(event) {
        if (!estado.modoTallarActivo) return;
        if (!estado.tallarActivo) return;
        if (!estado.figuraSeleccionada) return;
        tallarFigura(event);
    }

    function manejarMouseUpTallar(event) {
        if (!estado.modoTallarActivo) return;
        estado.tallarActivo = false;
        if (estado.figuraSeleccionadaInfo) {
            mensajeTerminal('✅ Tallado completado en ' + estado.figuraSeleccionadaInfo.label, '#38ef7d');
            sincronizarEditor();
            actualizarUI();
            actualizarTamanioCanvas();
        }
    }

    // Manejadores de eventos para material (NUEVO)
    function manejarMouseDownMaterial(event) {
        if (!estado.modoMaterialActivo) return;
        if (!estado.figuraSeleccionada) {
            seleccionarFiguraParaTallar(event);
            return;
        }
        estado.tallarActivo = true;
        añadirMaterialFigura(event);
    }

    function manejarMouseMoveMaterial(event) {
        if (!estado.modoMaterialActivo) return;
        if (!estado.tallarActivo) return;
        if (!estado.figuraSeleccionada) return;
        añadirMaterialFigura(event);
    }

    function manejarMouseUpMaterial(event) {
        if (!estado.modoMaterialActivo) return;
        estado.tallarActivo = false;
        if (estado.figuraSeleccionadaInfo) {
            mensajeTerminal('✅ Material añadido en ' + estado.figuraSeleccionadaInfo.label, '#38ef7d');
            sincronizarEditor();
            actualizarUI();
            actualizarTamanioCanvas();
        }
    }

    // ========== ESCENAS ==========
    function crearEscenaPrincipal() {
        if (!dom.container) {
            console.error('❌ Contenedor principal no encontrado');
            return;
        }
        var ancho = dom.container.clientWidth || window.innerWidth * 0.6;
        var alto = dom.container.clientHeight || window.innerHeight * 0.8;
        estado.scene = new THREE.Scene();
        estado.scene.background = new THREE.Color(0x0a0a1a);
        estado.camera = new THREE.PerspectiveCamera(45, ancho / alto, 0.1, 1000);
        estado.camera.position.set(120, 100, 150);
        estado.camera.lookAt(0, 0, 0);
        estado.renderer = new THREE.WebGLRenderer({ antialias: true });
        estado.renderer.setSize(ancho, alto);
        estado.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        dom.container.appendChild(estado.renderer.domElement);
        estado.controls = new THREE.OrbitControls(estado.camera, estado.renderer.domElement);
        estado.controls.enableDamping = true;
        estado.controls.dampingFactor = 0.08;
        estado.controls.target.set(0, 0, 0);
        estado.controls.update();
        var luz1 = new THREE.AmbientLight(0x404060);
        estado.scene.add(luz1);
        var luz2 = new THREE.DirectionalLight(0xffffff, 0.8);
        luz2.position.set(80, 120, 100);
        estado.scene.add(luz2);
        var grilla = new THREE.GridHelper(200, 20, 0x667eea, 0x2a2a4a);
        grilla.position.y = -0.5;
        estado.scene.add(grilla);
        var ejes = new THREE.AxesHelper(120);
        estado.scene.add(ejes);
        animarPrincipal();
        actualizarInfoCamara();
    }

    function animarPrincipal() {
        requestAnimationFrame(animarPrincipal);
        if (estado.controls) estado.controls.update();
        if (estado.renderer && estado.scene && estado.camera) {
            estado.renderer.render(estado.scene, estado.camera);
        }
    }

    function crearEscenaDibujo() {
        if (!dom.drawingContainer) {
            console.error('❌ Contenedor de dibujo no encontrado');
            return;
        }
        var rect = dom.drawingContainer.getBoundingClientRect();
        var ancho = Math.max(rect.width || 400, 100);
        var alto = Math.max(rect.height || 300, 100);
        estado.drawingScene = new THREE.Scene();
        estado.drawingScene.background = new THREE.Color(0x0a0a1a);
        estado.drawingCamera = new THREE.PerspectiveCamera(45, ancho / alto, 0.1, 1000);
        estado.drawingCamera.position.set(120, 90, 140);
        estado.drawingCamera.lookAt(0, 0, 0);
        estado.drawingRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        estado.drawingRenderer.setSize(ancho, alto);
        estado.drawingRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        estado.drawingRenderer.setClearColor(0x0a0a1a, 1);
        estado.drawingRenderer.shadowMap.enabled = true;
        estado.drawingRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        dom.drawingContainer.innerHTML = '';
        dom.drawingContainer.appendChild(estado.drawingRenderer.domElement);
        estado.drawingControls = new THREE.OrbitControls(estado.drawingCamera, estado.drawingRenderer.domElement);
        estado.drawingControls.enableDamping = true;
        estado.drawingControls.dampingFactor = 0.08;
        estado.drawingControls.target.set(0, 0, 0);
        estado.drawingControls.enabled = false;
        estado.drawingControls.enableRotate = false;
        estado.drawingControls.enablePan = false;
        estado.drawingControls.enableZoom = false;
        estado.drawingControls.update();

        // Iluminación 360° blanca sobre fondo oscuro
        var luzAmbiental = new THREE.AmbientLight(0xffffff, 0.6);
        estado.drawingScene.add(luzAmbiental);
        var luzAmbiental2 = new THREE.AmbientLight(0xffffff, 0.3);
        estado.drawingScene.add(luzAmbiental2);
        var luzArriba = new THREE.DirectionalLight(0xffffff, 0.7);
        luzArriba.position.set(0, 150, 0);
        luzArriba.castShadow = true;
        estado.drawingScene.add(luzArriba);
        var luzIzquierda = new THREE.DirectionalLight(0xffffff, 0.5);
        luzIzquierda.position.set(-120, 60, 0);
        estado.drawingScene.add(luzIzquierda);
        var luzDerecha = new THREE.DirectionalLight(0xffffff, 0.5);
        luzDerecha.position.set(120, 60, 0);
        estado.drawingScene.add(luzDerecha);
        var luzFrente = new THREE.DirectionalLight(0xffffff, 0.5);
        luzFrente.position.set(0, 60, 120);
        estado.drawingScene.add(luzFrente);
        var luzAtras = new THREE.DirectionalLight(0xffffff, 0.3);
        luzAtras.position.set(0, 30, -120);
        estado.drawingScene.add(luzAtras);
        var luzAbajo = new THREE.DirectionalLight(0xffffff, 0.2);
        luzAbajo.position.set(0, -100, 0);
        estado.drawingScene.add(luzAbajo);
        var luzHemispherica = new THREE.HemisphereLight(0xffffff, 0xeeeeee, 0.5);
        estado.drawingScene.add(luzHemispherica);

        var sueloGeometry = new THREE.PlaneGeometry(400, 400);
        var sueloMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            roughness: 0.8,
            metalness: 0.0,
            transparent: true,
            opacity: 0.3
        });
        var suelo = new THREE.Mesh(sueloGeometry, sueloMaterial);
        suelo.rotation.x = -Math.PI / 2;
        suelo.position.y = -60;
        estado.drawingScene.add(suelo);

        crearEjesConRango();

        estado.drawingRenderer.domElement.style.cursor = 'crosshair';
        estado.drawingRenderer.domElement.addEventListener('click', alHacerClicEnCanvas);
        estado.drawingRenderer.domElement.addEventListener('mousedown', function(event) {
            if (estado.modoManoActivo) { manejarMouseDownMano(event); }
            else if (estado.modoTallarActivo) { manejarMouseDownTallar(event); }
            else if (estado.modoMaterialActivo) { manejarMouseDownMaterial(event); }
        });
        estado.drawingRenderer.domElement.addEventListener('mousemove', function(event) {
            if (estado.modoManoActivo) { manejarMouseMoveMano(event); }
            else if (estado.modoTallarActivo) { manejarMouseMoveTallar(event); }
            else if (estado.modoMaterialActivo) { manejarMouseMoveMaterial(event); }
        });
        document.addEventListener('mouseup', function(event) {
            if (estado.modoManoActivo) { manejarMouseUpMano(event); }
            else if (estado.modoTallarActivo) { manejarMouseUpTallar(event); }
            else if (estado.modoMaterialActivo) { manejarMouseUpMaterial(event); }
        });

        estado.modoDibujoActivo = true;
        estado.modoConexionActivo = false;
        estado.modoManoActivo = false;
        estado.modoOrbitaActivo = false;
        estado.modoTallarActivo = false;
        estado.modoMaterialActivo = false;
        estado.modoPincelActivo = false;
        estado.modoCubetaActivo = false;
        
        setupRangesPanelEvents();
        
        if (dom.figuraSizeInput && dom.figuraSizeValue) {
            dom.figuraSizeInput.addEventListener('input', function() {
                estado.figuraSize = parseInt(this.value) || 30;
                dom.figuraSizeValue.textContent = estado.figuraSize;
            });
        }
        if (dom.tallarRadio && dom.tallarRadioValue) {
            dom.tallarRadio.addEventListener('input', function() {
                estado.radioTallar = parseInt(this.value) || 5;
                dom.tallarRadioValue.textContent = estado.radioTallar;
            });
            estado.radioTallar = parseInt(dom.tallarRadio.value) || 5;
            dom.tallarRadioValue.textContent = estado.radioTallar;
        }
        if (dom.tallarIntensidad && dom.tallarIntensidadValue) {
            dom.tallarIntensidad.addEventListener('input', function() {
                estado.intensidadTallar = parseFloat(this.value) || 0.5;
                dom.tallarIntensidadValue.textContent = estado.intensidadTallar.toFixed(1);
            });
            estado.intensidadTallar = parseFloat(dom.tallarIntensidad.value) || 0.5;
            dom.tallarIntensidadValue.textContent = estado.intensidadTallar.toFixed(1);
        }
        if (dom.viewSolidBtn) {
            dom.viewSolidBtn.addEventListener('click', function() { window.setViewSolid(); });
        }
        if (dom.viewWireframeBtn) {
            dom.viewWireframeBtn.addEventListener('click', function() { window.setViewWireframe(); });
        }
        if (dom.viewTransparentBtn) {
            dom.viewTransparentBtn.addEventListener('click', function() { window.setViewTransparent(); });
        }
        configurarSelectorColor();
        
        var btnTallar = document.getElementById('paletteTallar');
        if (btnTallar) {
            btnTallar.removeAttribute('onclick');
            var newBtn = btnTallar.cloneNode(true);
            btnTallar.parentNode.replaceChild(newBtn, btnTallar);
            btnTallar = newBtn;
            btnTallar.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🪚 Click en botón de tallar');
                window.activarModoTallar();
            });
            actualizarBotonTallar();
            console.log('🪚 Botón de tallar configurado correctamente');
        }
        
        var btnMaterial = document.getElementById('paletteMaterial');
        if (btnMaterial) {
            btnMaterial.removeAttribute('onclick');
            var newBtn = btnMaterial.cloneNode(true);
            btnMaterial.parentNode.replaceChild(newBtn, btnMaterial);
            btnMaterial = newBtn;
            btnMaterial.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🧱 Click en botón de material');
                window.activarModoMaterial();
            });
            actualizarBotonMaterial();
            console.log('🧱 Botón de material configurado correctamente');
        }
        
        estado.isSolidView = true;
        estado.isWireframeView = false;
        estado.isTransparentView = false;
        estado.fondoColor = '#0a0a1a';
        
        setTimeout(function() {
            aplicarModoSolid();
            aplicarFondoConfiguracion();
        }, 50);
        
        setTimeout(function() {
            var panel = document.getElementById('drawingRangesPanel');
            var btn = document.getElementById('paletteRangesToggle');
            if (panel) {
                panel.style.display = 'none';
                panel.classList.remove('visible');
                if (btn) btn.classList.remove('active');
            }
            setPointMode('create');
            actualizarRangosPanelUI();
            actualizarBotonesVisualizacion();
            actualizarBotonesPintura();
            actualizarEstadoTextura();
            setFondoModo('oscuro');
        }, 100);

        animarDibujo();
        setTimeout(actualizarTamanioCanvas, 200);
    }

    function animarDibujo() {
        requestAnimationFrame(animarDibujo);
        if (estado.drawingControls) estado.drawingControls.update();
        if (estado.drawingRenderer && estado.drawingScene && estado.drawingCamera) {
            estado.drawingRenderer.render(estado.drawingScene, estado.drawingCamera);
        }
    }

    // ========== CONFIGURAR EVENTOS ==========
    function configurarEventos() {
        window.addEventListener('resize', function() {
            try {
                var ancho = dom.container.clientWidth;
                var alto = dom.container.clientHeight;
                if (estado.camera && estado.renderer) {
                    estado.camera.aspect = ancho / alto;
                    estado.camera.updateProjectionMatrix();
                    estado.renderer.setSize(ancho, alto);
                }
                if (estado.modalAbierto) { actualizarTamanioCanvas(); }
                actualizarInfoCamara();
            } catch (error) {}
        });
        if (dom.terminalInput) {
            dom.terminalInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); window.ejecutarComandoTerminal(); }
            });
        }
        var connectInput = document.getElementById('connectInput');
        if (connectInput) {
            connectInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); window.conectarPuntos(); }
            });
        }
        var coordInput = document.getElementById('coordInput');
        if (coordInput) {
            coordInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); window.createPointByCoordinates(); }
            });
        }
        if (dom.editor) {
            dom.editor.addEventListener('input', function() {
                clearTimeout(estado.timeoutEditor);
                estado.timeoutEditor = setTimeout(function() { window.ejecutarEditor(); }, 600);
            });
            dom.editor.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    clearTimeout(estado.timeoutEditor);
                    window.ejecutarEditor();
                }
            });
        }
        if (dom.nombreInput) {
            dom.nombreInput.addEventListener('input', function() {
                estado.nombreObjeto = this.value || 'mi_objeto';
                actualizarEditor();
            });
        }
        var rangoXInput = document.getElementById('rangoXInput');
        var rangoYInput = document.getElementById('rangoYInput');
        var rangoZInput = document.getElementById('rangoZInput');
        if (rangoXInput) { rangoXInput.addEventListener('change', function() { window.actualizarRangoEje('x'); }); }
        if (rangoYInput) { rangoYInput.addEventListener('change', function() { window.actualizarRangoEje('y'); }); }
        if (rangoZInput) { rangoZInput.addEventListener('change', function() { window.actualizarRangoEje('z'); }); }
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && estado.modalAbierto) { window.cerrarModalObjeto(); }
        });
        var modal = document.getElementById('createObjectModal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) { window.cerrarModalObjeto(); }
            });
        }
        console.log('✅ Eventos configurados');
    }

    // ========== INICIALIZACIÓN ==========
    function iniciar() {
        console.log('🚀 Iniciando Constructor 3D/2D v5.3.34 - Modo oscuro consistente...');
        if (!dom.container || !dom.drawingContainer) {
            console.error('❌ Elementos DOM no encontrados');
            return;
        }
        try {
            crearEscenaPrincipal();
            crearEscenaDibujo();
            configurarEventos();
            configurarComandos();
            actualizarUI();
            actualizarEditor();
            mensajeTerminal('✅ Sistema inicializado correctamente v5.3.34', '#38ef7d');
            mensajeTerminal('🌙 Modo oscuro activado - Sin fondo blanco', '#667eea');
            mensajeTerminal('📐 Rango X: ±' + estado.rangoX + ', Y: ±' + estado.rangoY + ', Z: ±' + estado.rangoZ, '#667eea');
            mensajeTerminal('📝 Escribe "help" para ver comandos', 'rgba(255,255,255,0.3)');
            mensajeTerminal('🪚 Haz clic en "🪚" para activar el modo tallar (quitar material)', '#ff6b6b');
            mensajeTerminal('🧱 Haz clic en "🧱" para activar el modo añadir material', '#4facfe');
            mensajeTerminal('🖌️ Pincel - pinta área local, 🪣 Cubeta - pinta toda la figura', '#4facfe');
            estado.sistemaInicializado = true;
            console.log('✅ Sistema listo');
        } catch (error) {
            console.error('❌ Error:', error);
            mensajeTerminal('❌ Error: ' + error.message, '#f5576c');
        }
    }

    // Exponer funciones globales
    window.eliminarPunto = eliminarPunto;
    window.limpiarTodo = limpiarTodo;
    window.resetearFlags = resetearFlags;
    window.forceReset = resetearFlags;
    window.parseColor = parseColor;
    window.crearFiguraEnDibujo = crearFiguraEnDibujo;
    window.tallarFiguraDirecta = tallarFiguraDirecta;
    window.añadirMaterialDirecto = añadirMaterialDirecto;
    window.activarPincel = activarPincel;
    window.activarCubeta = activarCubeta;
    window.actualizarColorPintura = actualizarColorPintura;
    window.subirTextura = subirTextura;
    window.limpiarTextura = limpiarTextura;
    window.toggleModoPintura = toggleModoPintura;
    window.setFondoModo = setFondoModo;
    window.actualizarIntensidadFondo = actualizarIntensidadFondo;
    window.actualizarColorFondo = actualizarColorFondo;
    window.activarModoTallar = activarModoTallar;
    window.activarModoMaterial = activarModoMaterial;
    window.actualizarBotonTallar = actualizarBotonTallar;
    window.actualizarBotonMaterial = actualizarBotonMaterial;

    // ========== SINCRONIZACIÓN AUTOMÁTICA ==========
    (function configurarSincronizacionAutomatica() {
        function initAutoSync() {
            const editor = dom.editor;
            if (!editor) { setTimeout(initAutoSync, 500); return; }
            console.log('🔄 Configurando sincronización automática del editor...');
            let timeoutEditor = null;
            let ultimoContenido = editor.value;
            let sincronizando = false;
            function ejecutarEditorAuto() {
                if (sincronizando || estado.ejecutando || editor.value === ultimoContenido) return;
                sincronizando = true;
                ultimoContenido = editor.value;
                try {
                    if (typeof window.ejecutarEditor === 'function') { window.ejecutarEditor(); }
                } catch (error) { console.warn('Error en sincronización automática:', error); }
                finally { sincronizando = false; }
            }
            editor.addEventListener('input', function() {
                clearTimeout(timeoutEditor);
                timeoutEditor = setTimeout(function() { ejecutarEditorAuto(); }, 400);
            });
            editor.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    clearTimeout(timeoutEditor);
                    ultimoContenido = editor.value;
                    ejecutarEditorAuto();
                }
            });
            editor.addEventListener('blur', function() {
                clearTimeout(timeoutEditor);
                if (editor.value !== ultimoContenido) {
                    ultimoContenido = editor.value;
                    setTimeout(ejecutarEditorAuto, 200);
                }
            });
            const modal = document.getElementById('createObjectModal');
            if (modal) {
                const observer = new MutationObserver(function() {
                    if (modal.style.display === 'flex') {
                        setTimeout(function() {
                            if (editor.value !== ultimoContenido) {
                                ultimoContenido = editor.value;
                                ejecutarEditorAuto();
                            }
                        }, 300);
                    }
                });
                observer.observe(modal, { attributes: true, attributeFilter: ['style'] });
            }
            console.log('✅ Sincronización automática del editor configurada');
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() { setTimeout(initAutoSync, 300); });
        } else { setTimeout(initAutoSync, 300); }
        window.addEventListener('load', function() { setTimeout(initAutoSync, 500); });
    })();

    // ========== INICIO ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else { iniciar(); }

    console.log('🚀 Constructor 3D/2D v5.3.34 - MODO OSCURO CONSISTENTE - SIN FONDO BLANCO');
    console.log('🌙 Fondo oscuro por defecto, iluminación 360° blanca');
    console.log('🪚 Modo tallar para quitar material');
    console.log('🧱 Modo material para añadir material');
    console.log('🖌️ Pincel y 🪣 Cubeta con soporte para texturas');

})();