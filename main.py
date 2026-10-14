import webview
import os
import sys

def get_resource_path():
    """Obtiene la ruta correcta del recurso"""
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    else:
        return os.path.dirname(os.path.abspath(__file__))

def create_window():
    base_dir = get_resource_path()
    html_path = os.path.join(base_dir, 'templates', 'index.html')
    
    if not os.path.exists(html_path):
        print(f"❌ Error: No se encontró el archivo en: {html_path}")
        return None
    
    print(f"✅ Archivo encontrado: {html_path}")
    
    window = webview.create_window(
        title='Constructor 3D con Vectores',
        url=html_path,
        width=1400,
        height=900,
        resizable=True,
        fullscreen=False,
        min_size=(1024, 768)
    )
    
    return window

if __name__ == '__main__':
    print("🚀 Iniciando Constructor 3D con Vectores...")
    window = create_window()
    if window:
        webview.start()
        print("✅ Aplicación cerrada correctamente")
    else:
        print("❌ Error al iniciar la aplicación")