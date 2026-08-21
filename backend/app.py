import os
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

import logging
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from database import init_db

from routes.auth_routes import auth_bp
from routes.profile_routes import profile_bp
from routes.ai_routes import ai_bp
from routes.job_routes import job_bp
from routes.admin_routes import admin_bp
from routes.resume_routes import resume_bp

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger('talent_agent_api')

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for local development and frontend client
    CORS(
        app,
        resources={r"/api/*": {"origins": Config.CORS_ORIGINS}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    )

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(job_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(resume_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        from database import DB_ENGINE
        from database import execute_query
        execute_query('SELECT 1 AS ok', fetchone=True)
        return jsonify({
            'status': 'healthy',
            'service': 'Talent Agent AI Backend',
            'database_engine': DB_ENGINE,
            'version': '2.0.0'
        }), 200

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        if path.startswith('api/'):
            return jsonify({'error': 'Endpoint not found'}), 404
        requested = Path(app.static_folder) / path
        if path and requested.is_file():
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Endpoint not found'}), 404

    @app.errorhandler(500)
    def server_error(e):
        logger.error(f"Internal Server Error: {e}")
        return jsonify({'error': 'Internal server error occurred.'}), 500

    # Initialize Database & Seed
    with app.app_context():
        try:
            init_db()
        except Exception as e:
            logger.error(f"Database initialization warning: {e}")
            if Config.ENV == 'production':
                raise

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Starting Talent Agent AI Backend Server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=Config.DEBUG)
