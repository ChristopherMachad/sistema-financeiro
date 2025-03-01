// Configuração da API
const API_URL = 'https://sistema-financeiro-btjl.onrender.com/api';

// Elementos do DOM
const authContainer = document.getElementById('auth-container');
const mainContainer = document.getElementById('main-container');
const loginForm = document.getElementById('login-form');
const toggleRegister = document.getElementById('toggle-register');
const logoutBtn = document.getElementById('logout-btn');
const contaForm = document.getElementById('conta-form');
const salvarContaBtn = document.getElementById('salvar-conta');
const filtroTipo = document.getElementById('filtro-tipo');
const filtroStatus = document.getElementById('filtro-status');

// Estado da aplicação
let isRegistering = false;
let editandoConta = null;

// Configuração padrão para todas as requisições fetch
const fetchConfig = {
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json'
    }
};

// Funções auxiliares
function mostrarMensagem(mensagem, tipo = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${tipo} alert-dismissible fade show`;
    alert.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

function formatarValor(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// Autenticação
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_URL}/${isRegistering ? 'registrar' : 'login'}`, {
            ...fetchConfig,
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensagem(data.mensagem);
            if (!isRegistering) {
                authContainer.classList.add('d-none');
                mainContainer.classList.remove('d-none');
                carregarContas();
            } else {
                toggleRegister.click();
            }
        } else {
            mostrarMensagem(data.erro, 'danger');
        }
    } catch (error) {
        mostrarMensagem('Erro ao conectar com o servidor', 'danger');
    }
});

toggleRegister.addEventListener('click', (e) => {
    e.preventDefault();
    isRegistering = !isRegistering;
    const titulo = document.querySelector('#auth-container h2');
    const botao = document.querySelector('#login-form button[type="submit"]');
    const texto = document.querySelector('#toggle-register');
    
    if (isRegistering) {
        titulo.textContent = 'Registro';
        botao.textContent = 'Registrar';
        texto.textContent = 'Já tem uma conta? Faça login';
    } else {
        titulo.textContent = 'Login';
        botao.textContent = 'Entrar';
        texto.textContent = 'Não tem uma conta? Registre-se';
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await fetch(`${API_URL}/logout`, {
            ...fetchConfig,
            method: 'POST'
        });
        mainContainer.classList.add('d-none');
        authContainer.classList.remove('d-none');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    } catch (error) {
        mostrarMensagem('Erro ao fazer logout', 'danger');
    }
});

// Gerenciamento de contas
async function carregarContas() {
    try {
        const response = await fetch(`${API_URL}/contas`, fetchConfig);
        if (response.ok) {
            const contas = await response.json();
            exibirContas(contas);
        } else {
            if (response.status === 401) {
                mainContainer.classList.add('d-none');
                authContainer.classList.remove('d-none');
            }
            const data = await response.json();
            mostrarMensagem(data.erro, 'danger');
        }
    } catch (error) {
        mostrarMensagem('Erro ao carregar contas', 'danger');
    }
}

function exibirContas(contas) {
    const tbody = document.getElementById('contas-lista');
    tbody.innerHTML = '';
    
    const tipoFiltrado = filtroTipo.value;
    const statusFiltrado = filtroStatus.value;
    
    contas
        .filter(conta => 
            (!tipoFiltrado || conta.tipo === tipoFiltrado) &&
            (!statusFiltrado || conta.status === statusFiltrado)
        )
        .forEach(conta => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${conta.descricao}</td>
                <td class="${conta.tipo === 'receber' ? 'valor-positivo' : 'valor-negativo'}">
                    ${formatarValor(conta.valor)}
                </td>
                <td>${formatarData(conta.data_vencimento)}</td>
                <td>${conta.tipo === 'pagar' ? 'A Pagar' : 'A Receber'}</td>
                <td>
                    <span class="status-badge status-${conta.status}">
                        ${conta.status.charAt(0).toUpperCase() + conta.status.slice(1)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary btn-action" onclick="editarConta(${conta.id})">
                        Editar
                    </button>
                    <button class="btn btn-sm btn-danger btn-action" onclick="deletarConta(${conta.id})">
                        Excluir
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
}

async function salvarConta() {
    try {
        const formData = {
            descricao: document.getElementById('conta-descricao').value,
            valor: parseFloat(document.getElementById('conta-valor').value),
            data_vencimento: document.getElementById('conta-vencimento').value,
            tipo: document.getElementById('conta-tipo').value,
            status: document.getElementById('conta-status').value
        };

        const id = document.getElementById('conta-id').value;
        const url = id ? `${API_URL}/contas/${id}` : `${API_URL}/contas`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            ...fetchConfig,
            method: method,
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (response.ok) {
            mostrarMensagem(data.mensagem);
            const modal = bootstrap.Modal.getInstance(document.getElementById('contaModal'));
            modal.hide();
            carregarContas();
        } else {
            if (response.status === 401) {
                mainContainer.classList.add('d-none');
                authContainer.classList.remove('d-none');
                mostrarMensagem('Sessão expirada. Por favor, faça login novamente.', 'warning');
            } else {
                mostrarMensagem(data.erro, 'danger');
            }
        }
    } catch (error) {
        mostrarMensagem('Erro ao salvar conta', 'danger');
    }
}

async function editarConta(id) {
    try {
        const response = await fetch(`${API_URL}/contas/${id}`);
        if (response.ok) {
            const conta = await response.json();
            document.getElementById('conta-id').value = conta.id;
            document.getElementById('conta-descricao').value = conta.descricao;
            document.getElementById('conta-valor').value = conta.valor;
            document.getElementById('conta-vencimento').value = conta.data_vencimento;
            document.getElementById('conta-tipo').value = conta.tipo;
            document.getElementById('conta-status').value = conta.status;
            
            document.querySelector('#contaModal .modal-title').textContent = 'Editar Conta';
            new bootstrap.Modal(document.getElementById('contaModal')).show();
        } else {
            const data = await response.json();
            mostrarMensagem(data.erro, 'danger');
        }
    } catch (error) {
        mostrarMensagem('Erro ao carregar conta', 'danger');
    }
}

async function deletarConta(id) {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    
    try {
        const response = await fetch(`${API_URL}/contas/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensagem(data.mensagem);
            carregarContas();
        } else {
            mostrarMensagem(data.erro, 'danger');
        }
    } catch (error) {
        mostrarMensagem('Erro ao excluir conta', 'danger');
    }
}

// Event Listeners
document.getElementById('contaModal').addEventListener('show.bs.modal', () => {
    if (!document.getElementById('conta-id').value) {
        document.querySelector('#contaModal .modal-title').textContent = 'Nova Conta';
        document.getElementById('conta-form').reset();
    }
});

salvarContaBtn.addEventListener('click', salvarConta);

[filtroTipo, filtroStatus].forEach(filtro => {
    filtro.addEventListener('change', carregarContas);
});