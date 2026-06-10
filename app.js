// app.js - Banco de Dados Local (LocalStorage) para PrintPro

const DADOS_INICIAIS = [
    {
        id: "1",
        nome: "Claudio Ramos",
        tag: "PRN-9902",
        problema: "Vazamento de toner azul no lado direito das impressões coloridas.",
        status: "pendente",
        resolucao: "",
        dataFim: "",
        tecnico: ""
    },
    {
        id: "2",
        nome: "Gráfica Criciúma",
        tag: "HP-1020",
        problema: "Troca de rolete efetuada e limpeza interna concluída.",
        status: "concluido",
        resolucao: "Substituição completa do kit de tração de papel e limpeza do laser cleaner.",
        dataFim: "04/03/2026",
        tecnico: "Admin"
    }
];

function inicializarBD() {
    if (!localStorage.getItem('printpro_chamados')) {
        localStorage.setItem('printpro_chamados', JSON.stringify(DADOS_INICIAIS));
    }
}

function obterChamados() {
    inicializarBD();
    return JSON.parse(localStorage.getItem('printpro_chamados'));
}

function salvarChamados(chamados) {
    localStorage.setItem('printpro_chamados', JSON.stringify(chamados));
}

document.addEventListener('DOMContentLoaded', () => {
    inicializarBD();
    
    // ==========================================
    // LÓGICA DA PÁGINA DO CLIENTE (cliente.html)
    // ==========================================
    const supportForm = document.getElementById('support-form');
    if (supportForm) {
        supportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nomeInput = document.getElementById('client-name');
            const tagInput = document.getElementById('tag');
            const problemInput = document.getElementById('problem');
            
            const novoChamado = {
                id: Date.now().toString(),
                nome: nomeInput ? nomeInput.value : "Cliente Anônimo",
                tag: tagInput.value,
                problema: problemInput.value,
                status: "pendente",
                resolucao: "",
                dataFim: "",
                tecnico: ""
            };
            
            const chamados = obterChamados();
            chamados.push(novoChamado);
            salvarChamados(chamados);
            
            this.style.display = 'none';
            document.getElementById('success-msg').classList.remove('hidden');
        });
    }
    
    // ==================================================
    // LÓGICA DA PÁGINA ADMINISTRATIVA (administrador.html)
    // ==================================================
    const tbodyChamados = document.getElementById('tbody-chamados');
    const tbodyConcluidos = document.getElementById('tbody-concluidos');
    
    if (tbodyChamados || tbodyConcluidos) {
        let idChamadoEmEdicao = null;
        
        function renderizarTabelas() {
            const chamados = obterChamados();
            
            if (tbodyChamados) tbodyChamados.innerHTML = '';
            if (tbodyConcluidos) tbodyConcluidos.innerHTML = '';
            
            chamados.forEach(chamado => {
                if (chamado.status !== 'concluido') {
                    if (!tbodyChamados) return;
                    
                    const tr = document.createElement('tr');
                    let textoStatus = 'Pendente';
                    let classeBadge = '';
                    
                    if (chamado.status === 'atendimento') {
                        textoStatus = 'Em Atendimento';
                        classeBadge = 'status-atendimento';
                    } else if (chamado.status === 'aguardando') {
                        textoStatus = 'Aguardando Peça';
                        classeBadge = 'status-aguardando';
                    }
                    
                    tr.innerHTML = `
                        <td data-label="Nome">${chamado.nome}</td>
                        <td data-label="Máquina" class="tag-id">${chamado.tag}</td>
                        <td data-label="Descrição">${chamado.problema}</td>
                        <td data-label="Status"><span class="status-badge ${classeBadge}">${textoStatus}</span></td>
                        <td data-label="Ações">
                            <button class="btn-edit" onclick="abrirEConfigurarModal('${chamado.id}')">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        </td>
                    `;
                    tbodyChamados.appendChild(tr);
                } else {
                    if (!tbodyConcluidos) return;
                    
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td data-label="Data Fim">${chamado.dataFim || 'N/A'}</td>
                        <td data-label="Máquina" class="tag-id">${chamado.tag}</td>
                        <td data-label="Resolução Final">${chamado.resolucao || 'Nenhuma nota informada.'}</td>
                        <td data-label="Técnico">${chamado.tecnico || 'Admin'}</td>
                        <td data-label="Status"><span class="status-badge status-concluido">Finalizado</span></td>
                    `;
                    tbodyConcluidos.appendChild(tr);
                }
            });
        }
        
        // Configuração do Modal de Edição
        window.abrirEConfigurarModal = function(id) {
            idChamadoEmEdicao = id;
            const chamados = obterChamados();
            const chamado = chamados.find(c => c.id === id);
            
            if (chamado) {
                document.getElementById('modal-status').value = chamado.status;
                // Carrega o campo correto no modal baseado no que está salvo
                document.getElementById('modal-resolucao').value = chamado.problema || chamado.resolucao;
                openModal(); 
            }
        };
        
        // Submissão da Edição de Chamado
        const modalForm = document.getElementById('modal-form');
        if (modalForm) {
            modalForm.addEventListener('submit', function(e) {
                e.preventDefault();
                if (!idChamadoEmEdicao) return;
                
                const novoStatus = document.getElementById('modal-status').value;
                const novaResolucao = document.getElementById('modal-resolucao').value;
                
                const chamados = obterChamados();
                const index = chamados.findIndex(c => c.id === idChamadoEmEdicao);
                
                if (index !== -1) {
                    chamados[index].status = novoStatus;
                    
                    // =========================================================
                    // CORREÇÃO DO BUG DE ATUALIZAÇÃO:
                    // Atualiza o 'problema' para refletir em tempo real na listagem!
                    // =========================================================
                    chamados[index].problema = novaResolucao; 
                    chamados[index].resolucao = novaResolucao;
                    
                    if (novoStatus === 'concluido') {
                        const hoje = new Date();
                        const dia = String(hoje.getDate()).padStart(2, '0');
                        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
                        const ano = hoje.getFullYear();
                        
                        chamados[index].dataFim = `${dia}/${mes}/${ano}`;
                        chamados[index].tecnico = "Admin";
                    }
                    
                    salvarChamados(chamados);
                    renderizarTabelas(); // Agora a tabela redesenha com os valores certos atualizados!
                    closeModal();
                }
            });
        }

        // Submissão da Criação de Novo Chamado (Via Admin)
        const criarForm = document.getElementById('criar-form');
        if (criarForm) {
            criarForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const nome = document.getElementById('criar-nome').value;
                const tag = document.getElementById('criar-tag').value;
                const problema = document.getElementById('criar-problema').value;
                const status = document.getElementById('criar-status').value;
                
                const novoChamado = {
                    id: Date.now().toString(),
                    nome: nome,
                    tag: tag,
                    problema: problema,
                    status: status,
                    resolucao: "",
                    dataFim: "",
                    tecnico: ""
                };
                
                if (status === 'concluido') {
                    const hoje = new Date();
                    novoChamado.dataFim = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
                    novoChamado.tecnico = "Admin";
                    novoChamado.resolucao = problema; 
                }
                
                const chamados = obterChamados();
                chamados.push(novoChamado);
                salvarChamados(chamados);
                
                renderizarTabelas();
                this.reset();
                closeCriarModal();
            });
        }
        
        renderizarTabelas();
    }
});