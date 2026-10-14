// ============================================
// MANUAL.JS - Módulo de ayuda y comandos
// VERSIÓN v2.2 - SOPORTE COMPLETO DE FIGURAS, TALLAR, MATERIAL Y VISUALIZACIÓN
// ============================================

(function() {
    'use strict';

    // ============================================
    // COMANDOS DISPONIBLES
    // ============================================
    const COMANDOS = {
        guia_tallar_material: {
            titulo: '🪚🧱 GUÍA PASO A PASO - TALLAR Y MATERIAL',
            ejemplos: [
                { cmd: 'PASO 1:', desc: 'Crea una figura geométrica (esfera, cuadrado, cono, piramide, cilindro)' },
                { cmd: 'PASO 2 - TALLAR (🪚):', desc: 'Activa el modo tallar con el botón 🪚 en la paleta o con "tallar"' },
                { cmd: 'PASO 3 - TALLAR (🪚):', desc: 'Haz clic en la figura y arrastra para QUITAR material (esculpir)' },
                { cmd: 'PASO 2 - MATERIAL (🧱):', desc: 'Activa el modo material con el botón 🧱 en la paleta o con "material"' },
                { cmd: 'PASO 3 - MATERIAL (🧱):', desc: 'Haz clic en la figura y arrastra para AÑADIR material (volumen)' },
                { cmd: 'CONSEJO:', desc: 'Radio pequeño (3-8) = efecto preciso y detallado' },
                { cmd: 'CONSEJO:', desc: 'Radio grande (10-20) = efecto amplio y suave' },
                { cmd: 'CONSEJO:', desc: 'Intensidad baja (0.2-0.4) = efecto suave' },
                { cmd: 'CONSEJO:', desc: 'Intensidad alta (0.7-1.0) = efecto agresivo' }
            ]
        },
        modo_tallar: {
            titulo: '🪚 COMANDOS DEL MODO TALLAR (QUITAR MATERIAL)',
            ejemplos: [
                { cmd: 'tallar {10, 0.7}', desc: 'Configura radio 10, intensidad 0.7 y activa el modo tallar' },
                { cmd: 'tallar {5}', desc: 'Configura radio 5, intensidad por defecto (0.5)' },
                { cmd: 'tallar', desc: 'Usa valores por defecto (radio 5, intensidad 0.5) y activa el modo' },
                { cmd: 'tallarf esfera {10, 0.7}', desc: 'Tallar esfera directamente (sin selección con mouse)' },
                { cmd: 'tallarf cuadrado {5}', desc: 'Tallar cuadrado con radio 5' },
                { cmd: 'tallarf cono', desc: 'Tallar cono con valores por defecto' },
                { cmd: 'tallarf piramide {15, 0.8}', desc: 'Tallar pirámide con radio 15 e intensidad 0.8' },
                { cmd: 'tallarf cilindro {8, 0.3}', desc: 'Tallar cilindro con radio 8 e intensidad 0.3' },
                { cmd: '🪚 (botón en paleta)', desc: 'Activa/desactiva el modo tallar (alternativo)' }
            ]
        },
        modo_material: {
            titulo: '🧱 COMANDOS DEL MODO AÑADIR MATERIAL (NUEVO)',
            ejemplos: [
                { cmd: 'material {10, 0.7}', desc: 'Configura radio 10, intensidad 0.7 y activa el modo material' },
                { cmd: 'material {5}', desc: 'Configura radio 5, intensidad por defecto (0.5)' },
                { cmd: 'material', desc: 'Usa valores por defecto (radio 5, intensidad 0.5) y activa el modo' },
                { cmd: 'materialf esfera {10, 0.7}', desc: 'Añade material a esfera directamente (sin selección con mouse)' },
                { cmd: 'materialf cuadrado {5}', desc: 'Añade material a cuadrado con radio 5' },
                { cmd: 'materialf cono', desc: 'Añade material a cono con valores por defecto' },
                { cmd: 'materialf piramide {15, 0.8}', desc: 'Añade material a pirámide con radio 15 e intensidad 0.8' },
                { cmd: 'materialf cilindro {8, 0.3}', desc: 'Añade material a cilindro con radio 8 e intensidad 0.3' },
                { cmd: '🧱 (botón en paleta)', desc: 'Activa/desactiva el modo añadir material (alternativo)' }
            ]
        },
        visualizacion: {
            titulo: '🎨 MODOS DE VISUALIZACIÓN',
            ejemplos: [
                { cmd: 'view solid', desc: 'Modo Sólido (🧊) - Muestra las figuras opacas' },
                { cmd: 'view sólido', desc: 'Modo Sólido (alternativo)' },
                { cmd: 'view wireframe', desc: 'Modo Malla (🔲) - Muestra solo las aristas' },
                { cmd: 'view malla', desc: 'Modo Malla (alternativo)' },
                { cmd: 'view transparent', desc: 'Modo Transparente (👻) - Figuras semitransparentes' },
                { cmd: 'view transparente', desc: 'Modo Transparente (alternativo)' }
            ]
        },
        puntos: {
            titulo: '🔹 PUNTOS (formatos flexibles)',
            ejemplos: [
                { cmd: 'p_1 : {(10,20,30), color_rojo}', desc: 'Punto con nombre de color' },
                { cmd: 'p_1 : {(10,20,30), rojo}', desc: 'Punto con nombre corto' },
                { cmd: 'p_1 : {(10,20,30), #FF0000}', desc: 'Punto con código hexadecimal' },
                { cmd: 'p_1 : {(10,20,30), FF0000}', desc: 'Punto sin #' },
                { cmd: 'P1 : {(10,20,30), color_azul}', desc: 'Punto con P mayúscula' },
                { cmd: 'punto_1 : {(10,20,30), color_verde}', desc: 'Punto con nombre personalizado' }
            ]
        },
        figuras: {
            titulo: '🔹 FIGURAS GEOMÉTRICAS',
            ejemplos: [
                { cmd: 'esfera : {color_rojo, 20}', desc: 'Esfera con radio 20' },
                { cmd: 'esfera : {#FF0000, 15}', desc: 'Esfera con código hex' },
                { cmd: 'esfera : {25}', desc: 'Esfera con tamaño por defecto (color azul)' },
                { cmd: 'cuadrado : {color_azul, 30}', desc: 'Cuadrado de lado 30' },
                { cmd: 'cuadrado : {25, color_cian}', desc: 'Cuadrado con color y tamaño' },
                { cmd: 'cuadrado : {#00FF00, 20}', desc: 'Cuadrado con código hex' },
                { cmd: 'cono : {color_verde, 25, 40}', desc: 'Cono con radio 25 y altura 40' },
                { cmd: 'cono : {#00FF00, 20, 35}', desc: 'Cono con código hex' },
                { cmd: 'piramide : {color_amarillo, 30, 35}', desc: 'Pirámide con base 30 y altura 35' },
                { cmd: 'piramide : {#FFFF00, 25, 30}', desc: 'Pirámide con código hex' },
                { cmd: 'cilindro : {color_morado, 20, 50}', desc: 'Cilindro con radio 20 y altura 50' },
                { cmd: 'cilindro : {#AA44FF, 15, 45}', desc: 'Cilindro con código hex' }
            ]
        },
        figuras_comandos: {
            titulo: '📐 COMANDOS DE GESTIÓN DE FIGURAS',
            ejemplos: [
                { cmd: 'listfiguras', desc: 'Lista todas las figuras con su estado (tamaño, color, modificada)' },
                { cmd: 'listfig', desc: 'Versión corta de listfiguras' },
                { cmd: 'deletefigura esfera', desc: 'Elimina todas las esferas' },
                { cmd: 'deletefigura cuadrado', desc: 'Elimina todos los cuadrados' },
                { cmd: 'deletefigura 1', desc: 'Elimina la primera figura de la lista' },
                { cmd: 'deletefigura 3', desc: 'Elimina la tercera figura de la lista' }
            ]
        },
        conjuntos: {
            titulo: '🔹 CONJUNTOS (sólidos)',
            ejemplos: [
                { cmd: 'C_1 : {(p_1-p_2-p_3), color_verde}', desc: 'Conjunto con nombre de color' },
                { cmd: 'C_1 : {(p_1-p_2-p_3), verde}', desc: 'Conjunto con nombre corto' },
                { cmd: 'conjunto_1 : {(p_1-p_2-p_3), #00FF00}', desc: 'Conjunto con código hex' },
                { cmd: 'C_1 : {(p_1-p_2-p_3)}', desc: 'Conjunto sin color (verde por defecto)' },
                { cmd: 'C_1 : {(p_1-p_2-p_3-p_4), color_rojo}', desc: 'Conjunto con 4+ puntos' }
            ]
        },
        lineas: {
            titulo: '🔹 LÍNEAS',
            ejemplos: [
                { cmd: 'p_1-p_2 : {color_rojo}', desc: 'Línea con nombre de color' },
                { cmd: 'p_1-p_2 : {rojo}', desc: 'Línea con nombre corto' },
                { cmd: 'p_1-p_2 : {#FF0000}', desc: 'Línea con código hex' },
                { cmd: 'p_1-p_2 : {}', desc: 'Línea sin color (azul por defecto)' }
            ]
        },
        terminal: {
            titulo: '🔹 COMANDOS DE TERMINAL',
            ejemplos: [
                { cmd: 'help / ?', desc: 'Muestra esta ayuda' },
                { cmd: 'helptallar', desc: 'Guía completa del modo tallar y material' },
                { cmd: 'list / ls', desc: 'Lista todos los elementos (puntos, figuras, líneas)' },
                { cmd: 'clear / cls', desc: 'Limpia el dibujo (elimina todo)' },
                { cmd: 'delete P1', desc: 'Elimina un punto por su nombre' },
                { cmd: 'move P1 10,20,30', desc: 'Mueve un punto a nuevas coordenadas' },
                { cmd: 'diagnostico', desc: 'Diagnóstico del sistema (estado detallado)' },
                { cmd: 'estado', desc: 'Estado resumido del sistema' },
                { cmd: 'resetflags', desc: 'Resetea flags bloqueadas' },
                { cmd: 'redraw', desc: 'Redibuja el canvas' },
                { cmd: 'sync', desc: 'Sincroniza editor con canvas' },
                { cmd: 'sync2', desc: 'Ejecuta el editor' }
            ]
        },
        colores: {
            titulo: '🎨 COLORES DISPONIBLES',
            ejemplos: [
                { cmd: 'rojo', desc: '#FF4444' },
                { cmd: 'verde', desc: '#44FF44' },
                { cmd: 'azul', desc: '#4444FF' },
                { cmd: 'amarillo', desc: '#FFFF44' },
                { cmd: 'naranja', desc: '#FF8800' },
                { cmd: 'morado', desc: '#AA44FF' },
                { cmd: 'rosa', desc: '#FF44AA' },
                { cmd: 'cian', desc: '#44FFFF' },
                { cmd: 'blanco', desc: '#FFFFFF' },
                { cmd: 'negro', desc: '#000000' },
                { cmd: 'gris', desc: '#888888' },
                { cmd: 'turquesa', desc: '#40E0D0' },
                { cmd: 'violeta', desc: '#8A2BE2' },
                { cmd: 'mostaza', desc: '#FFDB58' },
                { cmd: 'celeste', desc: '#87CEEB' },
                { cmd: 'marron', desc: '#8B4513' },
                { cmd: 'plateado', desc: '#C0C0C0' },
                { cmd: 'dorado', desc: '#FFD700' }
            ]
        },
        ejemplos_completos: {
            titulo: '📝 EJEMPLOS COMPLETOS',
            ejemplos: [
                { cmd: 'mi_objeto : {', desc: 'Inicio del objeto' },
                { cmd: '    p_1 : {(10,20,30), color_rojo}', desc: 'Punto rojo' },
                { cmd: '    p_2 : {(-15,25,-10), #00FF00}', desc: 'Punto verde con hex' },
                { cmd: '    p_3 : {(5,-20,40), color_azul}', desc: 'Punto azul' },
                { cmd: '    esfera : {color_azul, 25}', desc: 'Esfera azul' },
                { cmd: '    cuadrado : {#FF0000, 30}', desc: 'Cuadrado rojo' },
                { cmd: '    cono : {color_verde, 20, 40}', desc: 'Cono verde' },
                { cmd: '    piramide : {color_amarillo, 25, 30}', desc: 'Pirámide amarilla' },
                { cmd: '    cilindro : {color_morado, 15, 45}', desc: 'Cilindro morado' },
                { cmd: '    C_1 : {(p_1-p_2-p_3), color_azul}', desc: 'Conjunto con 3 puntos' },
                { cmd: '    p_1-p_2 : {#FF8800}', desc: 'Línea naranja' },
                { cmd: '}', desc: 'Cierre del objeto' }
            ]
        },
        atajos_rapidos: {
            titulo: '⚡ ATAJOS RÁPIDOS',
            ejemplos: [
                { cmd: 'tallar {8, 0.6}', desc: 'Configurar tallado rápido (quitar material)' },
                { cmd: 'material {8, 0.6}', desc: 'Configurar añadido de material rápido' },
                { cmd: 'view solid', desc: 'Cambiar a modo sólido' },
                { cmd: 'view wireframe', desc: 'Cambiar a modo malla' },
                { cmd: 'listfig', desc: 'Ver figuras rápidamente' },
                { cmd: 'deletefigura 1', desc: 'Eliminar primera figura' },
                { cmd: 'clear', desc: 'Limpiar todo' }
            ]
        }
    };

    // ============================================
    // DOM REFERENCIAS
    // ============================================
    let modalAyuda = null;
    let modalVisible = false;

    // ============================================
    // FUNCIONES PRINCIPALES
    // ============================================

    function crearModalAyuda() {
        // Verificar si ya existe
        if (document.getElementById('helpModal')) {
            modalAyuda = document.getElementById('helpModal');
            return;
        }

        // Crear el modal
        const modal = document.createElement('div');
        modal.id = 'helpModal';
        modal.className = 'help-modal';
        modal.style.display = 'none';
        
        // Contenido del modal
        modal.innerHTML = `
            <div class="help-modal-content">
                <div class="help-modal-header">
                    <h2>📖 GUÍA DE COMANDOS</h2>
                    <button class="help-modal-close" onclick="window.cerrarAyuda()">✕</button>
                </div>
                <div class="help-modal-body" id="helpModalBody">
                    <!-- Contenido generado dinámicamente -->
                </div>
                <div class="help-modal-footer">
                    <span class="help-footer-text">💡 Los comandos son flexibles con espacios y mayúsculas/minúsculas</span>
                    <button class="help-modal-btn-close" onclick="window.cerrarAyuda()">Cerrar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modalAyuda = modal;

        // Cerrar al hacer clic fuera
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                window.cerrarAyuda();
            }
        });

        // Cerrar con Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modalVisible) {
                window.cerrarAyuda();
            }
        });

        // Generar contenido
        generarContenidoAyuda();
    }

    function generarContenidoAyuda() {
        const body = document.getElementById('helpModalBody');
        if (!body) return;

        let html = '';

        // Sección de guía del modo tallar y material (PRIMERO - destacado)
        html += generarSeccion(COMANDOS.guia_tallar_material);
        
        // Sección de modo tallar
        html += generarSeccion(COMANDOS.modo_tallar);
        
        // Sección de modo material (NUEVO)
        html += generarSeccion(COMANDOS.modo_material);
        
        // Sección de visualización
        html += generarSeccion(COMANDOS.visualizacion);
        
        // Sección de atajos rápidos
        html += generarSeccion(COMANDOS.atajos_rapidos);
        
        // Sección de puntos
        html += generarSeccion(COMANDOS.puntos);
        
        // Sección de figuras geométricas
        html += generarSeccion(COMANDOS.figuras);
        
        // Sección de figuras comandos
        html += generarSeccion(COMANDOS.figuras_comandos);
        
        // Sección de conjuntos
        html += generarSeccion(COMANDOS.conjuntos);
        
        // Sección de líneas
        html += generarSeccion(COMANDOS.lineas);
        
        // Sección de terminal
        html += generarSeccion(COMANDOS.terminal);

        // Sección de colores
        html += generarSeccionColores(COMANDOS.colores);

        // Sección de ejemplos completos
        html += generarSeccion(COMANDOS.ejemplos_completos);

        body.innerHTML = html;

        // Agregar eventos de copiado a los comandos
        document.querySelectorAll('.help-cmd').forEach(function(el) {
            el.addEventListener('click', function() {
                const cmd = this.textContent.trim();
                copiarAlPortapapeles(cmd);
                mostrarNotificacion('📋 Comando copiado: ' + cmd);
            });
            el.title = 'Click para copiar el comando';
        });
    }

    function generarSeccion(seccion) {
        let html = `<div class="help-section">
            <h3 class="help-section-title">${seccion.titulo}</h3>
            <div class="help-grid">`;
        
        seccion.ejemplos.forEach(function(item) {
            const isStep = item.cmd.startsWith('PASO') || item.cmd.startsWith('CONSEJO');
            const extraClass = isStep ? ' help-step' : '';
            html += `
                <div class="help-item${extraClass}">
                    <code class="help-cmd">${item.cmd}</code>
                    <span class="help-desc">${item.desc}</span>
                </div>
            `;
        });
        
        html += `</div></div>`;
        return html;
    }

    function generarSeccionColores(seccion) {
        let html = `<div class="help-section">
            <h3 class="help-section-title">${seccion.titulo}</h3>
            <div class="help-colors-grid">`;
        
        seccion.ejemplos.forEach(function(item) {
            const colorHex = item.desc;
            html += `
                <div class="help-color-item">
                    <div class="help-color-swatch" style="background-color: ${colorHex};"></div>
                    <span class="help-color-name">${item.cmd}</span>
                    <span class="help-color-hex">${colorHex}</span>
                </div>
            `;
        });
        
        html += `</div></div>`;
        return html;
    }

    // ============================================
    // FUNCIONES DE UTILIDAD
    // ============================================

    function copiarAlPortapapeles(texto) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(texto).catch(function() {
                copiarFallback(texto);
            });
        } else {
            copiarFallback(texto);
        }
    }

    function copiarFallback(texto) {
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
        } catch (e) {
            console.warn('No se pudo copiar:', e);
        }
        document.body.removeChild(textarea);
    }

    function mostrarNotificacion(mensaje) {
        // Eliminar notificaciones anteriores
        document.querySelectorAll('.help-toast').forEach(function(el) {
            el.remove();
        });

        const toast = document.createElement('div');
        toast.className = 'help-toast';
        toast.textContent = mensaje;
        document.body.appendChild(toast);

        setTimeout(function() {
            toast.classList.add('show');
        }, 10);

        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() {
                toast.remove();
            }, 300);
        }, 2000);
    }

    // ============================================
    // FUNCIONES PÚBLICAS
    // ============================================

    window.abrirAyuda = function() {
        console.log('📖 Abriendo ayuda...');
        
        if (!modalAyuda) {
            crearModalAyuda();
        }

        if (modalAyuda) {
            modalAyuda.style.display = 'flex';
            modalVisible = true;
            document.body.style.overflow = 'hidden';
            generarContenidoAyuda();
            console.log('✅ Ayuda abierta');
        } else {
            console.error('❌ No se pudo crear el modal de ayuda');
        }
    };

    window.cerrarAyuda = function() {
        console.log('📖 Cerrando ayuda...');
        
        if (modalAyuda) {
            modalAyuda.style.display = 'none';
            modalVisible = false;
            document.body.style.overflow = '';
            console.log('✅ Ayuda cerrada');
        }
    };

    window.toggleAyuda = function() {
        if (modalVisible) {
            window.cerrarAyuda();
        } else {
            window.abrirAyuda();
        }
    };

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    function init() {
        console.log('📖 Manual de comandos cargado (v2.2 - Soporte tallar y material)');
        crearModalAyuda();
        
        // Buscar el botón de ayuda por varios IDs posibles
        const btnAyuda = document.getElementById('btnHelpManual') || 
                         document.querySelector('.drawing-editor-help') ||
                         document.querySelector('[onclick*="abrirAyuda"]');
        
        if (btnAyuda) {
            console.log('✅ Botón de ayuda encontrado');
            // Remover eventos anteriores para evitar duplicados
            const newBtn = btnAyuda.cloneNode(true);
            btnAyuda.parentNode.replaceChild(newBtn, btnAyuda);
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                window.abrirAyuda();
            });
            // Asegurar onclick
            newBtn.setAttribute('onclick', 'abrirAyuda()');
        } else {
            console.warn('⚠️ Botón de ayuda no encontrado');
            // Intentar de nuevo después de un momento
            setTimeout(function() {
                const btn = document.getElementById('btnHelpManual') || 
                           document.querySelector('.drawing-editor-help');
                if (btn) {
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        window.abrirAyuda();
                    });
                    btn.setAttribute('onclick', 'abrirAyuda()');
                    console.log('✅ Botón de ayuda configurado después de retraso');
                }
            }, 500);
        }
    }

    // ============================================
    // ESTILOS ADICIONALES PARA PASOS Y CONSEJOS
    // ============================================
    function agregarEstilosAdicionales() {
        const style = document.createElement('style');
        style.textContent = `
            .help-item.help-step {
                background: rgba(255, 107, 107, 0.05);
                border-color: rgba(255, 107, 107, 0.1);
            }
            .help-item.help-step .help-cmd {
                background: rgba(255, 107, 107, 0.1);
                color: #ff6b6b;
                font-weight: 600;
            }
            .help-item.help-step:hover {
                background: rgba(255, 107, 107, 0.08);
                border-color: rgba(255, 107, 107, 0.2);
            }
            .help-section:first-child .help-section-title {
                color: #ff6b6b;
                border-bottom-color: rgba(255, 107, 107, 0.15);
            }
            .help-section:first-child {
                background: rgba(255, 107, 107, 0.03);
                border-radius: 8px;
                padding: 12px 16px;
                margin-bottom: 16px;
                border: 1px solid rgba(255, 107, 107, 0.08);
            }
            .help-section:nth-child(2) .help-section-title {
                color: #ff6b6b;
            }
            .help-section:nth-child(3) .help-section-title {
                color: #4facfe;
            }
            .help-section:nth-child(3) {
                background: rgba(79, 172, 254, 0.03);
                border-radius: 8px;
                padding: 12px 16px;
                margin-bottom: 16px;
                border: 1px solid rgba(79, 172, 254, 0.08);
            }
        `;
        document.head.appendChild(style);
    }

    // ============================================
    // EXPORTAR
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            init();
            agregarEstilosAdicionales();
        });
    } else {
        init();
        agregarEstilosAdicionales();
    }

    window.COMANDOS = COMANDOS;
    window.generarContenidoAyuda = generarContenidoAyuda;

    console.log('📖 Manual de comandos listo (v2.2 - Soporte tallar y material)');

})();