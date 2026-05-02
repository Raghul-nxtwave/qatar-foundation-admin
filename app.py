from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from datetime import datetime, timedelta
import secrets
import os
from flask_cors import CORS

app = Flask(__name__, static_folder='sky', static_url_path='')
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///qatar_foundation.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)

CORS(app, supports_credentials=True)

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)

# ─── MODELS ────────────────────────────────────────────────

class Admin(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    opportunities = db.relationship('Opportunity', backref='admin', lazy=True)
    reset_tokens = db.relationship('PasswordResetToken', backref='admin', lazy=True)

class Opportunity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    duration = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    skills = db.Column(db.String(500), nullable=False)
    future_opportunities = db.Column(db.Text, nullable=False)
    max_applicants = db.Column(db.Integer, nullable=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('admin.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class PasswordResetToken(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(200), unique=True, nullable=False)
    admin_id = db.Column(db.Integer, db.ForeignKey('admin.id'), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)

# ─── LOGIN MANAGER ─────────────────────────────────────────

@login_manager.user_loader
def load_user(user_id):
    return Admin.query.get(int(user_id))

# ─── AUTH ROUTES ───────────────────────────────────────────

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')

    # Validations
    if not all([full_name, email, password, confirm_password]):
        return jsonify({'error': 'All fields are required'}), 400
    if '@' not in email or '.' not in email:
        return jsonify({'error': 'Invalid email format'}), 400
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    if password != confirm_password:
        return jsonify({'error': 'Passwords do not match'}), 400
    if Admin.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email already exists'}), 409

    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    new_admin = Admin(full_name=full_name, email=email, password=hashed_pw)
    db.session.add(new_admin)
    db.session.commit()
    return jsonify({'message': 'Account created successfully'}), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    remember_me = data.get('remember_me', False)

    if not email or not password:
        return jsonify({'error': 'All fields are required'}), 400

    admin = Admin.query.filter_by(email=email).first()
    if not admin or not bcrypt.check_password_hash(admin.password, password):
        return jsonify({'error': 'Invalid email or password'}), 401

    login_user(admin, remember=remember_me)
    if remember_me:
        session.permanent = True

    return jsonify({
        'message': 'Login successful',
        'admin': {'id': admin.id, 'full_name': admin.full_name, 'email': admin.email}
    }), 200


@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'}), 200


@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email', '').strip().lower()

    # Always return same message (privacy protection)
    admin = Admin.query.filter_by(email=email).first()
    if admin:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=1)
        reset_token = PasswordResetToken(token=token, admin_id=admin.id, expires_at=expires_at)
        db.session.add(reset_token)
        db.session.commit()
        # In production you'd email this. For now, just log it.
        print(f"[RESET LINK] http://localhost:5000/reset-password?token={token}")

    return jsonify({'message': 'If this email is registered, a reset link has been sent'}), 200


@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token', '')
    new_password = data.get('new_password', '')

    reset_token = PasswordResetToken.query.filter_by(token=token, used=False).first()
    if not reset_token:
        return jsonify({'error': 'Invalid or expired reset link'}), 400
    if datetime.utcnow() > reset_token.expires_at:
        return jsonify({'error': 'This reset link has expired'}), 400
    if len(new_password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    admin = Admin.query.get(reset_token.admin_id)
    admin.password = bcrypt.generate_password_hash(new_password).decode('utf-8')
    reset_token.used = True
    db.session.commit()
    return jsonify({'message': 'Password reset successfully'}), 200

# ─── OPPORTUNITY ROUTES ────────────────────────────────────

@app.route('/api/opportunities', methods=['GET'])
@login_required
def get_opportunities():
    opps = Opportunity.query.filter_by(admin_id=current_user.id).order_by(Opportunity.created_at.desc()).all()
    return jsonify([opp_to_dict(o) for o in opps]), 200


@app.route('/api/opportunities', methods=['POST'])
@login_required
def create_opportunity():
    data = request.get_json()
    error = validate_opportunity(data)
    if error:
        return jsonify({'error': error}), 400

    opp = Opportunity(
        name=data['name'].strip(),
        category=data['category'].strip(),
        duration=data['duration'].strip(),
        start_date=data['start_date'].strip(),
        description=data['description'].strip(),
        skills=data['skills'].strip(),
        future_opportunities=data['future_opportunities'].strip(),
        max_applicants=data.get('max_applicants') or None,
        admin_id=current_user.id
    )
    db.session.add(opp)
    db.session.commit()
    return jsonify(opp_to_dict(opp)), 201


@app.route('/api/opportunities/<int:opp_id>', methods=['GET'])
@login_required
def get_opportunity(opp_id):
    opp = Opportunity.query.filter_by(id=opp_id, admin_id=current_user.id).first()
    if not opp:
        return jsonify({'error': 'Opportunity not found'}), 404
    return jsonify(opp_to_dict(opp)), 200


@app.route('/api/opportunities/<int:opp_id>', methods=['PUT'])
@login_required
def update_opportunity(opp_id):
    opp = Opportunity.query.filter_by(id=opp_id, admin_id=current_user.id).first()
    if not opp:
        return jsonify({'error': 'Opportunity not found'}), 404

    data = request.get_json()
    error = validate_opportunity(data)
    if error:
        return jsonify({'error': error}), 400

    opp.name = data['name'].strip()
    opp.category = data['category'].strip()
    opp.duration = data['duration'].strip()
    opp.start_date = data['start_date'].strip()
    opp.description = data['description'].strip()
    opp.skills = data['skills'].strip()
    opp.future_opportunities = data['future_opportunities'].strip()
    opp.max_applicants = data.get('max_applicants') or None

    db.session.commit()
    return jsonify(opp_to_dict(opp)), 200


@app.route('/api/opportunities/<int:opp_id>', methods=['DELETE'])
@login_required
def delete_opportunity(opp_id):
    opp = Opportunity.query.filter_by(id=opp_id, admin_id=current_user.id).first()
    if not opp:
        return jsonify({'error': 'Opportunity not found or unauthorized'}), 404

    db.session.delete(opp)
    db.session.commit()
    return jsonify({'message': 'Opportunity deleted successfully'}), 200

# ─── SERVE FRONTEND ────────────────────────────────────────

@app.route('/')
def index():
    return app.send_static_file('admin.html')

# ─── HELPERS ───────────────────────────────────────────────

def validate_opportunity(data):
    required = ['name', 'category', 'duration', 'start_date', 'description', 'skills', 'future_opportunities']
    for field in required:
        if not data.get(field, '').strip():
            return f"'{field.replace('_', ' ').title()}' is required"
    valid_categories = ['technology', 'business', 'design', 'marketing', 'data', 'other']
    if data['category'] not in valid_categories:
        return 'Invalid category selected'
    return None

def opp_to_dict(opp):
    return {
        'id': opp.id,
        'name': opp.name,
        'category': opp.category,
        'duration': opp.duration,
        'start_date': opp.start_date,
        'description': opp.description,
        'skills': opp.skills,
        'future_opportunities': opp.future_opportunities,
        'max_applicants': opp.max_applicants,
        'created_at': opp.created_at.isoformat()
    }

# ─── INIT & RUN ────────────────────────────────────────────

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 10000)))