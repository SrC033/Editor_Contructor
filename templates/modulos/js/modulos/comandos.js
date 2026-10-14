// ============================================
// COMANDOS.JS - Módulo de comandos para la terminal
// VERSIÓN v4.0 - SOPORTE COMPLETO DE FIGURAS, TALLAR, MATERIAL Y VISUALIZACIÓN
// ============================================

(function() {
    'use strict';

    // ============================================
    // REFERENCIAS A FUNCIONES GLOBALES
    // ============================================
    let _drawingPoints = [];
    let _drawingLines = [];
    let _drawingScene = null;
    let _drawingLineObjects = [];
    let _drawingPointMeshes = [];
    let _drawingSolidMeshes = [];
    let _pointCounter = 0;
    let _terminalOutputCallback = null;
    let _updateUI = null;
    let _clearAllDrawingObjects = null;
    let _createPointWithColor = null;
    let _createConjunto = null;
    let _normalizePointLabel = null;
    let _COLOR_MAP = {};
    let _getEditor = null;
    let _clearTerminalEditor = null;
    let _restoreExistingPoints = null;
    let _updateDrawingCanvasSize = null;
    let _updatePointsList = null;
    let _updateLinesList = null;
    let _updateDrawingInfo = null;
    let _updateEditorFromCanvas = null;
    let _getEstado = null;
    let _getRangos = null;
    let _resetFlags = null;
    let _sincronizarEditor = null;
    let _actualizarEditor = null;
    let _createFigureInDrawing = null;
    let _figurasGuardadas = [];
    let _activarModoTallar = null;
    let _activarModoMaterial = null;
    let _setViewSolid = null;
    let _setViewWireframe = null;
    let _setViewTransparent = null;
    let _tallarFiguraDirecta = null;
    let _añadirMaterialDirecto = null;

    // ============================================
    // CONFIGURACIÓN DEL MÓDULO
    // ============================================
    function configure(config) {
        _drawingPoints = config.drawingPoints || [];
        _drawingLines = config.drawingLines || [];
        _drawingScene = config.drawingScene || null;
        _drawingLineObjects = config.drawingLineObjects || [];
        _drawingPointMeshes = config.drawingPointMeshes || [];
        _drawingSolidMeshes = config.drawingSolidMeshes || [];
        _pointCounter = config.pointCounter || 0;
        _terminalOutputCallback = config.terminalOutputCallback || null;
        _updateUI = config.updateUI || null;
        _clearAllDrawingObjects = config.clearAllDrawingObjects || null;
        _createPointWithColor = config.createPointWithColor || null;
        _createConjunto = config.createConjunto || null;
        _normalizePointLabel = config.normalizePointLabel || null;
        _COLOR_MAP = config.COLOR_MAP || {};
        _getEditor = config.getEditor || null;
        _clearTerminalEditor = config.clearTerminalEditor || null;
        _restoreExistingPoints = config.restoreExistingPoints || null;
        _updateDrawingCanvasSize = config.updateDrawingCanvasSize || null;
        _updatePointsList = config.updatePointsList || null;
        _updateLinesList = config.updateLinesList || null;
        _updateDrawingInfo = config.updateDrawingInfo || null;
        _updateEditorFromCanvas = config.updateEditorFromCanvas || null;
        _getEstado = config.getEstado || null;
        _getRangos = config.getRangos || null;
        _resetFlags = config.resetFlags || null;
        _sincronizarEditor = config.sincronizarEditor || null;
        _actualizarEditor = config.actualizarEditor || null;
        _createFigureInDrawing = config.createFigureInDrawing || null;
        _figurasGuardadas = config.figurasGuardadas || [];
        _activarModoTallar = config.activarModoTallar || null;
        _activarModoMaterial = config.activarModoMaterial || null;
        _setViewSolid = config.setViewSolid || null;
        _setViewWireframe = config.setViewWireframe || null;
        _setViewTransparent = config.setViewTransparent || null;
        _tallarFiguraDirecta = config.tallarFiguraDirecta || null;
        _añadirMaterialDirecto = config.añadirMaterialDirecto || null;

        console.log('✅ ComandosModule configurado correctamente v4.0');
        return true;
    }

    // ============================================
    // FUNCIONES DE UTILIDAD - COLORES (FLEXIBLE)
    // ============================================
    
    function parseColor(input) {
        if (!input) return 0x4facfe;
        
        const clean = input.trim().toLowerCase();
        
        const hexMatch = clean.match(/^#?([0-9a-f]{6})$/i);
        if (hexMatch) {
            return parseInt(hexMatch[1], 16);
        }
        
        const shortHexMatch = clean.match(/^#?([0-9a-f]{3})$/i);
        if (shortHexMatch) {
            const hex = shortHexMatch[1];
            return parseInt(hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2], 16);
        }
        
        for (const [name, value] of Object.entries(_COLOR_MAP)) {
            if (name === clean) {
                return value;
            }
        }
        
        for (const [name, value] of Object.entries(_COLOR_MAP)) {
            if (clean.includes(name) || name.includes(clean)) {
                return value;
            }
        }
        
        return 0x4facfe;
    }

    function getColorName(colorValue) {
        for (const [name, value] of Object.entries(_COLOR_MAP)) {
            if (value === colorValue) {
                return name;
            }
        }
        return 'azul';
    }

    function getColorHex(colorValue) {
        return '#' + colorValue.toString(16).padStart(6, '0');
    }

    function getColorValue(colorName) {
        return parseColor(colorName);
    }

    function outputMessage(message, color = 'rgba(255,255,255,0.5)') {
        if (_terminalOutputCallback) {
            _terminalOutputCallback(message, color);
        } else {
            console.log('📝 Terminal:', message);
        }
    }

    function updateAllUI() {
        if (_updatePointsList) _updatePointsList();
        if (_updateLinesList) _updateLinesList();
        if (_updateDrawingInfo) _updateDrawingInfo();
        if (_updateEditorFromCanvas) _updateEditorFromCanvas();
        if (_restoreExistingPoints) _restoreExistingPoints();
        if (_updateDrawingCanvasSize) _updateDrawingCanvasSize();
        if (_updateUI) _updateUI();
        if (_actualizarEditor) _actualizarEditor();
        if (_sincronizarEditor) _sincronizarEditor();
    }

    function limpiarComando(texto) {
        return texto.replace(/\s+/g, ' ').trim();
    }

    // ============================================
    // COMANDO: CREAR FIGURA GEOMÉTRICA (FLEXIBLE)
    // ============================================
    function commandCreateFigura(command) {
        const clean = limpiarComando(command);
        
        const figuraRegex = /^(esfera|cuadrado|cono|piramide|cilindro)\s*:\s*\{\s*([^}]+)\s*\}/i;
        const match = clean.match(figuraRegex);
        
        if (!match) {
            outputMessage(`❌ Formato inválido. Ejemplos:`, '#f5576c');
            outputMessage(`  esfera : {color_rojo, 20}`, 'rgba(255,255,255,0.3)');
            outputMessage(`  esfera : {rojo, 20}`, 'rgba(255,255,255,0.3)');
            outputMessage(`  esfera : {#FF0000, 20}`, 'rgba(255,255,255,0.3)');
            outputMessage(`  cuadrado : {color_azul, 30}`, 'rgba(255,255,255,0.3)');
            outputMessage(`  cono : {color_verde, 25, 40}`, 'rgba(255,255,255,0.3)');
            outputMessage(`  piramide : {color_amarillo, 30, 35}`, 'rgba(255,255,255,0.3)');
            outputMessage(`  cilindro : {color_morado, 20, 50}`, 'rgba(255,255,255,0.3)');
            return false;
        }

        const tipo = match[1].toLowerCase();
        const paramsStr = match[2].trim();
        
        let color = 0x4facfe;
        let size1 = 20;
        let size2 = 20;
        
        const elementos = paramsStr.split(',').map(s => s.trim());
        const valoresNumericos = [];
        const coloresTexto = [];
        
        elementos.forEach(el => {
            const num = parseFloat(el);
            if (!isNaN(num) && num > 0) {
                valoresNumericos.push(num);
                return;
            }
            const colorTest = parseColor(el);
            if (colorTest !== 0x4facfe || el === 'azul' || el === '#4facfe' || el === '4facfe') {
                coloresTexto.push(el);
                return;
            }
            const numFallback = parseFloat(el.replace(/[^0-9.]/g, ''));
            if (!isNaN(numFallback) && numFallback > 0) {
                valoresNumericos.push(numFallback);
            }
        });
        
        if (coloresTexto.length > 0) {
            color = parseColor(coloresTexto[0]);
        }
        
        if (tipo === 'esfera') {
            size1 = valoresNumericos[0] || 20;
            size2 = size1;
        } else if (tipo === 'cuadrado') {
            size1 = valoresNumericos[0] || 30;
            size2 = size1;
        } else if (tipo === 'cono') {
            size1 = valoresNumericos[0] || 25;
            size2 = valoresNumericos[1] || 40;
        } else if (tipo === 'piramide') {
            size1 = valoresNumericos[0] || 30;
            size2 = valoresNumericos[1] || 35;
        } else if (tipo === 'cilindro') {
            size1 = valoresNumericos[0] || 20;
            size2 = valoresNumericos[1] || 50;
        }
        
        const rangos = _getRangos ? _getRangos() : { x: 100, y: 100, z: 100 };
        const maxSize = Math.min(rangos.x, rangos.y, rangos.z) * 0.8;
        size1 = Math.min(size1, maxSize);
        size2 = Math.min(size2, maxSize);
        size1 = Math.max(5, size1);
        size2 = Math.max(5, size2);
        
        const colorName = getColorName(color);
        const colorHex = getColorHex(color);
        
        if (_createFigureInDrawing) {
            const result = _createFigureInDrawing(tipo, color, size1, size2);
            if (result) {
                outputMessage(`✅ ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} creada [${colorName} ${colorHex}] (${size1}${size2 !== size1 ? ', ' + size2 : ''})`, '#38ef7d');
                updateAllUI();
                return true;
            } else {
                outputMessage(`❌ Error al crear ${tipo}`, '#f5576c');
                return false;
            }
        }
        
        outputMessage('❌ Error: Función createFigureInDrawing no disponible', '#f5576c');
        return false;
    }

    // ============================================
    // COMANDO: CREAR PUNTO (FLEXIBLE)
    // ============================================
    function commandCreatePoint(command) {
        const clean = limpiarComando(command);
        const normalized = clean.replace(/\bP(\d+)\b/g, 'p_$1');
        
        const pointRegex = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\{\s*\(\s*([\d\-\.]+)\s*,\s*([\d\-\.]+)\s*,\s*([\d\-\.]+)\s*\)\s*(?:,\s*(?:color_)?([a-zA-Z0-9_#]+))?\s*\}/i;
        const match = normalized.match(pointRegex);

        if (!match) {
            return false;
        }

        const label = match[1].trim();
        const x = Math.round(parseFloat(match[2]));
        const y = Math.round(parseFloat(match[3]));
        const z = Math.round(parseFloat(match[4]));
        const colorInput = match[5] ? match[5].trim() : 'azul';

        const rangos = _getRangos ? _getRangos() : { x: 100, y: 100, z: 100 };
        if (Math.abs(x) > rangos.x || Math.abs(y) > rangos.y || Math.abs(z) > rangos.z) {
            outputMessage(`⚠️ ${label} fuera del rango (±${rangos.x}, ±${rangos.y}, ±${rangos.z})`, '#fda085');
            return false;
        }

        const color = parseColor(colorInput);
        const colorName = getColorName(color);
        const colorHex = getColorHex(color);
        
        if (color === 0x4facfe && colorInput !== 'azul' && colorInput !== '#4facfe' && colorInput !== '4facfe') {
            outputMessage(`⚠️ Color "${colorInput}" no reconocido. Usando azul (#4facfe)`, '#fda085');
        }

        let puntoExistente = null;
        for (let i = 0; i < _drawingPoints.length; i++) {
            const pLabel = _normalizePointLabel ? _normalizePointLabel(_drawingPoints[i].label) : _drawingPoints[i].label;
            const currentLabel = _normalizePointLabel ? _normalizePointLabel(label) : label;
            if (pLabel === currentLabel) {
                puntoExistente = _drawingPoints[i];
                break;
            }
        }

        if (puntoExistente) {
            puntoExistente.x = x;
            puntoExistente.y = y;
            puntoExistente.z = z;
            puntoExistente.color = color;
            
            for (let i = 0; i < _drawingPointMeshes.length; i++) {
                if (_drawingPointMeshes[i].userData && _drawingPointMeshes[i].userData.pointLabel === label) {
                    _drawingPointMeshes[i].position.set(x, y, z);
                    _drawingPointMeshes[i].material.color.setHex(color);
                    break;
                }
            }
            
            outputMessage(`🔄 Punto ${label} actualizado a (${x}, ${y}, ${z}) [${colorName} ${colorHex}]`, '#38ef7d');
            updateAllUI();
            return true;
        }

        if (_createPointWithColor) {
            _createPointWithColor(x, y, z, color, label);
            outputMessage(`✅ Punto ${label} creado en (${x}, ${y}, ${z}) [${colorName} ${colorHex}]`, '#38ef7d');
            updateAllUI();
            return true;
        }
        
        outputMessage('❌ Error: Función createPointWithColor no disponible', '#f5576c');
        return false;
    }

    // ============================================
    // COMANDO: CREAR CONJUNTO (FLEXIBLE)
    // ============================================
    function commandCreateConjunto(command) {
        const clean = limpiarComando(command);
        const normalized = clean.replace(/\bconjunto_(\d+)\b/g, 'C_$1');
        
        const solidRegex = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\{\s*\(\s*([p_\d\-]+)\s*\)\s*(?:,\s*(?:color_)?([a-zA-Z0-9_#]+))?\s*\}/i;
        const match = normalized.match(solidRegex);

        if (!match) {
            return false;
        }

        const label = match[1].trim();
        const pointsStr = match[2].trim();
        const colorInput = match[3] ? match[3].trim() : 'verde';

        const pointLabels = pointsStr.split('-').map(s => s.trim().toLowerCase());
        const validLabels = pointLabels.filter(l => l.startsWith('p_'));

        if (validLabels.length < 3) {
            outputMessage(`❌ Conjunto ${label}: se necesitan al menos 3 puntos (tiene ${validLabels.length})`, '#f5576c');
            return false;
        }

        const color = parseColor(colorInput);
        const colorName = getColorName(color);
        const colorHex = getColorHex(color);

        if (color === 0x4facfe && colorInput !== 'azul' && colorInput !== '#4facfe' && colorInput !== '4facfe') {
            outputMessage(`⚠️ Color "${colorInput}" no reconocido. Usando verde (#44ff44)`, '#fda085');
        }

        if (_createConjunto) {
            const result = _createConjunto(validLabels, color, label);
            if (result) {
                outputMessage(`✅ Conjunto ${label} creado con ${validLabels.length} puntos [${colorName} ${colorHex}]`, '#38ef7d');
                updateAllUI();
                return true;
            } else {
                outputMessage(`❌ Error al crear conjunto ${label}`, '#f5576c');
                return false;
            }
        }

        outputMessage('❌ Error: Función createConjunto no disponible', '#f5576c');
        return false;
    }

    // ============================================
    // COMANDO: CREAR LÍNEA (FLEXIBLE)
    // ============================================
    function commandCreateLine(command) {
        const clean = limpiarComando(command);
        
        const lineRegex = /^([p_\d]+)\s*-\s*([p_\d]+)\s*:\s*\{\s*(?:color_)?([a-zA-Z0-9_#]+)?\s*\}/i;
        const match = clean.match(lineRegex);
        
        if (!match) {
            return false;
        }

        const p1Label = match[1].trim();
        const p2Label = match[2].trim();
        const colorInput = match[3] ? match[3].trim() : 'azul';

        let p1 = null, p2 = null;
        for (let j = 0; j < _drawingPoints.length; j++) {
            if (_drawingPoints[j].label === p1Label) p1 = _drawingPoints[j];
            if (_drawingPoints[j].label === p2Label) p2 = _drawingPoints[j];
        }

        if (!p1 || !p2) {
            outputMessage(`⚠️ Puntos no encontrados: ${!p1 ? p1Label : ''} ${!p2 ? p2Label : ''}`, '#fda085');
            return false;
        }

        const color = parseColor(colorInput);
        const colorName = getColorName(color);
        const colorHex = getColorHex(color);
        
        const existe = _drawingLines.some(l => 
            (l.p1.label === p1Label && l.p2.label === p2Label) ||
            (l.p1.label === p2Label && l.p2.label === p1Label)
        );
        
        if (existe) {
            outputMessage(`⚠️ Línea ${p1Label}-${p2Label} ya existe`, '#fda085');
            return false;
        }

        _drawingLines.push({ p1: p1, p2: p2, label: `${p1Label}-${p2Label}` });
        
        if (_drawingScene) {
            const points3D = [
                new THREE.Vector3(p1.x, p1.y + 0.01, p1.z),
                new THREE.Vector3(p2.x, p2.y + 0.01, p2.z)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points3D);
            const material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
            const line = new THREE.Line(geometry, material);
            line.raycast = function() {};
            line.userData = { label: `${p1Label}-${p2Label}` };
            _drawingScene.add(line);
            _drawingLineObjects.push(line);
        }
        
        outputMessage(`📐 Línea ${p1Label}-${p2Label} creada [${colorName} ${colorHex}]`, '#fda085');
        updateAllUI();
        return true;
    }

    // ============================================
    // COMANDO: TALLAR FIGURA (QUITAR MATERIAL)
    // ============================================
    function commandTallar(command) {
        const clean = limpiarComando(command);
        
        const tallarRegex = /^tallar\s*(?::?\s*\{\s*([\d\.]+)?\s*(?:,\s*([\d\.]+))?\s*\})?/i;
        const match = clean.match(tallarRegex);
        
        if (!match) {
            outputMessage('❌ Formato inválido. Usa: tallar {radio, intensidad}', '#f5576c');
            outputMessage('  Ejemplo: tallar {10, 0.7}', 'rgba(255,255,255,0.3)');
            outputMessage('  Ejemplo: tallar {5}', 'rgba(255,255,255,0.3)');
            outputMessage('  Ejemplo: tallar', 'rgba(255,255,255,0.3)');
            return false;
        }
        
        const radio = match[1] ? parseFloat(match[1]) : 5;
        const intensidad = match[2] ? parseFloat(match[2]) : 0.5;
        
        const radioFinal = isNaN(radio) || radio < 0.5 ? 5 : Math.min(radio, 50);
        const intensidadFinal = isNaN(intensidad) || intensidad < 0.1 || intensidad > 1.0 ? 0.5 : Math.min(Math.max(intensidad, 0.1), 1.0);
        
        try {
            const radioInput = document.getElementById('tallarRadio');
            const radioValue = document.getElementById('tallarRadioValue');
            const intensidadInput = document.getElementById('tallarIntensidad');
            const intensidadValue = document.getElementById('tallarIntensidadValue');
            
            if (radioInput) {
                radioInput.value = radioFinal;
                if (radioValue) radioValue.textContent = radioFinal;
            }
            if (intensidadInput) {
                intensidadInput.value = intensidadFinal;
                if (intensidadValue) intensidadValue.textContent = intensidadFinal.toFixed(1);
            }
            
            if (typeof window !== 'undefined' && window.estado) {
                window.estado.radioTallar = radioFinal;
                window.estado.intensidadTallar = intensidadFinal;
            }
        } catch (e) {
            // Ignorar errores del DOM
        }
        
        if (_activarModoTallar) {
            let yaActivo = false;
            if (typeof window !== 'undefined' && window.estado) {
                yaActivo = window.estado.modoTallarActivo;
            }
            if (!yaActivo) {
                _activarModoTallar();
            }
            outputMessage(`🪚 Modo tallar configurado - Radio: ${radioFinal}, Intensidad: ${intensidadFinal.toFixed(1)}`, '#ff6b6b');
        } else {
            outputMessage(`🪚 Configuración de tallar - Radio: ${radioFinal}, Intensidad: ${intensidadFinal.toFixed(1)}`, '#ff6b6b');
            outputMessage('⚠️ Función activarModoTallar no disponible en el módulo', '#fda085');
        }
        
        updateAllUI();
        return true;
    }

    // ============================================
    // COMANDO: AÑADIR MATERIAL (NUEVO)
    // ============================================
    function commandMaterial(command) {
        const clean = limpiarComando(command);
        
        const materialRegex = /^material\s*(?::?\s*\{\s*([\d\.]+)?\s*(?:,\s*([\d\.]+))?\s*\})?/i;
        const match = clean.match(materialRegex);
        
        if (!match) {
            outputMessage('❌ Formato inválido. Usa: material {radio, intensidad}', '#f5576c');
            outputMessage('  Ejemplo: material {10, 0.7}', 'rgba(255,255,255,0.3)');
            outputMessage('  Ejemplo: material {5}', 'rgba(255,255,255,0.3)');
            outputMessage('  Ejemplo: material', 'rgba(255,255,255,0.3)');
            return false;
        }
        
        const radio = match[1] ? parseFloat(match[1]) : 5;
        const intensidad = match[2] ? parseFloat(match[2]) : 0.5;
        
        const radioFinal = isNaN(radio) || radio < 0.5 ? 5 : Math.min(radio, 50);
        const intensidadFinal = isNaN(intensidad) || intensidad < 0.1 || intensidad > 1.0 ? 0.5 : Math.min(Math.max(intensidad, 0.1), 1.0);
        
        try {
            const radioInput = document.getElementById('tallarRadio');
            const radioValue = document.getElementById('tallarRadioValue');
            const intensidadInput = document.getElementById('tallarIntensidad');
            const intensidadValue = document.getElementById('tallarIntensidadValue');
            
            if (radioInput) {
                radioInput.value = radioFinal;
                if (radioValue) radioValue.textContent = radioFinal;
            }
            if (intensidadInput) {
                intensidadInput.value = intensidadFinal;
                if (intensidadValue) intensidadValue.textContent = intensidadFinal.toFixed(1);
            }
            
            if (typeof window !== 'undefined' && window.estado) {
                window.estado.radioTallar = radioFinal;
                window.estado.intensidadTallar = intensidadFinal;
            }
        } catch (e) {
            // Ignorar errores del DOM
        }
        
        if (_activarModoMaterial) {
            let yaActivo = false;
            if (typeof window !== 'undefined' && window.estado) {
                yaActivo = window.estado.modoMaterialActivo;
            }
            if (!yaActivo) {
                _activarModoMaterial();
            }
            outputMessage(`🧱 Modo añadir material configurado - Radio: ${radioFinal}, Intensidad: ${intensidadFinal.toFixed(1)}`, '#4facfe');
        } else {
            outputMessage(`🧱 Configuración de material - Radio: ${radioFinal}, Intensidad: ${intensidadFinal.toFixed(1)}`, '#4facfe');
            outputMessage('⚠️ Función activarModoMaterial no disponible', '#fda085');
        }
        
        updateAllUI();
        return true;
    }

    // ============================================
    // COMANDO: TALLAR FIGURA DIRECTAMENTE POR TIPO (QUITAR)
    // ============================================
    function commandTallarFigura(command) {
        const clean = limpiarComando(command);
        
        const regex = /^tallarf\s+(esfera|cuadrado|cono|piramide|cilindro)\s*(?::?\s*\{\s*([\d\.]+)?\s*(?:,\s*([\d\.]+))?\s*\})?/i;
        const match = clean.match(regex);
        
        if (!match) {
            outputMessage('❌ Formato inválido. Usa: tallarf [tipo] {radio, intensidad}', '#f5576c');
            outputMessage('  Ejemplo: tallarf esfera {10, 0.7}', 'rgba(255,255,255,0.3)');
            outputMessage('  Ejemplo: tallarf cuadrado {5}', 'rgba(255,255,255,0.3)');
            outputMessage('  Ejemplo: tallarf cono', 'rgba(255,255,255,0.3)');
            return false;
        }
        
        const tipo = match[1].toLowerCase();
        const radio = match[2] ? parseFloat(match[2]) : 5;
        const intensidad = match[3] ? parseFloat(match[3]) : 0.5;
        
        const radioFinal = isNaN(radio) || radio < 0.5 ? 5 : Math.min(radio, 50);
        const intensidadFinal = isNaN(intensidad) || intensidad < 0.1 || intensidad > 1.0 ? 0.5 : Math.min(Math.max(intensidad, 0.1), 1.0);
        
        let figurasEncontradas = _figurasGuardadas.filter(f => f.tipo === tipo);
        
        if (figurasEncontradas.length === 0) {
            outputMessage(`⚠️ No se encontraron figuras de tipo: ${tipo}`, '#fda085');
            return false;
        }
        
        const fig = figurasEncontradas[0];
        const mesh = fig.mesh;
        
        if (!mesh || !mesh.geometry) {
            outputMessage(`⚠️ La figura ${tipo} no tiene geometría válida`, '#fda085');
            return false;
        }
        
        if (_tallarFiguraDirecta) {
            const result = _tallarFiguraDirecta(mesh, fig, radioFinal, intensidadFinal);
            if (result) {
                outputMessage(`🪚 Figura ${tipo} tallada (quitando material) con radio ${radioFinal} e intensidad ${intensidadFinal.toFixed(1)}`, '#ff6b6b');
                updateAllUI();
                return true;
            } else {
                outputMessage(`❌ Error al tallar la figura ${tipo}`, '#f5576c');
                return false;
            }
        }
        
        outputMessage('❌ Función tallarFiguraDirecta no disponible', '#f5576c');
        return false;
    }

    // ============================================
    // COMANDO: AÑADIR MATERIAL DIRECTAMENTE POR TIPO (NUEVO)
    // ============================================
    function commandMaterialFigura(command) {
        const clean = limpiarComando(command);
        
        const regex = /^materialf\s+(esfera|cuadrado|cono|piramide|cilindro)\s*(?::?\s*\{\s*([\d\.]+)?\s*(?:,\s*([\d\.]+))?\s*\})?/i;
        const match = clean.match(regex);
        
        if (!match) {
            outputMessage('❌ Formato inválido. Usa: materialf [tipo] {radio, intensidad}', '#f5576c');
            outputMessage('  Ejemplo: materialf esfera {10, 0.7}', 'rgba(255,255,255,0.3)');
            outputMessage('  Ejemplo: materialf cuadrado {5}', 'rgba(255,255,255,0.3)');
            outputMessage('  Ejemplo: materialf cono', 'rgba(255,255,255,0.3)');
            return false;
        }
        
        const tipo = match[1].toLowerCase();
        const radio = match[2] ? parseFloat(match[2]) : 5;
        const intensidad = match[3] ? parseFloat(match[3]) : 0.5;
        
        const radioFinal = isNaN(radio) || radio < 0.5 ? 5 : Math.min(radio, 50);
        const intensidadFinal = isNaN(intensidad) || intensidad < 0.1 || intensidad > 1.0 ? 0.5 : Math.min(Math.max(intensidad, 0.1), 1.0);
        
        let figurasEncontradas = _figurasGuardadas.filter(f => f.tipo === tipo);
        
        if (figurasEncontradas.length === 0) {
            outputMessage(`⚠️ No se encontraron figuras de tipo: ${tipo}`, '#fda085');
            return false;
        }
        
        const fig = figurasEncontradas[0];
        const mesh = fig.mesh;
        
        if (!mesh || !mesh.geometry) {
            outputMessage(`⚠️ La figura ${tipo} no tiene geometría válida`, '#fda085');
            return false;
        }
        
        if (_añadirMaterialDirecto) {
            const result = _añadirMaterialDirecto(mesh, fig, radioFinal, intensidadFinal);
            if (result) {
                outputMessage(`🧱 Figura ${tipo} con material añadido (radio ${radioFinal}, intensidad ${intensidadFinal.toFixed(1)})`, '#4facfe');
                updateAllUI();
                return true;
            } else {
                outputMessage(`❌ Error al añadir material a la figura ${tipo}`, '#f5576c');
                return false;
            }
        }
        
        outputMessage('❌ Función añadirMaterialDirecto no disponible', '#f5576c');
        return false;
    }

    // ============================================
    // COMANDO: CAMBIAR MODO DE VISUALIZACIÓN
    // ============================================
    function commandView(command) {
        const clean = limpiarComando(command);
        const lower = clean.toLowerCase();
        
        if (lower === 'view solid' || lower === 'view sólido') {
            if (_setViewSolid) {
                _setViewSolid();
                outputMessage('🧊 Modo Sólido activado', '#38ef7d');
                updateAllUI();
                return true;
            }
            outputMessage('⚠️ Función setViewSolid no disponible en el módulo', '#fda085');
            return false;
        } else if (lower === 'view wireframe' || lower === 'view malla') {
            if (_setViewWireframe) {
                _setViewWireframe();
                outputMessage('🔲 Modo Malla (Wireframe) activado', '#667eea');
                updateAllUI();
                return true;
            }
            outputMessage('⚠️ Función setViewWireframe no disponible en el módulo', '#fda085');
            return false;
        } else if (lower === 'view transparent' || lower === 'view transparente') {
            if (_setViewTransparent) {
                _setViewTransparent();
                outputMessage('👻 Modo Transparente activado', '#4facfe');
                updateAllUI();
                return true;
            }
            outputMessage('⚠️ Función setViewTransparent no disponible en el módulo', '#fda085');
            return false;
        } else {
            outputMessage('❌ Modo no reconocido. Opciones: solid, wireframe, transparent', '#f5576c');
            outputMessage('  Ejemplos:', 'rgba(255,255,255,0.3)');
            outputMessage('    view solid', 'rgba(255,255,255,0.3)');
            outputMessage('    view wireframe', 'rgba(255,255,255,0.3)');
            outputMessage('    view transparent', 'rgba(255,255,255,0.3)');
            return false;
        }
    }

    // ============================================
    // COMANDO: LISTAR FIGURAS
    // ============================================
    function commandListFiguras() {
        if (_figurasGuardadas.length === 0) {
            outputMessage('📐 No hay figuras geométricas', 'rgba(255,255,255,0.3)');
            return true;
        }
        
        let mensaje = `📐 Figuras (${_figurasGuardadas.length}):\n`;
        _figurasGuardadas.forEach((fig, index) => {
            const colorName = getColorName(fig.color);
            const colorHex = getColorHex(fig.color);
            const modificada = fig.modificada ? ' ✨(modificada)' : '';
            mensaje += `  ${index + 1}. ${fig.tipo} [${colorName} ${colorHex}] tamaño: ${fig.size1}${fig.size2 !== fig.size1 ? ' x ' + fig.size2 : ''}${modificada}\n`;
        });
        
        outputMessage(mensaje, '#667eea');
        return true;
    }

    // ============================================
    // COMANDO: ELIMINAR FIGURA
    // ============================================
    function commandDeleteFigura(command) {
        const clean = limpiarComando(command);
        const deleteRegex = /^deletefigura\s+(esfera|cuadrado|cono|piramide|cilindro|\d+)/i;
        const match = clean.match(deleteRegex);
        
        if (!match) {
            outputMessage('❌ Formato inválido. Usa: deletefigura [tipo|número]', '#f5576c');
            outputMessage('  Ejemplos:', 'rgba(255,255,255,0.3)');
            outputMessage('    deletefigura esfera', 'rgba(255,255,255,0.3)');
            outputMessage('    deletefigura 1', 'rgba(255,255,255,0.3)');
            return false;
        }
        
        const target = match[1].toLowerCase();
        let figurasAEliminar = [];
        
        const index = parseInt(target);
        if (!isNaN(index) && index > 0 && index <= _figurasGuardadas.length) {
            figurasAEliminar.push(_figurasGuardadas[index - 1]);
        } else {
            figurasAEliminar = _figurasGuardadas.filter(f => f.tipo === target);
        }
        
        if (figurasAEliminar.length === 0) {
            outputMessage(`⚠️ No se encontraron figuras para eliminar: ${target}`, '#fda085');
            return false;
        }
        
        figurasAEliminar.forEach(fig => {
            if (fig.group && _drawingScene) {
                _drawingScene.remove(fig.group);
            }
            const idx = _figurasGuardadas.indexOf(fig);
            if (idx !== -1) {
                _figurasGuardadas.splice(idx, 1);
            }
            outputMessage(`🗑️ Figura ${fig.tipo} eliminada`, '#fda085');
        });
        
        updateAllUI();
        return true;
    }

    // ============================================
    // COMANDO: AYUDA DE TALLAR
    // ============================================
    function commandHelpTallar() {
        outputMessage('🪚 GUÍA DEL MODO TALLAR / MATERIAL:', '#ff6b6b');
        outputMessage('  📌 Para usar el modo tallar (quitar material):', '#ff6b6b');
        outputMessage('    1. Crea una figura geométrica', 'rgba(255,255,255,0.3)');
        outputMessage('    2. Activa el modo tallar con el botón 🪚 en la paleta', 'rgba(255,255,255,0.3)');
        outputMessage('    3. Haz clic en la figura para seleccionarla', 'rgba(255,255,255,0.3)');
        outputMessage('    4. Arrastra el mouse sobre la figura para quitar material', 'rgba(255,255,255,0.3)');
        outputMessage('  📌 Para usar el modo añadir material (🧱):', '#4facfe');
        outputMessage('    1. Activa el modo material con el botón 🧱 en la paleta', 'rgba(255,255,255,0.3)');
        outputMessage('    2. Haz clic en la figura para seleccionarla', 'rgba(255,255,255,0.3)');
        outputMessage('    3. Arrastra el mouse sobre la figura para añadir volumen', 'rgba(255,255,255,0.3)');
        outputMessage('  📌 Comandos de terminal:', '#667eea');
        outputMessage('    tallar {radio, intensidad}   → Configura el tallado', 'rgba(255,255,255,0.3)');
        outputMessage('    material {radio, intensidad} → Configura el añadido de material', 'rgba(255,255,255,0.3)');
        outputMessage('    tallarf esfera {10, 0.7}    → Tallar esfera directamente', 'rgba(255,255,255,0.3)');
        outputMessage('    materialf esfera {10, 0.7}  → Añadir material a esfera', 'rgba(255,255,255,0.3)');
        outputMessage('  📌 Comandos de visualización:', '#667eea');
        outputMessage('    view solid      → Modo Sólido', 'rgba(255,255,255,0.3)');
        outputMessage('    view wireframe  → Modo Malla', 'rgba(255,255,255,0.3)');
        outputMessage('    view transparent → Modo Transparente', 'rgba(255,255,255,0.3)');
        outputMessage('  📌 Comandos de figuras:', '#38ef7d');
        outputMessage('    listfiguras     → Lista todas las figuras', 'rgba(255,255,255,0.3)');
        outputMessage('    deletefigura esfera → Elimina todas las esferas', 'rgba(255,255,255,0.3)');
        outputMessage('    deletefigura 1  → Elimina la primera figura', 'rgba(255,255,255,0.3)');
        return true;
    }

    // ============================================
    // COMANDOS EXISTENTES
    // ============================================
    function commandList() {
        if (_drawingPoints.length === 0 && _figurasGuardadas.length === 0 && _drawingLines.length === 0) {
            outputMessage('📋 No hay elementos dibujados', 'rgba(255,255,255,0.3)');
            return true;
        }
        
        let mensaje = '';
        if (_drawingPoints.length > 0) {
            const pointList = _drawingPoints.map(p => {
                const colorName = getColorName(p.color);
                const colorHex = getColorHex(p.color);
                return `${p.label}(${p.x},${p.y},${p.z}) [${colorName} ${colorHex}]`;
            }).join(', ');
            mensaje += `📋 Puntos (${_drawingPoints.length}): ${pointList}`;
        }
        
        if (_figurasGuardadas.length > 0) {
            if (mensaje) mensaje += ' | ';
            const figList = _figurasGuardadas.map(f => {
                const colorName = getColorName(f.color);
                const modificada = f.modificada ? '✨' : '';
                return `${f.tipo}${modificada} [${colorName}]`;
            }).join(', ');
            mensaje += `📐 Figuras (${_figurasGuardadas.length}): ${figList}`;
        }
        
        if (_drawingLines.length > 0) {
            if (mensaje) mensaje += ' | ';
            const lineList = _drawingLines.map(l => `${l.p1.label}-${l.p2.label}`).join(', ');
            mensaje += `📏 Líneas (${_drawingLines.length}): ${lineList}`;
        }
        
        outputMessage(mensaje, '#4facfe');
        return true;
    }

    function commandClear() {
        if (_clearAllDrawingObjects) {
            _clearAllDrawingObjects();
            _figurasGuardadas = [];
            outputMessage('🧹 Todo limpiado', '#fda085');
            if (_clearTerminalEditor) _clearTerminalEditor();
            updateAllUI();
            return true;
        }
        outputMessage('❌ Error: Función clearAllDrawingObjects no disponible', '#f5576c');
        return false;
    }

    function commandHelp() {
        outputMessage('📖 COMANDOS DISPONIBLES:', '#667eea');
        outputMessage('  🔹 PUNTOS (formatos flexibles):', '#4facfe');
        outputMessage('    p_1 : {(10,20,30), color_rojo}', 'rgba(255,255,255,0.3)');
        outputMessage('    p_1 : {(10,20,30), rojo}', 'rgba(255,255,255,0.3)');
        outputMessage('    p_1 : {(10,20,30), #FF0000}', 'rgba(255,255,255,0.3)');
        outputMessage('    P1 : {(10,20,30), color_azul}', 'rgba(255,255,255,0.3)');
        outputMessage('  🔹 FIGURAS GEOMÉTRICAS:', '#667eea');
        outputMessage('    esfera : {color_rojo, 20}', 'rgba(255,255,255,0.3)');
        outputMessage('    esfera : {rojo, 20}', 'rgba(255,255,255,0.3)');
        outputMessage('    esfera : {#FF0000, 20}', 'rgba(255,255,255,0.3)');
        outputMessage('    esfera : {20, color_rojo}', 'rgba(255,255,255,0.3)');
        outputMessage('    esfera : {20}', 'rgba(255,255,255,0.3)');
        outputMessage('    cuadrado : {color_azul, 30}', 'rgba(255,255,255,0.3)');
        outputMessage('    cono : {color_verde, 25, 40}', 'rgba(255,255,255,0.3)');
        outputMessage('    piramide : {color_amarillo, 30, 35}', 'rgba(255,255,255,0.3)');
        outputMessage('    cilindro : {color_morado, 20, 50}', 'rgba(255,255,255,0.3)');
        outputMessage('  🔹 CONJUNTOS:', '#38ef7d');
        outputMessage('    C_1 : {(p_1-p_2-p_3), color_verde}', 'rgba(255,255,255,0.3)');
        outputMessage('    conjunto_1 : {(p_1-p_2-p_3), #00FF00}', 'rgba(255,255,255,0.3)');
        outputMessage('  🔹 LÍNEAS:', '#fda085');
        outputMessage('    p_1-p_2 : {color_rojo}', 'rgba(255,255,255,0.3)');
        outputMessage('    p_1-p_2 : {#FF0000}', 'rgba(255,255,255,0.3)');
        outputMessage('  🔹 MODO TALLAR (QUITAR MATERIAL):', '#ff6b6b');
        outputMessage('    tallar {radio, intensidad}', 'rgba(255,255,255,0.3)');
        outputMessage('    tallar {10, 0.7}', 'rgba(255,255,255,0.3)');
        outputMessage('    tallar', 'rgba(255,255,255,0.3)');
        outputMessage('    tallarf esfera {10, 0.7}  → Tallar directamente', 'rgba(255,255,255,0.3)');
        outputMessage('  🔹 MODO AÑADIR MATERIAL (NUEVO):', '#4facfe');
        outputMessage('    material {radio, intensidad}', 'rgba(255,255,255,0.3)');
        outputMessage('    material {10, 0.7}', 'rgba(255,255,255,0.3)');
        outputMessage('    material', 'rgba(255,255,255,0.3)');
        outputMessage('    materialf esfera {10, 0.7}  → Añadir material directamente', 'rgba(255,255,255,0.3)');
        outputMessage('  🔹 VISUALIZACIÓN:', '#667eea');
        outputMessage('    view solid      → Modo Sólido', 'rgba(255,255,255,0.3)');
        outputMessage('    view wireframe  → Modo Malla', 'rgba(255,255,255,0.3)');
        outputMessage('    view transparent → Modo Transparente', 'rgba(255,255,255,0.3)');
        outputMessage('  🔹 FIGURAS:', '#38ef7d');
        outputMessage('    listfiguras → Lista todas las figuras', 'rgba(255,255,255,0.3)');
        outputMessage('    deletefigura esfera → Elimina figuras por tipo', 'rgba(255,255,255,0.3)');
        outputMessage('    deletefigura 1 → Elimina por índice', 'rgba(255,255,255,0.3)');
        outputMessage('  🔹 COLORES SOPORTADOS:', 'rgba(255,255,255,0.4)');
        const colorList = Object.keys(_COLOR_MAP).join(', ');
        outputMessage(`    ${colorList}`, 'rgba(255,255,255,0.3)');
        outputMessage('    También códigos hexadecimales: #FF0000, #00FF00, #0000FF, etc.', 'rgba(255,255,255,0.3)');
        outputMessage('  🔹 COMANDOS GENERALES:', 'rgba(255,255,255,0.4)');
        outputMessage('    list / ls  → Lista todos los elementos', 'rgba(255,255,255,0.4)');
        outputMessage('    clear / cls  → Limpia el dibujo', 'rgba(255,255,255,0.4)');
        outputMessage('    delete P1  → Elimina un punto', 'rgba(255,255,255,0.4)');
        outputMessage('    move P1 10,20,30  → Mueve un punto', 'rgba(255,255,255,0.4)');
        outputMessage('    help / ?  → Muestra esta ayuda', 'rgba(255,255,255,0.4)');
        outputMessage('    helptallar  → Ayuda específica de tallar/material', 'rgba(255,255,255,0.4)');
        outputMessage('    diagnostico  → Diagnóstico del sistema', 'rgba(255,255,255,0.4)');
        outputMessage('    estado  → Estado del sistema', 'rgba(255,255,255,0.4)');
        outputMessage('    resetflags  → Resetea flags bloqueadas', 'rgba(255,255,255,0.4)');
        outputMessage('    redraw  → Redibuja el canvas', 'rgba(255,255,255,0.4)');
        outputMessage('    sync  → Sincroniza editor con canvas', 'rgba(255,255,255,0.4)');
        outputMessage('    sync2  → Ejecuta el editor', 'rgba(255,255,255,0.4)');
        return true;
    }

    function commandDelete(command) {
        const deleteRegex = /^delete\s+(p?[_\s]*(\d+))/i;
        const match = command.match(deleteRegex);
        
        if (!match) {
            outputMessage('❌ Formato inválido. Usa: delete P1', '#f5576c');
            return false;
        }
        
        const label = match[1];
        const normalizedLabel = _normalizePointLabel ? _normalizePointLabel(label) : label;
        
        const pointToDelete = _drawingPoints.find(p => {
            const pLabel = _normalizePointLabel ? _normalizePointLabel(p.label) : p.label;
            return pLabel === normalizedLabel;
        });
        
        if (!pointToDelete) {
            outputMessage(`⚠️ Punto ${label} no encontrado`, '#fda085');
            return false;
        }
        
        const idx = _drawingPoints.indexOf(pointToDelete);
        if (idx !== -1) {
            _drawingPoints.splice(idx, 1);
        }
        
        const linesToRemove = _drawingLines.filter(l => 
            (_normalizePointLabel ? _normalizePointLabel(l.p1.label) : l.p1.label) === normalizedLabel || 
            (_normalizePointLabel ? _normalizePointLabel(l.p2.label) : l.p2.label) === normalizedLabel
        );
        linesToRemove.forEach(line => {
            const lineIdx = _drawingLines.indexOf(line);
            if (lineIdx !== -1) {
                _drawingLines.splice(lineIdx, 1);
                const lineObj = _drawingLineObjects.find(obj => 
                    obj.userData && obj.userData.label === line.label
                );
                if (lineObj && _drawingScene) _drawingScene.remove(lineObj);
            }
        });
        
        const meshToRemove = _drawingPointMeshes.find(m => 
            m.userData && m.userData.pointLabel === pointToDelete.label
        );
        if (meshToRemove && _drawingScene) _drawingScene.remove(meshToRemove);
        
        updateAllUI();
        outputMessage(`🗑️ Punto ${pointToDelete.label} eliminado`, '#fda085');
        return true;
    }

    function commandMove(command) {
        const moveRegex = /^move\s+(p?[_\s]*(\d+))\s+([\d\-\.]+)\s*,\s*([\d\-\.]+)\s*,\s*([\d\-\.]+)/i;
        const match = command.match(moveRegex);
        
        if (!match) {
            outputMessage('❌ Formato inválido. Usa: move P1 10,20,30', '#f5576c');
            return false;
        }
        
        const label = match[1];
        const x = parseFloat(match[3]);
        const y = parseFloat(match[4]);
        const z = parseFloat(match[5]);
        
        if (isNaN(x) || isNaN(y) || isNaN(z)) {
            outputMessage('❌ Coordenadas inválidas', '#f5576c');
            return false;
        }
        
        const normalizedLabel = _normalizePointLabel ? _normalizePointLabel(label) : label;
        const point = _drawingPoints.find(p => {
            const pLabel = _normalizePointLabel ? _normalizePointLabel(p.label) : p.label;
            return pLabel === normalizedLabel;
        });
        
        if (!point) {
            outputMessage(`⚠️ Punto ${label} no encontrado`, '#fda085');
            return false;
        }
        
        const rangos = _getRangos ? _getRangos() : { x: 100, y: 100, z: 100 };
        const newX = Math.max(-rangos.x, Math.min(rangos.x, Math.round(x)));
        const newY = Math.max(-rangos.y, Math.min(rangos.y, Math.round(y)));
        const newZ = Math.max(-rangos.z, Math.min(rangos.z, Math.round(z)));
        
        point.x = newX;
        point.y = newY;
        point.z = newZ;
        
        const mesh = _drawingPointMeshes.find(m => 
            m.userData && m.userData.pointLabel === point.label
        );
        if (mesh) {
            mesh.position.set(newX, newY, newZ);
        }
        
        outputMessage(`📍 Punto ${point.label} movido a (${newX}, ${newY}, ${newZ})`, '#4facfe');
        updateAllUI();
        return true;
    }

    function commandDiagnostico() {
        const info = {
            'Puntos': _drawingPoints.length,
            'Líneas': _drawingLines.length,
            'Sólidos': _drawingSolidMeshes.length,
            'Figuras': _figurasGuardadas.length,
            'COLOR_MAP': Object.keys(_COLOR_MAP).length + ' colores',
            'Contador puntos': _pointCounter,
            'Figuras modificadas': _figurasGuardadas.filter(f => f.modificada).length
        };
        
        outputMessage('🔍 DIAGNÓSTICO DEL SISTEMA:', '#667eea');
        Object.entries(info).forEach(([key, value]) => {
            outputMessage(`  ${key}: ${value}`, 'rgba(255,255,255,0.3)');
        });
        return true;
    }

    function commandEstado() {
        if (_getEstado) {
            const estado = _getEstado();
            outputMessage('📊 ESTADO DEL SISTEMA:', '#667eea');
            Object.entries(estado).forEach(([key, value]) => {
                outputMessage(`  ${key}: ${value}`, 'rgba(255,255,255,0.3)');
            });
            return true;
        }
        
        const estado = {
            'Puntos': _drawingPoints.length,
            'Líneas': _drawingLines.length,
            'Sólidos': _drawingSolidMeshes.length,
            'Figuras': _figurasGuardadas.length,
            'Figuras modificadas': _figurasGuardadas.filter(f => f.modificada).length
        };
        outputMessage('📊 ESTADO:', '#667eea');
        Object.entries(estado).forEach(([key, value]) => {
            outputMessage(`  ${key}: ${value}`, 'rgba(255,255,255,0.3)');
        });
        return true;
    }

    function commandRedraw() {
        if (_updateDrawingCanvasSize) {
            _updateDrawingCanvasSize();
            outputMessage('🔄 Canvas redibujado correctamente', '#38ef7d');
            return true;
        }
        outputMessage('⚠️ Función updateDrawingCanvasSize no disponible', '#fda085');
        return false;
    }

    function commandResetFlags() {
        if (_resetFlags) {
            _resetFlags();
            outputMessage('🔄 Flags reseteados correctamente', '#38ef7d');
            return true;
        }
        outputMessage('⚠️ Función resetFlags no disponible', '#fda085');
        return false;
    }

    function commandSync() {
        if (_sincronizarEditor) {
            _sincronizarEditor();
            outputMessage('🔄 Editor sincronizado con el canvas', '#38ef7d');
            return true;
        }
        outputMessage('⚠️ Función sincronizarEditor no disponible', '#fda085');
        return false;
    }

    function commandSync2() {
        outputMessage('🔄 Ejecutando editor...', '#667eea');
        if (typeof window.ejecutarEditor === 'function') {
            window.ejecutarEditor();
            return true;
        }
        outputMessage('⚠️ Función ejecutarEditor no disponible', '#fda085');
        return false;
    }

    // ============================================
    // EJECUTOR DE COMANDOS PRINCIPAL
    // ============================================
    function executeCommand(command) {
        if (!command || command.trim() === '') {
            return false;
        }

        const trimmed = command.trim();
        const lower = trimmed.toLowerCase();

        // Comandos especiales
        if (lower === 'help' || lower === '?') return commandHelp();
        if (lower === 'helptallar' || lower === 'help tallar') return commandHelpTallar();
        if (lower === 'clear' || lower === 'cls') return commandClear();
        if (lower === 'list' || lower === 'ls') return commandList();
        if (lower === 'listfiguras' || lower === 'listfig') return commandListFiguras();
        if (lower === 'diagnostico') return commandDiagnostico();
        if (lower === 'estado') return commandEstado();
        if (lower === 'redraw') return commandRedraw();
        if (lower === 'resetflags') return commandResetFlags();
        if (lower === 'sync') return commandSync();
        if (lower === 'sync2') return commandSync2();

        // Comando de visualización
        if (lower.startsWith('view ')) return commandView(trimmed);

        // Comando de tallar
        if (lower.startsWith('tallar ')) return commandTallar(trimmed);
        if (lower === 'tallar') return commandTallar(trimmed);
        
        // Comando de material (NUEVO)
        if (lower.startsWith('material ')) return commandMaterial(trimmed);
        if (lower === 'material') return commandMaterial(trimmed);

        // Comando tallar figura directamente
        if (lower.startsWith('tallarf ')) return commandTallarFigura(trimmed);
        
        // Comando añadir material directamente (NUEVO)
        if (lower.startsWith('materialf ')) return commandMaterialFigura(trimmed);

        // Comando eliminar figura
        if (lower.startsWith('deletefigura ')) return commandDeleteFigura(trimmed);

        // Comandos existentes
        if (lower.startsWith('delete ')) return commandDelete(trimmed);
        if (lower.startsWith('move ')) return commandMove(trimmed);

        // Detectar figuras geométricas (con espacios flexibles)
        if (/^(esfera|cuadrado|cono|piramide|cilindro)\s*:/i.test(trimmed)) {
            return commandCreateFigura(trimmed);
        }

        // Detectar líneas
        if (/^[p_\d]+\s*-\s*[p_\d]+\s*:/i.test(trimmed)) {
            return commandCreateLine(trimmed);
        }

        // Detectar conjuntos
        if (/^[cC]_\d+\s*:/i.test(trimmed) || /^conjunto_\d+\s*:/i.test(trimmed)) {
            return commandCreateConjunto(trimmed);
        }

        // Detectar puntos
        if (/^[pP]?[_\s]*\d+\s*:/i.test(trimmed)) {
            return commandCreatePoint(trimmed);
        }

        outputMessage(`❌ Comando no reconocido: "${command}"`, '#f5576c');
        outputMessage('  Escribe "help" para ver los comandos disponibles', 'rgba(255,255,255,0.2)');
        return false;
    }

    function executeCommands(commands) {
        if (!commands || commands.length === 0) {
            return { executed: 0, errors: 0 };
        }

        let executed = 0;
        let errors = 0;

        commands.forEach(command => {
            try {
                const cleanCommand = command.split('//')[0].trim();
                if (!cleanCommand) return;
                
                const result = executeCommand(cleanCommand);
                if (result === true) {
                    executed++;
                } else {
                    errors++;
                }
            } catch (error) {
                errors++;
                outputMessage(`❌ Error: ${error.message}`, '#f5576c');
            }
        });

        return { executed, errors };
    }

    // ============================================
    // API PÚBLICA
    // ============================================
    const ComandosModule = {
        configure: configure,
        executeCommand: executeCommand,
        executeCommands: executeCommands,
        
        // Acceso a datos
        getDrawingPoints: function() { return _drawingPoints; },
        getDrawingLines: function() { return _drawingLines; },
        getColorMap: function() { return _COLOR_MAP; },
        getColorValue: getColorValue,
        getColorName: getColorName,
        getColorHex: getColorHex,
        parseColor: parseColor,
        outputMessage: outputMessage,
        
        // Setters para actualizar referencias en vivo
        setDrawingPoints: function(points) { _drawingPoints = points; },
        setDrawingLines: function(lines) { _drawingLines = lines; },
        setDrawingScene: function(scene) { _drawingScene = scene; },
        setDrawingLineObjects: function(objects) { _drawingLineObjects = objects; },
        setDrawingPointMeshes: function(meshes) { _drawingPointMeshes = meshes; },
        setDrawingSolidMeshes: function(meshes) { _drawingSolidMeshes = meshes; },
        setFigurasGuardadas: function(figuras) { _figurasGuardadas = figuras; },
        getFigurasGuardadas: function() { return _figurasGuardadas; },
        setActivarsModoTallar: function(fn) { _activarModoTallar = fn; },
        setActivarModoMaterial: function(fn) { _activarModoMaterial = fn; },
        setTallarFiguraDirecta: function(fn) { _tallarFiguraDirecta = fn; },
        setAñadirMaterialDirecto: function(fn) { _añadirMaterialDirecto = fn; },
        setViewFunctions: function(solid, wireframe, transparent) {
            _setViewSolid = solid;
            _setViewWireframe = wireframe;
            _setViewTransparent = transparent;
        },
        
        // Comandos expuestos
        commandCreatePoint: commandCreatePoint,
        commandCreateConjunto: commandCreateConjunto,
        commandCreateLine: commandCreateLine,
        commandCreateFigura: commandCreateFigura,
        commandList: commandList,
        commandClear: commandClear,
        commandHelp: commandHelp,
        commandHelpTallar: commandHelpTallar,
        commandDelete: commandDelete,
        commandMove: commandMove,
        commandDiagnostico: commandDiagnostico,
        commandEstado: commandEstado,
        commandRedraw: commandRedraw,
        commandResetFlags: commandResetFlags,
        commandSync: commandSync,
        commandSync2: commandSync2,
        commandTallar: commandTallar,
        commandMaterial: commandMaterial,
        commandTallarFigura: commandTallarFigura,
        commandMaterialFigura: commandMaterialFigura,
        commandView: commandView,
        commandListFiguras: commandListFiguras,
        commandDeleteFigura: commandDeleteFigura,
        updateAllUI: updateAllUI
    };

    if (typeof window !== 'undefined') {
        window.ComandosModule = ComandosModule;
        console.log('📦 ComandosModule cargado correctamente (v4.0 - Soporte tallar y material)');
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ComandosModule;
    }

})();