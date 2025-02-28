from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)
app.secret_key = 'sua_chave_secreta_aqui'  # Importante para sessões

# Configuração do CORS
CORS(app, supports_credentials=True, resources={
    r"/*": {
        "origins": ["http://localhost:8000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

# Configuração do banco de dados
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///financas.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Modelo de Usuário
class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    contas = db.relationship('Conta', backref='usuario', lazy=True)

# Modelo de Conta
class Conta(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    descricao = db.Column(db.String(200), nullable=False)
    valor = db.Column(db.Float, nullable=False)
    data_vencimento = db.Column(db.Date, nullable=False)
    tipo = db.Column(db.String(20), nullable=False)  # 'pagar' ou 'receber'
    status = db.Column(db.String(20), default='pendente')  # 'pendente', 'pago', 'recebido'
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)

# Função para verificar se usuário está logado
def requer_login(f):
    def decorated_function(*args, **kwargs):
        if 'usuario_id' not in session:
            return jsonify({'erro': 'Usuário não está logado'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

# Rotas de Autenticação
@app.route('/api/registrar', methods=['POST'])
def registrar():
    dados = request.json
    if Usuario.query.filter_by(username=dados['username']).first():
        return jsonify({'erro': 'Nome de usuário já existe'}), 400
    
    novo_usuario = Usuario(
        username=dados['username'],
        password_hash=generate_password_hash(dados['password'])
    )
    db.session.add(novo_usuario)
    db.session.commit()
    return jsonify({'mensagem': 'Usuário criado com sucesso!'})

@app.route('/api/login', methods=['POST'])
def login():
    dados = request.json
    usuario = Usuario.query.filter_by(username=dados['username']).first()
    
    if usuario and check_password_hash(usuario.password_hash, dados['password']):
        session['usuario_id'] = usuario.id
        return jsonify({'mensagem': 'Login realizado com sucesso!'})
    return jsonify({'erro': 'Usuário ou senha inválidos'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('usuario_id', None)
    return jsonify({'mensagem': 'Logout realizado com sucesso!'})

# Rotas da API
@app.route('/api/contas', methods=['GET'])
@requer_login
def listar_contas():
    contas = Conta.query.filter_by(usuario_id=session['usuario_id']).all()
    return jsonify([{
        'id': conta.id,
        'descricao': conta.descricao,
        'valor': conta.valor,
        'data_vencimento': conta.data_vencimento.strftime('%Y-%m-%d'),
        'tipo': conta.tipo,
        'status': conta.status,
        'data_criacao': conta.data_criacao.strftime('%Y-%m-%d %H:%M:%S')
    } for conta in contas])

@app.route('/api/contas', methods=['POST'])
@requer_login
def criar_conta():
    dados = request.json
    nova_conta = Conta(
        descricao=dados['descricao'],
        valor=dados['valor'],
        data_vencimento=datetime.strptime(dados['data_vencimento'], '%Y-%m-%d'),
        tipo=dados['tipo'],
        status=dados.get('status', 'pendente'),
        usuario_id=session['usuario_id']
    )
    db.session.add(nova_conta)
    db.session.commit()
    return jsonify({'mensagem': 'Conta criada com sucesso!', 'id': nova_conta.id}), 201

@app.route('/api/contas/<int:id>', methods=['PUT'])
@requer_login
def atualizar_conta(id):
    conta = Conta.query.get_or_404(id)
    if conta.usuario_id != session['usuario_id']:
        return jsonify({'erro': 'Acesso negado'}), 403
    
    dados = request.json
    conta.descricao = dados.get('descricao', conta.descricao)
    conta.valor = dados.get('valor', conta.valor)
    if 'data_vencimento' in dados:
        conta.data_vencimento = datetime.strptime(dados['data_vencimento'], '%Y-%m-%d')
    conta.tipo = dados.get('tipo', conta.tipo)
    conta.status = dados.get('status', conta.status)
    
    db.session.commit()
    return jsonify({'mensagem': 'Conta atualizada com sucesso!'})

@app.route('/api/contas/<int:id>', methods=['DELETE'])
@requer_login
def deletar_conta(id):
    conta = Conta.query.get_or_404(id)
    if conta.usuario_id != session['usuario_id']:
        return jsonify({'erro': 'Acesso negado'}), 403
    
    db.session.delete(conta)
    db.session.commit()
    return jsonify({'mensagem': 'Conta deletada com sucesso!'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True) 