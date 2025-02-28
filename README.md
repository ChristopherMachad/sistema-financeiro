# Sistema Financeiro - Documentação

## Visão Geral
Este é um sistema de controle financeiro desenvolvido com Flask (backend) que permite aos usuários gerenciar contas a pagar e receber.

## Estrutura do Backend

### Configurações Principais
```python
app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'chave_secreta_padrao')
```
- Inicializa a aplicação Flask
- Define uma chave secreta para gerenciar sessões de usuário

### Configuração CORS
```python
CORS(app, supports_credentials=True, resources={...})
```
- Permite requisições de domínios específicos:
  - `http://localhost:8000` (desenvolvimento local)
  - `https://sistema-financeiro3.onrender.com` (frontend em produção)
- Habilita credenciais para autenticação
- Define métodos HTTP permitidos (GET, POST, PUT, DELETE)

### Banco de Dados
```python
database_url = os.environ.get('DATABASE_URL')
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
```
- Configura conexão com PostgreSQL em produção
- Mantém SQLite como fallback para desenvolvimento

## Modelos de Dados

### Usuário (`Usuario`)
```python
class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    contas = db.relationship('Conta', backref='usuario', lazy=True)
```
- Armazena informações do usuário
- Campos:
  - `id`: Identificador único
  - `username`: Nome de usuário (único)
  - `password_hash`: Senha criptografada
  - `contas`: Relacionamento com as contas do usuário

### Conta (`Conta`)
```python
class Conta(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    descricao = db.Column(db.String(200), nullable=False)
    valor = db.Column(db.Float, nullable=False)
    data_vencimento = db.Column(db.Date, nullable=False)
    tipo = db.Column(db.String(20), nullable=False)  # 'pagar' ou 'receber'
    status = db.Column(db.String(20), default='pendente')  # 'pendente', 'pago', 'recebido'
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
```
- Armazena informações das contas
- Campos:
  - `descricao`: Descrição da conta
  - `valor`: Valor monetário
  - `data_vencimento`: Data de vencimento
  - `tipo`: "pagar" ou "receber"
  - `status`: "pendente", "pago" ou "recebido"
  - `data_criacao`: Data de criação automática
  - `usuario_id`: Vínculo com o usuário

## Rotas da API

### Autenticação

#### Registro (`/api/registrar` - POST)
```python
@app.route('/api/registrar', methods=['POST'])
def registrar():
```
- Cria novo usuário
- Verifica se username já existe
- Criptografa a senha
- Retorna mensagem de sucesso

#### Login (`/api/login` - POST)
```python
@app.route('/api/login', methods=['POST'])
def login():
```
- Valida credenciais
- Cria sessão para usuário
- Retorna mensagem de sucesso ou erro

#### Logout (`/api/logout` - POST)
```python
@app.route('/api/logout', methods=['POST'])
def logout():
```
- Remove sessão do usuário
- Retorna mensagem de sucesso

### Gerenciamento de Contas

#### Listar Contas (`/api/contas` - GET)
```python
@app.route('/api/contas', methods=['GET'])
@requer_login
def listar_contas():
```
- Requer autenticação
- Lista todas as contas do usuário logado
- Retorna array com detalhes das contas

#### Criar Conta (`/api/contas` - POST)
```python
@app.route('/api/contas', methods=['POST'])
@requer_login
def criar_conta():
```
- Requer autenticação
- Cria nova conta para usuário logado
- Retorna mensagem de sucesso e ID da conta

#### Atualizar Conta (`/api/contas/<id>` - PUT)
```python
@app.route('/api/contas/<int:id>', methods=['PUT'])
@requer_login
def atualizar_conta(id):
```
- Requer autenticação
- Atualiza dados da conta específica
- Verifica se usuário é dono da conta
- Retorna mensagem de sucesso

#### Deletar Conta (`/api/contas/<id>` - DELETE)
```python
@app.route('/api/contas/<int:id>', methods=['DELETE'])
@requer_login
def deletar_conta(id):
```
- Requer autenticação
- Remove conta específica
- Verifica se usuário é dono da conta
- Retorna mensagem de sucesso

## Segurança

### Decorator de Login
```python
def requer_login(f):
```
- Verifica se usuário está autenticado
- Protege rotas que necessitam de autenticação
- Retorna erro 401 se não autenticado

## Como Usar

1. **Registro de Usuário**:
   - POST para `/api/registrar`
   - Enviar: `{"username": "seu_usuario", "password": "sua_senha"}`

2. **Login**:
   - POST para `/api/login`
   - Enviar: `{"username": "seu_usuario", "password": "sua_senha"}`

3. **Gerenciar Contas**:
   - Criar: POST para `/api/contas`
   - Listar: GET para `/api/contas`
   - Atualizar: PUT para `/api/contas/<id>`
   - Deletar: DELETE para `/api/contas/<id>`

4. **Logout**:
   - POST para `/api/logout`

## Observações
- Todas as senhas são criptografadas antes de salvar
- Sessões são gerenciadas via cookies
- CORS configurado para permitir apenas domínios específicos
- Sistema usa PostgreSQL em produção e SQLite em desenvolvimento

## Links do Projeto
- Frontend: https://sistema-financeiro3.onrender.com
- Backend: https://sistema-financeiro.onrender.com/api 