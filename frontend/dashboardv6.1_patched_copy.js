document.addEventListener("DOMContentLoaded", async function () {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const sidebarMenu = document.getElementById('sidebarMenu');
    const profileView = document.getElementById('profileView');
    const tableView = document.getElementById('tableView');
    const tableContainer = document.getElementById('tableContainer');
    const userRoleDisplay = document.getElementById('userRoleDisplay');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const dbStatus = document.getElementById('dbStatus');
    const recordFormContainer = document.getElementById('recordFormContainer');

    function formatTableName(tableName) {
        const abbreviations = { id: 'ID', fir: 'FIR', cbi: 'CBI', hq: 'HQ', dna: 'DNA' };
        const specialTableNames = {
            cbipersonnel: 'CBI Personnel',
            firevidence: 'FIR Evidence',
            cybercrimefir: 'Cyber Crime FIR',
            cybersecurityagency: 'Cyber Security Agency',
            detectiveagency: 'Detective Agency',
            forensicdepartment: 'Forensic Department',
            forensicreport: 'Forensic Report',
            lawenforcement: 'Law Enforcement',
            policedepartment: 'Police Department',
            policepersonnel: 'Police Personnel',
            postmorteminstitute: 'Post Mortem Institute',
            postmortemreport: 'Post Mortem Report',
            accused: 'Accused',
            court: 'Court',
            courtcase: 'Court Case',
            suspect: 'Suspect',
            victim: 'Victim',
            witness: 'Witness'
        };

        if (specialTableNames[tableName]) return specialTableNames[tableName];

        let words = tableName.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').split(' ');
        words = words.map(word => abbreviations[word.toLowerCase()] || word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
        return words.join(' ');
    }

    function showLoading(show) {
        loadingIndicator.style.display = show ? 'flex' : 'none';
    }

    function updateDatabaseStatus(message, type) {
        dbStatus.textContent = message;
        dbStatus.className = `status-message ${type}`;
        dbStatus.style.display = 'block';
        setTimeout(() => dbStatus.style.display = 'none', 5000);
    }

    async function getUserData() {
    const user = await fetch('https://law-enforcement.onrender.com/api/current-user').then(res => res.json());

    if (!user || !user.username) {
        return { name: "Guest", role: "guest", department: "None", badgeNumber: "N/A" };
    }

    let department = "Unknown Department";
    if (user.role === 'police') {
        const personnel = await fetch('https://law-enforcement.onrender.com/api/table/policePersonnel').then(res => res.json());
        const person = personnel.find(p => p.userID === user.userID);
        if (person) {
            const departments = await fetch('https://law-enforcement.onrender.com/api/table/policeDepartment').then(res => res.json());
            const dept = departments.find(d => d.id === person.policeStationID);
            if (dept) department = `${dept.location} Police Station`;
        }
    }

    return {
        name: user.name,
        role: user.role,
        department: department,
        badgeNumber: user.badgeNumber || "N/A"
    };
}

    async function initDashboard() {
        const userData = await getUserData();
        userRoleDisplay.textContent = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);

        const lastPage = localStorage.getItem('activePage');
        if (lastPage && lastPage !== 'My Profile') {
            const waitForSidebar = setInterval(() => {
                const items = Array.from(sidebarMenu.querySelectorAll('li'));
                const match = items.find(i => i.getAttribute('data-table-name') === lastPage);
                if (match) {
                    clearInterval(waitForSidebar);
                    setActiveMenuItem(match);
                    loadTable(lastPage);
                }
            }, 100);
        } else {
            loadProfileView(userData);
        }
        setupEventListeners();
    }

    function loadProfileView(userData) {
        document.getElementById('profileName').textContent = userData.name;
        document.getElementById('profileRole').textContent = userData.role;
        document.getElementById('profileDepartment').textContent = userData.department;
        document.getElementById('profileBadge').textContent = userData.badgeNumber;

        profileView.style.display = 'block';
        tableView.style.display = 'none';
    }

    async function loadSidebarTables() {
        sidebarMenu.innerHTML = '';
        const profileItem = document.createElement('li');
        profileItem.textContent = 'My Profile';
        profileItem.classList.add('active');
        profileItem.addEventListener('click', async () => {
            setActiveMenuItem(profileItem);
            localStorage.setItem('activePage', 'My Profile');
            loadProfileView(await getUserData());
        });
        sidebarMenu.appendChild(profileItem);

        const tableNames = await fetch('https://law-enforcement.onrender.com/api/tables').then(res => res.json());
        const excludedTables = ['users', 'casehandledby', 'useractivitylog', 'cybercrimefir'];

        tableNames.forEach(table => {
            if (excludedTables.includes(table.toLowerCase())) return;
            const item = document.createElement('li');
            item.textContent = formatTableName(table);
            item.setAttribute('data-table-name', table);
            item.addEventListener('click', () => {
                setActiveMenuItem(item);
                localStorage.setItem('activePage', table);
                loadTable(table);
            });
            sidebarMenu.appendChild(item);
        });
    }

    function setActiveMenuItem(selected) {
        sidebarMenu.querySelectorAll('li').forEach(i => i.classList.remove('active'));
        selected.classList.add('active');
    }

    async function loadTable(tableName) {
        profileView.style.display = 'none';
        tableView.style.display = 'block';
        recordFormContainer.style.display = 'none';

        const data = await fetch(`https://law-enforcement.onrender.com/api/table/${tableName}`).then(res => res.json());
        if (!data.length) {
            tableContainer.innerHTML = `<div class="empty-table">No data available for table: ${formatTableName(tableName)}</div>`;
            return;
        }

        let html = '<table><thead><tr>';
        Object.keys(data[0]).forEach(col => html += `<th>${formatTableName(col)}</th>`);
        html += '<th>Action</th></tr></thead><tbody>';

        data.forEach(row => {
            html += '<tr>' + Object.values(row).map(val => `<td>${val ?? 'NULL'}</td>`).join('') +
                `<td><div class="action-buttons">
                    <button class="update-btn">Update</button>
                    <button class="delete-btn">Delete</button>
                </div></td></tr>`;
        });

        html += '</tbody></table>';
        tableContainer.innerHTML = html;
        setupTableActionListeners();
    }

    async function setupTableActionListeners() {
        const updateButtons = document.querySelectorAll('.update-btn');
        const deleteButtons = document.querySelectorAll('.delete-btn');

        updateButtons.forEach(btn => {
            btn.addEventListener('click', async function () {
                const row = this.closest('tr');
                const cells = row.querySelectorAll('td:not(:last-child)');
                const activeItem = sidebarMenu.querySelector('li.active');
                const tableName = activeItem.getAttribute('data-table-name');

                try {
                    const { primaryKey } = await fetch(`https://law-enforcement.onrender.com/api/table/${tableName}/primary-key`).then(res => res.json());
                    const primaryValue = cells[0].textContent;
                    const tableData = await fetch(`https://law-enforcement.onrender.com/api/table/${tableName}`).then(res => res.json());
                    const originalColumns = Object.keys(tableData[0] || {});

                    cells.forEach((cell, index) => {
                        const columnName = originalColumns[index];
                        if (columnName !== primaryKey) {
                            const original = cell.textContent;
                            cell.innerHTML = `<input type="text" value="${original}" data-original-column="${columnName}">`;
                        }
                    });

                    const actionCell = row.querySelector('td:last-child');
                    actionCell.innerHTML = `<button class="save-btn">Save</button>`;

                    actionCell.querySelector('.save-btn').addEventListener('click', async () => {
                        const updatedData = {};
                        cells.forEach((cell) => {
                            const input = cell.querySelector('input');
                            if (input) {
                                const originalColName = input.getAttribute('data-original-column');
                                if (originalColName && originalColName !== primaryKey) {
                                    updatedData[originalColName] = input.value;
                                }
                            }
                        });

                        try {
                            const response = await fetch(`https://law-enforcement.onrender.com/api/table/${tableName}/${primaryValue}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-Primary-Key': primaryKey
                                },
                                body: JSON.stringify(updatedData)
                            });

                            if (!response.ok) throw new Error('Update failed');

                            setTimeout(() => {
                                loadTable(tableName);
                                alert('Record updated successfully.');
                            }, 100);
                        } catch (err) {
                            console.error('Update failed:', err);
                            alert('Failed to update record: ' + err.message);
                        }
                    });
                } catch (err) {
                    console.error('Error setting up update:', err);
                    alert('Failed to prepare update form: ' + err.message);
                }
            });
        });

        deleteButtons.forEach(btn => {
            btn.addEventListener('click', async function () {
                if (!confirm("Are you sure you want to delete this record?")) return;

                const row = this.closest('tr');
                const tableName = sidebarMenu.querySelector('li.active').getAttribute('data-table-name');

                try {
                    const { primaryKey } = await fetch(`https://law-enforcement.onrender.com/api/table/${tableName}/primary-key`).then(res => res.json());
                    const primaryValue = row.querySelector('td').textContent;

                    const response = await fetch(`https://law-enforcement.onrender.com/api/delete`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ table: tableName, column: primaryKey, value: primaryValue })
                    });

                    if (!response.ok) throw new Error('Delete failed');

                    setTimeout(() => {
                        loadTable(tableName);
                        alert("Record deleted successfully.");
                    }, 100);
                } catch (err) {
                    console.error('Delete failed:', err);
                    alert('Failed to delete record: ' + err.message);
                }
            });
        });
    }

    function setupEventListeners() {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            mainContent.classList.toggle('sidebar-active');
        });

        document.getElementById('showInsertForm').addEventListener('click', async () => {
            const active = sidebarMenu.querySelector('li.active');
            if (!active || active.textContent === 'My Profile') return alert("Select a table first");

            const tableName = active.getAttribute('data-table-name');
            const data = await fetch(`https://law-enforcement.onrender.com/api/table/${tableName}`).then(res => res.json());
            const { primaryKey } = await fetch(`https://law-enforcement.onrender.com/api/table/${tableName}/primary-key`).then(res => res.json());

            const container = recordFormContainer;
            container.innerHTML = '';
            container.style.display = 'block';

            const form = document.createElement('form');
            form.id = 'insertForm';
            Object.keys(data[0]).forEach(key => {
                if (key === primaryKey) return;
                const input = document.createElement('input');
                input.name = key;
                input.placeholder = `Enter ${formatTableName(key)}`;
                input.required = true;
                form.appendChild(input);
            });

            const submit = document.createElement('button');
            submit.textContent = 'Save';
            submit.className = 'insert-button';
            form.appendChild(submit);

            form.addEventListener('submit', async e => {
                e.preventDefault();
                const formData = Object.fromEntries(new FormData(form));
                await fetch(`https://law-enforcement.onrender.com/api/table/${tableName}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                alert("Record inserted.");
                container.style.display = 'none';
                loadTable(tableName);
            });

            container.appendChild(form);
        });

        document.getElementById('reloadDatabase').addEventListener('click', async () => {
            showLoading(true);
            await loadSidebarTables();
            showLoading(false);
            updateDatabaseStatus('Data reloaded successfully!', 'success');

            const active = sidebarMenu.querySelector('li.active');
            if (active) {
                if (active.textContent === 'My Profile') {
                    loadProfileView(await getUserData());
                } else {
                    const tableName = active.getAttribute('data-table-name');
                    loadTable(tableName);
                }
            }
        });

        // Admin-style dropdown
        const adminMenuBtn = document.getElementById('adminMenuBtn');
        const adminDropdown = document.getElementById('adminDropdown');

        adminMenuBtn.addEventListener('click', () => {
            adminDropdown.classList.toggle('show');
            adminMenuBtn.classList.toggle('active');
        });

        window.addEventListener("click", function (e) {
            if (!adminMenuBtn.contains(e.target) && !adminDropdown.contains(e.target)) {
                adminDropdown.classList.remove('show');
                adminMenuBtn.classList.remove('active');
            }
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "loginPage.html";
        });
    }

    try {
        showLoading(true);
        await loadSidebarTables();
        showLoading(false);
        updateDatabaseStatus('Connected to database successfully!', 'success');
        initDashboard();
    } catch (error) {
        showLoading(false);
        updateDatabaseStatus('Failed to connect to database.', 'error');
        console.error('Database error:', error);
        // Still attach event listeners even if DB fails
        setupEventListeners();
    }
    
});
