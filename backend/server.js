const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');               // Callback-based
const mysqlPromise = require('mysql2/promise'); // Promise-based
const net = require('net');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

const dbConfig = {
    host: 'law-enforcement-db.cp000yayw4rn.ap-south-1.rds.amazonaws.com',
    user: 'new_username', // change to your MySQL username
    password: 'new_password', // change to your MySQL password
    database: 'project'
};

const db = mysql.createPool(dbConfig); // For callback-based routes

async function getConnection() {
    return await mysqlPromise.createConnection(dbConfig); // For async/await routes
}

// Test MySQL connection on startup
(async () => {
    try {
        const connection = await getConnection();
        console.log('Connected to MySQL.');
        await connection.end();
    } catch (err) {
        console.error('Connection error:', err.message);
    }
})();

/* ------------------ AUTH ------------------ */
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
	global.username = username;
	global.password = password;

    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM users WHERE username = ? AND status = ?',
            [username, 'active']
        );

        if (rows.length > 0) {
            const user = rows[0];
            if (user.password === password) {
                await connection.execute(
                    'UPDATE users SET lastLogin = NOW() WHERE userID = ?',
                    [user.userID]
                );
                return res.json({ success: true, message: 'Login successful!', user });
            } else {
                return res.json({ success: false, message: 'Invalid password' });
            }
        } else {
            return res.json({ success: false, message: 'User not found' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    } finally {
        if (connection) await connection.end();
    }
});

/* ------------------ USERS ------------------ */
app.get('/users', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM users');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Error fetching users' });
    } finally {
        if (connection) await connection.end();
    }
});

app.get('/users/:username', async (req, res) => {
    const { username } = req.params;
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
        res.json(rows[0] || {});
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ message: 'Error fetching user' });
    } finally {
        if (connection) await connection.end();
    }
});

app.post('/users', async (req, res) => {
    const { username, password, name, role, departmentID, badgeNumber, email, status } = req.body;
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.execute(
            'INSERT INTO users (username, password, name, role, departmentID, badgeNumber, email, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [username, password, name, role, departmentID, badgeNumber, email, status]
        );
        res.status(201).json({ id: result.insertId });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ message: 'Error creating user' });
    } finally {
        if (connection) await connection.end();
    }
});

app.put('/users/:username', async (req, res) => {
    const { username } = req.params;
    const { password, name, role, departmentID, badgeNumber, email, status } = req.body;
    let connection;
    try {
        connection = await getConnection();
        await connection.execute(
            'UPDATE users SET password = ?, name = ?, role = ?, departmentID = ?, badgeNumber = ?, email = ?, status = ? WHERE username = ?',
            [password, name, role, departmentID, badgeNumber, email, status, username]
        );
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ message: 'Error updating user' });
    } finally {
        if (connection) await connection.end();
    }
});

app.get('/api/current-user', async (req, res) => {
    const username = global.username;
    if (!username) {
        return res.status(401).json({ message: 'Not logged in' });
    }

    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
        res.json(rows[0] || {});
    } catch (err) {
        console.error('Error fetching current user:', err);
        res.status(500).json({ message: 'Error fetching user' });
    } finally {
        if (connection) await connection.end();
    }
});


app.delete('/users/:username', async (req, res) => {
    const { username } = req.params;
    let connection;
    try {
        connection = await getConnection();
        await connection.execute('DELETE FROM users WHERE username = ?', [username]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Error deleting user' });
    } finally {
        if (connection) await connection.end();
    }
});

/* ------------------ DYNAMIC TABLES ------------------ */
app.get('/data/:table', async (req, res) => {
    const table = req.params.table;
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute(`SELECT * FROM \`${table}\``);
        res.json(rows);
    } catch (err) {
        console.error(`Failed to load table ${table}:`, err);
        res.status(500).json({ message: 'Error fetching data' });
    } finally {
        if (connection) await connection.end();
    }
});

app.post('/:table', async (req, res) => {
    const table = req.params.table;
    const data = req.body;
    if (table === 'userActivityLog') {
        return res.status(403).json({ message: 'Manual insert not allowed' });
    }

    const connection = await getConnection();
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.values(data).map(() => '?').join(', ');
    const values = Object.values(data);

    try {
        const [result] = await connection.execute(`INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`, values);

        const userID = data.userID || data.createdBy || data.assignedTo || data.submittedBy || null;
        if (userID) {
            await connection.execute(
                `INSERT INTO userActivityLog (userID, activity, tableName, recordID) VALUES (?, ?, ?, ?)`,
                [userID, `Created entry in ${table}`, table, result.insertId]
            );
        }

        res.status(201).send('Record created');
    } catch (err) {
        console.error(`Error inserting into ${table}:`, err);
        res.status(500).send('Insert failed');
    } finally {
        await connection.end();
    }
});

app.put('/:table/:id', async (req, res) => {
    const { table, id } = req.params;
    const data = req.body;
    const updates = Object.keys(data).map(key => `\`${key}\` = ?`).join(', ');
    const values = Object.values(data);
    const connection = await getConnection();
    try {
        await connection.execute(`UPDATE \`${table}\` SET ${updates} WHERE id = ?`, [...values, id]);
        res.send('Record updated');
    } catch (err) {
        console.error('Update error:', err);
        res.status(500).send('Update failed');
    } finally {
        await connection.end();
    }
});

app.delete('/:table/:id', async (req, res) => {
    const { table, id } = req.params;
    const connection = await getConnection();

    const primaryKeys = {
        fir: 'firID',
        victim: 'victimID',
        accused: 'accusedID',
        suspect: 'suspectID',
        witness: 'witnessID',
        firEvidence: 'evidenceID',
        courtCase: 'caseID',
        forensicReport: 'reportID',
        postMortemReport: 'reportID',
        userActivityLog: 'logID',
        cbi: 'id',
        court: 'id',
        policeDepartment: 'id',
        forensicDepartment: 'id',
        postMortemInstitute: 'id',
        cyberSecurityAgency: 'id',
        detectiveAgency: 'id',
        policePersonnel: 'personnelID',
        cbiPersonnel: 'personnelID',
        lawEnforcement: 'departmentID',
        users: 'userID'
    };

    const pk = primaryKeys[table];
    if (!pk) {
        return res.status(400).json({ message: `Unknown primary key for table ${table}` });
    }

    try {
        await connection.execute(`DELETE FROM \`${table}\` WHERE \`${pk}\` = ?`, [id]);
        res.send('Record deleted');
    } catch (err) {
        console.error('Error deleting record:', err);
        res.status(500).json({ message: 'Delete failed' });
    } finally {
        await connection.end();
    }
});

/* ------------------ CALLBACK-BASED /api ROUTES ------------------ */
app.get('/api/tables', (req, res) => {
    db.query("SHOW TABLES", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const key = Object.keys(results[0])[0];
        res.json(results.map(row => row[key]));
    });
});

app.get('/api/table/:name', (req, res) => {
    db.query("SELECT * FROM ??", [req.params.name], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/table/:name/primary-key', (req, res) => {
    const sql = `
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = ? AND CONSTRAINT_NAME = 'PRIMARY' AND TABLE_SCHEMA = ?
    `;
    db.query(sql, [req.params.name, dbConfig.database], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            res.json({ primaryKey: results[0].COLUMN_NAME });
        } else {
            res.status(404).json({ error: 'Primary key not found' });
        }
    });
});

app.post('/api/table/:name', (req, res) => {
    const data = req.body;
    db.query(`INSERT INTO ?? SET ?`, [req.params.name, data], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId });
    });
});

app.put('/api/table/:name/:id', (req, res) => {
    const data = req.body;
    const primaryKey = req.headers['x-primary-key'];
    db.query(`UPDATE ?? SET ? WHERE ?? = ?`, [req.params.name, data, primaryKey, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.sendStatus(200);
    });
});

app.post('/api/delete', (req, res) => {
    const { table, column, value } = req.body;
    if (!table || !column || value === undefined) {
        return res.status(400).json({ error: 'Missing table, column, or value' });
    }

    db.query(`DELETE FROM ?? WHERE ?? = ?`, [table, column, value], (err, result) => {
        if (err) {
            console.error("Delete failed:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Record deleted', affectedRows: result.affectedRows });
    });
});

/* ------------------ START SERVER ------------------ */
(async () => {
    const portFree = await new Promise(resolve => {
        const tester = net.createServer().once('error', () => resolve(false)).once('listening', () => tester.close(() => resolve(true))).listen(PORT);
    });

    if (portFree) {
        app.listen(PORT, () => console.log(`Server running at http://law-enforcement-db.cp000yayw4rn.ap-south-1.rds.amazonaws.com:${PORT}`));
    } else {
        console.error(`Port ${PORT} already in use.`);
    }
})();
