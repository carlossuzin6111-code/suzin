#!/usr/bin/env python3
import http.server
import socketserver
import sys

PORT = 3000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def log_message(self, format, *args):
        # Log personalizado para ver as requisições
        print(f"{self.address_string()} - {format % args}")

try:
    with socketserver.TCPServer(("0.0.0.0", PORT), MyHTTPRequestHandler) as httpd:
        print(f"Servidor rodando em http://0.0.0.0:{PORT}")
        print(f"Acesse pelo computador: http://localhost:{PORT}")
        print(f"Acesse pelo celular: http://192.168.122.126:{PORT}")
        print("Pressione Ctrl+C para parar o servidor")
        httpd.serve_forever()
except OSError as e:
    if "Address already in use" in str(e) or "address is already in use" in str(e):
        print(f"Erro: A porta {PORT} já está em uso.")
        print("Tente parar o servidor anterior ou use outra porta.")
    else:
        print(f"Erro ao iniciar servidor: {e}")
    sys.exit(1)
except KeyboardInterrupt:
    print("\nServidor parado pelo usuário.")
    sys.exit(0)

