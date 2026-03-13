/**
 * app.js - Lógica Principal (Vanilla JS)
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State & Data ---
    let budgets = JSON.parse(localStorage.getItem('constru_budgets')) || [];
    let workers = JSON.parse(localStorage.getItem('constru_workers')) || [];
    let templates = JSON.parse(localStorage.getItem('constru_templates')) || [];
    let userProfile = localStorage.getItem('constru_profile') || 'architect'; // architect or constructor

    // Seleccionador de Perfil
    const profileSelect = document.getElementById('user-profile-select');
    if (profileSelect) {
        profileSelect.value = userProfile;
        profileSelect.addEventListener('change', (e) => {
            userProfile = e.target.value;
            localStorage.setItem('constru_profile', userProfile);
            applyProfileRestrictions();
            switchView('dashboard'); // Refresh current view
        });
    }

    function applyProfileRestrictions() {
        const isArchitect = userProfile === 'architect';

        const tabContratos = document.getElementById('tab-btn-contratos');
        const tabAssignment = document.getElementById('tab-btn-assignment');
        const btnApprove = document.getElementById('btn-status-approve');
        const btnReject = document.getElementById('btn-status-reject');
        const sideMenuWorkers = document.querySelector('a[data-view="workers"]');
        const btnCreateTemplate = document.getElementById('btn-create-template');

        if (isArchitect) {
            if (tabContratos) tabContratos.style.display = 'none';
            if (tabAssignment) tabAssignment.style.display = 'none';
            if (btnApprove) btnApprove.style.display = 'none';
            if (btnReject) btnReject.style.display = 'none';
            if (sideMenuWorkers) sideMenuWorkers.parentElement.style.display = 'none';
            if (btnCreateTemplate) btnCreateTemplate.style.display = 'inline-block';
        } else {
            if (tabContratos) tabContratos.style.display = 'inline-block';
            if (tabAssignment) tabAssignment.style.display = 'inline-block';
            if (btnApprove) btnApprove.style.display = 'inline-block';
            if (btnReject) btnReject.style.display = 'inline-block';
            if (sideMenuWorkers) sideMenuWorkers.parentElement.style.display = 'block';
            if (btnCreateTemplate) btnCreateTemplate.style.display = 'none';
        }
    }

    // Variables para el Editor de Presupuestos
    let currentBudgetId = null;
    let isEditingTemplate = false;
    let currentPhases = []; // Replaces currentItems. Array of: {id, name, items: []}
    let currentUnexpected = [];
    let currentBudgetWorkers = []; // Trabajadores asignados al presupuesto actual
    let currentFiles = []; // {id, name, url, type}
    let currentContracts = []; // {id, title, status, signedDate}

    // Variables para Workers
    let currentWorkerId = null;
    let currentWorkerAdvances = [];
    let currentWorkerTransport = [];

    // Variables de Gráficos
    let revenueChartInstance = null;
    let categoryChartInstance = null;
    let statusChartInstance = null;

    // Elementos del DOM - Navegación
    const navLinks = document.querySelectorAll('.nav-links a');
    const viewTitle = document.getElementById('view-title');
    const views = document.querySelectorAll('.content-view');

    // Botones Globales
    const btnCreateBudget = document.getElementById('btn-create-budget');
    const btnCreateFirst = document.getElementById('btn-create-first');
    const btnBack = document.getElementById('btn-back');
    const btnSaveBudget = document.getElementById('btn-save-budget');
    const btnExportPdf = document.getElementById('btn-export-pdf');

    // Elementos Editor
    const editorProjectName = document.getElementById('editor-project-name');
    const editorCategory = document.getElementById('editor-category');
    const editorClient = document.getElementById('editor-client');
    const summaryClientPrice = document.getElementById('summary-client-price');

    // Contenedores de listas
    const itemsList = document.getElementById('editor-items-list');
    const unexpectedList = document.getElementById('editor-unexpected-list');
    const dashboardBudgetsList = document.getElementById('dashboard-budgets-list');

    // Contenedores separadores de estado
    const inprogressBudgetsTbody = document.getElementById('inprogress-budgets-tbody');
    const approvedBudgetsTbody = document.getElementById('approved-budgets-tbody');
    const completedBudgetsTbody = document.getElementById('completed-budgets-tbody');
    const pendingBudgetsTbody = document.getElementById('pending-budgets-tbody');
    const rejectedBudgetsTbody = document.getElementById('rejected-budgets-tbody');
    const templatesTbody = document.getElementById('templates-tbody');

    // Controles de estado
    const btnApprove = document.getElementById('btn-status-approve');
    const btnReject = document.getElementById('btn-status-reject');
    const editorStatusBadge = document.getElementById('editor-status-badge');
    let currentStatus = 'pending';

    const statusMap = {
        'pending': { label: 'Pendiente', class: 'badge-pending' },
        'approved': { label: 'Aprobado', class: 'badge-approved' },
        'rejected': { label: 'Rechazado', class: 'badge-rejected' },
        'in-progress': { label: 'En Curso', class: 'badge-in-progress' },
        'completed': { label: 'Terminado', class: 'badge-completed' }
    };

    // --- Funciones de Navegación ---
    function switchView(viewId) {
        currentView = viewId;
        views.forEach(v => { v.classList.remove('active-view'); v.classList.add('hidden-view'); });
        document.getElementById(`view-${viewId}`).classList.remove('hidden-view');
        document.getElementById(`view-${viewId}`).classList.add('active-view');

        navLinks.forEach(link => {
            link.parentElement.classList.remove('active');
            if (link.getAttribute('data-view') === viewId) {
                link.parentElement.classList.add('active');
            }
        });

        if (viewId === 'dashboard') {
            viewTitle.textContent = 'Dashboard Financiero';
            btnCreateBudget.style.display = 'block';
            updateDashboard();
            applyProfileRestrictions(); // Apply restrictions when switching to dashboard
        } else if (viewId === 'budgets') {
            viewTitle.textContent = 'Todos los Presupuestos';
            btnCreateBudget.style.display = 'block';
            updateBudgetsList();
        } else if (viewId === 'workers') {
            viewTitle.textContent = 'Pagos a Trabajadores';
            btnCreateBudget.style.display = 'none';
            updateWorkersList();
        } else if (viewId === 'editor') {
            viewTitle.textContent = 'Generador de Presupuestos';
            btnCreateBudget.style.display = 'none';
        } else if (viewId === 'templates') {
            viewTitle.textContent = 'Plantillas de Proyectos';
            btnCreateBudget.style.display = 'none';
            updateTemplatesList();
        } else if (viewId === 'worker-editor') {
            viewTitle.textContent = 'Editar Trabajador';
            btnCreateBudget.style.display = 'none';
        } else {
            viewTitle.textContent = viewId.charAt(0).toUpperCase() + viewId.slice(1);
            btnCreateBudget.style.display = 'block';
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.getAttribute('data-view');
            if (targetView && document.getElementById(`view-${targetView}`)) switchView(targetView);
        });
    });

    // --- Lógica de Dashboards ---
    function formatMoney(amount) {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
    }

    function updateDashboard() {
        const emptyState = document.getElementById('dashboard-empty-state');

        let totalBudgeted = 0;
        let totalRealProfit = 0;
        let totalUnexpected = 0;
        let totalWorkersAdvances = workers.reduce((acc, worker) => {
            const advSum = (worker.advances || []).reduce((a, b) => a + Number(b.amount || 0), 0);
            const transportSum = (worker.transport || []).reduce((a, b) => a + Number(b.amount || 0), 0);
            return acc + advSum + transportSum;
        }, 0);

        if (budgets.length === 0) {
            emptyState.style.display = 'block';
            dashboardBudgetsList.innerHTML = '';
            document.getElementById('dashboard-charts-section').style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            dashboardBudgetsList.innerHTML = '';
            document.getElementById('dashboard-charts-section').style.display = 'grid';

            // Tomar los últimos 3 presupuestos
            const recent = [...budgets].reverse().slice(0, 3);
            recent.forEach(b => {
                totalBudgeted += b.baseCost;
                totalRealProfit += b.finalProfit;
                totalUnexpected += b.unexpectedCost;

                const bStatus = b.status || 'pending';
                const statusBadge = `<span class="badge ${statusMap[bStatus].class}">${statusMap[bStatus].label}</span>`;

                const card = document.createElement('div');
                card.className = 'budget-card';
                card.innerHTML = `
                    <div class="budget-card-header">
                        <h4>${b.name || 'Sin Título'}</h4>
                        ${statusBadge}
                    </div>
                    <div class="budget-card-body">
                        <p>Cliente: ${b.client || 'N/A'}</p>
                        <p>Total Costo: <strong>${formatMoney(b.baseCost + b.unexpectedCost)}</strong></p>
                        <p>Cobrado: <strong>${formatMoney(b.clientPrice)}</strong></p>
                        <hr>
                        <p class="profit-text">Ganancia Real: <strong>${formatMoney(b.finalProfit)}</strong></p>
                    </div>
                    <div class="budget-card-footer">
                        <small>${new Date(b.date).toLocaleDateString()}</small>
                        <button class="btn-secondary btn-sm" onclick="editBudget('${b.id}')">Abrir</button>
                    </div>
                `;
                dashboardBudgetsList.appendChild(card);
            });

            // Recalcular métricas globales (de todos los presupuestos, no solo recientes)
            totalBudgeted = budgets.reduce((acc, curr) => acc + curr.baseCost, 0);

            // Ganancia real SOLO de los proyectos aprobados y terminados
            totalRealProfit = budgets.reduce((acc, curr) => {
                const s = curr.status || 'pending';
                if (s === 'approved' || s === 'completed') {
                    return acc + curr.finalProfit;
                }
                return acc;
            }, 0);

            totalUnexpected = budgets.reduce((acc, curr) => acc + curr.unexpectedCost, 0);

        }

        document.getElementById('stat-total-budgeted').textContent = formatMoney(totalBudgeted);
        document.getElementById('stat-total-profit').textContent = formatMoney(totalRealProfit);
        document.getElementById('stat-total-unexpected').textContent = formatMoney(totalUnexpected);
        document.getElementById('stat-total-workers').textContent = formatMoney(totalWorkersAdvances);

        if (budgets.length > 0) {
            updateCharts();
        }
    }

    function updateCharts() {
        const ctxRev = document.getElementById('revenueChart');
        const ctxCat = document.getElementById('categoryChart');
        const ctxStatus = document.getElementById('statusChart');
        if (!ctxRev || !ctxCat || !ctxStatus) return;

        // Destruir gráficos anteriores si existen
        if (revenueChartInstance) revenueChartInstance.destroy();
        if (categoryChartInstance) categoryChartInstance.destroy();
        if (statusChartInstance) statusChartInstance.destroy();

        // 1. Gráfico de Ingresos y Ganancias por Mes (Solo presupuestos realizados/terminados o aprobados)
        const monthlyData = {};
        const revenueBudgets = budgets.filter(b => (b.status === 'completed' || b.status === 'approved' || b.status === 'in-progress' || !b.status));

        revenueBudgets.forEach(b => {
            const date = new Date(b.date);
            const monthYear = date.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' });
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { revenue: 0, profit: 0 };
            }
            monthlyData[monthYear].revenue += (b.clientPrice > 0 ? b.clientPrice : (b.baseCost + b.unexpectedCost));
            monthlyData[monthYear].profit += b.finalProfit;
        });

        const labelsRev = Object.keys(monthlyData);
        const dataRevenue = labelsRev.map(k => monthlyData[k].revenue);
        const dataProfit = labelsRev.map(k => monthlyData[k].profit);

        revenueChartInstance = new Chart(ctxRev, {
            type: 'bar',
            data: {
                labels: labelsRev,
                datasets: [
                    {
                        label: 'Ingresos Totales',
                        data: dataRevenue,
                        backgroundColor: 'rgba(37, 99, 235, 0.8)',
                        borderRadius: 4
                    },
                    {
                        label: 'Ganancia Neta',
                        data: dataProfit,
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Rendimiento por Mes', font: { size: 16 } }
                }
            }
        });

        // 2. Gráfico de Ganancias por Proyecto (Donut)
        // Tomaremos solo los presupuestos que tengan ganancia > 0 o simplemente todos.
        const validBudgets = budgets.filter(b => b.finalProfit > 0);

        const labelsCat = validBudgets.map(b => b.name || 'Sin Título');
        const dataCat = validBudgets.map(b => b.finalProfit);

        const catColors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6', '#f43f5e'];

        categoryChartInstance = new Chart(ctxCat, {
            type: 'doughnut',
            data: {
                labels: labelsCat,
                datasets: [{
                    data: dataCat,
                    backgroundColor: catColors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Ganancias por Proyecto', font: { size: 16 } },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(context.parsed);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });

        // 3. Gráfico de Cantidad de Presupuestos por Estado
        const statusCounts = {
            'approved': 0,
            'rejected': 0,
            'in-progress': 0,
            'completed': 0,
            'pending': 0
        };

        budgets.forEach(b => {
            const s = b.status || 'pending';
            if (statusCounts[s] !== undefined) statusCounts[s]++;
        });

        const statusLabels = ['Aprobados', 'En Curso', 'Terminados', 'Rechazados', 'Pendientes'];
        const statusData = [
            statusCounts['approved'],
            statusCounts['in-progress'],
            statusCounts['completed'],
            statusCounts['rejected'],
            statusCounts['pending']
        ];
        // Colors corresponding to styles.css badges logic (Verde, Naranja, Azul, Rojo, Gris)
        const statusBgColors = ['#166534', '#f59e0b', '#1e40af', '#991b1b', '#64748b'];

        statusChartInstance = new Chart(ctxStatus, {
            type: 'pie', // Or bar/doughnut
            data: {
                labels: statusLabels,
                datasets: [{
                    data: statusData,
                    backgroundColor: statusBgColors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Presupuestos por Estado', font: { size: 16 } }
                }
            }
        });
    }

    function createBudgetRow(b, asActive) {
        const tr = document.createElement('tr');
        const bStatus = b.status || 'pending';
        let actionButtons = `<button class="btn-secondary btn-sm" onclick="editBudget('${b.id}')">Ver / Editar</button>`;

        if (asActive) {
            if (bStatus === 'approved') {
                actionButtons += `<button class="btn-secondary btn-sm" style="color: var(--warning); margin-left: 5px;" onclick="changeStatus('${b.id}', 'in-progress')">Iniciar Trabajo</button>`;
            } else if (bStatus === 'in-progress') {
                actionButtons += `<button class="btn-secondary btn-sm" style="color: var(--success); margin-left: 5px;" onclick="changeStatus('${b.id}', 'completed')">Terminar</button>`;
            }
        } else {
            actionButtons += `<button class="btn-danger btn-sm" onclick="deleteBudget('${b.id}')" style="margin-left:5px;">Borrar</button>`;
        }

        tr.innerHTML = `
            <td><strong>${b.name}</strong><br><small>${b.client}</small></td>
            <td><span class="badge" style="background:var(--bg-color)">${b.category}</span></td>
            <td>${formatMoney(b.baseCost)}</td>
            <td>${formatMoney(b.baseCost + b.unexpectedCost)}</td>
            <td class="${b.finalProfit >= 0 ? 'text-success' : 'text-danger'}"><strong>${formatMoney(b.finalProfit)}</strong></td>
            <td><span class="badge ${statusMap[bStatus].class}">${statusMap[bStatus].label}</span></td>
            <td>${actionButtons}</td>
        `;
        return tr;
    }

    function updateBudgetsList() {
        if (!inprogressBudgetsTbody) return; // Si no estamos en la página correcta

        inprogressBudgetsTbody.innerHTML = '';
        approvedBudgetsTbody.innerHTML = '';
        completedBudgetsTbody.innerHTML = '';
        pendingBudgetsTbody.innerHTML = '';
        rejectedBudgetsTbody.innerHTML = '';

        const searchInput = document.getElementById('search-budgets');
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

        [...budgets].reverse().forEach(b => {
            if (searchTerm) {
                const matchName = b.name && b.name.toLowerCase().includes(searchTerm);
                const matchClient = b.client && b.client.toLowerCase().includes(searchTerm);
                const matchCategory = b.category && b.category.toLowerCase().includes(searchTerm);
                if (!matchName && !matchClient && !matchCategory) return;
            }

            const s = b.status || 'pending';
            if (s === 'in-progress') {
                inprogressBudgetsTbody.appendChild(createBudgetRow(b, true));
            } else if (s === 'approved') {
                approvedBudgetsTbody.appendChild(createBudgetRow(b, true));
            } else if (s === 'completed') {
                completedBudgetsTbody.appendChild(createBudgetRow(b, true));
            } else if (s === 'rejected') {
                rejectedBudgetsTbody.appendChild(createBudgetRow(b, false));
            } else {
                pendingBudgetsTbody.appendChild(createBudgetRow(b, false));
            }
        });
    }

    const searchBudgetsInput = document.getElementById('search-budgets');
    if (searchBudgetsInput) {
        searchBudgetsInput.addEventListener('input', updateBudgetsList);
    }

    window.changeStatus = (id, newStatus) => {
        const bIndex = budgets.findIndex(x => x.id === id);
        if (bIndex > -1) {
            budgets[bIndex].status = newStatus;
            localStorage.setItem('constru_budgets', JSON.stringify(budgets));
            updateBudgetsList();
            updateDashboard();
        }
    };

    window.editBudget = (id) => {
        const b = budgets.find(x => x.id === id);
        if (b) openEditor(b);
    };

    window.deleteBudget = (id) => {
        if (confirm('¿Estás seguro de eliminar este presupuesto?')) {
            budgets = budgets.filter(x => x.id !== id);
            localStorage.setItem('constru_budgets', JSON.stringify(budgets));
            updateBudgetsList();
            updateDashboard();
        }
    }

    // --- Lógica de Plantillas ---
    function updateTemplatesList() {
        if (!templatesTbody) return;
        templatesTbody.innerHTML = '';
        [...templates].reverse().forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${t.name}</strong></td>
                <td><span class="badge" style="background:var(--bg-color)">${t.category}</span></td>
                <td>${formatMoney(t.baseCost)}</td>
                <td>
                    <button class="btn-secondary btn-sm" onclick="useTemplate('${t.id}')">Crear Presupuesto</button>
                    ${userProfile === 'architect' ? `<button class="btn-secondary btn-sm" onclick="editTemplate('${t.id}')">Editar</button>
                    <button class="btn-danger btn-sm" onclick="deleteTemplate('${t.id}')" style="margin-left:5px;">Borrar</button>` : ''}
                </td>
            `;
            templatesTbody.appendChild(tr);
        });
    }

    const btnCreateTemplate = document.getElementById('btn-create-template');
    if (btnCreateTemplate) {
        btnCreateTemplate.addEventListener('click', () => {
            isEditingTemplate = true;
            openEditor({
                id: 'tpl_' + Date.now(),
                name: 'Nueva Plantilla',
                category: '',
                client: 'Plantilla Generica',
                clientPrice: 0,
                status: 'pending',
                phases: [],
                unexpectedItems: [],
                files: [],
                contracts: [],
                assignedWorkers: []
            });
        });
    }

    window.editTemplate = (id) => {
        const t = templates.find(x => x.id === id);
        if (t) {
            isEditingTemplate = true;
            openEditor(t);
        }
    };

    window.useTemplate = (id) => {
        const t = templates.find(x => x.id === id);
        if (t) {
            isEditingTemplate = false;
            const newBudget = JSON.parse(JSON.stringify(t));
            newBudget.id = 'bud_' + Date.now();
            newBudget.name = 'Nuevo desde: ' + t.name;
            newBudget.client = '';
            newBudget.clientPrice = 0;
            newBudget.status = 'pending';
            openEditor(newBudget);
        }
    }

    window.deleteTemplate = (id) => {
        if (confirm('¿Estás seguro de eliminar esta plantilla?')) {
            templates = templates.filter(x => x.id !== id);
            localStorage.setItem('constru_templates', JSON.stringify(templates));
            updateTemplatesList();
        }
    }

    // --- Manejo del Editor ---
    function openEditor(budget = null) {
        // Enforce isEditingTemplate flag
        if (!budget || (budget && !budget.id.startsWith('tpl_'))) {
            isEditingTemplate = false;
        }

        switchView('editor');

        if (budget) {
            currentBudgetId = budget.id;
            currentStatus = budget.status || 'pending';
            editorProjectName.value = budget.name;
            editorCategory.value = budget.category || '';
            editorClient.value = budget.client;
            summaryClientPrice.value = budget.clientPrice || 0;
            // Migración retroactiva: si hay items viejos los metemos a una fase por defecto
            if (budget.items && budget.items.length > 0 && !budget.phases) {
                currentPhases = [{ id: 'phase_default', name: 'Partidas Generales', items: [...budget.items] }];
            } else {
                currentPhases = budget.phases ? JSON.parse(JSON.stringify(budget.phases)) : [];
            }
            currentUnexpected = budget.unexpectedItems ? JSON.parse(JSON.stringify(budget.unexpectedItems)) : [];
            currentFiles = budget.files ? JSON.parse(JSON.stringify(budget.files)) : [];
            currentContracts = budget.contracts ? JSON.parse(JSON.stringify(budget.contracts)) : [];
            currentBudgetWorkers = budget.assignedWorkers ? JSON.parse(JSON.stringify(budget.assignedWorkers)) : [];
        } else {
            currentBudgetId = Date.now().toString(); // Generar ID único temporal
            currentStatus = 'pending';
            editorProjectName.value = 'Nuevo Presupuesto';
            editorCategory.value = '';
            editorClient.value = '';
            summaryClientPrice.value = 0;
            currentPhases = [{ id: Date.now().toString(), name: 'Fase 1', items: [] }];
            currentUnexpected = [];
            currentFiles = [];
            currentContracts = [];
            currentBudgetWorkers = [];
        }

        updateEditorStatusUI();
        renderPhasesList();
        calculateSummary();
    }

    function updateEditorStatusUI() {
        editorStatusBadge.className = `badge ${statusMap[currentStatus].class}`;
        editorStatusBadge.textContent = statusMap[currentStatus].label;
        document.getElementById('pdf-status').textContent = statusMap[currentStatus].label;

        // Hide/Show status buttons depending on current status
        if (currentStatus === 'completed' || currentStatus === 'in-progress') {
            btnApprove.style.display = 'none';
            btnReject.style.display = 'none';
        } else {
            btnApprove.style.display = 'inline-flex';
            btnApprove.textContent = currentStatus === 'approved' ? 'Desaprobar' : 'Aprobar';
            btnReject.style.display = 'inline-flex';
            btnReject.textContent = currentStatus === 'rejected' ? 'Des-Rechazar' : 'Rechazar';
        }
        applyProfileRestrictions(); // Apply restrictions to status buttons
    }

    btnApprove.addEventListener('click', () => {
        currentStatus = currentStatus === 'approved' ? 'pending' : 'approved';
        updateEditorStatusUI();
    });

    btnReject.addEventListener('click', () => {
        currentStatus = currentStatus === 'rejected' ? 'pending' : 'rejected';
        updateEditorStatusUI();
    });

    if (btnCreateBudget) btnCreateBudget.addEventListener('click', () => openEditor());
    if (btnCreateFirst) btnCreateFirst.addEventListener('click', () => openEditor());
    if (btnBack) btnBack.addEventListener('click', () => switchView('dashboard'));

    // Tabs eliminados - funciones vacías por compatibilidad
    function switchEditorTab() { /* no-op: tabs removed */ }

    // --- Lógica de Fases e Ítems ---
    const phasesListContainer = document.getElementById('editor-phases-list');

    document.getElementById('btn-add-phase').addEventListener('click', () => {
        currentPhases.push({
            id: 'ph_' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: 'Nueva Fase',
            items: []
        });
        renderPhasesList();
    });

    function createPhaseItemRow(phaseId) {
        const phase = currentPhases.find(p => p.id === phaseId);
        if (!phase) return;
        phase.items.push({
            id: 'it_' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: '',
            unit: 'm2',
            quantity: 1,
            unitPrice: 0,
            total: 0
        });
        renderPhasesList();
        calculateSummary();
    }


    function renderPhasesList() {
        if (!phasesListContainer) return;
        phasesListContainer.innerHTML = '';
        if (currentPhases.length === 0) {
            phasesListContainer.innerHTML = `<div class="empty-item-state" style="padding: 20px; color: #64748b; font-style: italic;">Agrega una fase para comenzar.</div>`;
            return;
        }

        currentPhases.forEach((phase, index) => {
            const phaseDiv = document.createElement('div');
            phaseDiv.className = 'phase-container';

            // Header de la fase
            const header = document.createElement('div');
            header.className = 'phase-header';
            header.innerHTML = `
                <div style="display:flex; align-items:center; gap: 10px; flex:1;">
                    <span style="color:var(--text-secondary); font-size:12px;">FASE ${index + 1}</span>
                    <input type="text" class="phase-title-input" value="${phase.name}" data-pid="${phase.id}">
                </div>
                <div class="phase-actions">
                    <button class="btn-secondary btn-sm btn-add-phase-item" data-pid="${phase.id}">+ Añadir Partida</button>
                    <button class="btn-icon btn-delete-phase" data-pid="${phase.id}" style="color: var(--danger);" title="Eliminar Fase">&times;</button>
                </div>
            `;
            phaseDiv.appendChild(header);

            // Contenedor de items de la fase
            const itemsCont = document.createElement('div');
            itemsCont.style.display = 'flex';
            itemsCont.style.flexDirection = 'column';
            itemsCont.style.gap = '8px';

            if (phase.items.length === 0) {
                itemsCont.innerHTML = `<div class="empty-phase-msg">Fase vacía — usa el botón <strong>+ Añadir Partida</strong> para comenzar.</div>`;
            } else {
                // Columnas de cabecera
                const colsHeader = document.createElement('div');
                colsHeader.className = 'phase-cols-header';
                colsHeader.innerHTML = `
                    <div class="col-desc">Descripción</div>
                    <div class="col-unit">Unidad</div>
                    <div class="col-qty">Cant.</div>
                    <div class="col-price">Precio Un.</div>
                    <div class="col-total">Total</div>
                    <div class="col-del"></div>
                `;
                itemsCont.appendChild(colsHeader);

                phase.items.forEach(item => {
                    const row = document.createElement('div');
                    row.className = 'item-row';

                    row.innerHTML = `
                        <input type="text" class="form-control item-name col-desc" placeholder="Ej: Demolición cerámica" value="${item.name}" data-pid="${phase.id}" data-iid="${item.id}">
                        <input type="text" class="form-control item-unit col-unit" placeholder="m2" value="${item.unit || 'm2'}" data-pid="${phase.id}" data-iid="${item.id}">
                        <input type="number" class="form-control item-qty col-qty" placeholder="1" value="${item.quantity}" min="0" data-pid="${phase.id}" data-iid="${item.id}">
                        <input type="number" class="form-control item-price col-price" placeholder="0" value="${item.unitPrice}" min="0" data-pid="${phase.id}" data-iid="${item.id}">
                        <div class="item-total-read col-total">${formatMoney(item.quantity * item.unitPrice)}</div>
                        <button class="btn-icon btn-delete-pitem col-del" data-pid="${phase.id}" data-iid="${item.id}" title="Eliminar">&times;</button>
                    `;
                    itemsCont.appendChild(row);
                });
            }
            phaseDiv.appendChild(itemsCont);
            phasesListContainer.appendChild(phaseDiv);
        });

        // Re-bind phase title events
        phasesListContainer.querySelectorAll('.phase-title-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const pid = e.target.getAttribute('data-pid');
                const p = currentPhases.find(x => x.id === pid);
                if (p) p.name = e.target.value;
            });
        });

        // Re-bind phase buttons
        phasesListContainer.querySelectorAll('.btn-add-phase-item').forEach(btn => {
            btn.addEventListener('click', (e) => createPhaseItemRow(e.target.getAttribute('data-pid')));
        });

        phasesListContainer.querySelectorAll('.btn-delete-phase').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('¿Eliminar fase completa y sus partidas?')) {
                    currentPhases = currentPhases.filter(p => p.id !== e.target.getAttribute('data-pid'));
                    renderPhasesList();
                    calculateSummary();
                }
            });
        });

        // Re-bind item inputs
        phasesListContainer.querySelectorAll('.item-name, .item-unit, .item-qty, .item-price').forEach(input => {
            input.addEventListener('input', handlePhaseItemChange);
        });

        phasesListContainer.querySelectorAll('.btn-delete-pitem').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pid = e.target.getAttribute('data-pid');
                const iid = e.target.getAttribute('data-iid');
                const p = currentPhases.find(x => x.id === pid);
                if (p) {
                    p.items = p.items.filter(i => i.id !== iid);
                    renderPhasesList();
                    calculateSummary();
                }
            });
        });
    }

    function handlePhaseItemChange(e) {
        const pid = e.target.getAttribute('data-pid');
        const iid = e.target.getAttribute('data-iid');
        const p = currentPhases.find(x => x.id === pid);
        if (!p) return;
        const item = p.items.find(x => x.id === iid);
        if (!item) return;

        if (e.target.classList.contains('item-name'))  item.name = e.target.value;
        if (e.target.classList.contains('item-unit'))  item.unit = e.target.value;
        if (e.target.classList.contains('item-qty'))   item.quantity = parseFloat(e.target.value) || 0;
        if (e.target.classList.contains('item-price')) item.unitPrice = parseFloat(e.target.value) || 0;

        item.total = item.quantity * item.unitPrice;

        // Update visual total in row without full re-render
        const row = e.target.closest('.item-row');
        if (row) row.querySelector('.item-total-read').textContent = formatMoney(item.total);
        calculateSummary();
    }

    // --- Lógica de Archivos (Planos/Renders) y Contratos ---
    // Secciones ocultas - guardadas por compatibilidad con datos guardados
    const filesListContainer = document.getElementById('editor-files-list');
    const contractsListContainer = document.getElementById('editor-contracts-list');

    document.getElementById('btn-add-file')?.addEventListener('click', () => {
        currentFiles.push({ id: 'file_' + Date.now(), name: '', url: '', type: 'plano' });
        renderFilesList();
    });

    document.getElementById('btn-add-contract')?.addEventListener('click', () => {
        currentContracts.push({ id: 'contract_' + Date.now(), title: '', status: 'pending', signedDate: '' });
        renderContractsList();
    });

    function renderFilesList() {
        if (!filesListContainer) return;
        filesListContainer.innerHTML = '';
        if (currentFiles.length === 0) {
            filesListContainer.innerHTML = `<div class="empty-item-state" style="padding: 20px; color: #64748b; font-style: italic;">No hay archivos o enlaces añadidos.</div>`;
            return;
        }

        currentFiles.forEach(file => {
            const row = document.createElement('div');
            row.className = 'item-row';
            row.style.display = 'flex';
            row.style.gap = '10px';
            row.style.alignItems = 'center';

            row.innerHTML = `
                <select class="form-control file-type" style="flex: 0.5;" data-id="${file.id}">
                    <option value="plano" ${file.type === 'plano' ? 'selected' : ''}>Plano (PDF)</option>
                    <option value="render" ${file.type === 'render' ? 'selected' : ''}>Render 3D</option>
                    <option value="otro" ${file.type === 'otro' ? 'selected' : ''}>Otro</option>
                </select>
                <input type="text" class="form-control file-name" style="flex: 1;" placeholder="Nombre del archivo" value="${file.name}" data-id="${file.id}">
                <input type="text" class="form-control file-url" style="flex: 2;" placeholder="URL / Enlace externo" value="${file.url}" data-id="${file.id}">
                ${file.url ? `<a href="${file.url}" target="_blank" class="btn-secondary btn-sm" style="flex: 0.3;">Abrir</a>` : ''}
                <button class="btn-icon btn-delete-file" data-id="${file.id}" title="Eliminar" style="color: var(--danger);">&times;</button>
            `;
            filesListContainer.appendChild(row);
        });

        filesListContainer.querySelectorAll('.file-type, .file-name, .file-url').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                const file = currentFiles.find(x => x.id === id);
                if (!file) return;
                if (e.target.classList.contains('file-type')) file.type = e.target.value;
                if (e.target.classList.contains('file-name')) file.name = e.target.value;
                if (e.target.classList.contains('file-url')) file.url = e.target.value;
                renderFilesList(); // Re-render to show/hide "Abrir" button
            });
        });

        filesListContainer.querySelectorAll('.btn-delete-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentFiles = currentFiles.filter(f => f.id !== e.target.getAttribute('data-id'));
                renderFilesList();
            });
        });
    }

    function renderContractsList() {
        if (!contractsListContainer) return;
        contractsListContainer.innerHTML = '';
        if (currentContracts.length === 0) {
            contractsListContainer.innerHTML = `<div class="empty-item-state" style="padding: 20px; color: #64748b; font-style: italic;">No hay contratos registrados.</div>`;
            return;
        }

        currentContracts.forEach(contract => {
            const row = document.createElement('div');
            row.className = 'item-row phase-container'; // Reuse styling
            row.style.display = 'flex';
            row.style.gap = '15px';
            row.style.alignItems = 'center';
            row.style.padding = '10px';
            row.style.marginBottom = '10px';

            row.innerHTML = `
                <input type="text" class="form-control contract-title" style="flex: 2;" placeholder="Título del contrato (Ej: Anexo 1)" value="${contract.title}" data-id="${contract.id}">
                
                <div style="flex: 1; display:flex; flex-direction: column; gap: 5px;">
                    <label style="font-size:12px; color:var(--text-secondary);">Estado</label>
                    <select class="form-control contract-status" data-id="${contract.id}" style="${contract.status === 'signed' ? 'background:#f0fdf4; border-color:#86efac;' : ''}">
                        <option value="pending" ${contract.status === 'pending' ? 'selected' : ''}>Pendiente de Firma</option>
                        <option value="signed" ${contract.status === 'signed' ? 'selected' : ''}>Firmado</option>
                    </select>
                </div>

                <div style="flex: 1; display:flex; flex-direction: column; gap: 5px;">
                    <label style="font-size:12px; color:var(--text-secondary);">Fecha de Firma</label>
                    <input type="date" class="form-control contract-date" value="${contract.signedDate}" data-id="${contract.id}">
                </div>

                <button class="btn-icon btn-delete-contract" data-id="${contract.id}" title="Eliminar" style="color: var(--danger); margin-top: 15px;">&times;</button>
            `;
            contractsListContainer.appendChild(row);
        });

        contractsListContainer.querySelectorAll('.contract-title, .contract-status, .contract-date').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                const contract = currentContracts.find(x => x.id === id);
                if (!contract) return;
                if (e.target.classList.contains('contract-title')) contract.title = e.target.value;
                if (e.target.classList.contains('contract-status')) contract.status = e.target.value;
                if (e.target.classList.contains('contract-date')) contract.signedDate = e.target.value;

                if (e.target.classList.contains('contract-status')) renderContractsList(); // Re-render for color change
            });
        });

        contractsListContainer.querySelectorAll('.btn-delete-contract').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentContracts = currentContracts.filter(c => c.id !== e.target.getAttribute('data-id'));
                renderContractsList();
            });
        });
    }

    // --- Lógica de Asignación de Personal al Presupuesto ---
    const assignmentListContainer = document.getElementById('editor-assignment-list');

    document.getElementById('btn-add-budget-worker')?.addEventListener('click', () => {
        if (workers.length === 0) {
            alert('Primero debes crear trabajadores en la sección Personal y Tareas.');
            return;
        }
        currentBudgetWorkers.push({
            id: 'assig_' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
            workerId: workers[0].id,
            phaseId: currentPhases.length > 0 ? currentPhases[0].id : '',
            specificTask: '',
            daysWorked: 0,
            dailyRate: workers[0].dailyRate || 0,
            isContracted: false
        });
        renderAssignmentList();
        calculateSummary();
    });

    function renderAssignmentList() {
        if (!assignmentListContainer) return;
        assignmentListContainer.innerHTML = '';
        if (currentBudgetWorkers.length === 0) {
            assignmentListContainer.innerHTML = `<div class="empty-item-state" style="padding: 20px; color: #64748b; font-style: italic;">No hay personal asignado todavía.</div>`;
            return;
        }

        currentBudgetWorkers.forEach(assig => {
            const row = document.createElement('div');
            row.className = 'item-row phase-container';
            row.style.display = 'flex';
            row.style.flexWrap = 'wrap';
            row.style.gap = '15px';
            row.style.alignItems = 'center';
            row.style.padding = '10px';
            row.style.marginBottom = '10px';

            const workerOpts = workers.map(w => `<option value="${w.id}" ${w.id === assig.workerId ? 'selected' : ''}>${w.name} (${w.role || 'Gral'})</option>`).join('');
            const phaseOpts = currentPhases.map(p => `<option value="${p.id}" ${p.id === assig.phaseId ? 'selected' : ''}>${p.name}</option>`).join('');

            row.innerHTML = `
                <div style="flex: 1; min-width: 150px; display:flex; flex-direction:column; gap:5px;">
                    <label style="font-size:12px; color:var(--text-secondary);">Trabajador</label>
                    <select class="form-control assig-worker" data-id="${assig.id}">
                        ${workerOpts}
                    </select>
                </div>
                <div style="flex: 1; min-width: 150px; display:flex; flex-direction:column; gap:5px;">
                    <label style="font-size:12px; color:var(--text-secondary);">Fase Asignada</label>
                    <select class="form-control assig-phase" data-id="${assig.id}">
                        <option value="">A nivel General</option>
                        ${phaseOpts}
                    </select>
                </div>
                <div style="flex: 1.5; min-width: 150px; display:flex; flex-direction:column; gap:5px;">
                    <label style="font-size:12px; color:var(--text-secondary);">Labor Específica</label>
                    <input type="text" class="form-control assig-task" value="${assig.specificTask}" placeholder="Ej: Pintura Fachada" data-id="${assig.id}">
                </div>
                <div style="flex: 0.5; min-width: 70px; display:flex; flex-direction:column; gap:5px;">
                    <label style="font-size:12px; color:var(--text-secondary);">Días</label>
                    <input type="number" class="form-control assig-days" value="${assig.daysWorked}" min="0" data-id="${assig.id}">
                </div>
                <div style="flex: 1; min-width: 100px; display:flex; flex-direction:column; gap:5px;">
                    <label style="font-size:12px; color:var(--text-secondary);">Trato / Día ($)</label>
                    <input type="number" class="form-control assig-rate" value="${assig.dailyRate}" min="0" data-id="${assig.id}">
                </div>
                 <div style="flex: 0.5; display:flex; flex-direction:column; gap:5px; align-items:center;">
                    <label style="font-size:12px; color:var(--text-secondary);">Contrato</label>
                    <input type="checkbox" class="assig-contract" ${assig.isContracted ? 'checked' : ''} data-id="${assig.id}">
                </div>
                <div style="flex: 1; min-width: 100px; display:flex; flex-direction:column; gap:5px; text-align:right;">
                    <label style="font-size:12px; color:var(--text-secondary);">Total Pagar</label>
                    <div style="font-weight: 600; padding: 10px 0;">${formatMoney(assig.daysWorked * assig.dailyRate)}</div>
                </div>
                <button class="btn-icon btn-delete-assig" data-id="${assig.id}" title="Eliminar" style="color: var(--danger); margin-top:15px;">&times;</button>
            `;
            assignmentListContainer.appendChild(row);
        });

        // Binding events
        assignmentListContainer.querySelectorAll('.assig-worker, .assig-phase, .assig-task, .assig-days, .assig-rate, .assig-contract').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                const assig = currentBudgetWorkers.find(x => x.id === id);
                if (!assig) return;

                if (e.target.classList.contains('assig-worker')) {
                    assig.workerId = e.target.value;
                    const targetWorker = workers.find(w => w.id === assig.workerId);
                    if (targetWorker) {
                        assig.dailyRate = targetWorker.dailyRate || 0;
                    }
                }
                if (e.target.classList.contains('assig-phase')) assig.phaseId = e.target.value;
                if (e.target.classList.contains('assig-task')) assig.specificTask = e.target.value;
                if (e.target.classList.contains('assig-days')) assig.daysWorked = parseFloat(e.target.value) || 0;
                if (e.target.classList.contains('assig-rate')) assig.dailyRate = parseFloat(e.target.value) || 0;
                if (e.target.classList.contains('assig-contract')) assig.isContracted = e.target.checked;

                renderAssignmentList(); // Re-render for totals
                calculateSummary();
            });
            // Update on input for text/number fields for immediate feedback
            if (input.type === 'number' || input.type === 'text') {
                input.addEventListener('input', (e) => {
                    const id = e.target.getAttribute('data-id');
                    const assig = currentBudgetWorkers.find(x => x.id === id);
                    if (!assig) return;
                    if (e.target.classList.contains('assig-task')) assig.specificTask = e.target.value;
                    if (e.target.classList.contains('assig-days')) assig.daysWorked = parseFloat(e.target.value) || 0;
                    if (e.target.classList.contains('assig-rate')) assig.dailyRate = parseFloat(e.target.value) || 0;

                    e.target.closest('.item-row').querySelector('div[style*="font-weight: 600"]').textContent = formatMoney(assig.daysWorked * assig.dailyRate);
                    calculateSummary();
                });
            }
        });

        assignmentListContainer.querySelectorAll('.btn-delete-assig').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentBudgetWorkers = currentBudgetWorkers.filter(a => a.id !== e.target.getAttribute('data-id'));
                renderAssignmentList();
                calculateSummary();
            });
        });
    }

    // Lógica para Imprevistos (Mantiene estructura simple anterior)
    function createUnexpectedItemRow() {
        currentUnexpected.push({
            id: 'un_' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: '', quantity: 1, unitPrice: 0, total: 0
        });
        renderItemsList(unexpectedList, currentUnexpected, 'unexpected');
        calculateSummary();
    }

    document.getElementById('btn-add-unexpected')?.addEventListener('click', createUnexpectedItemRow);

    function renderItemsList(container, itemsArray, type) { // Utilizado solo para imprevistos ahora
        container.innerHTML = '';
        if (itemsArray.length === 0) {
            container.innerHTML = `<div class="empty-item-state" style="padding: 20px; color: #64748b; font-style: italic;">Haz clic en añadir para agregar elementos a tu presupuesto.</div>`;
            return;
        }

        itemsArray.forEach(item => {
            const row = document.createElement('div');
            row.className = 'item-row';
            row.style.display = 'flex';
            row.style.gap = '10px';
            row.style.alignItems = 'center';
            row.innerHTML = `
                <input type="text" class="form-control item-name" style="flex: 2;" placeholder="Descripción del material / labor" value="${item.name}" data-id="${item.id}" data-type="${type}">
                <input type="number" class="form-control item-qty" style="flex: 0.5;" placeholder="Cant." value="${item.quantity}" min="1" data-id="${item.id}" data-type="${type}">
                <input type="number" class="form-control item-price" style="flex: 1;" placeholder="Precio Un." value="${item.unitPrice}" min="0" data-id="${item.id}" data-type="${type}">
                <div class="item-total-read" style="flex: 1; text-align: right; font-weight: 600;">${formatMoney(item.quantity * item.unitPrice)}</div>
                <button class="btn-icon btn-delete-item" data-id="${item.id}" data-type="${type}" title="Eliminar" style="color: var(--danger); font-size: 20px;">&times;</button>
            `;
            container.appendChild(row);
        });

        // Re-bind events
        container.querySelectorAll('.item-name, .item-qty, .item-price').forEach(input => {
            input.addEventListener('input', handleItemChange);
        });

        container.querySelectorAll('.btn-delete-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const t = e.target.getAttribute('data-type');
                if (t === 'unexpected') {
                    currentUnexpected = currentUnexpected.filter(i => i.id !== id);
                    renderItemsList(unexpectedList, currentUnexpected, 'unexpected');
                }
                calculateSummary();
            });
        });
    }

    function handleItemChange(e) {
        const id = e.target.getAttribute('data-id');
        const type = e.target.getAttribute('data-type');
        const list = currentUnexpected;
        const item = list.find(i => i.id === id);

        if (!item) return;

        if (e.target.classList.contains('item-name')) item.name = e.target.value;
        if (e.target.classList.contains('item-qty')) item.quantity = parseFloat(e.target.value) || 0;
        if (e.target.classList.contains('item-price')) item.unitPrice = parseFloat(e.target.value) || 0;

        item.total = item.quantity * item.unitPrice;

        // Update total visual in row
        const row = e.target.closest('.item-row');
        row.querySelector('.item-total-read').textContent = formatMoney(item.total);

        calculateSummary();
    }

    // --- Motor de Cálculos (Resumen) ---
    function calculateSummary() {
        let baseCost = 0;
        currentPhases.forEach(p => {
            p.items.forEach(i => baseCost += (i.quantity * i.unitPrice));
        });

        const totalProjectCost = baseCost;

        const elTotal = document.getElementById('summary-total-cost');
        if (elTotal) elTotal.textContent = formatMoney(totalProjectCost);

        const clientValue = parseFloat(summaryClientPrice ? summaryClientPrice.value : 0) || 0;
        const profit = clientValue - totalProjectCost;
        const profitSpan = document.getElementById('summary-final-profit');
        if (profitSpan) {
            profitSpan.textContent = formatMoney(profit);
            profitSpan.style.color = profit >= 0 ? 'var(--success)' : 'var(--danger)';
        }
    }

    summaryClientPrice.addEventListener('input', calculateSummary);

    // --- Guardado ---
    btnSaveBudget.addEventListener('click', () => {
        const bIndex = budgets.findIndex(b => b.id === currentBudgetId);

        // Calcular totales
        let baseCost = 0;
        currentPhases.forEach(p => p.items.forEach(i => baseCost += (i.quantity * i.unitPrice)));
        const unexpectedCost = currentUnexpected.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
        const workerCost = currentBudgetWorkers.reduce((acc, curr) => acc + (curr.daysWorked * curr.dailyRate), 0);
        const clientPrice = parseFloat(summaryClientPrice.value) || 0;

        const budgetData = {
            id: currentBudgetId,
            name: editorProjectName.value || 'Presupuesto Sin Nombre',
            category: editorCategory.value,
            client: editorClient.value,
            date: new Date().toISOString(),
            phases: currentPhases,
            unexpectedItems: currentUnexpected,
            files: currentFiles,
            contracts: currentContracts,
            assignedWorkers: currentBudgetWorkers,
            baseCost,
            unexpectedCost,
            workerCost,
            clientPrice,
            finalProfit: clientPrice - (baseCost + unexpectedCost + workerCost),
            status: currentStatus
        };

        if (isEditingTemplate) {
            const tIndex = templates.findIndex(t => t.id === currentBudgetId);
            if (tIndex > -1) {
                templates[tIndex] = budgetData;
            } else {
                templates.push(budgetData);
            }
            localStorage.setItem('constru_templates', JSON.stringify(templates));
        } else {
            if (bIndex > -1) {
                budgets[bIndex] = budgetData;
            } else {
                budgets.push(budgetData);
            }
            localStorage.setItem('constru_budgets', JSON.stringify(budgets));
        }

        // Flash success
        const ogText = btnSaveBudget.textContent;
        btnSaveBudget.textContent = '¡Guardado!';
        btnSaveBudget.style.backgroundColor = 'var(--success)';
        setTimeout(() => {
            btnSaveBudget.textContent = ogText;
            btnSaveBudget.style.backgroundColor = 'var(--accent-color)';
            // switchView('dashboard'); // Optional: don't automatically close after saving for better UX when exporting.
        }, 1000);
    });

    // --- Exportación a PDF ---
    if (btnExportPdf) {
        btnExportPdf.addEventListener('click', () => {
            if (currentItems.length === 0) {
                alert("Agrega al menos un material o partida para generar el PDF.");
                return;
            }

            // Llenar datos de la plantilla invisible
            document.getElementById('pdf-project-name').textContent = editorProjectName.value || 'Presupuesto Sin Nombre';
            document.getElementById('pdf-client-name').textContent = editorClient.value || 'Cliente No Especificado';
            document.getElementById('pdf-date').textContent = new Date().toLocaleDateString('es-CL');

            const tbody = document.getElementById('pdf-items-tbody');
            tbody.innerHTML = '';

            // Sumar Items Base + Imprevistos para el cliente
            const allItemsForClient = [];
            currentPhases.forEach(p => {
                // Opción: agregar título de fase en el PDF si se quiere visualmente
                // allItemsForClient.push({name: `--- ${p.name.toUpperCase()} ---`, isHeader: true});
                p.items.forEach(i => allItemsForClient.push(i));
            });
            currentUnexpected.forEach(i => allItemsForClient.push(i));

            allItemsForClient.forEach(item => {
                if (!item.name && item.total === 0) return; // Saltamos vacíos
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="border: 1px solid #ccc; padding: 10px;">${item.name || 'Sin detalle'}</td>
                    <td style="border: 1px solid #ccc; padding: 10px; text-align: center;">${item.quantity || ''}</td>
                    <td style="border: 1px solid #ccc; padding: 10px; text-align: right;">${item.unitPrice ? formatMoney(item.unitPrice) : ''}</td>
                    <td style="border: 1px solid #ccc; padding: 10px; text-align: right;"><strong>${item.total ? formatMoney(item.total) : ''}</strong></td>
                `;
                tbody.appendChild(tr);
            });

            // Usamos en el PDF el Precio Cobrado al Cliente, si no hay, usamos la suma base
            const clientPriceInput = parseFloat(summaryClientPrice.value);
            let generatedTotal = 0;
            currentPhases.forEach(p => p.items.forEach(i => generatedTotal += i.total));
            currentUnexpected.forEach(i => generatedTotal += i.total);
            const totalToShow = (clientPriceInput > 0) ? clientPriceInput : generatedTotal;

            document.getElementById('pdf-total-cost').textContent = formatMoney(totalToShow);

            // Generar PDF usando el motor nativo del navegador (Guardar como PDF / Imprimir)
            const elementToPrint = document.getElementById('exportable-budget-table');
            elementToPrint.style.display = 'block'; // Mostrarlo para impresión

            const ogText = btnExportPdf.textContent;
            btnExportPdf.textContent = 'Abriendo generador...';
            btnExportPdf.disabled = true;

            // Pequeño timeout para asegurar que el DOM se actualice antes de imprimir
            setTimeout(() => {
                window.print();

                // Ocultar y restaurar botones después de imprimir
                document.getElementById('exportable-budget-table').style.display = 'none';
                btnExportPdf.textContent = ogText;
                btnExportPdf.disabled = false;
            }, 300);
        });
    }

    // Inicializar app
    applyRoleUI();

    // ============================================
    // === MÓDULO DE TRABAJADORES Y PAGOS =========
    // ============================================

    const btnCreateWorker = document.getElementById('btn-create-worker');
    const btnBackWorkers = document.getElementById('btn-back-workers');
    const btnSaveWorker = document.getElementById('btn-save-worker');
    const workersTbody = document.getElementById('workers-tbody');

    const workerNameInput = document.getElementById('worker-name');
    const workerRoleInput = document.getElementById('worker-role');
    const workerPhoneInput = document.getElementById('worker-phone');
    const workerRateInput = document.getElementById('worker-rate');

    const workerAdvancesList = document.getElementById('worker-advances-list');
    const workerProjectsList = document.getElementById('worker-projects-list');

    // Filtros de fecha
    const workersMonthFilter = document.getElementById('workers-month-filter');
    const workerEditorMonth = document.getElementById('worker-editor-month');

    // Inicializar mes actual por defecto
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    if (workersMonthFilter) workersMonthFilter.value = currentMonthStr;
    if (workerEditorMonth) workerEditorMonth.value = currentMonthStr;

    function getWorkerProjectsAmount(workerId, viewMonth = currentMonthStr) {
        let total = 0;
        let projects = [];
        budgets.forEach(b => {
            const bDate = b.date || new Date().toISOString();
            if (!bDate.startsWith(viewMonth)) return;

            if (b.assignedWorkers) {
                b.assignedWorkers.forEach(bw => {
                    if (bw.workerId === workerId) {
                        total += bw.amount;
                        projects.push({ budgetName: b.name, amount: bw.amount });
                    }
                });
            }
        });
        return { total, projects };
    }

    function updateWorkersList() {
        if (!workersTbody) return;
        workersTbody.innerHTML = '';
        if (workers.length === 0) {
            workersTbody.innerHTML = `<tr><td colspan="6" style="padding: 20px; color: #64748b; font-style: italic; text-align:center;">No hay trabajadores registrados.</td></tr>`;
            return;
        }

        // Ordenar alfabéticamente por Especialidad y luego por Nombre
        const sortedWorkers = [...workers].sort((a, b) => {
            const roleA = a.role || '';
            const roleB = b.role || '';
            return roleA.localeCompare(roleB) || (a.name || '').localeCompare(b.name || '');
        });

        sortedWorkers.forEach(w => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${w.name}</strong></td>
                <td><span class="badge badge-pending" style="color:#1f2937;">${w.role || 'General'}</span></td>
                <td>${formatMoney(w.dailyRate || 0)}</td>
                <td>${w.phone || 'N/A'}</td>
                <td><span class="badge ${w.isActive !== false ? 'badge-approved' : 'badge-rejected'}">${w.isActive !== false ? 'Activo' : 'Inactivo'}</span></td>
                <td style="display:flex; gap:10px;">
                    <button class="btn-secondary btn-sm" onclick="editWorker('${w.id}')">Ver Perfil</button>
                    <button class="btn-icon" onclick="deleteWorker('${w.id}')" style="color: var(--danger); font-size: 16px;" title="Eliminar">&times;</button>
                </td>
            `;
            workersTbody.appendChild(tr);
        });
    }

    // Funciones globales para botones onclick
    window.editWorker = (id) => {
        const w = workers.find(x => x.id === id);
        if (w) openWorkerEditor(w);
    };

    window.deleteWorker = (id) => {
        if (confirm('¿Estás seguro de eliminar a este trabajador y todo su historial de pagos?')) {
            workers = workers.filter(x => x.id !== id);
            localStorage.setItem('constru_workers', JSON.stringify(workers));
            updateWorkersList();
        }
    }

    function openWorkerEditor(worker = null) {
        switchView('worker-editor');
        if (worker) {
            currentWorkerId = worker.id;
            workerNameInput.value = worker.name;
            workerRoleInput.value = worker.role || '';
            workerPhoneInput.value = worker.phone || '';
            workerRateInput.value = worker.dailyRate || 0;
            currentWorkerAdvances = worker.advances ? [...worker.advances] : [];
            currentWorkerTransport = worker.transport ? [...worker.transport] : [];
        } else {
            currentWorkerId = null;
            workerNameInput.value = '';
            workerRoleInput.value = '';
            workerPhoneInput.value = '';
            workerRateInput.value = '';
            currentWorkerAdvances = [];
            currentWorkerTransport = [];
        }

        // Renderizar proyectos
        const viewMonth = workerEditorMonth ? workerEditorMonth.value : currentMonthStr;
        const projectData = getWorkerProjectsAmount(currentWorkerId, viewMonth);
        workerProjectsList.innerHTML = '';
        if (projectData.projects.length === 0) {
            workerProjectsList.innerHTML = `<div class="empty-item-state" style="padding: 20px; color: #64748b; font-style: italic;">Sin proyectos asignados. Este historial se basa en los presupuestos donde asocies al trabajador.</div>`;
        } else {
            projectData.projects.forEach(p => {
                workerProjectsList.innerHTML += `
                    <div style="display: flex; justify-content: space-between; padding: 12px; background: #f8fafc; margin-bottom: 8px; border-radius: 6px;">
                        <span>Presupuesto/Obra: <strong>${p.budgetName}</strong></span>
                        <span style="color: var(--success); font-weight: 600;">+ ${formatMoney(p.amount)}</span>
                    </div>
                `;
            });
        }

        renderWorkerItems(workerAdvancesList, currentWorkerAdvances, 'advance');
        renderWorkerItems(workerTransportList, currentWorkerTransport, 'transport');
        calculateWorkerSummary();
        switchWorkerTab('adelantos');
    }

    if (btnCreateWorker) btnCreateWorker.addEventListener('click', () => openWorkerEditor());
    if (btnBackWorkers) btnBackWorkers.addEventListener('click', () => switchView('workers'));

    // Al cambiar la fecha del filtro listar de nuevo
    if (workersMonthFilter) {
        workersMonthFilter.addEventListener('change', () => updateWorkersList());
    }
    if (workerEditorMonth) {
        workerEditorMonth.addEventListener('change', () => openWorkerEditor(workers.find(w => w.id === currentWorkerId)));
    }

    // Tabs Worker
    const wtabBtns = document.querySelectorAll('.w-tab');
    const wtabContents = document.querySelectorAll('.w-content');

    function switchWorkerTab(tabId) {
        wtabBtns.forEach(b => b.classList.remove('active'));
        wtabContents.forEach(c => c.classList.add('hidden'));
        document.querySelector(`.w-tab[data-wtab="${tabId}"]`).classList.add('active');
        document.getElementById(`wtab-${tabId}`).classList.remove('hidden');
    }

    wtabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchWorkerTab(btn.getAttribute('data-wtab')));
    });

    // Worker Items Logica (Adelantos / Transporte)
    function createWorkerItemRow(container, isTransport) {
        const item = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            note: '',
            amount: 0
        };
        if (isTransport) currentWorkerTransport.push(item);
        else currentWorkerAdvances.push(item);

        renderWorkerItems(container, isTransport ? currentWorkerTransport : currentWorkerAdvances, isTransport ? 'transport' : 'advance');
        calculateWorkerSummary();
    }

    document.getElementById('btn-add-advance').addEventListener('click', () => createWorkerItemRow(workerAdvancesList, false));
    document.getElementById('btn-add-transport').addEventListener('click', () => createWorkerItemRow(workerTransportList, true));

    function renderWorkerItems(container, itemsArray, type) {
        container.innerHTML = '';
        if (itemsArray.length === 0) {
            container.innerHTML = `<div class="empty-item-state" style="padding: 20px; color: #64748b; font-style: italic;">No hay registros. Añade uno.</div>`;
            return;
        }

        const viewMonth = workerEditorMonth ? workerEditorMonth.value : currentMonthStr;

        const filteredItems = itemsArray.filter(item => item.date.startsWith(viewMonth));

        if (filteredItems.length === 0) {
            container.innerHTML = `<div class="empty-item-state" style="padding: 20px; color: #64748b; font-style: italic;">No hay registros para este mes. Añade uno o busca en otro mes.</div>`;
        }

        filteredItems.forEach(item => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.gap = '10px';
            row.style.marginBottom = '10px';
            row.style.alignItems = 'center';
            row.innerHTML = `
                <input type="date" class="form-control item-w-date" value="${item.date}" data-id="${item.id}" data-type="${type}" style="flex: 1;">
                <input type="text" class="form-control item-w-note" placeholder="Detalle (ej. Semana 1)" value="${item.note}" data-id="${item.id}" data-type="${type}" style="flex: 2;">
                <input type="number" class="form-control item-w-amount" placeholder="Monto $" value="${item.amount || ''}" min="0" data-id="${item.id}" data-type="${type}" style="flex: 1;">
                <button class="btn-icon btn-del-w-item" data-id="${item.id}" data-type="${type}" style="color: var(--danger);">&times;</button>
            `;
            container.appendChild(row);
        });

        // Eventos
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                const id = e.target.getAttribute('data-id');
                const t = e.target.getAttribute('data-type');
                const list = t === 'transport' ? currentWorkerTransport : currentWorkerAdvances;
                const mItem = list.find(i => i.id === id);
                if (!mItem) return;

                if (e.target.classList.contains('item-w-date')) mItem.date = e.target.value;
                if (e.target.classList.contains('item-w-note')) mItem.note = e.target.value;
                if (e.target.classList.contains('item-w-amount')) mItem.amount = parseFloat(e.target.value) || 0;

                calculateWorkerSummary();
            });
        });

        container.querySelectorAll('.btn-del-w-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const t = e.target.getAttribute('data-type');
                if (t === 'transport') {
                    currentWorkerTransport = currentWorkerTransport.filter(i => i.id !== id);
                    renderWorkerItems(workerTransportList, currentWorkerTransport, 'transport');
                } else {
                    currentWorkerAdvances = currentWorkerAdvances.filter(i => i.id !== id);
                    renderWorkerItems(workerAdvancesList, currentWorkerAdvances, 'advance');
                }
                calculateWorkerSummary();
            });
        });
    }

    function calculateWorkerSummary() {
        const viewMonth = workerEditorMonth ? workerEditorMonth.value : currentMonthStr;

        const baseManual = parseFloat(workerRateInput.value) || 0;
        const projectData = getWorkerProjectsAmount(currentWorkerId, viewMonth);
        const totalEarned = baseManual + projectData.total;

        const targetAdvances = currentWorkerAdvances.filter(a => a.date.startsWith(viewMonth));
        const targetTransport = currentWorkerTransport.filter(t => t.date.startsWith(viewMonth));

        const totalAd = targetAdvances.reduce((a, c) => a + c.amount, 0);
        const totalTr = targetTransport.reduce((a, c) => a + c.amount, 0);

        const deducted = totalAd + totalTr;
        const remaining = totalEarned - deducted;

        document.getElementById('worker-stat-base').textContent = formatMoney(totalEarned);
        document.getElementById('worker-stat-deducted').textContent = formatMoney(deducted);
        document.getElementById('worker-stat-remaining').textContent = formatMoney(remaining);
    }
    if (workerRateInput) workerRateInput.addEventListener('input', calculateWorkerSummary);

    function saveData() {
        localStorage.setItem('constru_workers', JSON.stringify(workers));
    }

    btnSaveWorker.addEventListener('click', () => {
        if (!workerNameInput.value.trim()) {
            alert('El nombre es obligatorio.');
            return;
        }

        if (currentWorkerId) {
            const w = workers.find(x => x.id === currentWorkerId);
            w.name = workerNameInput.value;
            w.role = workerRoleInput.value;
            w.phone = workerPhoneInput.value;
            w.dailyRate = parseFloat(workerRateInput.value) || 0;
            w.advances = currentWorkerAdvances;
            w.transport = currentWorkerTransport;
        } else {
            workers.push({
                id: 'w_' + Date.now().toString(),
                name: workerNameInput.value,
                role: workerRoleInput.value,
                phone: workerPhoneInput.value,
                dailyRate: parseFloat(workerRateInput.value) || 0,
                advances: currentWorkerAdvances,
                transport: currentWorkerTransport,
                isActive: true
            });
        }

        saveData();
        updateWorkersList();
        switchView('workers');

        // Limpiar
        currentWorkerId = null;
        workerNameInput.value = '';
        workerRoleInput.value = '';
        workerPhoneInput.value = '';
        workerRateInput.value = '';
        currentWorkerAdvances = [];
        currentWorkerTransport = [];
    });
});
