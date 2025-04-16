// Show the user form for adding or updating a user
function showForm(user = null) {
    if (user) {
        // Populate form with existing user data for editing
        document.getElementById('username').value = user.username;
        document.getElementById('password').value = user.password; // Consider hashing passwords in production
        document.getElementById('name').value = user.name;
        document.getElementById('role').value = user.role;
        document.getElementById('departmentID').value = user.departmentID;
        document.getElementById('badgeNumber').value = user.badgeNumber;
        document.getElementById('email').value = user.email;
        document.getElementById('status').value = user.status;
    } else {
        // Clear form for adding new user
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('name').value = '';
        document.getElementById('role').value = '';
        document.getElementById('departmentID').value = '';
        document.getElementById('badgeNumber').value = '';
        document.getElementById('email').value = '';
        document.getElementById('status').value = 'active';
    }
    document.getElementById('userForm').style.display = 'block';
}
function toggleDropdown(buttonElement) {
    const dropdown = document.getElementById("adminDropdown");
    dropdown.classList.toggle("show");
    buttonElement.classList.toggle("active");
  }
  
  // Logout function
  function logout() {
    // Add a fade out effect before alerting
    const navbar = document.querySelector(".navbar");
    navbar.style.transition = "opacity 0.5s ease";
    navbar.style.opacity = "0.5";
    
    setTimeout(() => {
      alert("Logged out!");
      navbar.style.opacity = "1";
	window.location.href = "loginPage.html";

    }, 300);
  }
  
  // Close the dropdown when clicking outside
  window.addEventListener("click", function(e) {
    const menu = document.querySelector(".admin-menu");
    const dropdown = document.getElementById("adminDropdown");
    const adminButton = document.querySelector(".admin-button");
    
    if (!menu.contains(e.target)) {
      dropdown.classList.remove("show");
      adminButton.classList.remove("active");
    }
  });
  
  // Prevent clicks inside dropdown from closing it
  document.getElementById("adminDropdown").addEventListener("click", function(e) {
    e.stopPropagation();
  });
// Hide the user form
function hideForm() {
    document.getElementById('userForm').style.display = 'none';
}

// Save user (create or update)
async function saveUser () {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('name').value;
    const role = document.getElementById('role').value;
    const departmentID = document.getElementById('departmentID').value;
    const badgeNumber = document.getElementById('badgeNumber').value;
    const email = document.getElementById('email').value;
    const status = document.getElementById('status').value;

    const userData = { username, password, name, role, departmentID, badgeNumber, email, status };

    // Check if the user already exists (for update)
    const existingUser  = document.querySelector(`#userTable tr[data-username="${username}"]`);
    if (existingUser ) {
        // Update existing user
        const response = await fetch(`http://localhost:4000/users/${username}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        if (response.ok) {
            alert('User  updated successfully');
        }
    } else {
        // Create new user
        const response = await fetch('http://localhost:4000/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        if (response.ok) {
            alert('User  created successfully');
        }
    }
    hideForm();
    loadUsers(); // Refresh the user list
}

// Load users from the server
async function loadUsers() {
    const response = await fetch('http://localhost:4000/users');
    const users = await response.json();
    const table = document.getElementById('userTable');
    table.innerHTML = ''; // Clear existing rows

    users.forEach(user => {
        const row = table.insertRow();
        row.setAttribute('data-username', user.username); // Set data attribute for easy access
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.name}</td>
            <td>${user.role}</td>
            <td>${user.departmentID}</td>
            <td>${user.badgeNumber}</td>
            <td>${user.email}</td>
            <td>${user.status}</td>
            <td>
                <button onclick="deleteUser ('${user.username}')">Delete</button>
            </td>
        `;
    });
}

// Search for users by username
function searchUser () {
    const searchValue = document.getElementById('search').value.toLowerCase();
    const rows = document.querySelectorAll('#userTable tr');
    rows.forEach(row => {
        const username = row.cells[0].textContent.toLowerCase();
        if (username.includes(searchValue)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Delete a user
async function deleteUser (username) {
    const response = await fetch(`http://localhost:4000/users/${username}`, {
        method: 'DELETE',
    });
    if (response.ok) {
        alert('User  deleted successfully');
        loadUsers(); // Refresh the user list
    }
}

// Load users on page load
document.addEventListener('DOMContentLoaded', loadUsers);

// Toggle dropdown function with animation
// Toggle dropdown function with animation
